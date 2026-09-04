import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";

import { createPoll } from "@/features/polls";

import { GET } from "./route";

describe("GET /api/poll/[id]/export", () => {
  it("returns a 200 xlsx download for an existing poll", async () => {
    const poll = createPoll({
      title: `Export route test ${randomUUID()}`,
      description: undefined,
      options: ["Pizza", "Sushi"],
    });

    const request = new Request(`http://localhost/api/poll/${poll.id}/export`);
    const response = await GET(request, { params: Promise.resolve({ id: poll.id }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("Content-Disposition")).toContain(
      'attachment; filename="poll-results-',
    );
  });

  it("returns 404 JSON for an unknown poll", async () => {
    const unknownId = randomUUID();
    const request = new Request(`http://localhost/api/poll/${unknownId}/export`);
    const response = await GET(request, { params: Promise.resolve({ id: unknownId }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("POLL_NOT_FOUND");
  });
});
