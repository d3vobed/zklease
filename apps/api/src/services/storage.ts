import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { VerificationRecord, Stats } from "../types/index.js";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "db.json");

interface DbData {
  verifications: VerificationRecord[];
}

function loadDb(): DbData {
  if (!existsSync(DB_PATH)) {
    return { verifications: [] };
  }
  try {
    const raw = readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as DbData;
  } catch {
    return { verifications: [] };
  }
}

function saveDb(data: DbData): void {
  try {
    if (!existsSync(DATA_DIR)) {
      const { mkdirSync } = require("node:fs");
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write db file:", err);
  }
}

export function addVerification(record: VerificationRecord): VerificationRecord {
  const db = loadDb();
  db.verifications.push(record);
  saveDb(db);
  return record;
}

export function getVerificationsByOwner(owner: string): VerificationRecord[] {
  const db = loadDb();
  return db.verifications.filter(
    (v) => v.owner.toLowerCase() === owner.toLowerCase()
  );
}

export function getAllVerifications(): VerificationRecord[] {
  const db = loadDb();
  return db.verifications;
}

export function getStats(): Stats {
  const db = loadDb();
  const unique = new Set(db.verifications.map((v) => v.owner.toLowerCase()));
  const timestamps = db.verifications.map((v) => v.timestamp).filter(Boolean);
  return {
    totalVerifications: db.verifications.length,
    uniqueAddresses: unique.size,
    lastVerification: timestamps.length ? Math.max(...timestamps) : null,
  };
}
