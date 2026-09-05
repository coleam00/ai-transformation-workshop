import { describe, expect, it, mock } from "bun:test";

mock.module("@/features/admin/audit", () => ({
  countPollsByStatus: (status: string) => {
    const liveCounts: Record<string, number> = { open: 3, closed: 5, archived: 0 };
    return liveCounts[status] ?? 0;
  },
  countLegacyPollsByStatus: (status: string, callback: (total: number) => void) => {
    const allTimeCounts: Record<string, number> = { open: 30, closed: 50, archived: 0 };
    queueMicrotask(() => callback(allTimeCounts[status] ?? 0));
  },
}));

const { getPollStatusCounts } = await import("./get-status-counts");

describe("getPollStatusCounts", () => {
  it("returns one entry per status, in the same order as the input", async () => {
    const result = await getPollStatusCounts(["open", "closed", "archived"]);
    expect(result.map((entry) => entry.status)).toEqual(["open", "closed", "archived"]);
  });

  it("maps live and all-time counts independently for each status", async () => {
    const result = await getPollStatusCounts(["open", "closed", "archived"]);
    expect(result).toEqual([
      { status: "open", liveCount: 3, allTimeCount: 30 },
      { status: "closed", liveCount: 5, allTimeCount: 50 },
      { status: "archived", liveCount: 0, allTimeCount: 0 },
    ]);
  });

  it("resolves a status with zero live and zero legacy polls", async () => {
    const result = await getPollStatusCounts(["archived"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ status: "archived", liveCount: 0, allTimeCount: 0 });
  });
});
