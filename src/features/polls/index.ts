export {
  DuplicateVoteError,
  PollError,
  PollNotFoundError,
  PollOptionMismatchError,
  PollOptionNotFoundError,
} from "./errors";
export type {
  NewPoll,
  NewPollOption,
  NewVote,
  Poll,
  PollOption,
  PollResultOption,
  PollResults,
  PollWithOptions,
  Vote,
} from "./models";
export type { CastVoteInput, CreatePollInput } from "./schemas";
export { CastVoteSchema, CreatePollSchema } from "./schemas";

export {
  castVote,
  createPoll,
  getPollWithOptions,
  getResults,
  hasVoted,
  listRecentPolls,
} from "./service";
