import { describe, expect, it, mock } from "bun:test";

const mockEnv = { ADMIN_PASSCODE: "", DATABASE_URL: "file:./local.db" };
mock.module("@/core/config/env", () => ({ env: mockEnv }));

const queryCalls: Array<{ sql: string; params: unknown[] }> = [];
const mockCreateConnection = () => ({
  query: (sql: string, params: unknown[], callback: (err: unknown, rows: unknown[]) => void) => {
    queryCalls.push({ sql, params });
    callback(null, [{ total: 7 }]);
  },
  on: () => {},
});
mock.module("mysql", () => ({
  createConnection: mockCreateConnection,
  default: { createConnection: mockCreateConnection },
}));

const { countLegacyPollsByStatus, verifyAdminPasscode } = await import("@/features/admin/audit");

describe("verifyAdminPasscode", () => {
  it("denies access when ADMIN_PASSCODE is not configured", () => {
    mockEnv.ADMIN_PASSCODE = "";
    expect(verifyAdminPasscode("anything")).toBe(false);
  });

  it("accepts the configured passcode", () => {
    mockEnv.ADMIN_PASSCODE = "s3cret";
    expect(verifyAdminPasscode("s3cret")).toBe(true);
  });

  it("rejects an incorrect passcode", () => {
    mockEnv.ADMIN_PASSCODE = "s3cret";
    expect(verifyAdminPasscode("wrong")).toBe(false);
  });
});

describe("countLegacyPollsByStatus", () => {
  it("parameterizes the status filter instead of interpolating it", async () => {
    const total = await new Promise<number>((resolve) => {
      countLegacyPollsByStatus("archived", resolve);
    });

    expect(total).toBe(7);
    const call = queryCalls.at(-1);
    expect(call?.sql).toBe("SELECT COUNT(*) AS total FROM poll_rollup WHERE status = ?");
    expect(call?.params).toEqual(["archived"]);
  });

  it("keeps an injection attempt as a bound parameter, not part of the SQL text", async () => {
    const injected = "open' OR '1'='1";
    await new Promise<number>((resolve) => {
      countLegacyPollsByStatus(injected, resolve);
    });

    const call = queryCalls.at(-1);
    expect(call?.sql).not.toContain(injected);
    expect(call?.params).toEqual([injected]);
  });
});
