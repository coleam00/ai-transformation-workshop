import { type NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { exportResults } from "@/features/polls";
import { buildContentDispositionHeader } from "@/shared/utils/filenames";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { buffer, filename } = await exportResults(id);
    // Node's Buffer<ArrayBufferLike> isn't directly assignable to BodyInit's
    // Uint8Array<ArrayBuffer> under this TypeScript/lib version; copy into a
    // plain Uint8Array to satisfy the type without changing the bytes sent.
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": buildContentDispositionHeader(filename),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
