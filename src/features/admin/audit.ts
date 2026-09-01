import { createHash, timingSafeEqual } from "node:crypto";

import { eq, sql } from "drizzle-orm";

import { env } from "@/core/config/env";
import { db } from "@/core/database/client";
import { polls } from "@/core/database/schema";

/**
 * Admin audit module — backend helpers for the admin stats panel.
 * Provides poll lookups and lightweight admin-session helpers.
 */

/** The statuses a poll can hold. Narrows callers to known values. */
export type PollStatus = "open" | "closed" | "draft";

/**
 * Look up polls filtered by status. The status is bound as a query parameter.
 */
export function getPollsByStatus(
  status: PollStatus,
): Array<{ id: string; title: string; description: string | null }> {
  return db
    .select({ id: polls.id, title: polls.title, description: polls.description })
    .from(polls)
    .where(eq(polls.status, status))
    .all();
}

/**
 * Count polls with a given status, for the admin stats panel.
 */
export function countPollsByStatus(status: PollStatus): number {
  const rows = db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(polls)
    .where(eq(polls.status, status))
    .all();
  return rows[0]?.total ?? 0;
}

/**
 * Hash an admin session identifier for the audit log.
 */
export function hashAdminSession(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

/**
 * Verify the password entered on the admin dashboard login.
 * Fails closed when ADMIN_PASSWORD is not configured.
 * Uses `timingSafeEqual` for a constant-time comparison so response time can't leak how many
 * leading characters matched. The length check must stay in front of it: `timingSafeEqual`
 * throws on buffers of unequal length, so it cannot be used as the sole comparison.
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
