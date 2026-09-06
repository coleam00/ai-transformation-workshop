import { describe, expect, it } from "bun:test";

import { formatStatusLabel } from "../page";

describe("formatStatusLabel", () => {
  it("capitalizes the first letter", () => {
    expect(formatStatusLabel("open")).toBe("Open");
    expect(formatStatusLabel("closed")).toBe("Closed");
    expect(formatStatusLabel("archived")).toBe("Archived");
  });
});
