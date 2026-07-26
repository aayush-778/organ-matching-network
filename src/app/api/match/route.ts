import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { connectToDatabase } from "@/lib/db";
import { Recipient, type RecipientDoc } from "@/models/Recipient";
import { SEED_RECIPIENTS } from "@/lib/seedRecipients";
import { createSession, currentOffer, decisionWindowMinutes } from "@/lib/offerSessions";
import { bloodTypeToMask, hlaArrayToMask } from "@/lib/bitmask";

export const runtime = "nodejs";
const ENGINE_TIMEOUT_MS = 5000;

function resolveEnginePath(): string {
  const binaryName = process.platform === "win32" ? "engine.exe" : "engine";
  return path.join(process.cwd(), "cpp-engine", binaryName);
}

// Matches main.cpp exactly: combined mask per recipient.
interface EngineRecipient {
  id: string;
  urgency: number;
  waiting_years: number;
  blood_mask: number;
  hospital_id: number;
}

interface IntakePayload {
  organ: string;
  ischemia_limit_mins: number;
  donor_hospital_id: number;
  donor_blood_type: string;
  donor_hla_antigens?: number[];
  max_allowed_hla_mismatches?: number;
}

// Matches main.cpp's actual JSON reads: organ, ischemia_limit_mins,
// donor_hospital_id, donor_blood_mask (combined), max_allowed_hla_mismatches,
interface EnginePayload {
  organ: string;
  ischemia_limit_mins: number;
  donor_hospital_id: number;
  donor_blood_mask: number;
  max_allowed_hla_mismatches: number;
  recipients: EngineRecipient[];
}

function runEngine(payload: EnginePayload): Promise<{ stdout: string; stderr: string; code: number | null; timedOut: boolean }> {
  return new Promise((resolve, reject) => {
    const enginePath = resolveEnginePath();
    const child = spawn(enginePath, ["--mode=pipeline"]);

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, ENGINE_TIMEOUT_MS);

    child.stdout.on("data", (c) => { stdout += c.toString(); });
    child.stderr.on("data", (c) => { stderr += c.toString(); });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.stdin.on("error", () => {});

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, code, timedOut });
    });

    try {
      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    } catch {
      // stdin write failed; 'error'/'close' handlers above still settle the promise
    }
  });
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (typeof value === "number" && Number.isNaN(value));
}

export async function POST(req: NextRequest) {
  let body: IntakePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid JSON body" }, { status: 400 });
  }

  const {
    organ,
    ischemia_limit_mins,
    donor_hospital_id,
    donor_blood_type,
    donor_hla_antigens = [],
    max_allowed_hla_mismatches = 4,
  } = body;

  if (
    isMissing(organ) ||
    isMissing(ischemia_limit_mins) ||
    isMissing(donor_hospital_id) ||
    isMissing(donor_blood_type)
  ) {
    return NextResponse.json(
      { status: "error", message: "missing required procurement parameters" },
      { status: 400 }
    );
  }

  let donorMask: number;
  try {
    donorMask = bloodTypeToMask(donor_blood_type) | hlaArrayToMask(donor_hla_antigens);
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err instanceof Error ? err.message : "Invalid donor blood/HLA data" },
      { status: 400 }
    );
  }

  try {
    let targetRecipients: EngineRecipient[] = [];
    const db = await connectToDatabase();

    if (db) {
      const dbData = await Recipient.find({
        organNeeded: { $regex: new RegExp(`^${organ}$`, "i") },
        status: "waiting",
      }).lean<RecipientDoc[]>();

      targetRecipients = dbData.map((r) => ({
        id: r.patientId,
        urgency: Number(r.urgency),
        waiting_years: Number(r.waitingYears),
        blood_mask: (r.bloodMask ?? 0) | (r.hlaMask ?? 0),
        hospital_id: Number(r.hospitalId),
      }));
    } else {
      targetRecipients = SEED_RECIPIENTS
        .filter((r) => r.organNeeded.toLowerCase() === organ.toLowerCase() && r.status === "waiting")
        .map((r) => ({
          id: r.patientId,
          urgency: Number(r.urgency),
          waiting_years: Number(r.waitingYears),
          blood_mask: (r.bloodMask ?? 0) | (r.hlaMask ?? 0),
          hospital_id: Number(r.hospitalId),
        }));
    }

    if (targetRecipients.length === 0) {
      return NextResponse.json(
        { status: "error", message: `No waiting candidates found for organ: ${organ}` },
        { status: 404 }
      );
    }

    const enginePayload: EnginePayload = {
      organ,
      ischemia_limit_mins: Number(ischemia_limit_mins),
      donor_hospital_id: Number(donor_hospital_id),
      donor_blood_mask: donorMask,
      max_allowed_hla_mismatches: Number(max_allowed_hla_mismatches),
      recipients: targetRecipients,
    };

    const { stdout, stderr, code, timedOut } = await runEngine(enginePayload);

    if (timedOut) {
      return NextResponse.json({ status: "error", message: `Engine timed out after ${ENGINE_TIMEOUT_MS}ms`, stderr }, { status: 504 });
    }
    if (code !== 0) {
      return NextResponse.json({ status: "error", message: "Engine execution failure", stderr, code }, { status: 500 });
    }

    const lines = stdout.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return NextResponse.json({ status: "error", message: "Engine produced no output" }, { status: 502 });
    }

    let result: {
      status: string;
      organ: string;
      matches_found: number;
      screened_out: unknown[];
      ranked_match_run?: Parameters<typeof createSession>[3];
    };
    try {
      result = JSON.parse(lines[lines.length - 1]);
    } catch (parseErr) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to parse engine output as JSON",
          detail: parseErr instanceof Error ? parseErr.message : String(parseErr),
          raw_stdout: stdout,
        },
        { status: 502 }
      );
    }

    if (result.status !== "success") {
      return NextResponse.json(result, { status: 500 });
    }

    const session = createSession(
      result.organ || organ,
      enginePayload.ischemia_limit_mins,
      enginePayload.donor_hospital_id,
      result.ranked_match_run ?? []
    );

    return NextResponse.json({
      status: "success",
      session_id: session.id,
      session_status: session.status,
      decision_window_minutes: decisionWindowMinutes(),
      current_offer_expires_at: session.currentOfferExpiresAt,
      current_offer: currentOffer(session) ?? null,
      remaining_in_queue: session.queue.length,
      matches_found: result.matches_found,
      screened_out: Array.isArray(result.screened_out) ? result.screened_out.length : 0,
      datasource: db ? "mongodb" : "fallback_seed",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Engine execution error";
    const hint = message.includes("ENOENT")
      ? "Engine binary not found -- run the C++ build step first (npm run build:engine)."
      : undefined;
    return NextResponse.json({ status: "error", message, hint }, { status: 500 });
  }
}
