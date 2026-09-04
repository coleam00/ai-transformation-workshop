import { describe, expect, it } from "bun:test";
import ExcelJS from "exceljs";

import type { PollResults } from "@/features/polls";
import { buildResultsWorkbookBuffer } from "@/features/polls/export";

function buildFixture(overrides: Partial<PollResults> = {}): PollResults {
  return {
    poll: {
      id: "poll-1",
      title: "Best Lunch",
      description: null,
      status: "open",
      createdAt: new Date("2025-01-15T10:30:00.000Z"),
    },
    options: [
      { id: "opt-1", text: "Pizza", position: 0, voteCount: 3 },
      { id: "opt-2", text: "Sushi", position: 1, voteCount: 5 },
    ],
    totalVotes: 8,
    ...overrides,
  };
}

// exceljs's own type declarations shadow the global `Buffer` with a local
// `interface Buffer extends ArrayBuffer {}`, so `load()` needs a real
// ArrayBuffer rather than Node's `Buffer<ArrayBufferLike>` to satisfy the
// compiler (the values are compatible at runtime).
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

async function loadFirstSheetRows(buffer: Buffer): Promise<unknown[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(toArrayBuffer(buffer));
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("Expected a worksheet");
  }
  const rows: unknown[][] = [];
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    rows.push(row.values as unknown[]);
  }
  return rows;
}

describe("buildResultsWorkbookBuffer", () => {
  it("writes a header row followed by option rows in position order", async () => {
    const results = buildFixture();
    const buffer = await buildResultsWorkbookBuffer(results);
    const rows = await loadFirstSheetRows(buffer);

    // exceljs row.values is 1-indexed; index 0 is unused
    expect(rows[0]?.slice(1)).toEqual(["Option", "Votes"]);
    expect(rows[1]?.slice(1)).toEqual(["Pizza", 3]);
    expect(rows[2]?.slice(1)).toEqual(["Sushi", 5]);
  });

  it("prefixes option text that starts with a formula-injection character with a quote", async () => {
    const results = buildFixture({
      options: [{ id: "opt-1", text: "=SUM(A1:A9)", position: 0, voteCount: 1 }],
    });
    const buffer = await buildResultsWorkbookBuffer(results);
    const rows = await loadFirstSheetRows(buffer);

    const cellValue = rows[1]?.[1];
    expect(typeof cellValue).toBe("string");
    expect((cellValue as string).startsWith("=")).toBe(false);
    expect(cellValue).toBe("'=SUM(A1:A9)");
  });

  it("still renders a row for an option with zero votes", async () => {
    const results = buildFixture({
      options: [{ id: "opt-1", text: "Untouched", position: 0, voteCount: 0 }],
    });
    const buffer = await buildResultsWorkbookBuffer(results);
    const rows = await loadFirstSheetRows(buffer);

    expect(rows.length).toBe(2);
    expect(rows[1]?.slice(1)).toEqual(["Untouched", 0]);
  });
});
