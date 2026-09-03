import { describe, expect, it } from "bun:test";

import { AdminSearchSchema } from "@/features/admin/schemas";

describe("AdminSearchSchema", () => {
  it("accepts a valid search term", () => {
    const result = AdminSearchSchema.safeParse({ q: "climate" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from the term", () => {
    const result = AdminSearchSchema.parse({ q: "  climate  " });
    expect(result.q).toBe("climate");
  });

  it("rejects an empty term", () => {
    const result = AdminSearchSchema.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only term", () => {
    const result = AdminSearchSchema.safeParse({ q: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a missing term", () => {
    const result = AdminSearchSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a term over 200 characters", () => {
    const result = AdminSearchSchema.safeParse({ q: "a".repeat(201) });
    expect(result.success).toBe(false);
  });
});
