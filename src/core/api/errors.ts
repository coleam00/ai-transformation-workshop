import { NextResponse } from "next/server";
import { ZodError } from "zod/v4";

import { getLogger } from "@/core/logging";
import { createErrorResponse, type ErrorResponse } from "@/shared/schemas/errors";

const logger = getLogger("api.errors");

export type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 500;

interface HttpError {
  message: string;
  code: string;
  statusCode: HttpStatusCode;
}

const VALID_STATUS_CODES = new Set<HttpStatusCode>([400, 401, 403, 404, 409, 500]);

function isHttpError(error: unknown): error is HttpError {
  if (!(error instanceof Error)) {
    return false;
  }
  if (!("code" in error) || !("statusCode" in error)) {
    return false;
  }

  const { code, statusCode } = error as { code: unknown; statusCode: unknown };
  return typeof code === "string" && VALID_STATUS_CODES.has(statusCode as HttpStatusCode);
}

function formatZodErrors(error: ZodError): Record<string, unknown> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "root";
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return { fields: fieldErrors };
}

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  if (error instanceof ZodError) {
    logger.warn({ error: error.message }, "api.validation_failed");
    return NextResponse.json(
      createErrorResponse("Validation failed", "VALIDATION_ERROR", formatZodErrors(error)),
      { status: 400 },
    );
  }

  if (isHttpError(error)) {
    const level = error.statusCode >= 500 ? "error" : "warn";
    logger[level]({ error: error.message, code: error.code }, "api.error");
    return NextResponse.json(createErrorResponse(error.message, error.code), {
      status: error.statusCode,
    });
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error({ error: message }, "api.internal_error");
  return NextResponse.json(createErrorResponse("Internal server error", "INTERNAL_ERROR"), {
    status: 500,
  });
}
