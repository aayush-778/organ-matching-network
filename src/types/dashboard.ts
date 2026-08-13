// Single source of truth for the shape of data moving through the pipeline.
// Every field here is verified against main.cpp's actual JSON output and
// lib/offerSessions.ts's actual runtime shape.

export type OrganType = "Heart" | "Liver" | "Kidney" | "Lung" | "Pancreas" | "Cornea";

export type SessionStatus = "active" | "accepted" | "exhausted";

export type DeclineReason =
  | "organ_quality"
  | "patient_unstable"
  | "logistics_delay"
  | "size_mismatch"
  | "other";

// Matches main.cpp's ischemiaWindowStatus() -- "unsafe"/"exceeded" candidates
// never reach ranked_match_run, they're filtered into screened_out instead,
// so only these two values are ever actually seen here.
export type IschemiaWindowStatus = "safe" | "tight";

export interface Logistics {
  path_sequence: string[];
  total_eta_minutes: number;
  ischemia_window_status: IschemiaWindowStatus;
}

export interface QueueItem {
  patient_id: string;
  priority_score: number;
  compatibility: string;
  logistics: Logistics;
  distance_km_source: "reported" | "eta_proxy";
}

export interface OfferHistoryItem {
  patient_id: string;
  decision: "accept" | "decline";
  reason?: DeclineReason | "timeout";
  timestamp: string;
}

export interface MatchResponse {
  status: "success" | "error";
  session_id: string;
  session_status: SessionStatus;
  decision_window_minutes: number;
  current_offer_expires_at: number | null; // epoch ms, NOT an ISO string
  current_offer: QueueItem | null;
  remaining_in_queue: number;
  matches_found: number;
  screened_out: number;
  datasource: "mongodb";
  history?: OfferHistoryItem[];
  message?: string;
  hint?: string;
}

export interface RespondResponse {
  status: "success" | "error";
  session_id?: string;
  session_status?: SessionStatus;
  matched_patient_id?: string | null;
  current_offer?: QueueItem | null;
  current_offer_expires_at?: number | null;
  remaining_in_queue?: number;
  history?: OfferHistoryItem[];
  message?: string;
}

// Intake form collects -- human-readable blood type + HLA loci,
// combined into a single wire mask by lib/bitmask.ts before hitting the API.
export interface IntakeFormValues {
  organ: OrganType;
  ischemia_limit_mins: number;
  donor_hospital_id: number;
  donor_blood_type: string; // e.g. "A+", "O-"
  donor_hla_antigens: number[]; // loci indices 0-15
  max_allowed_hla_mismatches: number;
}

export interface Recipient {
  _id?: string;
  patientId: string;
  name: string;
  organNeeded: OrganType;
  urgency: number;
  waitingYears: number;
  bloodType: string;
  bloodMask: number;
  hlaAntigens: number[];
  hlaMask: number;
  hospitalId: number;
  hospitalName: string;
  status: "waiting" | "matched" | "transplanted" | "removed";
  createdAt?: string;
}

export interface RecipientsResponse {
  status: "success" | "error";
  recipients: Recipient[];
  historyLogs?: OfferHistoryItem[];
  datasource?: "mongodb";
  message?: string;
}

export interface RecipientMutationResponse {
  status: "success" | "error";
  message?: string;
  recipient?: Recipient;
}

// Known hospital IDs seeded into cpp-engine's buildRegionalGraph(). Any
// hospital ID outside this set has no edges in the graph and will always be
// screened out as "no_transit_path_found" -- keep this list in lockstep with
// main.cpp's buildRegionalGraph() until the graph is loaded dynamically.
export const SEEDED_HOSPITAL_IDS = [12, 45, 77, 99] as const;

export const ISCHEMIA_CEILINGS_MINS: Record<OrganType, number> = {
  Heart: 360,
  Lung: 360,
  Liver: 720,
  Pancreas: 720,
  Kidney: 1800,
  Cornea: 10080,
};