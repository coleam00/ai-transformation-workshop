import { z } from "zod/v4";

/**
 * Standard error response schema.
 * Used for consistent error format across all APIs.
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Create a standardized error response.
 */
export function createErrorResponse(
  error: string,
  code: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  const response: ErrorResponse = { error, code };
  if (details) {
    response.details = details;
  }
  return response;
}
