// File: src/app/api/recipients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Recipient } from "@/models/Recipient";
import { OfferSessionModel } from "@/models/OfferSession"; // <-- Make sure this is imported
import { bloodTypeToMask, hlaArrayToMask } from "@/lib/bitmask";

export async function GET(req: NextRequest) {
  try {
    const organ = req.nextUrl.searchParams.get("organ");
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json(
        { status: "error", message: "MongoDB connection unavailable. Seed the database first or check MONGODB_URI." },
        { status: 503 }
      );
    }

    const filter = organ ? { organNeeded: { $regex: new RegExp(`^${organ}$`, "i") } } : {};
    const recipients = await Recipient.find(filter).sort({ urgency: -1 }).lean();

    const sessions = await OfferSessionModel.find({}, { history: 1 }).lean();

    const globalHistory = sessions
      .flatMap((session) => session.history || [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ 
      status: "success", 
      recipients, 
      historyLogs: globalHistory,
      datasource: "mongodb" 
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch recipient records";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (typeof value === "number" && Number.isNaN(value));
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

type RecipientCreateBody = {
  patientId?: unknown;
  name?: unknown;
  organNeeded?: unknown;
  urgency?: unknown;
  waitingYears?: unknown;
  bloodType?: unknown;
  hlaAntigens?: unknown;
  hospitalId?: unknown;
  hospitalName?: unknown;
};

export async function POST(req: NextRequest) {
  let body: RecipientCreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid JSON body." }, { status: 400 });
  }

  const patientId = body.patientId;
  const name = body.name;
  const organNeeded = body.organNeeded;
  const urgency = body.urgency;
  const waitingYears = body.waitingYears;
  const bloodType = body.bloodType;
  const hlaAntigens = body.hlaAntigens;
  const hospitalId = body.hospitalId;
  const hospitalName = body.hospitalName;

  if (
    isMissing(patientId) ||
    isMissing(name) ||
    isMissing(organNeeded) ||
    isMissing(urgency) ||
    isMissing(bloodType) ||
    isMissing(hospitalId) ||
    isMissing(hospitalName)
  ) {
    return NextResponse.json(
      { status: "error", message: "Missing required fields: patientId, name, organNeeded, urgency, bloodType, hospitalId, hospitalName are all required." },
      { status: 400 }
    );
  }

  const db = await connectToDatabase();
  if (!db) {
    return NextResponse.json(
      { status: "error", message: "Database connection unavailable. Cannot register a new patient while running on the seed fallback." },
      { status: 503 }
    );
  }

  if (
    !isString(patientId) ||
    !isString(name) ||
    !isString(organNeeded) ||
    !isString(bloodType) ||
    !isString(hospitalName)
  ) {
    return NextResponse.json(
      { status: "error", message: "patientId, name, organNeeded, bloodType, and hospitalName must be strings." },
      { status: 400 }
    );
  }

  const antigens = Array.isArray(hlaAntigens) ? (hlaAntigens as number[]) : [];

  let computedBloodMask: number;
  let computedHlaMask: number;
  try {
    computedBloodMask = bloodTypeToMask(String(bloodType));
    computedHlaMask = hlaArrayToMask(antigens);
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err instanceof Error ? err.message : "Invalid bloodType or hlaAntigens" },
      { status: 400 }
    );
  }

  try {
    const recipient = await Recipient.create({
      patientId,
      name,
      organNeeded,
      urgency: Number(urgency),
      waitingYears: Number(waitingYears ?? 0),
      bloodType,
      bloodMask: computedBloodMask,
      hlaAntigens: antigens,
      hlaMask: computedHlaMask,
      hospitalId: Number(hospitalId),
      hospitalName,
      status: "waiting",
    });
    return NextResponse.json({ status: "success", recipient }, { status: 201 });
  } catch (err: unknown) {
    // Most likely real-world cause: duplicate patientId (unique index) or a
    // schema validation failure (e.g. urgency out of 1-10 range).
    const message = err instanceof Error ? err.message : "Failed to register candidate";
    return NextResponse.json({ status: "error", message }, { status: 409 });
  }
}
