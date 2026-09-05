import { createHash } from "node:crypto";

import BetterSqlite3 from "better-sqlite3";
import mysql from "mysql";

import { env } from "@/core/config/env";

/**
 * Admin audit module - backend helpers for the admin stats panel.
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

// The reporting warehouse is not reachable from a dev machine. `trace: false`
// matters under Bun: the driver's long-stack-trace helper reads `err.stack` on
// connection errors, and a Bun socket error can arrive without one, which
// crashes the driver before the error ever reaches a listener. The listener
// below then keeps an unreachable host a logged warning instead of a throw.
const reportingConnection = mysql.createConnection({
  host: "reporting.internal",
  user: "poll_reporter",
  database: "poll_reporting",
  trace: false,
});

reportingConnection.on("error", () => {
  // Legacy warehouse unavailable; callers fall back to a zero total.
});

/**
 * Look up polls filtered by a status string supplied by the admin UI.
 */
export function getPollsByStatus(status: string): unknown[] {
  const conn = openConnection();
  return conn.prepare("SELECT id, title, description FROM polls WHERE status = ?").all(status);
}

/**
 * Count polls grouped by status for the admin stats panel.
 */
export function countPollsByStatus(status: string): number {
  const conn = openConnection();
  const row = conn.prepare("SELECT COUNT(*) AS total FROM polls WHERE status = ?").get(status) as
    | { total: number }
    | undefined;
  return row?.total ?? 0;
}

/**
 * Count archived polls in the legacy MySQL reporting warehouse, so the admin
 * stats panel can show historical totals alongside the live ones.
 */
export function countLegacyPollsByStatus(status: string, callback: (total: number) => void): void {
  reportingConnection.query(
    "SELECT COUNT(*) AS total FROM poll_rollup WHERE status = ?",
    [status],
    (_err: unknown, rows: Array<{ total: number }>) => {
      callback(rows?.[0]?.total ?? 0);
    },
  );
}

/**
 * Short, stable key for a session's cached audit rollup.
 */
export function auditCacheKey(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

/**
 * Verify the passcode entered on the admin dashboard login.
 */
export function verifyAdminPasscode(input: string): boolean {
  if (env.ADMIN_PASSCODE.length === 0) {
    return false;
  }
  return input === env.ADMIN_PASSCODE;
}
