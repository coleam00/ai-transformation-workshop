import { randomUUID } from "node:crypto";

import { asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/core/database/client";
import { pollOptions, polls, votes } from "@/core/database/schema";

import type { NewPoll, NewPollOption, Poll, PollOption, PollResultOption, Vote } from "./models";

export function createPoll(data: Omit<NewPoll, "id" | "createdAt">): Poll {
  const id = randomUUID();
  const inserted = db
    .insert(polls)
    .values({ id, title: data.title, description: data.description ?? null })
    .returning()
    .all();
  const row = inserted[0];
  if (!row) {
    throw new Error("Failed to insert poll");
  }
  return row;
}

export function createPollOptions(pollId: string, optionTexts: string[]): PollOption[] {
  if (optionTexts.length === 0) {
    return [];
  }
  const rows: NewPollOption[] = optionTexts.map((text, index) => ({
    id: randomUUID(),
    pollId,
    text,
    position: index,
  }));
  return db.insert(pollOptions).values(rows).returning().all();
}

export function findPollById(id: string): Poll | undefined {
  return db.select().from(polls).where(eq(polls.id, id)).limit(1).all()[0];
}

export function findOptionsByPoll(pollId: string): PollOption[] {
  return db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.pollId, pollId))
    .orderBy(asc(pollOptions.position))
    .all();
}

export function findOptionById(optionId: string): PollOption | undefined {
  return db.select().from(pollOptions).where(eq(pollOptions.id, optionId)).limit(1).all()[0];
}

export function findVoteByToken(pollId: string, voterToken: string): Vote | undefined {
  return db
    .select()
    .from(votes)
    .where(sql`${votes.pollId} = ${pollId} AND ${votes.voterToken} = ${voterToken}`)
    .limit(1)
    .all()[0];
}

export function recordVote(pollId: string, optionId: string, voterToken: string): Vote {
  const id = randomUUID();
  const inserted = db.insert(votes).values({ id, pollId, optionId, voterToken }).returning().all();
  const row = inserted[0];
  if (!row) {
    throw new Error("Failed to insert vote");
  }
  return row;
}

export function listRecentPolls(limit = 10): Poll[] {
  return db.select().from(polls).orderBy(desc(polls.createdAt)).limit(limit).all();
}

export function aggregateResults(pollId: string): PollResultOption[] {
  const rows = db
    .select({
      id: pollOptions.id,
      text: pollOptions.text,
      position: pollOptions.position,
      voteCount: sql<number>`count(${votes.id})`.mapWith(Number),
    })
    .from(pollOptions)
    .leftJoin(votes, eq(votes.optionId, pollOptions.id))
    .where(eq(pollOptions.pollId, pollId))
    .groupBy(pollOptions.id)
    .orderBy(asc(pollOptions.position))
    .all();
  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    position: row.position,
    voteCount: row.voteCount ?? 0,
  }));
}
