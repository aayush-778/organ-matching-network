"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { OrganType, Recipient } from "@/types/dashboard";
import { bloodTypeToMask, hlaArrayToMask } from "@/lib/bitmask";

const ORGANS: OrganType[] = ["Heart", "Liver", "Kidney", "Lung", "Pancreas", "Cornea"];
const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const HLA_KEYS = Array.from({ length: 16 }, (_, i) => `HLA-${i + 1}`);

interface AddPatientModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (recipient: Omit<Recipient, "status" | "createdAt">) => Promise<{ ok: boolean; message?: string }>;
}

const EMPTY = {
  patientId: "",
  name: "",
  organNeeded: "Heart" as OrganType,
  urgency: "5",
  waitingYears: "1.0",
  bloodType: "O+",
  hospitalId: "45",
  hospitalName: "St. Vincent Regional",
};

export default function AddPatientModal({ open, onClose, onSubmit }: AddPatientModalProps) {
  const [form, setForm] = useState(EMPTY);
  const [selectedHla, setSelectedHla] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleHla(idx: number) {
    setSelectedHla((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const bMask = bloodTypeToMask(form.bloodType);
    const hMask = hlaArrayToMask(selectedHla);

    const result = await onSubmit({
      patientId: form.patientId,
      name: form.name,
      organNeeded: form.organNeeded,
      urgency: Number(form.urgency),
      waitingYears: Number(form.waitingYears),
      bloodType: form.bloodType,
      bloodMask: bMask,
      hlaAntigens: selectedHla,
      hlaMask: hMask,
      hospitalId: Number(form.hospitalId),
      hospitalName: form.hospitalName,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? "Could not register patient.");
      return;
    }

    setForm(EMPTY);
    setSelectedHla([]);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Register new patient">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <div className="bg-urgent-light text-urgent text-sm rounded-card px-3 py-2">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-muted">
            Patient ID
            <input
              required
              value={form.patientId}
              onChange={(e) => update("patientId", e.target.value)}
              className="mt-1 w-full font-mono text-sm rounded-card border border-line px-3 py-2 focus-visible:outline-primary"
              placeholder="PT_107"
            />
          </label>

          <label className="block text-xs font-medium text-muted">
            Patient Name
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="mt-1 w-full text-sm rounded-card border border-line px-3 py-2 focus-visible:outline-primary"
              placeholder="E. Vance"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-muted">
            Organ needed
            <select
              value={form.organNeeded}
              onChange={(e) => update("organNeeded", e.target.value as OrganType)}
              className="mt-1 w-full text-sm rounded-card border border-line px-3 py-2 focus-visible:outline-primary bg-white"
            >
              {ORGANS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-muted">
            Blood Type
            <select
              value={form.bloodType}
              onChange={(e) => update("bloodType", e.target.value)}
              className="mt-1 w-full text-sm rounded-card border border-line px-3 py-2 focus-visible:outline-primary bg-white"
            >
              {BLOOD_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-muted">
            Urgency (1–10)
            <input
              required type="number" min={1} max={10}
              value={form.urgency}
              onChange={(e) => update("urgency", e.target.value)}
              className="mt-1 w-full font-mono text-sm rounded-card border border-line px-3 py-2 focus-visible:outline-primary"
            />
          </label>
          <label className="text-xs font-medium text-muted">
            Years waiting
            <input
              required type="number" step="0.1" min={0}
              value={form.waitingYears}
              onChange={(e) => update("waitingYears", e.target.value)}
              className="mt-1 w-full font-mono text-sm rounded-card border border-line px-3 py-2 focus-visible:outline-primary"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-muted">
            Hospital ID
            <input
              required type="number"
              value={form.hospitalId}
              onChange={(e) => update("hospitalId", e.target.value)}
              className="mt-1 w-full font-mono text-sm rounded-card border border-line px-3 py-2 focus-visible:outline-primary"
            />
          </label>
          <label className="text-xs font-medium text-muted">
            Hospital Name
            <input
              required
              value={form.hospitalName}
              onChange={(e) => update("hospitalName", e.target.value)}
              className="mt-1 w-full text-sm rounded-card border border-line px-3 py-2 focus-visible:outline-primary"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">HLA Antigens</label>
          <div className="grid grid-cols-4 gap-1.5">
            {HLA_KEYS.map((label, idx) => (
              <button
                type="button"
                key={label}
                onClick={() => toggleHla(idx)}
                className={`py-1 text-[10px] rounded border transition-colors ${
                  selectedHla.includes(idx)
                    ? "bg-primary text-white border-primary font-medium"
                    : "bg-surface text-muted border-line hover:bg-surface-hover"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full mt-2">
          {submitting ? "Registering…" : "Register patient"}
        </Button>
      </form>
    </Modal>
  );
}