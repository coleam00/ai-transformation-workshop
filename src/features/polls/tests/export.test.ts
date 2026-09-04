import { describe, expect, it } from "bun:test";
import ExcelJS from "exceljs";

import { buildResultsFilename, buildResultsWorkbook } from "@/features/polls/export";
import type { Poll, PollResults } from "@/features/polls/models";

function makePoll(overrides: Partial<Poll> = {}): Poll {
  return {
    id: "poll-1",
    title: "Best lunch?",
    description: null,
    status: "open",
    createdAt: new Date(0),
    ...overrides,
  };
}

function makeResults(overrides: Partial<PollResults> = {}): PollResults {
  const poll = makePoll();
  const options = [
    { id: "opt-1", text: "Pizza", position: 0, voteCount: 3 },
    { id: "opt-2", text: "Tacos", position: 1, voteCount: 5 },
  ];
  return {
    poll,
    options,
    totalVotes: 8,
    ...overrides,
  };
}

describe("buildResultsWorkbook", () => {
  it("builds a header row plus one row per option", async () => {
    const results = makeResults();
    const buffer = await buildResultsWorkbook(results);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet("Results");

    expect(worksheet).toBeDefined();
    expect(worksheet?.getRow(1).values).toEqual([undefined, "Option", "Votes"]);
    expect(worksheet?.getRow(2).values).toEqual([undefined, "Pizza", 3]);
    expect(worksheet?.getRow(3).values).toEqual([undefined, "Tacos", 5]);
    expect(worksheet?.rowCount).toBe(3);
  });

  it("handles a poll with zero votes without crashing", async () => {
    const results = makeResults({
      options: [
        { id: "opt-1", text: "Pizza", position: 0, voteCount: 0 },
        { id: "opt-2", text: "Tacos", position: 1, voteCount: 0 },
      ],
      totalVotes: 0,
    });
    const buffer = await buildResultsWorkbook(results);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet("Results");

    expect(worksheet?.getRow(2).values).toEqual([undefined, "Pizza", 0]);
    expect(worksheet?.getRow(3).values).toEqual([undefined, "Tacos", 0]);
  });

  it("keeps duplicate option text on separate rows", async () => {
    const results = makeResults({
      options: [
        { id: "opt-1", text: "Pizza", position: 0, voteCount: 2 },
        { id: "opt-2", text: "Pizza", position: 1, voteCount: 6 },
      ],
      totalVotes: 8,
    });
    const buffer = await buildResultsWorkbook(results);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet("Results");

    expect(worksheet?.rowCount).toBe(3);
    expect(worksheet?.getRow(2).values).toEqual([undefined, "Pizza", 2]);
    expect(worksheet?.getRow(3).values).toEqual([undefined, "Pizza", 6]);
  });
});

describe("buildResultsFilename", () => {
  it("sanitizes and appends .xlsx", () => {
    const poll = makePoll({ title: "Best lunch?" });
    expect(buildResultsFilename(poll)).toBe("Best lunch.xlsx");
  });

  it("strips unsafe characters like slashes, quotes, and emoji", () => {
    const poll = makePoll({ title: 'Q3/Q4 "results" 🎉' });
    expect(buildResultsFilename(poll)).toBe("Q3Q4 results.xlsx");
  });

  it("collapses repeated whitespace", () => {
    const poll = makePoll({ title: "Team   lunch   poll" });
    expect(buildResultsFilename(poll)).toBe("Team lunch poll.xlsx");
  });

  it("falls back to poll.xlsx for a symbol-only title", () => {
    const poll = makePoll({ title: "🎉🎉🎉" });
    expect(buildResultsFilename(poll)).toBe("poll.xlsx");
  });

  it("falls back to poll.xlsx for a whitespace-only title", () => {
    const poll = makePoll({ title: "   " });
    expect(buildResultsFilename(poll)).toBe("poll.xlsx");
  });
});
