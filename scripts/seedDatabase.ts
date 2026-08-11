// File: scripts/seedDatabase.ts
// One-time (or repeatable) script to push SEED_RECIPIENTS into MongoDB.
// Run this AFTER MONGODB_URI is set -- connecting a real DB does not
// auto-populate it; the seed array is only ever used as a fallback for
// requests, never written anywhere on its own.
//
// Usage:
//   npx tsx scripts/seedDatabase.ts
//
// (If you don't have tsx: npm install -D tsx)

import fs from "fs";
import path from "path";
import { connectToDatabase } from "../src/lib/db";
import { Recipient } from "../src/models/Recipient";
import { SEED_RECIPIENTS } from "../src/lib/seedRecipients";

function loadMongoUriFromEnvFiles(): void {
  if (process.env.MONGODB_URI) {
    return;
  }

  for (const envFile of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), envFile);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const contents = fs.readFileSync(filePath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.startsWith("MONGODB_URI=")) {
        continue;
      }

      process.env.MONGODB_URI = trimmed.slice("MONGODB_URI=".length).trim();
      return;
    }
  }
}

async function main() {
  loadMongoUriFromEnvFiles();

  const db = await connectToDatabase();
  if (!db) {
    console.error("MONGODB_URI is not set -- nothing to connect to. Set it in .env.local first.");
    process.exit(1);
  }

  const shouldSyncExisting = process.argv.includes("--sync");
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const recipient of SEED_RECIPIENTS) {
    const existing = await Recipient.findOne({ patientId: recipient.patientId });

    if (!existing) {
      await Recipient.create(recipient);
      inserted++;
      continue;
    }

    if (!shouldSyncExisting) {
      skipped++;
      continue;
    }

    const result = await Recipient.updateOne(
      { patientId: recipient.patientId },
      { $set: recipient }
    );

    if (result.modifiedCount > 0) {
      updated++;
    }
  }

  const modeLabel = shouldSyncExisting ? "sync" : "bootstrap";
  console.log(`Seed ${modeLabel} complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});