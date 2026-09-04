import { describe, expect, it } from "bun:test";
import ExcelJS from "exceljs";

import { buildExportFilename, buildResultsWorkbook } from "../export";
import type { PollResultOption, PollResults } from "../models";

// exceljs's own `.d.ts` declares a module-scoped `Buffer` type (extends `ArrayBuffer`)
// that shadows Node's `Buffer` (extends `Uint8Array`) for `load()`'s parameter, so the
// two don't structurally match even though the runtime value works fine either way.
async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook;
}

function makeResults(options: PollResultOption[]): PollResults {
  return {
    poll: {
      id: "poll-1",
      title: "Best lunch?",
      description: null,
      status: "open",
      createdAt: new Date(),
    },
    options,
    totalVotes: options.reduce((sum, option) => sum + option.voteCount, 0),
  };
}

describe("buildResultsWorkbook", () => {
  it("writes a header row and one row per option", async () => {
    const results = makeResults([
      { id: "opt-1", text: "Pizza", position: 0, voteCount: 3 },
      { id: "opt-2", text: "Sushi", position: 1, voteCount: 1 },
    ]);

    const buffer = await buildResultsWorkbook(results);
    const workbook = await loadWorkbook(buffer);
    const worksheet = workbook.getWorksheet("Results");
    if (!worksheet) {
      throw new Error("Results worksheet not found");
    }

    expect(worksheet.getRow(1).getCell(1).value).toBe("Option");
    expect(worksheet.getRow(1).getCell(2).value).toBe("Votes");
    expect(worksheet.getRow(2).getCell(1).value).toBe("Pizza");
    expect(worksheet.getRow(2).getCell(2).value).toBe(3);
    expect(worksheet.getRow(3).getCell(1).value).toBe("Sushi");
    expect(worksheet.getRow(3).getCell(2).value).toBe(1);
  });

  it("neutralizes option text that looks like a spreadsheet formula", async () => {
    const results = makeResults([{ id: "opt-1", text: "=1+1", position: 0, voteCount: 2 }]);

    const buffer = await buildResultsWorkbook(results);
    const workbook = await loadWorkbook(buffer);
    const worksheet = workbook.getWorksheet("Results");
    if (!worksheet) {
      throw new Error("Results worksheet not found");
    }

    const cell = worksheet.getRow(2).getCell(1);
    expect(cell.type).not.toBe(ExcelJS.ValueType.Formula);
    expect(String(cell.value)).toBe("'=1+1");
  });

  it("exports a valid workbook for a poll with zero votes", async () => {
    const results = makeResults([{ id: "opt-1", text: "Pizza", position: 0, voteCount: 0 }]);

    const buffer = await buildResultsWorkbook(results);
    const workbook = await loadWorkbook(buffer);
    const worksheet = workbook.getWorksheet("Results");
    if (!worksheet) {
      throw new Error("Results worksheet not found");
    }

    expect(worksheet.getRow(2).getCell(2).value).toBe(0);
  });
});

describe("buildExportFilename", () => {
  it("slugifies a normal poll title", () => {
    expect(buildExportFilename("Best lunch?")).toBe("poll-results-best-lunch.xlsx");
  });

  it("falls back to 'export' when the title has no sluggable characters", () => {
    expect(buildExportFilename("???")).toBe("poll-results-export.xlsx");
  });

  it("never contains a quote, CR, or LF character", () => {
    const filename = buildExportFilename('Weird "title"\r\nwith line breaks');
    expect(filename).not.toContain('"');
    expect(filename).not.toContain("\r");
    expect(filename).not.toContain("\n");
  });
});
