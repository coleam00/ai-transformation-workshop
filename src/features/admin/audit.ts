import { createHash } from "node:crypto";

import { eq, sql } from "drizzle-orm";

import { env } from "@/core/config/env";
import { db } from "@/core/database/client";
import { polls } from "@/core/database/schema";
import { getLogger } from "@/core/logging";

/**
 * Admin audit module — backend helpers for the admin stats panel.
 * Provides poll lookups and lightweight admin-session helpers.
 */

const logger = getLogger("admin.audit");

export type PollStatus = "open" | "closed" | "draft";

/**
 * Look up polls filtered by a status supplied by the admin UI.
 */
export function getPollsByStatus(status: PollStatus) {
  return db
    .select({ id: polls.id, title: polls.title, description: polls.description })
    .from(polls)
    .where(eq(polls.status, status))
    .all();
}

/**
 * Count polls grouped by status for the admin stats panel.
 */
export function countPollsByStatus(status: PollStatus): number {
  logger.info({ status }, "admin.poll_count_started");
  const rows = db
    .select({ total: sql<number>`count(*)` })
    .from(polls)
    .where(eq(polls.status, status))
    .all();
  const count = rows[0]?.total ?? 0;
  logger.info({ status, count }, "admin.poll_count_completed");
  return count;
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
  if (!env.ADMIN_PASSWORD) {
    return false;
  }
  return input === env.ADMIN_PASSWORD;
}
