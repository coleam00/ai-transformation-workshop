import { describe, expect, it } from "bun:test";

import { CastVoteSchema, CreatePollSchema } from "@/features/polls/schemas";

describe("CreatePollSchema", () => {
  it("accepts a valid poll", () => {
    const result = CreatePollSchema.safeParse({
      title: "Best lunch?",
      description: "Pick wisely",
      options: ["Pizza", "Tacos"],
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from title", () => {
    const result = CreatePollSchema.parse({
      title: "  Hello  ",
      options: ["A", "B"],
    });
    expect(result.title).toBe("Hello");
  });

  it("rejects polls with fewer than two options", () => {
    const result = CreatePollSchema.safeParse({
      title: "Test",
      options: ["only"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects polls with empty title", () => {
    const result = CreatePollSchema.safeParse({
      title: "   ",
      options: ["A", "B"],
    });
    expect(result.success).toBe(false);
  });

  it("normalizes empty description to undefined", () => {
    const result = CreatePollSchema.parse({
      title: "Test",
      description: "",
      options: ["A", "B"],
    });
    expect(result.description).toBeUndefined();
  });
});

describe("CastVoteSchema", () => {
  it("accepts a valid vote", () => {
    const result = CastVoteSchema.safeParse({
      pollId: "poll-1",
      optionId: "opt-1",
      voterToken: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty pollId", () => {
    const result = CastVoteSchema.safeParse({
      pollId: "",
      optionId: "opt-1",
      voterToken: "abc",
    });
    expect(result.success).toBe(false);
  });
});
