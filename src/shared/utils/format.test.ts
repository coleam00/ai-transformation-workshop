import { describe, expect, it } from "bun:test";

import { formatDate, formatDuration } from "./format";

describe("formatDate", () => {
  it("returns ISO string for valid date", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    expect(formatDate(date)).toBe("2025-01-15T10:30:00.000Z");
  });
});

describe("formatDuration", () => {
  it("formats sub-second durations in whole milliseconds", () => {
    expect(formatDuration(450)).toBe("450ms");
  });

  it("formats zero as 0ms", () => {
    expect(formatDuration(0)).toBe("0ms");
  });

  it("stays in ms just under the 1s boundary", () => {
    expect(formatDuration(999)).toBe("999ms");
  });

  it("switches to seconds at the 1s boundary", () => {
    expect(formatDuration(1000)).toBe("1.0s");
  });

  it("formats seconds with one decimal place", () => {
    expect(formatDuration(2500)).toBe("2.5s");
  });

  it("stays in seconds just under the 1m boundary", () => {
    expect(formatDuration(59_000)).toBe("59.0s");
  });

  it("switches to minutes+seconds at the 1m boundary", () => {
    expect(formatDuration(60_000)).toBe("1m 0s");
  });

  it("formats minutes and seconds together", () => {
    expect(formatDuration(200_000)).toBe("3m 20s");
  });

  it("stays in minutes just under the 1h boundary", () => {
    expect(formatDuration(3_540_000)).toBe("59m 0s");
  });

  it("switches to hours+minutes at the 1h boundary", () => {
    expect(formatDuration(3_600_000)).toBe("1h 0m");
  });

  it("formats hours and minutes together", () => {
    expect(formatDuration(3_900_000)).toBe("1h 5m");
  });

  it("returns '-' for negative input", () => {
    expect(formatDuration(-5)).toBe("-");
  });

  it("returns '-' for NaN", () => {
    expect(formatDuration(Number.NaN)).toBe("-");
  });

  it("returns '-' for Infinity", () => {
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("-");
  });

  it("returns '-' for -Infinity", () => {
    expect(formatDuration(Number.NEGATIVE_INFINITY)).toBe("-");
  });
});
