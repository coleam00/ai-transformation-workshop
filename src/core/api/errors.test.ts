import { describe, expect, it } from "bun:test";
import { ZodError } from "zod/v4";

import { DuplicateVoteError, PollNotFoundError } from "@/features/polls/errors";

import { handleApiError } from "./errors";

describe("handleApiError", () => {
  it("handles PollNotFoundError with 404", async () => {
    const error = new PollNotFoundError("test-id");
    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("POLL_NOT_FOUND");
    expect(data.error).toContain("test-id");
  });

  it("handles DuplicateVoteError with 409", async () => {
    const error = new DuplicateVoteError();
    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.code).toBe("POLL_DUPLICATE_VOTE");
  });

  it("handles ZodError with 400 and field details", async () => {
    const error = new ZodError([
      {
        code: "too_small",
        minimum: 3,
        origin: "string",
        inclusive: true,
        message: "String must contain at least 3 character(s)",
        path: ["title"],
        input: "ab",
      },
    ]);
    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(data.details?.fields).toBeDefined();
  });

  it("handles unknown errors with 500", async () => {
    const error = new Error("Something went wrong");
    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
    expect(data.error).toBe("Internal server error");
  });

  it("handles non-Error objects with 500", async () => {
    const response = handleApiError("string error");
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
