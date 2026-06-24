#!/usr/bin/env tsx
/**
 * ZKLease — Database Seed Script
 *
 * Populates the backend JSON store with sample credentials and
 * verification records for development and testing.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *   # or (once tsx is installed):
 *   ./scripts/seed.ts
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";

interface VerificationRecord {
  id: string;
  owner: string;
  threshold: string;
  txHash: string;
  network: string;
  timestamp: number;
}

interface DbData {
  verifications: VerificationRecord[];
}

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "db.json");

const SAMPLE_ADDRESSES = [
  "GA3SXJ6Y5Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6",
  "GB4TZ7Y5Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6",
  "GC5UY8Z5Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6",
  "GD6VZ9A5Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6",
  "GE7WAB5Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6",
];

function generateSampleVerifications(): VerificationRecord[] {
  const records: VerificationRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < SAMPLE_ADDRESSES.length; i++) {
    const numVerifications = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < numVerifications; j++) {
      records.push({
        id: crypto.randomUUID(),
        owner: SAMPLE_ADDRESSES[i],
        threshold: String([100, 250, 500, 1000][Math.floor(Math.random() * 4)]),
        txHash: crypto.randomBytes(32).toString("hex"),
        network: "TESTNET",
        timestamp: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
  }

  return records;
}

function seed() {
  console.log("🌱  ZKLease — Seeding Database\n");

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log(`  Created directory: ${DATA_DIR}`);
  }

  const verifications = generateSampleVerifications();
  const data: DbData = { verifications };

  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");

  const unique = new Set(verifications.map((v) => v.owner));

  console.log(`  Wrote ${verifications.length} verification records`);
  console.log(`  Across  ${unique.size} unique addresses`);
  console.log(`  To      ${DB_PATH}\n`);

  console.log("  Sample addresses seeded:");
  for (const addr of SAMPLE_ADDRESSES) {
    const count = verifications.filter((v) => v.owner === addr).length;
    console.log(`    ${addr.slice(0, 8)}… → ${count} verification(s)`);
  }

  console.log("\n✅  Seed complete. Start the API to serve this data.\n");
}

seed();
