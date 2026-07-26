"use client";

import { useEffect, useState } from "react";
import { MapPin, Clock, Check, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { QueueItem } from "@/types/dashboard";

interface ActiveOfferCardProps {
  offer: QueueItem;
  expiresAt: number | null;
  decisionWindowMinutes: number;
  remainingInQueue: number;
  onAccept: () => void;
  onDecline: () => void;
  busy: boolean;
}

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ActiveOfferCard({
  offer,
  expiresAt,
  decisionWindowMinutes,
  remainingInQueue,
  onAccept,
  onDecline,
  busy,
}: ActiveOfferCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalMs = decisionWindowMinutes * 60_000;
  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : totalMs;
  const fraction = totalMs > 0 ? remainingMs / totalMs : 0;
  const dashoffset = RING_CIRCUMFERENCE * (1 - fraction);
  const isUrgent = fraction < 0.2;

  const minutes = Math.floor(remainingMs / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);

  const windowTone =
    offer.logistics.ischemia_window_status === "safe"
      ? "safe"
      : offer.logistics.ischemia_window_status === "tight"
      ? "urgent"
      : "urgent";

  return (
    <div className="bg-white border border-line rounded-card shadow-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r={RING_RADIUS} fill="none" stroke="#E4E9E8" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r={RING_RADIUS}
                fill="none"
                stroke={isUrgent ? "#C4432E" : "#0C6E63"}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashoffset}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono font-semibold text-sm">{offer.priority_score.toFixed(1)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted uppercase tracking-wide">Top candidate</p>
            <p className="font-heading font-semibold text-lg">{offer.patient_id}</p>
            <Badge tone="primary">{offer.compatibility}</Badge>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className={`font-mono text-xl font-semibold ${isUrgent ? "text-urgent" : "text-ink"}`}>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
          <p className="text-[11px] text-muted">to respond</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <MapPin size={14} /> {offer.logistics.path_sequence.join(" → ")}
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <Clock size={14} /> ETA {offer.logistics.total_eta_minutes} min
        </span>
        <Badge tone={windowTone}>{offer.logistics.ischemia_window_status} window</Badge>
      </div>

      <p className="mt-2 text-xs text-muted">{remainingInQueue} more candidate{remainingInQueue === 1 ? "" : "s"} queued if declined</p>

      <div className="mt-4 flex gap-3">
        <Button variant="danger" onClick={onDecline} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5">
          <X size={16} /> Decline
        </Button>
        <Button variant="primary" onClick={onAccept} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5">
          <Check size={16} /> Accept match
        </Button>
      </div>
    </div>
  );
}