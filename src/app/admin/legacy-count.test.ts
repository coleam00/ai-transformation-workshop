import { describe, expect, it } from "bun:test";

import { getLegacyPollCount } from "./legacy-count";

describe("getLegacyPollCount", () => {
  it("resolves with the value the wrapped callback produces", async () => {
    const fetchCount = (
      _status: "open" | "closed" | "archived",
      callback: (total: number) => void,
    ) => {
      callback(42);
    };

    const result = await getLegacyPollCount("open", 1000, fetchCount);

    expect(result).toBe(42);
  });

  it("resolves with 0 when the callback never fires within timeoutMs", async () => {
    const fetchCount = () => {
      // Never calls back, simulating an unreachable legacy warehouse.
    };

    const result = await getLegacyPollCount("closed", 10, fetchCount);

    expect(result).toBe(0);
  });
});
