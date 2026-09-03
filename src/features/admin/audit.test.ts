import { describe, expect, it } from "bun:test";

import { hashAdminSession, POLL_STATUSES, verifyAdminPassword } from "./audit";

describe("audit", () => {
  describe("verifyAdminPassword", () => {
    it("returns false when ADMIN_DASHBOARD_PASSWORD is unset, even for an empty input", () => {
      expect(verifyAdminPassword("")).toBe(false);
    });

    it("returns false for a non-empty input when ADMIN_DASHBOARD_PASSWORD is unset", () => {
      expect(verifyAdminPassword("anything")).toBe(false);
    });
  });

  describe("hashAdminSession", () => {
    it("produces a 64-hex-char SHA-256 digest, not a 32-hex-char MD5 digest", () => {
      const hash = hashAdminSession("session-123");
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("POLL_STATUSES", () => {
    it("contains exactly open, closed, archived", () => {
      expect(POLL_STATUSES).toEqual(["open", "closed", "archived"]);
    });
  });
});
