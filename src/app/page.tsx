"use client";

import { useEffect, useState, useCallback } from "react";
import IntakeForm from "@/components/command/IntakeForm";
import ActiveOfferCard from "@/components/command/ActiveOfferCard";
import AuditFeed from "@/components/command/AuditFeed";
import DeclineModal from "@/components/command/DeclineModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { submitDonor, getOffer, respondToOffer } from "@/lib/api";
import type {
  MatchResponse,
  IntakeFormValues,
  DeclineReason,
} from "@/types/dashboard";
import { Activity } from "lucide-react";

const POLL_INTERVAL = 5000;
const ACTIVE_SESSION_STORAGE_KEY = "organmatch.activeSessionId";

export default function CommandCenterPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
  });
  const [matchData, setMatchData] = useState<MatchResponse | null>(null);
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeSessionId) {
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
    } else {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
  }, [activeSessionId]);

  const pollSession = useCallback(async (sessionId: string) => {
    try {
      const res = await getOffer(sessionId);
      if (res.status === "success") {
        setMatchData((prev) =>
          prev
            ? {
                ...prev,
                session_status: res.session_status ?? prev.session_status,
                current_offer: res.current_offer ?? null,
                current_offer_expires_at: res.current_offer_expires_at ?? null,
                remaining_in_queue: res.remaining_in_queue ?? prev.remaining_in_queue,
                history: res.history ?? prev.history,
              }
            : (res as MatchResponse)
        );
      } else if (res.session_status === "exhausted") {
        setMatchData((prev) =>
          prev
            ? {
                ...prev,
                session_status: "exhausted",
                current_offer: null,
                current_offer_expires_at: null,
                remaining_in_queue: 0,
              }
            : null
        );
      } else if (res.message?.toLowerCase().includes("expired") || res.message?.toLowerCase().includes("not found")) {
        setActiveSessionId(null);
        setMatchData(null);
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;

    const initialPoll = window.setTimeout(() => {
      void pollSession(activeSessionId);
    }, 0);

    const timer = setInterval(() => {
      void pollSession(activeSessionId);
    }, POLL_INTERVAL);

    return () => {
      window.clearTimeout(initialPoll);
      clearInterval(timer);
    };
  }, [activeSessionId, pollSession]);

  async function handleDonorSubmit(values: IntakeFormValues) {
    if (matchData?.session_status === "active") {
      setErrorMessage("Finish the current active session before starting another intake.");
      return;
    }

    setSubmittingIntake(true);
    setErrorMessage(null);
    try {
      const res = await submitDonor(values);
      if (res.status === "success" && res.session_id) {
        setActiveSessionId(res.session_id);
        setMatchData(res);
      } else {
        setErrorMessage(res.message || "No eligible matches found in queue.");
        setMatchData(null);
        setActiveSessionId(null);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to run donor match pipeline."
      );
      setMatchData(null);
      setActiveSessionId(null);
    } finally {
      setSubmittingIntake(false);
    }
  }

  async function handleAccept() {
    if (!activeSessionId) return;
    setBusyAction(true);
    setErrorMessage(null);
    try {
      const res = await respondToOffer(activeSessionId, "accept");
      if (res.status === "success" && res.session_status === "accepted") {
        setMatchData((prev) =>
          prev
            ? {
                ...prev,
                session_status: "accepted",
                current_offer: null,
                current_offer_expires_at: null,
                remaining_in_queue: 0,
                history: res.history ?? prev.history,
              }
            : null
        );
      } else if (res.status === "error") {
        setErrorMessage(res.message || "Match conflict: Patient matched elsewhere.");
        await pollSession(activeSessionId);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to register acceptance."
      );
    } finally {
      setBusyAction(false);
    }
  }

  async function handleDeclineConfirm(reason: DeclineReason) {
    if (!activeSessionId) return;
    setBusyAction(true);
    setErrorMessage(null);
    try {
      const res = await respondToOffer(activeSessionId, "decline", reason);
      setDeclineModalOpen(false);

      if (res.status === "success" && res.current_offer) {
        setMatchData((prev) =>
          prev
            ? {
                ...prev,
                current_offer: res.current_offer ?? null,
                current_offer_expires_at: res.current_offer_expires_at ?? null,
                remaining_in_queue: res.remaining_in_queue ?? 0,
                session_status: (res.session_status as "active" | "accepted" | "exhausted") ?? prev.session_status,
                history: res.history ?? prev.history,
              }
            : null
        );
      } else if (res.status === "success") {
        setMatchData((prev) =>
          prev
            ? {
                ...prev,
                session_status: (res.session_status as "active" | "accepted" | "exhausted") ?? "exhausted",
                current_offer: null,
                current_offer_expires_at: null,
                remaining_in_queue: 0,
                history: res.history ?? prev.history,
              }
            : null
        );
      } else {
        setErrorMessage(res.message || "Failed to decline offer.");
        await pollSession(activeSessionId);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to decline offer."
      );
    } finally {
      setBusyAction(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink font-heading">
            Allocation Command
          </h1>
          <p className="text-sm text-muted font-sans mt-0.5">
            Manage live organ donor matches and candidate decision queues.
          </p>
        </div>
        {activeSessionId && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted bg-surface border border-line px-2.5 py-1 rounded-md">
              Session: {activeSessionId.slice(0, 8)}...
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveSessionId(null);
                setMatchData(null);
                window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
              }}
            >
              Clear Session
            </Button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-urgent-light border border-urgent/20 text-urgent p-4 rounded-xl shadow-sm text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <IntakeForm
            onSubmit={handleDonorSubmit}
            submitting={submittingIntake || matchData?.session_status === "active"}
          />

          {matchData && (
            <div className="bg-white border border-line rounded-card shadow-card p-6 space-y-4">
              <h3 className="font-semibold text-base text-ink font-heading tracking-tight">
                Match Overview
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                <div className="bg-surface p-3 rounded-xl border border-line/60 flex flex-col justify-center">
                  <span className="text-muted font-medium text-[10px] uppercase tracking-wider mb-1.5 font-mono">
                    Status
                  </span>
                  <div className="flex items-center gap-2">
                    {matchData.session_status === "active" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                    <Badge
                      tone={
                        matchData.session_status === "accepted" ? "safe"
                          : matchData.session_status === "active" ? "primary"
                          : "neutral"
                      }
                    >
                      {matchData.session_status}
                    </Badge>
                  </div>
                </div>

                <div className="bg-surface p-3 rounded-xl border border-line/60">
                  <span className="text-muted font-medium text-[10px] uppercase tracking-wider mb-1 block font-mono">
                    Matches Found
                  </span>
                  <span className="text-xl font-mono font-bold text-ink">
                    {matchData.matches_found ?? 0}
                  </span>
                </div>
                
                <div className="bg-surface p-3 rounded-xl border border-line/60">
                  <span className="text-muted font-medium text-[10px] uppercase tracking-wider mb-1 block font-mono">
                    Screened Out
                  </span>
                  <span className="text-xl font-mono font-bold text-ink">
                    {matchData.screened_out ?? 0}
                  </span>
                </div>
                
                <div className="bg-surface p-3 rounded-xl border border-line/60 flex flex-col justify-center">
                  <span className="text-muted font-medium text-[10px] uppercase tracking-wider mb-1 block font-mono">
                    Source
                  </span>
                  <span className="text-xs font-mono font-semibold uppercase text-ink">
                    {matchData.datasource}
                  </span>
                </div>

              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-6">
          {matchData?.current_offer && matchData.session_status === "active" ? (
            <ActiveOfferCard
              offer={matchData.current_offer}
              expiresAt={matchData.current_offer_expires_at}
              decisionWindowMinutes={matchData.decision_window_minutes || 30}
              remainingInQueue={matchData.remaining_in_queue}
              onAccept={handleAccept}
              onDecline={() => setDeclineModalOpen(true)}
              busy={busyAction}
            />
          ) : matchData?.session_status === "accepted" ? (
            <div className="bg-safe-light border border-safe/20 rounded-card p-8 text-center space-y-2 shadow-card">
              <h3 className="font-semibold text-safe text-xl font-heading">
                Match Confirmed & Accepted
              </h3>
              <p className="text-sm text-muted font-sans">
                Logistics protocol initiated. Recipient facility notified.
              </p>
            </div>
          ) : matchData?.session_status === "exhausted" ? (
            <div className="bg-surface border border-line rounded-card p-8 text-center space-y-2 shadow-card">
              <h3 className="font-semibold text-ink text-xl font-heading">
                Queue Exhausted
              </h3>
              <p className="text-sm text-muted font-sans">
                All candidates were evaluated or declined. Start a new intake or expand search constraints.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-line rounded-card shadow-card p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[260px] transition-all hover:bg-surface/50">
              <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center shadow-inner">
                <Activity size={24} strokeWidth={1.75} />
              </div>
              <div className="max-w-sm space-y-1.5">
                <h3 className="text-lg font-semibold text-ink tracking-tight font-heading">
                  No Active Match Session
                </h3>
                <p className="text-sm text-muted leading-relaxed font-sans">
                  Submit a donor notification from the intake form to trigger real-time candidate evaluation across the network.
                </p>
              </div>
            </div>
          )}

          <AuditFeed history={matchData?.history || []} />
        </div>
      </div>

      <DeclineModal
        open={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        onConfirm={handleDeclineConfirm}
        submitting={busyAction}
      />
    </div>
  );
}