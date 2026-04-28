"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PollOption } from "@/features/polls";
import { type CastVoteState, castVoteAction } from "@/features/polls/actions";

const INITIAL_STATE: CastVoteState = { status: "idle" };

interface VoteFormProps {
  pollId: string;
  options: PollOption[];
}

export function VoteForm({ pollId, options }: VoteFormProps) {
  const [state, formAction, pending] = useActionState(castVoteAction, INITIAL_STATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="pollId" value={pollId} />

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Choose an option</legend>
        {options.map((option) => {
          const checked = selectedId === option.id;
          return (
            <Label
              key={option.id}
              htmlFor={`option-${option.id}`}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                checked
                  ? "border-zinc-900 bg-zinc-900/5 dark:border-zinc-100 dark:bg-zinc-100/5"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              }`}
            >
              <input
                id={`option-${option.id}`}
                type="radio"
                name="optionId"
                value={option.id}
                checked={checked}
                onChange={() => setSelectedId(option.id)}
                className="h-4 w-4"
                required
              />
              <span className="text-base text-zinc-900 dark:text-zinc-100">{option.text}</span>
            </Label>
          );
        })}
      </fieldset>

      {state.status === "error" && state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.status === "duplicate" && state.error ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending || !selectedId} size="lg" className="self-start">
        {pending ? "Submitting..." : "Submit vote"}
      </Button>
    </form>
  );
}
