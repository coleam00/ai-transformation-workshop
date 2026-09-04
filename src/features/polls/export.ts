import ExcelJS from "exceljs";

import type { PollResults } from "./models";

const FORMULA_TRIGGER_CHARS = new Set(["=", "+", "-", "@", "\t", "\r"]);

// Unicode combining diacritical marks range, stripped after NFKD normalization
// so accented characters degrade to their plain ASCII base letter.
const COMBINING_MARKS_PATTERN = /[̀-ͯ]/g;

/**
 * Neutralizes cell values that would otherwise be interpreted as spreadsheet
 * formulas by Excel/Google Sheets when the file is opened later (OWASP CSV/Formula
 * Injection, CWE-1236). Only strings starting with a trigger character are mutated;
 * everything else passes through untouched.
 */
function sanitizeCellValue(value: string): string {
  const firstChar = value.charAt(0);
  if (FORMULA_TRIGGER_CHARS.has(firstChar)) {
    return `'${value}`;
  }
  return value;
}

export async function buildResultsWorkbook(results: PollResults): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Results");
  worksheet.columns = [
    { header: "Option", key: "option", width: 40 },
    { header: "Votes", key: "votes", width: 12 },
  ];

  for (const option of results.options) {
    worksheet.addRow({ option: sanitizeCellValue(option.text), votes: option.voteCount });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function buildExportFilename(pollTitle: string): string {
  const slug = pollTitle
    .normalize("NFKD")
    .replace(COMBINING_MARKS_PATTERN, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return `poll-results-${slug || "export"}.xlsx`;
}
