import ExcelJS from "exceljs";

import type { PollResults } from "./models";

const RISKY_LEADING_CHARS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Guards a cell value against CSV/formula injection: if `value` starts with a
 * character a spreadsheet application could interpret as the start of a
 * formula (`=`, `+`, `-`, `@`, tab, or CR), prefix it with a leading single
 * quote so it is stored unambiguously as text.
 */
export function sanitizeSpreadsheetCell(value: string): string {
  const startsRisky = RISKY_LEADING_CHARS.some((char) => value.startsWith(char));
  return startsRisky ? `'${value}` : value;
}

/**
 * Builds an in-memory `.xlsx` workbook buffer for a poll's results: a header
 * row followed by one row per option (option text + vote count), in the
 * options' `position` order.
 */
export async function buildResultsWorkbookBuffer(results: PollResults): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");
  sheet.addRow(["Option", "Votes"]);
  for (const option of results.options) {
    sheet.addRow([sanitizeSpreadsheetCell(option.text), option.voteCount]);
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
