import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
};

export const polls = sqliteTable("polls", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"),
  ...timestamps,
});

export const pollOptions = sqliteTable("poll_options", {
  id: text("id").primaryKey(),
  pollId: text("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  position: integer("position").notNull().default(0),
});

export const votes = sqliteTable(
  "votes",
  {
    id: text("id").primaryKey(),
    pollId: text("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: text("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    voterToken: text("voter_token").notNull(),
    ...timestamps,
  },
  (table) => [
    // Enforces "one vote per voter per poll" atomically at the database layer so
    // concurrent requests (e.g. multi-worker deployments) can't both win a
    // check-then-insert race and record duplicate votes for the same voter.
    uniqueIndex("votes_poll_voter_unique").on(table.pollId, table.voterToken),
  ],
);
