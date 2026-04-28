"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getLogger } from "@/core/logging";
import { getOrCreateVoterToken } from "@/features/polls/voter-token";
import { CastVoteSchema, CreatePollSchema } from "./schemas";
import { castVote as castVoteService, createPoll as createPollService } from "./service";

const logger = getLogger("polls.actions");

export type CreatePollState = {
  status: "idle" | "error";
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createPollAction(
  _prevState: CreatePollState,
  formData: FormData,
): Promise<CreatePollState> {
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const optionsRaw = formData.getAll("options").map((value) => String(value));
  const options = optionsRaw.map((value) => value.trim()).filter((value) => value.length > 0);

  const parsed = CreatePollSchema.safeParse({
    title,
    description: description.trim() || undefined,
    options,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "form";
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }
    return { status: "error", error: "Please fix the errors below", fieldErrors };
  }

  let pollId: string | undefined;
  try {
    const poll = createPollService(parsed.data);
    pollId = poll.id;
  } catch (error) {
    logger.error({ err: error }, "poll.create_failed");
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Failed to create poll",
    };
  }

  if (pollId) {
    revalidatePath("/");
    redirect(`/poll/${pollId}`);
  }
  return { status: "idle" };
}

export type CastVoteState = {
  status: "idle" | "success" | "error" | "duplicate";
  error?: string;
};

export async function castVoteAction(
  _prevState: CastVoteState,
  formData: FormData,
): Promise<CastVoteState> {
  const pollId = String(formData.get("pollId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");

  if (!pollId || !optionId) {
    return { status: "error", error: "Please choose an option before voting" };
  }

  const voterToken = await getOrCreateVoterToken();

  const parsed = CastVoteSchema.safeParse({ pollId, optionId, voterToken });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Invalid vote",
    };
  }

  try {
    castVoteService(parsed.data);
  } catch (error) {
    if (error instanceof Error && error.name === "PollError") {
      const code = (error as unknown as { code: string }).code;
      if (code === "POLL_DUPLICATE_VOTE") {
        return { status: "duplicate", error: "You have already voted on this poll" };
      }
      return { status: "error", error: error.message };
    }
    logger.error({ err: error }, "poll.vote_failed");
    return { status: "error", error: "Failed to record vote" };
  }

  revalidatePath(`/poll/${pollId}`);
  revalidatePath(`/poll/${pollId}/results`);
  redirect(`/poll/${pollId}/results`);
}
