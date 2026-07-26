import { Clock3, CheckCircle2, XCircle, TimerOff } from "lucide-react";
import type { OfferHistoryItem } from "@/types/dashboard";

interface AuditFeedProps {
  history: OfferHistoryItem[];
}

function iconFor(item: OfferHistoryItem) {
  if (item.decision === "accept") return <CheckCircle2 size={16} className="text-safe" />;
  if (item.reason === "timeout") return <TimerOff size={16} className="text-urgent" />;
  return <XCircle size={16} className="text-muted" />;
}

function labelFor(item: OfferHistoryItem) {
  if (item.decision === "accept") return "Accepted";
  if (item.reason === "timeout") return "Auto-declined — decision window expired";
  return `Declined — ${item.reason?.replace("_", " ") ?? "no reason given"}`;
}

export default function AuditFeed({ history }: AuditFeedProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white border border-line rounded-card p-5 text-sm text-muted">
        No decisions recorded yet for this session.
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-card shadow-card p-5">
      <h3 className="font-heading font-semibold text-sm mb-3">Session timeline</h3>
      <ol className="space-y-3">
        {[...history].reverse().map((item, i) => (
          <li key={`${item.patient_id}-${item.timestamp}-${i}`} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 shrink-0">{iconFor(item)}</span>
            <div className="min-w-0">
              <p className="font-medium truncate">
                {item.patient_id} <span className="text-muted font-normal">— {labelFor(item)}</span>
              </p>
              <p className="text-[11px] text-muted flex items-center gap-1 font-mono">
                <Clock3 size={11} /> {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}