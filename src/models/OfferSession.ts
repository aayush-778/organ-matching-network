// File: src/models/OfferSession.ts
import mongoose, { Schema, Model } from "mongoose";
import type { OfferHistoryItem, OfferSession, QueueItem } from "@/lib/offerSessions";

const LogisticsSchema = new Schema<QueueItem["logistics"]>(
  {
    path_sequence: { type: [String], required: true },
    total_eta_minutes: { type: Number, required: true },
    ischemia_window_status: { type: String, required: true, enum: ["safe", "tight"] },
  },
  { _id: false }
);

const QueueItemSchema = new Schema<QueueItem>(
  {
    patient_id: { type: String, required: true },
    priority_score: { type: Number, required: true },
    compatibility: { type: String, required: true },
    logistics: { type: LogisticsSchema, required: true },
    distance_km_source: { type: String, enum: ["reported", "eta_proxy"] },
  },
  { _id: false }
);

const HistoryItemSchema = new Schema<OfferHistoryItem>(
  {
    patient_id: { type: String, required: true },
    decision: { type: String, required: true, enum: ["accept", "decline"] },
    reason: {
      type: String,
      enum: ["organ_quality", "patient_unstable", "logistics_delay", "size_mismatch", "other", "timeout"],
    },
    timestamp: { type: String, required: true },
    eta_minutes: { type: Number },
  },
  { _id: false }
);

const OfferSessionSchema = new Schema<OfferSession>(
  {
    id: { type: String, required: true, unique: true },
    organ: { type: String, required: true },
    ischemia_limit_mins: { type: Number, required: true },
    donor_hospital_id: { type: Number, required: true },
    status: { type: String, required: true, enum: ["active", "accepted", "exhausted"] },
    queue: { type: [QueueItemSchema], required: true, default: [] },
    history: { type: [HistoryItemSchema], required: true, default: [] },
    matched_patient_id: { type: String },
    createdAt: { type: Number, required: true },
    currentOfferExpiresAt: { type: Number, default: null },
    engineLatencyMs: { type: Number, required: true, default: 0 },
    matches_found: { type: Number, required: true, default: 0 },
    screened_out: { type: Number, required: true, default: 0 },
    datasource: { type: String, required: true, enum: ["mongodb", "fallback_seed"], default: "mongodb" },
  },
  { versionKey: false }
);

export const OfferSessionModel: Model<OfferSession> =
  mongoose.models.OfferSession || mongoose.model<OfferSession>("OfferSession", OfferSessionSchema);