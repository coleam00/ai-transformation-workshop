import { NextResponse } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { buildResultsFilename, buildResultsWorkbook, getResults } from "@/features/polls";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const results = getResults(id);
    const buffer = await buildResultsWorkbook(results);
    const filename = buildResultsFilename(results.poll);

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
