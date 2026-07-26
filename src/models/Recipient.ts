// src/models/Recipient.ts

import mongoose, { Schema, Model } from "mongoose";

export interface RecipientDoc {
  patientId: string;
  name: string;
  organNeeded: string;
  urgency: number;       // 1-10
  waitingYears: number;
  bloodType: string;     // Human string e.g. "A+", "O-"
  bloodMask: number;     // Bitmask integer
  hlaAntigens?: number[];// Array of indices e.g. [0, 2, 5]
  hlaMask: number;       // 16-bit integer mask
  hospitalId: number;
  hospitalName: string;
  status: "waiting" | "matched" | "transplanted" | "removed";
}

const RecipientSchema = new Schema<RecipientDoc>(
  {
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    organNeeded: { type: String, required: true },
    urgency: { type: Number, required: true, min: 1, max: 10 },
    waitingYears: { type: Number, required: true, min: 0 },
    bloodType: { type: String, required: true, default: "O+" },
    bloodMask: { type: Number, required: true },
    hlaAntigens: { type: [Number], default: [] },
    hlaMask: { type: Number, required: true, default: 0 },
    hospitalId: { type: Number, required: true },
    hospitalName: { type: String, required: true },
    status: {
      type: String,
      enum: ["waiting", "matched", "transplanted", "removed"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

export const Recipient: Model<RecipientDoc> =
  mongoose.models.Recipient || mongoose.model<RecipientDoc>("Recipient", RecipientSchema);