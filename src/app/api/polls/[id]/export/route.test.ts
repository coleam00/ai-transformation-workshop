import { afterEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";

import { db } from "@/core/database/client";
import { polls } from "@/core/database/schema";
import { createPoll } from "@/features/polls";

import { GET } from "./route";

describe("GET /api/polls/[id]/export", () => {
  let pollId: string | undefined;

  afterEach(() => {
    if (pollId) {
      db.delete(polls).where(eq(polls.id, pollId)).run();
      pollId = undefined;
    }
  });

  it("returns an xlsx attachment for an existing poll", async () => {
    const poll = createPoll({
      title: "Best Lunch?",
      description: undefined,
      options: ["Pizza", "Tacos"],
    });
    pollId = poll.id;

    const request = new Request(`http://localhost/api/polls/${poll.id}/export`);
    const response = await GET(request as never, { params: Promise.resolve({ id: poll.id }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("Content-Disposition")).toContain("best-lunch-results.xlsx");
  });

  it("returns 404 for a poll that does not exist", async () => {
    const request = new Request("http://localhost/api/polls/does-not-exist/export");
    const response = await GET(request as never, {
      params: Promise.resolve({ id: "does-not-exist" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("POLL_NOT_FOUND");
  });
});
