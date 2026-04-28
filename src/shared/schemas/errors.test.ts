import { describe, expect, it } from "bun:test";

import { createErrorResponse, ErrorResponseSchema } from "./errors";

describe("ErrorResponseSchema", () => {
  it("validates valid error response", () => {
    const result = ErrorResponseSchema.parse({
      error: "Not found",
      code: "NOT_FOUND",
    });
    expect(result.error).toBe("Not found");
    expect(result.code).toBe("NOT_FOUND");
    expect(result.details).toBeUndefined();
  });

  it("validates error response with details", () => {
    const result = ErrorResponseSchema.parse({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: { field: "email", message: "Invalid email format" },
    });
    expect(result.details).toEqual({ field: "email", message: "Invalid email format" });
  });

  it("rejects missing error field", () => {
    expect(() => ErrorResponseSchema.parse({ code: "ERROR" })).toThrow();
  });

  it("rejects missing code field", () => {
    expect(() => ErrorResponseSchema.parse({ error: "Error message" })).toThrow();
  });
});

describe("createErrorResponse", () => {
  it("creates error response without details", () => {
    const result = createErrorResponse("Not found", "NOT_FOUND");
    expect(result).toEqual({
      error: "Not found",
      code: "NOT_FOUND",
    });
    expect(result.details).toBeUndefined();
  });

  it("creates error response with details", () => {
    const result = createErrorResponse("Validation failed", "VALIDATION_ERROR", {
      field: "email",
    });
    expect(result).toEqual({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: { field: "email" },
    });
  });

  it("creates error response with complex details", () => {
    const result = createErrorResponse("Multiple errors", "VALIDATION_ERROR", {
      errors: [
        { field: "email", message: "Required" },
        { field: "name", message: "Too short" },
      ],
    });
    expect(result.details?.["errors"]).toHaveLength(2);
  });
});
