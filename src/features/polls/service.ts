import { getLogger } from "@/core/logging";

import {
  DuplicateVoteError,
  PollNotFoundError,
  PollOptionMismatchError,
  PollOptionNotFoundError,
} from "./errors";
import type { Poll, PollResults, PollWithOptions } from "./models";
import * as repository from "./repository";
import type { CastVoteInput, CreatePollInput } from "./schemas";

const logger = getLogger("polls.service");

export function createPoll(input: CreatePollInput): PollWithOptions {
  logger.info({ title: input.title, optionCount: input.options.length }, "poll.create_started");
  const poll = repository.createPoll({
    title: input.title,
    description: input.description,
  });
  const options = repository.createPollOptions(poll.id, input.options);
  logger.info({ pollId: poll.id }, "poll.create_completed");
  return { ...poll, options };
}

export function getPollWithOptions(id: string): PollWithOptions {
  const poll = repository.findPollById(id);
  if (!poll) {
    throw new PollNotFoundError(id);
  }
  const options = repository.findOptionsByPoll(id);
  return { ...poll, options };
}

export function castVote(input: CastVoteInput): { recorded: boolean; alreadyVoted: boolean } {
  logger.info({ pollId: input.pollId, optionId: input.optionId }, "poll.vote_started");

  const poll = repository.findPollById(input.pollId);
  if (!poll) {
    throw new PollNotFoundError(input.pollId);
  }
  const option = repository.findOptionById(input.optionId);
  if (!option) {
    throw new PollOptionNotFoundError(input.optionId);
  }
  if (option.pollId !== input.pollId) {
    throw new PollOptionMismatchError();
  }

  const existing = repository.findVoteByToken(input.pollId, input.voterToken);
  if (existing) {
    logger.info({ pollId: input.pollId }, "poll.vote_duplicate");
    throw new DuplicateVoteError();
  }

  repository.recordVote(input.pollId, input.optionId, input.voterToken);
  logger.info({ pollId: input.pollId }, "poll.vote_completed");
  return { recorded: true, alreadyVoted: false };
}

export function getResults(pollId: string): PollResults {
  const poll = repository.findPollById(pollId);
  if (!poll) {
    throw new PollNotFoundError(pollId);
  }
  const options = repository.aggregateResults(pollId);
  const totalVotes = options.reduce((sum, option) => sum + option.voteCount, 0);
  return { poll, options, totalVotes };
}

export function listRecentPolls(limit = 10): Poll[] {
  return repository.listRecentPolls(limit);
}

export function hasVoted(pollId: string, voterToken: string): boolean {
  return Boolean(repository.findVoteByToken(pollId, voterToken));
}
