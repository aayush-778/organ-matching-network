import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Recipient } from "@/models/Recipient";
import {
  getSession,
  respondToOffer,
  currentOffer,
  SessionError,
  type DeclineReason,
} from "@/lib/offerSessions";

type OfferDecision = "accept" | "decline";

const VALID_DECISIONS: OfferDecision[] = ["accept", "decline"];
const VALID_REASONS: DeclineReason[] = [
  "organ_quality",
  "patient_unstable",
  "logistics_delay",
  "size_mismatch",
  "other",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  let body: { decision?: string; reason?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON parsing context." },
      { status: 400 }
    );
  }

  if (!body.decision || !VALID_DECISIONS.includes(body.decision as OfferDecision)) {
    return NextResponse.json(
      { status: "error", message: `Decision must match exactly: ${VALID_DECISIONS.join(", ")}` },
      { status: 400 }
    );
  }

  if (body.decision === "decline" && body.reason && !VALID_REASONS.includes(body.reason as DeclineReason)) {
    return NextResponse.json(
      { status: "error", message: `Decline reason invalid. Use: ${VALID_REASONS.join(", ")}` },
      { status: 400 }
    );
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { status: "error", message: "Session matching token expired or not found." },
      { status: 404 }
    );
  }

  try {
    const targetCandidate = currentOffer(session);
    if (!targetCandidate) {
      return NextResponse.json(
        { status: "error", message: "No active recipient offers found on queue stack." },
        { status: 400 }
      );
    }

    if (body.decision === "accept") {
      const db = await connectToDatabase();
      if (db) {
        const updateResult = await Recipient.updateOne(
          { patientId: targetCandidate.patient_id, status: "waiting" },
          { $set: { status: "matched" } }
        );

        if (updateResult.modifiedCount === 0) {
          return NextResponse.json(
            {
              status: "error",
              message: `Patient ${targetCandidate.patient_id} is no longer available (already matched or removed by another session).`,
            },
            { status: 409 }
          );
        }
      }
    }

    const updatedSession = respondToOffer(
      sessionId,
      body.decision as OfferDecision,
      body.reason as DeclineReason | undefined
    );

    return NextResponse.json({
      status: "success",
      session_id: updatedSession.id,
      session_status: updatedSession.status,
      matched_patient_id: updatedSession.matched_patient_id ?? null,
      current_offer: currentOffer(updatedSession) ?? null,
      current_offer_expires_at: updatedSession.currentOfferExpiresAt,
      remaining_in_queue: updatedSession.queue.length,
      history: updatedSession.history,
    });
  } catch (err: unknown) {
    if (err instanceof SessionError) {
      return NextResponse.json({ status: "error", message: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { status: "error", message: "Unexpected synchronization exception." },
      { status: 500 }
    );
  }
}