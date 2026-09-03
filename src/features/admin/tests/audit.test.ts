import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

describe("countLegacyPollsByStatus", () => {
  it("uses a parameterized query, not string interpolation", () => {
    const source = readFileSync(new URL("../audit.ts", import.meta.url), "utf-8");
    const fn = source.slice(source.indexOf("export function countLegacyPollsByStatus"));
    expect(fn).toContain("WHERE status = ?");
    expect(fn).not.toMatch(/WHERE status = '\$\{/);
  });
});
