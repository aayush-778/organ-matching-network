"use client";

import React, { useState } from "react";
import Badge from "@/components/ui/Badge";
import type { Recipient } from "@/types/dashboard";
import { ChevronLeft, ChevronRight, Users, History, CalendarClock } from "lucide-react";

export interface OfferHistoryItem {
  patient_id: string;
  decision: "accept" | "decline";
  reason?: string;
  timestamp: string;
  eta_minutes?: number;
}

interface PatientTableProps {
  recipients: Recipient[];
  historyLogs?: OfferHistoryItem[];
  loading: boolean;
}

function statusTone(status: Recipient["status"]) {
  if (status === "waiting") return "primary" as const;
  if (status === "matched") return "safe" as const;
  return "neutral" as const;
}

function decisionTone(decision: string) {
  if (decision === "accept") return "safe" as const;
  if (decision === "decline") return "urgent" as const;
  return "neutral" as const;
}

export default function PatientTable({ recipients, historyLogs = [], loading }: PatientTableProps) {
  const [activeTab, setActiveTab] = useState<"registry" | "history">("registry");
  
  // Pagination State (Strictly 10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const totalPages = Math.ceil(historyLogs.length / ITEMS_PER_PAGE);
  const paginatedHistory = historyLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(date);
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-line rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-sm font-medium text-muted space-y-3 min-h-[300px]">
        <span className="animate-spin h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full"></span>
        <span>Loading clinical records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean, Floating Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-line pb-2">
        <button
          onClick={() => setActiveTab("registry")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none ${
            activeTab === "registry"
              ? "bg-ink text-white shadow-sm"
              : "bg-white border border-line text-muted hover:bg-surface hover:text-ink"
          }`}
        >
          <Users size={16} strokeWidth={2} />
          Patient List
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setCurrentPage(1); // Always reset pagination on tab switch
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none ${
            activeTab === "history"
              ? "bg-ink text-white shadow-sm"
              : "bg-white border border-line text-muted hover:bg-surface hover:text-ink"
          }`}
        >
          <History size={16} strokeWidth={2} />
          Match History
        </button>
      </div>

      {/* Main Unified Box Container */}
      <div className="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
        
        {/* REGISTRY VIEW */}
        {activeTab === "registry" && (
          <>
            {recipients.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <Users size={32} className="mx-auto text-muted/40" />
                <h3 className="text-lg font-semibold text-ink font-heading">No Patients Registered</h3>
                <p className="text-sm text-muted font-sans max-w-sm mx-auto">
                  The waiting pool is currently empty. Run the database seed script to populate clinical candidates.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm font-sans whitespace-nowrap">
                    <thead className="bg-surface/50 border-b border-line">
                      <tr>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Patient ID</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Organ</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Urgency</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Waiting Time</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Location</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {recipients.map((r) => (
                        <tr key={r.patientId} className="hover:bg-surface/30 transition-colors group">
                          <td className="px-6 py-4 font-mono font-bold text-ink/80 group-hover:text-ink">{r.patientId}</td>
                          <td className="px-6 py-4 text-ink font-semibold">{r.organNeeded}</td>
                          <td className="px-6 py-4 font-mono text-muted">{r.urgency}/10</td>
                          <td className="px-6 py-4 font-mono text-muted">{r.waitingYears}y</td>
                          <td className="px-6 py-4 font-mono text-muted">Hospital #{r.hospitalId}</td>
                          <td className="px-6 py-4">
                            <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View (Contained inside the main box) */}
                <div className="md:hidden divide-y divide-line/60">
                  {recipients.map((r) => (
                    <div key={r.patientId} className="p-5 space-y-4 hover:bg-surface/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-ink">{r.patientId}</span>
                        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-ink">{r.organNeeded}</p>
                      <div className="grid grid-cols-2 gap-3 text-xs text-muted font-mono bg-surface p-3.5 rounded-xl">
                        <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase font-sans font-bold tracking-wider text-muted/70">Urgency</span>{r.urgency}/10</div>
                        <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase font-sans font-bold tracking-wider text-muted/70">Waiting</span>{r.waitingYears}y</div>
                        <div className="flex flex-col gap-0.5 col-span-2 pt-1"><span className="text-[10px] uppercase font-sans font-bold tracking-wider text-muted/70">Location</span>Hospital #{r.hospitalId}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* HISTORY VIEW */}
        {activeTab === "history" && (
          <>
            {historyLogs.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <CalendarClock size={32} className="mx-auto text-muted/40" />
                <h3 className="text-lg font-semibold text-ink font-heading">No Historical Data</h3>
                <p className="text-sm text-muted font-sans max-w-sm mx-auto">
                  Past allocation decisions, timeouts, and matched records will populate here once match runs are completed.
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm font-sans whitespace-nowrap">
                    <thead className="bg-surface/50 border-b border-line">
                      <tr>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Timestamp</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Patient ID</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Decision</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">Reasoning</th>
                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase text-muted tracking-widest">ETA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {paginatedHistory.map((log, idx) => (
                        <tr key={idx} className="hover:bg-surface/30 transition-colors group">
                          <td className="px-6 py-4 text-muted font-medium">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-ink/80 group-hover:text-ink">{log.patient_id}</td>
                          <td className="px-6 py-4">
                            <Badge tone={decisionTone(log.decision)}>{log.decision}</Badge>
                          </td>
                          <td className="px-6 py-4 text-muted max-w-[220px] truncate capitalize font-medium">
                            {log.reason ? log.reason.replace("_", " ") : "—"}
                          </td>
                          <td className="px-6 py-4 font-mono text-muted">
                            {log.eta_minutes ? `${log.eta_minutes} mins` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-line/60">
                  {paginatedHistory.map((log, idx) => (
                    <div key={idx} className="p-5 space-y-4 hover:bg-surface/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-ink">{log.patient_id}</span>
                        <Badge tone={decisionTone(log.decision)}>{log.decision}</Badge>
                      </div>
                      <div className="bg-surface p-4 rounded-xl text-xs font-medium text-muted space-y-3">
                        <div className="flex justify-between items-center border-b border-line/50 pb-2">
                          <span className="font-bold uppercase text-[10px] tracking-widest text-muted/70">Time</span>
                          <span className="text-ink">{formatDate(log.timestamp)}</span>
                        </div>
                        {log.reason && (
                          <div className="flex justify-between items-center border-b border-line/50 pb-2">
                            <span className="font-bold uppercase text-[10px] tracking-widest text-muted/70">Reason</span>
                            <span className="capitalize text-ink">{log.reason.replace("_", " ")}</span>
                          </div>
                        )}
                        {log.eta_minutes && (
                          <div className="flex justify-between items-center">
                            <span className="font-bold uppercase text-[10px] tracking-widest text-muted/70">Transit ETA</span>
                            <span className="font-mono text-ink">{log.eta_minutes}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Refined Pagination Controls integrated into the bottom of the container */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-line p-4 bg-surface/30 mt-auto">
                    <span className="text-xs font-semibold text-muted px-2 font-mono">
                      {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, historyLogs.length)} – {Math.min(currentPage * ITEMS_PER_PAGE, historyLogs.length)} of {historyLogs.length}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-line text-ink bg-white hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm focus:outline-none"
                      >
                        <ChevronLeft size={16} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-line text-ink bg-white hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm focus:outline-none"
                      >
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}