import { describe, expect, it } from "bun:test";

import { buildContentDispositionHeader, toSafeFilename } from "./filenames";

describe("toSafeFilename", () => {
  it("builds a filename with the given extension from a plain title", () => {
    const filename = toSafeFilename("Best Lunch", "xlsx");
    expect(filename.endsWith(".xlsx")).toBe(true);
    expect(filename.includes("/")).toBe(false);
  });

  it("sanitizes path separators and filesystem-illegal characters", () => {
    const filename = toSafeFilename('Best/Lunch"?', "xlsx");
    expect(filename).not.toMatch(/[/\\<>:"|?*]/);
  });

  it("strips embedded CR/LF characters", () => {
    const filename = toSafeFilename("Best\r\nLunch", "xlsx");
    expect(filename.includes("\r")).toBe(false);
    expect(filename.includes("\n")).toBe(false);
  });

  it("falls back to a generic name when the title is empty after sanitization", () => {
    const filename = toSafeFilename("   ", "xlsx");
    expect(filename).toBe("poll-results.xlsx");
  });
});

describe("buildContentDispositionHeader", () => {
  it("includes both an ASCII filename and an RFC 5987 filename* parameter", () => {
    const header = buildContentDispositionHeader("Best_lunch.xlsx");
    expect(header).toContain('filename="Best_lunch.xlsx"');
    expect(header).toContain("filename*=UTF-8''Best_lunch.xlsx");
  });

  it("replaces non-ASCII characters in the ASCII fallback and round-trips filename*", () => {
    const header = buildContentDispositionHeader("Café ✓.xlsx");
    const asciiMatch = header.match(/filename="([^"]*)"/);
    expect(asciiMatch).not.toBeNull();
    expect(asciiMatch?.[1]).not.toMatch(/[^\x20-\x7e]/);

    const encodedMatch = header.match(/filename\*=UTF-8''(\S+)$/);
    expect(encodedMatch).not.toBeNull();
    const decoded = decodeURIComponent(encodedMatch?.[1] ?? "");
    expect(decoded).toBe("Café ✓.xlsx");
  });
});
