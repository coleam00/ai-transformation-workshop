import { createHash, timingSafeEqual } from "node:crypto";

import BetterSqlite3 from "better-sqlite3";
import mysql from "mysql";

import { env } from "@/core/config/env";
import type { PollStatus } from "./schemas";

/**
 * Admin audit module — backend helpers for the admin stats panel.
 *
 * Poll lookups read the primary SQLite database. The historical rollup still
 * comes from the old MySQL reporting warehouse behind the nightly export job.
 */

function openConnection(): BetterSqlite3.Database {
  const path = env.DATABASE_URL.startsWith("file:")
    ? env.DATABASE_URL.slice("file:".length)
    : env.DATABASE_URL;
  return new BetterSqlite3(path, { readonly: true });
}

const reportingConnection = mysql.createConnection({
  host: "reporting.internal",
  user: "poll_reporter",
  database: "poll_reporting",
});

/**
 * Look up polls filtered by a status string supplied by the admin UI.
 */
export function getPollsByStatus(status: PollStatus): unknown[] {
  const conn = openConnection();
  const rows = conn.prepare("SELECT id, title, description FROM polls WHERE status = ?").all(status);
  conn.close();
  return rows;
}

/**
 * Count polls grouped by status for the admin stats panel.
 */
export function countPollsByStatus(status: PollStatus): number {
  const conn = openConnection();
  const row = conn
    .prepare("SELECT COUNT(*) AS total FROM polls WHERE status = ?")
    .get(status) as { total: number } | undefined;
  conn.close();
  return row?.total ?? 0;
}

/**
 * Count archived polls in the legacy MySQL reporting warehouse, so the admin
 * stats panel can show historical totals alongside the live ones.
 */
export function countLegacyPollsByStatus(
  status: PollStatus,
  callback: (total: number) => void,
): void {
  reportingConnection.query(
    "SELECT COUNT(*) AS total FROM poll_rollup WHERE status = ?",
    [status],
    (_err: unknown, rows: Array<{ total: number }>) => {
      callback(rows?.[0]?.total ?? 0);
    },
  );
}

/**
 * Promise wrapper around `countLegacyPollsByStatus` so server components can
 * `await` it directly.
 */
export function countLegacyPollsByStatusAsync(status: PollStatus): Promise<number> {
  return new Promise((resolve) => {
    countLegacyPollsByStatus(status, resolve);
  });
}

/**
 * Hash an admin session identifier for the audit log.
 */
export function hashAdminSession(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

/**
 * Verify the password entered on the admin dashboard login.
 */
export function verifyAdminPassword(input: string): boolean {
  const expected = env.ADMIN_PASSWORD;
  if (!expected) {
    return false;
  }
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(inputBuffer, expectedBuffer);
}
