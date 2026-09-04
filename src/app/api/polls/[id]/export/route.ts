import { type NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { getResults } from "@/features/polls";
import { buildResultsFilename, buildResultsWorkbook } from "@/features/polls/export";

const logger = getLogger("polls.api.export");

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  logger.info({ pollId: id }, "poll.export_started");
  try {
    const results = getResults(id);
    const buffer = await buildResultsWorkbook(results);
    const filename = buildResultsFilename(results.poll.title);
    logger.info({ pollId: id }, "poll.export_completed");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
