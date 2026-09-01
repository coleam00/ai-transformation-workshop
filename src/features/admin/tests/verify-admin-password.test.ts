import { describe, expect, it, mock } from "bun:test";

// verifyAdminPassword reads env.ADMIN_PASSWORD at call time, so mock it before importing.
mock.module("@/core/config/env", () => ({
  env: { ADMIN_PASSWORD: "correct-horse-battery-staple" },
}));

const { verifyAdminPassword } = await import("@/features/admin/audit");

describe("verifyAdminPassword (ADMIN_PASSWORD configured)", () => {
  it("returns true for the correct password", () => {
    expect(verifyAdminPassword("correct-horse-battery-staple")).toBe(true);
  });

  it("returns false for an incorrect password of the same length", () => {
    expect(verifyAdminPassword("correct-horse-battery-staplE")).toBe(false);
  });

  it("returns false (without throwing) for a wrong-length password", () => {
    expect(verifyAdminPassword("short")).toBe(false);
    expect(verifyAdminPassword("way-too-long-a-password-to-possibly-match")).toBe(false);
  });

  it("returns false for an empty input", () => {
    expect(verifyAdminPassword("")).toBe(false);
  });
});
