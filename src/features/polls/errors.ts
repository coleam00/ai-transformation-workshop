export class PollError extends Error {
  public readonly code: string;
  public readonly statusCode: 400 | 401 | 403 | 404 | 409 | 500;

  constructor(message: string, code: string, statusCode: 400 | 401 | 403 | 404 | 409 | 500) {
    super(message);
    this.name = "PollError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class PollNotFoundError extends PollError {
  constructor(id: string) {
    super(`Poll not found: ${id}`, "POLL_NOT_FOUND", 404);
  }
}

export class PollOptionNotFoundError extends PollError {
  constructor(id: string) {
    super(`Poll option not found: ${id}`, "POLL_OPTION_NOT_FOUND", 404);
  }
}

export class PollOptionMismatchError extends PollError {
  constructor() {
    super("Selected option does not belong to this poll", "POLL_OPTION_MISMATCH", 400);
  }
}

export class DuplicateVoteError extends PollError {
  constructor() {
    super("You have already voted on this poll", "POLL_DUPLICATE_VOTE", 409);
  }
}
