import { describe, expect, it } from "bun:test";

import { formatIso, parseIso, utcNow } from "./dates";

describe("utcNow", () => {
  it("returns a Date object", () => {
    const result = utcNow();
    expect(result).toBeInstanceOf(Date);
  });

  it("returns approximately current time", () => {
    const before = Date.now();
    const result = utcNow();
    const after = Date.now();

    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });
});

describe("formatIso", () => {
  it("formats date to ISO 8601 string", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    expect(formatIso(date)).toBe("2025-01-15T10:30:00.000Z");
  });

  it("preserves milliseconds", () => {
    const date = new Date("2025-06-20T15:45:30.123Z");
    expect(formatIso(date)).toBe("2025-06-20T15:45:30.123Z");
  });

  it("handles midnight", () => {
    const date = new Date("2025-12-31T00:00:00.000Z");
    expect(formatIso(date)).toBe("2025-12-31T00:00:00.000Z");
  });
});

describe("parseIso", () => {
  it("parses valid ISO 8601 string", () => {
    const result = parseIso("2025-01-15T10:30:00.000Z");
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe("2025-01-15T10:30:00.000Z");
  });

  it("parses date without milliseconds", () => {
    const result = parseIso("2025-01-15T10:30:00Z");
    expect(result.toISOString()).toBe("2025-01-15T10:30:00.000Z");
  });

  it("parses date-only string", () => {
    const result = parseIso("2025-01-15");
    expect(result).toBeInstanceOf(Date);
  });

  it("throws on invalid string", () => {
    expect(() => parseIso("not-a-date")).toThrow("Invalid ISO date string: not-a-date");
  });

  it("throws on empty string", () => {
    expect(() => parseIso("")).toThrow("Invalid ISO date string: ");
  });
});

describe("roundtrip", () => {
  it("format and parse are inverses", () => {
    const original = new Date("2025-03-15T08:45:30.500Z");
    const formatted = formatIso(original);
    const parsed = parseIso(formatted);

    expect(parsed.getTime()).toBe(original.getTime());
  });
});
