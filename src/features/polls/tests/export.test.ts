import { describe, expect, it } from "bun:test";
import ExcelJS from "exceljs";

import { buildResultsFilename, buildResultsWorkbook } from "@/features/polls/export";
import type { PollResults } from "@/features/polls/models";

function makeResults(options: PollResults["options"]): PollResults {
  return {
    poll: {
      id: "poll-1",
      title: "Best Lunch?",
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
      { id: "opt-2", text: "Tacos", position: 1, voteCount: 1 },
    ]);

    const buffer = await buildResultsWorkbook(results);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet("Results");
    if (!worksheet) {
      throw new Error("Expected a Results worksheet");
    }

    expect(worksheet.getRow(1).values).toEqual([undefined, "Option", "Votes"]);
    expect(worksheet.getRow(2).values).toEqual([undefined, "Pizza", 3]);
    expect(worksheet.getRow(3).values).toEqual([undefined, "Tacos", 1]);
  });

  it("still writes only the header row for a poll with zero options", async () => {
    const results = makeResults([]);

    const buffer = await buildResultsWorkbook(results);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet("Results");
    if (!worksheet) {
      throw new Error("Expected a Results worksheet");
    }

    expect(worksheet.rowCount).toBe(1);
    expect(worksheet.getRow(1).values).toEqual([undefined, "Option", "Votes"]);
  });
});

describe("buildResultsFilename", () => {
  it("slugifies a normal title", () => {
    expect(buildResultsFilename("Best Lunch?")).toBe("best-lunch-results.xlsx");
  });

  it("falls back to poll for a punctuation-only title", () => {
    expect(buildResultsFilename("???")).toBe("poll-results.xlsx");
  });

  it("falls back to poll for an empty title", () => {
    expect(buildResultsFilename("")).toBe("poll-results.xlsx");
  });

  it("trims leading and trailing whitespace", () => {
    expect(buildResultsFilename("  Best Lunch?  ")).toBe("best-lunch-results.xlsx");
  });
});
