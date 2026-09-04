import { NextResponse } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { buildExportFilename, buildResultsWorkbook, getResults } from "@/features/polls";

const logger = getLogger("polls.export");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  logger.info({ pollId: id }, "poll.export_started");

  try {
    const results = getResults(id);
    const buffer = await buildResultsWorkbook(results);
    const filename = buildExportFilename(results.poll.title);

    logger.info({ pollId: id }, "poll.export_completed");
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error({ pollId: id, error }, "poll.export_failed");
    return handleApiError(error);
  }
}
