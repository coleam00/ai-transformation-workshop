import ExcelJS from "exceljs";

import type { PollResults } from "./models";

export async function buildResultsWorkbook(results: PollResults): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Results");
  worksheet.columns = [
    { header: "Option", key: "option", width: 40 },
    { header: "Votes", key: "votes", width: 12 },
  ];

  for (const option of results.options) {
    worksheet.addRow({ option: option.text, votes: option.voteCount });
  }

  return workbook.xlsx.writeBuffer();
}

export function buildResultsFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "poll"}-results.xlsx`;
}
