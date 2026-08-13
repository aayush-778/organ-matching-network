"use client";

import React, { useState } from "react";
import type { IntakeFormValues } from "@/types/dashboard";
import { RotateCcw } from "lucide-react";

const ORGAN_OPTIONS = ["Heart", "Liver", "Kidney", "Lung", "Pancreas", "Cornea"];
const BLOOD_OPTIONS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const HLA_ANTIGEN_KEYS = Array.from({ length: 16 }, (_, i) => `HLA-${i + 1}`);

// Clinical baseline ischemia limits (in minutes) for auto-population
const ORGAN_DEFAULTS: Record<string, number> = {
  Heart: 240,     // 4 hours
  Lung: 360,      // 6 hours
  Liver: 720,     // 12 hours
  Pancreas: 900,  // 15 hours
  Kidney: 1440,   // 24 hours
  Cornea: 20160,  // 14 days
};

// Regional hospitals mapped from the C++ routing graph
const REGIONAL_HOSPITALS = [
  { id: 12, name: "Hospital 12 (Central Base)" },
  { id: 45, name: "Hospital 45 (North Wing)" },
  { id: 77, name: "Hospital 77 (East Wing)" },
  { id: 99, name: "Hospital 99 (South Hub)" },
];

const DEFAULTS = {
  organ: "Heart" as IntakeFormValues["organ"],
  donorBloodType: "A+",
  donorHospitalId: REGIONAL_HOSPITALS[0].id,
  ischemiaLimitMins: ORGAN_DEFAULTS["Heart"],
  selectedHla: [] as number[],
  maxMismatches: 4,
};

// Shared input/select styling — no border, no default browser ring.
// `field-quiet` (see globals.css) swaps the global focus-visible outline
// for a soft inset highlight scoped to just these fields.
const FIELD_CLASS =
  "field-quiet w-full p-3 bg-surface hover:bg-surface/70 focus:bg-white border-none outline-none " +
  "ring-0 focus:ring-0 " +
  "rounded-lg text-sm font-medium text-ink transition-colors duration-150 cursor-pointer";

interface IntakeFormProps {
  onSubmit: (values: IntakeFormValues) => Promise<void>;
  submitting?: boolean;
}

export default function IntakeForm({ onSubmit, submitting = false }: IntakeFormProps) {
  const [organ, setOrgan] = useState<IntakeFormValues["organ"]>(DEFAULTS.organ);
  const [donorBloodType, setDonorBloodType] = useState(DEFAULTS.donorBloodType);
  const [donorHospitalId, setDonorHospitalId] = useState<number>(DEFAULTS.donorHospitalId);
  const [ischemiaLimitMins, setIschemiaLimitMins] = useState<number | "">(DEFAULTS.ischemiaLimitMins);
  const [selectedHla, setSelectedHla] = useState<number[]>(DEFAULTS.selectedHla);
  const [maxMismatches, setMaxMismatches] = useState<number>(DEFAULTS.maxMismatches);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleHla = (idx: number) => {
    setSelectedHla((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleOrganChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOrgan = e.target.value as IntakeFormValues["organ"];
    setOrgan(selectedOrgan);
    setIschemiaLimitMins(ORGAN_DEFAULTS[selectedOrgan] || 240);
  };

  const handleReset = () => {
    setOrgan(DEFAULTS.organ);
    setDonorBloodType(DEFAULTS.donorBloodType);
    setDonorHospitalId(DEFAULTS.donorHospitalId);
    setIschemiaLimitMins(DEFAULTS.ischemiaLimitMins);
    setSelectedHla(DEFAULTS.selectedHla);
    setMaxMismatches(DEFAULTS.maxMismatches);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (ischemiaLimitMins === "" || ischemiaLimitMins < 0 || maxMismatches < 0) {
      setErrorMsg("Numeric values must be valid and cannot be negative.");
      return;
    }

    const payload: IntakeFormValues = {
      organ,
      ischemia_limit_mins: Number(ischemiaLimitMins),
      donor_hospital_id: Number(donorHospitalId),
      donor_blood_type: donorBloodType,
      donor_hla_antigens: selectedHla,
      max_allowed_hla_mismatches: maxMismatches,
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white border border-line rounded-xl shadow-sm p-6 md:p-8 space-y-7"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-ink font-heading tracking-tight">
            Donor Intake Procurement
          </h2>
          <p className="text-sm text-muted font-sans leading-relaxed">
            Register a new donor organ to initialize the clinical triage and routing algorithms.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={submitting}
          className="field-quiet flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink bg-surface hover:bg-surface/70 border-none outline-none rounded-lg px-3 py-2 shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw size={13} strokeWidth={2} />
          Reset
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 text-sm font-medium text-urgent bg-urgent-light border border-urgent/20 rounded-lg">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Organ Selection */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider font-sans">
            Organ Type
          </label>
          <select value={organ} onChange={handleOrganChange} className={FIELD_CLASS}>
            {ORGAN_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Blood Type */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider font-sans">
            Donor Blood Type
          </label>
          <select
            value={donorBloodType}
            onChange={(e) => setDonorBloodType(e.target.value)}
            className={FIELD_CLASS}
          >
            {BLOOD_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Hospital ID Dropdown — full width row so long names don't feel squeezed */}
        <div className="space-y-2 sm:col-span-2">
          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider font-sans">
            Procurement Location
          </label>
          <select
            value={donorHospitalId}
            onChange={(e) => setDonorHospitalId(Number(e.target.value))}
            className={FIELD_CLASS}
          >
            {REGIONAL_HOSPITALS.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        {/* Ischemia Limit */}
        <div className="space-y-2 sm:col-span-2">
          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider font-sans flex justify-between">
            <span>Ischemia Limit</span>
            <span className="text-muted/70 normal-case font-medium">(minutes)</span>
          </label>
          <input
            type="number"
            min="0"
            step="15"
            value={ischemiaLimitMins}
            onChange={(e) => {
              const val = e.target.value;
              setIschemiaLimitMins(val === "" ? "" : Number(val));
            }}
            onWheel={(e) => e.currentTarget.blur()}
            className={`${FIELD_CLASS} font-mono cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            required
          />
        </div>
      </div>

      {/* HLA Antigens Multi-Select */}
      <div className="space-y-3 pt-1">
        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider font-sans">
          Donor HLA Antigen Profile
        </label>
        <div className="grid grid-cols-4 gap-2.5">
          {HLA_ANTIGEN_KEYS.map((label, idx) => {
            const isSelected = selectedHla.includes(idx);
            return (
              <button
                type="button"
                key={label}
                onClick={() => toggleHla(idx)}
                className={`field-quiet py-2 px-2 text-[11px] sm:text-xs font-mono font-medium rounded-lg transition-colors whitespace-nowrap outline-none ${
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:text-ink hover:bg-surface/80"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Allowed HLA Mismatches */}
      <div className="space-y-3 pt-1">
        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider font-sans">
          Max Allowed HLA Mismatches
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="6"
            value={maxMismatches}
            onChange={(e) => setMaxMismatches(Number(e.target.value))}
            className="field-quiet w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-primary outline-none"
          />
          <span className="font-mono text-ink font-semibold w-8 text-center bg-surface rounded-lg py-1.5">
            {maxMismatches}
          </span>
        </div>
        <p className="text-[11px] text-muted font-sans leading-relaxed">
          Clinical standard recommends a maximum of 4-6 mismatches depending on organ acuity.
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="field-quiet w-full py-3.5 px-4 bg-primary hover:bg-primary-dark text-white font-semibold font-heading rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2 outline-none"
        >
          {submitting ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></span>
              Computing Logistics...
            </>
          ) : (
            "Initiate Match Run"
          )}
        </button>
      </div>
    </form>
  );
}