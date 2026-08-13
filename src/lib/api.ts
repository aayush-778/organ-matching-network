// File: src/lib/api.ts
import type {
  IntakeFormValues,
  MatchResponse,
  RespondResponse,
  Recipient,
  RecipientsResponse,
  RecipientMutationResponse,
} from "@/types/dashboard";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store", // <-- Forces the browser/Next.js to always fetch fresh data
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json();
  return data as T;
}

export function submitDonor(values: IntakeFormValues) {
  return request<MatchResponse>("/api/match", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function getOffer(sessionId: string) {
  return request<MatchResponse>(`/api/offers/${sessionId}`);
}

export function respondToOffer(
  sessionId: string,
  decision: "accept" | "decline",
  reason?: string
) {
  return request<RespondResponse>(`/api/offers/${sessionId}/respond`, {
    method: "POST",
    body: JSON.stringify({ decision, reason }),
  });
}

export function listRecipients(organ?: string) {
  const qs = organ ? `?organ=${encodeURIComponent(organ)}` : "";
  return request<RecipientsResponse>(`/api/recipients${qs}`);
}

export async function addRecipient(
  recipient: Omit<Recipient, "status" | "createdAt" | "bloodMask" | "hlaMask" | "_id">
): Promise<{ ok: boolean; message?: string; recipient?: Recipient }> {
  const res = await request<RecipientMutationResponse>("/api/recipients", {
    method: "POST",
    body: JSON.stringify(recipient),
  });
  return { ok: res.status === "success", message: res.message, recipient: res.recipient };
}