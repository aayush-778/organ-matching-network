// File: src/lib/offerSessions.ts
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Recipient } from "@/models/Recipient";
import { OfferSessionModel } from "@/models/OfferSession";

export interface LogisticsDetails {
  path_sequence: string[];
  total_eta_minutes: number;
  ischemia_window_status: "safe" | "tight";
}

export interface QueueItem {
  patient_id: string;
  priority_score: number;
  compatibility: string;
  logistics: LogisticsDetails;
  distance_km_source?: "reported" | "eta_proxy";
}

export type DeclineReason =
  | "organ_quality"
  | "patient_unstable"
  | "logistics_delay"
  | "size_mismatch"
  | "other";

export interface OfferHistoryItem {
  patient_id: string;
  decision: "accept" | "decline";
  reason?: DeclineReason | "timeout";
  timestamp: string;
  eta_minutes?: number;
}

export interface OfferSession {
  id: string;
  organ: string;
  ischemia_limit_mins: number;
  donor_hospital_id: number;
  status: "active" | "accepted" | "exhausted";
  queue: QueueItem[];
  history: OfferHistoryItem[];
  matched_patient_id?: string;
  createdAt: number;
  currentOfferExpiresAt: number | null; // epoch ms
  engineLatencyMs: number;
  matches_found: number;
  screened_out: number;
  datasource: "mongodb" | "fallback_seed";
}

export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionError";
  }
}

type OfferSessionGlobalCache = typeof globalThis & {
  _offerSessionCache?: Map<string, OfferSession>;
};

const globalSymbols = globalThis as OfferSessionGlobalCache;
if (!globalSymbols._offerSessionCache) {
  globalSymbols._offerSessionCache = new Map<string, OfferSession>();
}
// NOTE: this cache is currently write-only -- every read (getSession,
// listSessions) goes straight to Mongo and never checks here first. Left in
// place since removing it is a design decision, not a bug fix, but worth
// knowing it's not actually saving you any DB round trips right now. If you
// want it to function as a real cache, loadSession would need to check it
// (with a short TTL, since Mongo is the source of truth for cross-process
// consistency) before querying.
const sessionCache: Map<string, OfferSession> = globalSymbols._offerSessionCache;

const DECISION_WINDOW_MINUTES = 30;

export function decisionWindowMinutes(): number {
  return DECISION_WINDOW_MINUTES;
}

function expiryFromNow(): number {
  return Date.now() + DECISION_WINDOW_MINUTES * 60_000;
}

function cloneSession(session: OfferSession): OfferSession {
  const { _id, ...rest } = session as OfferSession & { _id?: unknown };
  void _id;
  return {
    ...rest,
    queue: session.queue.map((item) => ({
      ...item,
      logistics: { ...item.logistics },
    })),
    history: session.history.map((item) => ({ ...item })),
  };
}

function expireStaleOffers(session: OfferSession): { session: OfferSession; mutated: boolean } {
  if (session.status !== "active") {
    return { session, mutated: false };
  }

  let mutated = false;
  while (
    session.status === "active" &&
    session.queue.length > 0 &&
    session.currentOfferExpiresAt !== null &&
    Date.now() > session.currentOfferExpiresAt
  ) {
    const expiredCandidate = session.queue[0];
    session.history.push({
      patient_id: expiredCandidate.patient_id,
      decision: "decline",
      reason: "timeout",
      timestamp: new Date().toISOString(),
      eta_minutes: expiredCandidate.logistics.total_eta_minutes,
    });
    session.queue.shift();
    mutated = true;

    if (session.queue.length === 0) {
      session.status = "exhausted";
      session.currentOfferExpiresAt = null;
    } else {
      session.currentOfferExpiresAt = expiryFromNow();
    }
  }

  return { session, mutated };
}

async function saveSession(session: OfferSession): Promise<void> {
  await OfferSessionModel.updateOne(
    { id: session.id },
    { $set: session },
    { upsert: true }
  );
  sessionCache.set(session.id, cloneSession(session));
}

async function loadSession(sessionId: string): Promise<OfferSession | undefined> {
  const db = await connectToDatabase();
  if (!db) {
    return undefined;
  }

  const persisted = await OfferSessionModel.findOne({ id: sessionId }).lean<OfferSession>();
  if (!persisted) {
    return undefined;
  }

  const session = cloneSession(persisted);
  const { session: freshSession, mutated } = expireStaleOffers(session);
  if (mutated) {
    // NOTE: this write is a plain $set of the whole document, with no
    // optimistic-concurrency guard (no version field, no filter on the
    // document's previous state), and it doesn't run inside a transaction
    // the way respondToOffer's accept path now does. In practice this only
    // matters if a GET poll's auto-expire write races with a concurrent
    // respondToOffer call on the SAME session at almost the exact same
    // moment -- a narrow window, but a real one, and it's the one place in
    // this file that isn't protected the way the accept path is.
    await saveSession(freshSession);
    return freshSession;
  }

  sessionCache.set(sessionId, cloneSession(freshSession));
  return freshSession;
}

export async function createSession(
  organ: string,
  ischemiaLimit: number,
  donorHospitalId: number,
  rankedQueue: QueueItem[],
  engineLatencyMs: number = 0,
  matchesFound: number = rankedQueue.length,
  screenedOut: number = 0,
  datasource: "mongodb" | "fallback_seed" = "mongodb"
): Promise<OfferSession> {
  const db = await connectToDatabase();
  if (!db) {
    throw new SessionError("Database connection unavailable. Unable to create match session.");
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newSession: OfferSession = {
    id: sessionId,
    organ,
    ischemia_limit_mins: ischemiaLimit,
    donor_hospital_id: donorHospitalId,
    status: rankedQueue.length > 0 ? "active" : "exhausted",
    queue: [...rankedQueue],
    history: [],
    createdAt: Date.now(),
    currentOfferExpiresAt: rankedQueue.length > 0 ? expiryFromNow() : null,
    engineLatencyMs,
    matches_found: matchesFound,
    screened_out: screenedOut,
    datasource,
  };

  await saveSession(newSession);
  return newSession;
}

export async function getSession(sessionId: string): Promise<OfferSession | undefined> {
  return loadSession(sessionId);
}

export async function listSessions(): Promise<OfferSession[]> {
  const db = await connectToDatabase();
  if (!db) {
    return [];
  }

  const sessions = await OfferSessionModel.find({}).lean<OfferSession[]>();
  const results: OfferSession[] = [];

  for (const persisted of sessions) {
    const session = cloneSession(persisted);
    const { session: freshSession, mutated } = expireStaleOffers(session);
    if (mutated) {
      await saveSession(freshSession);
    } else {
      sessionCache.set(freshSession.id, cloneSession(freshSession));
    }
    results.push(freshSession);
  }

  return results;
}

export function currentOffer(session: OfferSession): QueueItem | null {
  const { session: fresh } = expireStaleOffers(session);
  if (fresh.status !== "active" || fresh.queue.length === 0) {
    return null;
  }
  return fresh.queue[0];
}

export async function respondToOffer(
  sessionId: string,
  decision: "accept" | "decline",
  reason?: DeclineReason
): Promise<OfferSession> {
  const db = await connectToDatabase();
  if (!db) {
    throw new SessionError("Database connection unavailable. Unable to update match session.");
  }

  const mongoSession = await mongoose.startSession();
  let updatedSession: OfferSession | undefined;

  try {
    await mongoSession.withTransaction(async () => {
      const persisted = await OfferSessionModel.findOne({ id: sessionId })
        .session(mongoSession)
        .lean<OfferSession>();
      if (!persisted) {
        throw new SessionError("Target allocation session does not exist.");
      }

      const session = cloneSession(persisted);
      const { session: freshSession } = expireStaleOffers(session);

      if (freshSession.status !== "active") {
        throw new SessionError(`Cannot register decision. Session status is already: ${freshSession.status}`);
      }

      const targetPatient = currentOffer(freshSession);
      if (!targetPatient) {
        freshSession.status = "exhausted";
        freshSession.currentOfferExpiresAt = null;
        await OfferSessionModel.updateOne(
          { id: sessionId },
          { $set: freshSession },
          { session: mongoSession }
        );
        throw new SessionError("No active patient queue items remaining to target.");
      }

      if (decision === "accept") {
        const updateResult = await Recipient.updateOne(
          { patientId: targetPatient.patient_id, status: "waiting" },
          { $set: { status: "matched" } },
          { session: mongoSession }
        );

        if (updateResult.modifiedCount === 0) {
          throw new SessionError(
            `Patient ${targetPatient.patient_id} is no longer available (already matched or removed by another session).`
          );
        }
      }

      freshSession.history.push({
        patient_id: targetPatient.patient_id,
        decision,
        reason,
        timestamp: new Date().toISOString(),
        eta_minutes: targetPatient.logistics.total_eta_minutes,
      });

      if (decision === "accept") {
        freshSession.status = "accepted";
        freshSession.matched_patient_id = targetPatient.patient_id;
        freshSession.queue = [];
        freshSession.currentOfferExpiresAt = null;
      } else {
        freshSession.queue.shift();
        if (freshSession.queue.length === 0) {
          freshSession.status = "exhausted";
          freshSession.currentOfferExpiresAt = null;
        } else {
          freshSession.currentOfferExpiresAt = expiryFromNow();
        }
      }

      await OfferSessionModel.updateOne(
        { id: sessionId },
        { $set: freshSession },
        { session: mongoSession }
      );
      updatedSession = freshSession;
    });
  } finally {
    mongoSession.endSession();
  }

  if (!updatedSession) {
    throw new SessionError("Unexpected synchronization exception.");
  }

  sessionCache.set(updatedSession.id, cloneSession(updatedSession));
  return updatedSession;
}