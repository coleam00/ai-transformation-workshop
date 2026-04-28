import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { pollOptions, polls, votes } from "@/core/database/schema";

export type Poll = InferSelectModel<typeof polls>;
export type NewPoll = InferInsertModel<typeof polls>;

export type PollOption = InferSelectModel<typeof pollOptions>;
export type NewPollOption = InferInsertModel<typeof pollOptions>;

export type Vote = InferSelectModel<typeof votes>;
export type NewVote = InferInsertModel<typeof votes>;

export interface PollWithOptions extends Poll {
  options: PollOption[];
}

export interface PollResultOption {
  id: string;
  text: string;
  position: number;
  voteCount: number;
}

export interface PollResults {
  poll: Poll;
  options: PollResultOption[];
  totalVotes: number;
}
