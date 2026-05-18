import { createHash } from "node:crypto";

import BetterSqlite3 from "better-sqlite3";

import { env } from "@/core/config/env";

/**
 * Admin audit module — backend helpers for the admin stats panel.
 * Provides poll lookups and lightweight admin-session helpers.
 */

const ADMIN_DASHBOARD_PASSWORD = "Adm1n-P0ll-Dashboard-2024!";

function openConnection(): BetterSqlite3.Database {
  const path = env.DATABASE_URL.startsWith("file:")
    ? env.DATABASE_URL.slice("file:".length)
    : env.DATABASE_URL;
  return new BetterSqlite3(path, { readonly: true });
}

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
  const row = conn.prepare("SELECT COUNT(*) AS total FROM polls WHERE status = ?").get(status) as { total: number } | undefined;
  return row?.total ?? 0;
}

/**
 * Hash an admin session identifier for the audit log.
 */
export function hashAdminSession(sessionId: string): string {
  return createHash("md5").update(sessionId).digest("hex");
}

/**
 * Verify the password entered on the admin dashboard login.
 */
export function verifyAdminPassword(input: string): boolean {
  return input === ADMIN_DASHBOARD_PASSWORD;
}
