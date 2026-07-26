import { NextRequest, NextResponse } from "next/server";
import { getSession, currentOffer, decisionWindowMinutes } from "@/lib/offerSessions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ status: "error", message: "Session not found or expired." }, { status: 404 });
  }

  return NextResponse.json({
    status: "success",
    session_id: session.id,
    session_status: session.status,
    decision_window_minutes: decisionWindowMinutes(),
    current_offer_expires_at: session.currentOfferExpiresAt,
    current_offer: currentOffer(session) ?? null,
    remaining_in_queue: session.queue.length,
    matched_patient_id: session.matched_patient_id ?? null,
    history: session.history,
  });
}