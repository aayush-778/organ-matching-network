"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { DeclineReason } from "@/types/dashboard";

const REASONS: { value: DeclineReason; label: string }[] = [
  { value: "organ_quality", label: "Organ quality concern" },
  { value: "patient_unstable", label: "Patient condition changed" },
  { value: "logistics_delay", label: "Logistics not viable" },
  { value: "size_mismatch", label: "Size mismatch" },
  { value: "other", label: "Other" },
];

interface DeclineModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: DeclineReason) => void;
  submitting: boolean;
}

export default function DeclineModal({ open, onClose, onConfirm, submitting }: DeclineModalProps) {
  const [reason, setReason] = useState<DeclineReason>("logistics_delay");

  return (
    <Modal open={open} onClose={onClose} title="Decline this offer">
      <p className="text-sm text-muted mb-4">
        This moves the offer to the next ranked candidate. Select the reason for the audit record.
      </p>
      <div className="space-y-2">
        {REASONS.map((r) => (
          <label
            key={r.value}
            className={`flex items-center gap-3 rounded-card border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
              reason === r.value ? "border-primary bg-primary-light text-primary-dark" : "border-line"
            }`}
          >
            <input
              type="radio"
              name="decline-reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="accent-primary"
            />
            {r.label}
          </label>
        ))}
      </div>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button variant="danger" onClick={() => onConfirm(reason)} disabled={submitting} className="flex-1">
          {submitting ? "Declining…" : "Confirm decline"}
        </Button>
      </div>
    </Modal>
  );
}