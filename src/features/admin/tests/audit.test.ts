import { Database } from "bun:sqlite";
import { describe, expect, it, mock } from "bun:test";

import { drizzle } from "drizzle-orm/bun-sqlite";

import * as schema from "@/core/database/schema";
import type { PollStatus } from "@/features/admin/audit";

// The shared client opens better-sqlite3 (a native addon) at import time, which the Bun
// test runner cannot dlopen on Windows. Swap in an in-memory bun:sqlite database so these
// tests exercise the real Drizzle query builder without the native dependency.
const sqlite = new Database(":memory:");
sqlite.run(`CREATE TABLE polls (
  id text PRIMARY KEY NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'open' NOT NULL,
  created_at integer DEFAULT (unixepoch()) NOT NULL
)`);
sqlite.run(
  `INSERT INTO polls (id, title, description, status) VALUES
    ('p1', 'First poll', 'A description', 'open'),
    ('p2', 'Second poll', NULL, 'open'),
    ('p3', 'Third poll', NULL, 'closed')`,
);

mock.module("@/core/database/client", () => ({ db: drizzle(sqlite, { schema }) }));

const { countPollsByStatus, getPollsByStatus, hashAdminSession, verifyAdminPassword } =
  await import("@/features/admin/audit");

describe("countPollsByStatus", () => {
  it("counts the polls held in each status", () => {
    expect(countPollsByStatus("open")).toBe(2);
    expect(countPollsByStatus("closed")).toBe(1);
  });

  it("returns 0 for a status with no polls", () => {
    expect(countPollsByStatus("draft")).toBe(0);
  });

  it("does not execute injected SQL via the status value", () => {
    // Concatenated into SQL this predicate is always true, so it would match all 3 rows.
    // Bound as a parameter it is just a status string that matches nothing.
    const injected = "open' OR '1'='1" as PollStatus;
    expect(countPollsByStatus(injected)).toBe(0);
  });
});

describe("getPollsByStatus", () => {
  it("returns the polls in the requested status", () => {
    expect(getPollsByStatus("open")).toEqual([
      { id: "p1", title: "First poll", description: "A description" },
      { id: "p2", title: "Second poll", description: null },
    ]);
  });

  it("does not execute injected SQL via the status value", () => {
    expect(getPollsByStatus("open' OR '1'='1" as PollStatus)).toEqual([]);
  });
});

describe("verifyAdminPassword", () => {
  it("fails closed when ADMIN_PASSWORD is unset", () => {
    // No ADMIN_PASSWORD is set in the test environment.
    expect(verifyAdminPassword("anything")).toBe(false);
    expect(verifyAdminPassword("")).toBe(false);
  });
});

describe("hashAdminSession", () => {
  it("hashes with SHA-256, not MD5", () => {
    const hash = hashAdminSession("session-123");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
