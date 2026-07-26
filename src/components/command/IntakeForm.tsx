"use client";

import React, { useState } from "react";
import type { IntakeFormValues } from "@/types/dashboard";

const ORGAN_OPTIONS = ["Heart", "Liver", "Kidney", "Lung", "Pancreas", "Cornea"];
const BLOOD_OPTIONS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const HLA_ANTIGEN_KEYS = Array.from({ length: 16 }, (_, i) => `HLA-${i + 1}`);

interface IntakeFormProps {
  onSubmit: (values: IntakeFormValues) => Promise<void>;
  submitting?: boolean;
}

export default function IntakeForm({ onSubmit, submitting = false }: IntakeFormProps) {
  const [organ, setOrgan] = useState<IntakeFormValues["organ"]>("Heart");
  const [donorBloodType, setDonorBloodType] = useState("A+");
  const [donorHospitalId, setDonorHospitalId] = useState<number>(45);
  const [ischemiaLimitMins, setIschemiaLimitMins] = useState<number>(240); // 4 hrs default
  const [selectedHla, setSelectedHla] = useState<number[]>([]);
  const [maxMismatches, setMaxMismatches] = useState<number>(4);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleHla = (idx: number) => {
    setSelectedHla((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload: IntakeFormValues = {
      organ,
      ischemia_limit_mins: Number(ischemiaLimitMins),
      donor_hospital_id: Number(donorHospitalId),
      donor_blood_type: donorBloodType,
      donor_hla_antigens: selectedHla,
      max_allowed_hla_mismatches: 4,
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Donor Organ Procurement Intake</h2>

      {errorMsg && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {errorMsg}
        </div>
      )}

      {/* Organ Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Organ Type</label>
        <select
          value={organ}
          onChange={(e) => setOrgan(e.target.value as IntakeFormValues["organ"])}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        >
          {ORGAN_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Blood Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Donor Blood Type</label>
        <select
          value={donorBloodType}
          onChange={(e) => setDonorBloodType(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        >
          {BLOOD_OPTIONS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Hospital ID & Ischemia Limit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Donor Hospital ID</label>
          <input
            type="number"
            value={donorHospitalId}
            onChange={(e) => setDonorHospitalId(Number(e.target.value))}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ischemia Limit (Mins)</label>
          <input
            type="number"
            value={ischemiaLimitMins}
            onChange={(e) => setIschemiaLimitMins(Number(e.target.value))}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
      </div>

      {/* HLA Antigens Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Donor HLA Antigens</label>
        <div className="grid grid-cols-4 gap-2">
          {HLA_ANTIGEN_KEYS.map((label, idx) => (
            <button
              type="button"
              key={label}
              onClick={() => toggleHla(idx)}
              className={`p-1.5 text-xs rounded border transition-colors ${
                selectedHla.includes(idx)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Max Allowed HLA Mismatches */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Max Allowed HLA Mismatches</label>
        <input
          type="number"
          min={0}
          max={16}
          value={maxMismatches}
          onChange={(e) => setMaxMismatches(Number(e.target.value))}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow disabled:opacity-50"
      >
        {submitting ? "Running Allocation Engine..." : "Initiate Match Run"}
      </button>
    </form>
  );
}