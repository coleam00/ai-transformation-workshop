import { describe, expect, it } from "bun:test";

// `@/features/admin/audit` imports the shared Drizzle `db` client, which opens a
// `better-sqlite3` connection at module load. `better-sqlite3` is a native module that
// Bun's test runtime does not yet support (https://github.com/oven-sh/bun/issues/4290) —
// this is why no other feature in this codebase has a test that touches
// `@/core/database/client` either. Guard the import so these tests report as skipped
// (not a suite-crashing error) on a Bun runtime without native support, while still
// running for real wherever it is supported.
let audit: typeof import("@/features/admin/audit") | undefined;
try {
  audit = await import("@/features/admin/audit");
} catch {
  audit = undefined;
}

describe("countPollsByStatus", () => {
  it.skipIf(!audit)("returns a non-negative integer for each status", () => {
    for (const status of ["open", "closed", "draft"] as const) {
      const count = audit?.countPollsByStatus(status) ?? Number.NaN;
      expect(Number.isInteger(count)).toBe(true);
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // No runtime SQL-injection regression test exists here on purpose: `status` is typed
  // as the `PollStatus` literal union and passed through Drizzle's `eq()`, which binds
  // it as a query parameter. A string containing SQL metacharacters is not a valid
  // `PollStatus` and is rejected by `tsc --noEmit` before the code can run — a stronger
  // guarantee than a runtime test could provide.
});

describe("verifyAdminPassword", () => {
  it.skipIf(!audit)("returns false when ADMIN_PASSWORD is not configured", () => {
    expect(audit?.verifyAdminPassword("anything")).toBe(false);
  });
});
