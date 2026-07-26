// ============================================================================
// Offer cascade state machine.
//
// A "match run" produces a ranked list of candidates. In the real system the
// organ is offered to the top candidate; the transplant team accepts or
// declines within a time limit; if declined, the offer moves to the next
// candidate; this repeats until someone accepts or the list is exhausted.
// This module models exactly that, one session per donor notification.
//
// Storage: in-memory Map, cached on globalThis so it survives Next.js's
// dev-mode hot reloads. This is intentionally NOT persisted to a database --
// see README for how you'd swap this for a Redis-backed store if you need
// sessions to survive a server restart or run across multiple instances.
// ============================================================================

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
const sessionCache: Map<string, OfferSession> = globalSymbols._offerSessionCache;

const DECISION_WINDOW_MINUTES = 30;

export function decisionWindowMinutes(): number {
  return DECISION_WINDOW_MINUTES;
}

function expiryFromNow(): number {
  return Date.now() + DECISION_WINDOW_MINUTES * 60_000;
}

export function createSession(
  organ: string,
  ischemiaLimit: number,
  donorHospitalId: number,
  rankedQueue: QueueItem[]
): OfferSession {
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
  };

  sessionCache.set(sessionId, newSession);
  return newSession;
}

function expireStaleOffers(session: OfferSession): OfferSession {
  if (session.status !== "active") return session;

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
    });
    session.queue.shift();

    if (session.queue.length === 0) {
      session.status = "exhausted";
      session.currentOfferExpiresAt = null;
    } else {
      session.currentOfferExpiresAt = expiryFromNow();
    }
  }

  sessionCache.set(session.id, session);
  return session;
}

export function getSession(sessionId: string): OfferSession | undefined {
  const session = sessionCache.get(sessionId);
  if (!session) return undefined;
  return expireStaleOffers(session);
}

export function currentOffer(session: OfferSession): QueueItem | null {
  const fresh = expireStaleOffers(session);
  if (fresh.status !== "active" || fresh.queue.length === 0) {
    return null;
  }
  return fresh.queue[0];
}

export function respondToOffer(
  sessionId: string,
  decision: "accept" | "decline",
  reason?: DeclineReason
): OfferSession {
  let session = sessionCache.get(sessionId);
  if (!session) {
    throw new SessionError("Target allocation session does not exist.");
  }

  session = expireStaleOffers(session);

  if (session.status !== "active") {
    throw new SessionError(`Cannot register decision. Session status is already: ${session.status}`);
  }

  const targetPatient = currentOffer(session);
  if (!targetPatient) {
    session.status = "exhausted";
    session.currentOfferExpiresAt = null;
    sessionCache.set(sessionId, session);
    throw new SessionError("No active patient queue items remaining to target.");
  }

  session.history.push({
    patient_id: targetPatient.patient_id,
    decision,
    reason,
    timestamp: new Date().toISOString(),
  });

  if (decision === "accept") {
    session.status = "accepted";
    session.matched_patient_id = targetPatient.patient_id;
    session.queue = [];
    session.currentOfferExpiresAt = null;
  } else {
    session.queue.shift();
    if (session.queue.length === 0) {
      session.status = "exhausted";
      session.currentOfferExpiresAt = null;
    } else {
      session.currentOfferExpiresAt = expiryFromNow();
    }
  }

  sessionCache.set(sessionId, session);
  return session;
}
