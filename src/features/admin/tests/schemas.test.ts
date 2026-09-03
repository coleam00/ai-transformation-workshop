import { describe, expect, it } from "bun:test";

import { parsePollStatus, PollStatusSchema } from "@/features/admin/schemas";

describe("PollStatusSchema", () => {
  it("accepts each known status", () => {
    for (const status of ["open", "closed", "archived"]) {
      expect(PollStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("rejects an unknown status", () => {
    expect(PollStatusSchema.safeParse("deleted").success).toBe(false);
  });
});

describe("parsePollStatus", () => {
  it("returns the value when it is a known status", () => {
    expect(parsePollStatus("closed")).toBe("closed");
  });

  it("falls back to open for an unknown value", () => {
    expect(parsePollStatus("'; DROP TABLE polls; --")).toBe("open");
  });

  it("falls back to open when undefined", () => {
    expect(parsePollStatus(undefined)).toBe("open");
  });
});
