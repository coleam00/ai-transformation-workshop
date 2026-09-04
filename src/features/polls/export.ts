import ExcelJS from "exceljs";

import { getLogger } from "@/core/logging";
import type { Poll, PollResults } from "./models";

const logger = getLogger("polls.export");

export async function buildResultsWorkbook(results: PollResults): Promise<ArrayBuffer> {
  logger.info(
    { pollId: results.poll.id, optionCount: results.options.length },
    "poll.export_started",
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Results");
  worksheet.columns = [
    { header: "Option", key: "option" },
    { header: "Votes", key: "votes" },
  ];

  for (const option of results.options) {
    worksheet.addRow({ option: option.text, votes: option.voteCount });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  logger.info(
    { pollId: results.poll.id, optionCount: results.options.length },
    "poll.export_completed",
  );

  return buffer;
}

export function buildResultsFilename(poll: Poll): string {
  const sanitized = poll.title
    .replace(/[^A-Za-z0-9-_ ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return `${sanitized || "poll"}.xlsx`;
}
