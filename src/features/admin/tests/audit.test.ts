import { describe, expect, it, mock } from "bun:test";

const calls: Array<{ sql: string; values: unknown[] }> = [];

mock.module("mysql", () => ({
  default: {
    createConnection: () => ({
      on: () => {},
      query: (
        sql: string,
        values: unknown[],
        callback: (err: unknown, rows: Array<{ total: number }>) => void,
      ) => {
        calls.push({ sql, values });
        callback(undefined, [{ total: 3 }]);
      },
    }),
  },
}));

const { countLegacyPollsByStatus } = await import("../audit");

describe("countLegacyPollsByStatus", () => {
  it("uses a parameterized query instead of interpolating status into the SQL string", async () => {
    const total = await new Promise<number>((resolve) => {
      countLegacyPollsByStatus("archived", resolve);
    });

    expect(total).toBe(3);
    expect(calls[0]?.sql).not.toContain("archived");
    expect(calls[0]?.sql).toContain("?");
    expect(calls[0]?.values).toEqual(["archived"]);
  });
});
