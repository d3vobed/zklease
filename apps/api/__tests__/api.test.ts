import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "db.json");

function cleanDb() {
  if (existsSync(DB_PATH)) {
    unlinkSync(DB_PATH);
  } else if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

const BASE = "http://localhost:4001";
let server: Server;

beforeAll(async () => {
  cleanDb();
  const { default: app } = await import("../src/index.js");

  server = app.listen(4001);
  await new Promise<void>((resolve) => server.on("listening", resolve));
});

describe("Health check", () => {
  it("GET /api/health returns ok", async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(body.timestamp).toBeGreaterThan(0);
  });
});

describe("Verifications", () => {
  const testRecord = {
    owner: "GABCDEF123456789",
    threshold: "1000000",
    txHash: "abc123def456",
    network: "testnet",
  };

  it("POST /api/verification creates a record", async () => {
    const res = await fetch(`${BASE}/api/verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testRecord),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.owner).toBe(testRecord.owner);
    expect(body.threshold).toBe(testRecord.threshold);
    expect(body.txHash).toBe(testRecord.txHash);
    expect(body.network).toBe(testRecord.network);
    expect(body.timestamp).toBeGreaterThan(0);
  });

  it("POST /api/verification rejects missing fields", async () => {
    const res = await fetch(`${BASE}/api/verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "GABC" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error", "VALIDATION_ERROR");
  });

  it("GET /api/verification/:address returns records", async () => {
    const res = await fetch(`${BASE}/api/verification/${testRecord.owner}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].owner).toBe(testRecord.owner);
  });

  it("GET /api/verification/:address returns empty array for unknown", async () => {
    const res = await fetch(`${BASE}/api/verification/UNKNOWN`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

describe("Credentials", () => {
  const address = "GABCDEF123456789";

  it("GET /api/credential/:address returns credential record", async () => {
    const res = await fetch(`${BASE}/api/credential/${address}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).not.toBeNull();
    expect(body.address).toBe(address.toLowerCase());
    expect(body.verified).toBe(true);
    expect(body.threshold).toBe("1000000");
    expect(Array.isArray(body.txHashes)).toBe(true);
    expect(body.lastVerified).toBeGreaterThan(0);
  });

  it("GET /api/credential/:address returns null for unknown", async () => {
    const res = await fetch(`${BASE}/api/credential/UNKNOWN`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });
});

describe("Stats", () => {
  it("GET /api/stats returns platform stats", async () => {
    const res = await fetch(`${BASE}/api/stats`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("totalVerifications");
    expect(body).toHaveProperty("uniqueAddresses");
    expect(body).toHaveProperty("lastVerification");
    expect(body.totalVerifications).toBeGreaterThanOrEqual(1);
    expect(body.uniqueAddresses).toBeGreaterThanOrEqual(1);
  });
});

describe("404", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await fetch(`${BASE}/api/nonexistent`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty("error", "NOT_FOUND");
  });
});
