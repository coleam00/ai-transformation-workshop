import { describe, expect, it } from "bun:test";

import { formatDate } from "./format";

describe("formatDate", () => {
  it("returns ISO string for valid date", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    expect(formatDate(date)).toBe("2025-01-15T10:30:00.000Z");
  });
});
