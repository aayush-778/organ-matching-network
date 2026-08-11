// File: src/app/api/analytics/route.ts
// Everything below is computed from real data: persisted session history and
// the Recipient collection. Nothing here is a placeholder value.

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Recipient } from "@/models/Recipient";
import { listSessions } from "@/lib/offerSessions";

export async function GET() {
  try {
    const sessions = await listSessions();

    const allDecisions = sessions.flatMap((s) => s.history);
    const totalOffers = allDecisions.length;
    const acceptedOffers = allDecisions.filter((d) => d.decision === "accept").length;
    const acceptRatePercent = totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 1000) / 10 : 0;

    const etaSamples = allDecisions
      .map((d) => d.eta_minutes)
      .filter((v): v is number => typeof v === "number");
    const avgIschemiaHours =
      etaSamples.length > 0
        ? Math.round((etaSamples.reduce((sum, v) => sum + v, 0) / etaSamples.length / 60) * 100) / 100
        : 0;

    // Real engine round-trip latency, averaged across every match run in
    // this process's session cache.
    const latencySamples = sessions.map((s) => s.engineLatencyMs).filter((v) => v > 0);
    const systemLatencyMs =
      latencySamples.length > 0
        ? Math.round(latencySamples.reduce((sum, v) => sum + v, 0) / latencySamples.length)
        : 0;

    // Successful transplants: real count from the recipient collection
    // (falls back to 0, not a fabricated number, if there's no DB connected
    // -- the seed data has no "matched"/"transplanted" records by design).
    let successfulTransplants = 0;
    const db = await connectToDatabase();
    if (db) {
      successfulTransplants = await Recipient.countDocuments({
        status: { $in: ["matched", "transplanted"] },
      });
    }

    return NextResponse.json({
      avgIschemiaHours,
      acceptRatePercent,
      successfulTransplants,
      systemLatencyMs,
      sampleSize: {
        sessions: sessions.length,
        decisions: totalOffers,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to compute analytics";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}