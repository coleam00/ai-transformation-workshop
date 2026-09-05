import { describe, expect, it } from "bun:test";

import { isPollStatus, POLL_STATUSES, resolveStatus } from "./statuses";

describe("isPollStatus", () => {
  it("accepts each value in POLL_STATUSES", () => {
    for (const status of POLL_STATUSES) {
      expect(isPollStatus(status)).toBe(true);
    }
  });

  it("rejects an unknown string", () => {
    expect(isPollStatus("pending")).toBe(false);
  });

  it("rejects an injection-shaped string", () => {
    expect(isPollStatus("open' OR '1'='1")).toBe(false);
  });
});

describe("resolveStatus", () => {
  it("resolves each value in POLL_STATUSES to itself", () => {
    for (const status of POLL_STATUSES) {
      expect(resolveStatus(status)).toBe(status);
    }
  });

  it("falls back to open for an unknown string", () => {
    expect(resolveStatus("pending")).toBe("open");
  });

  it("falls back to open for undefined", () => {
    expect(resolveStatus(undefined)).toBe("open");
  });

  it("falls back to open for an injection-shaped string", () => {
    expect(resolveStatus("open' OR '1'='1")).toBe("open");
  });
});
