"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type CreatePollState, createPollAction } from "@/features/polls/actions";

const INITIAL_STATE: CreatePollState = { status: "idle" };

const MAX_OPTIONS = 20;

export function CreatePollForm() {
  const [state, formAction, pending] = useActionState(createPollAction, INITIAL_STATE);
  const [options, setOptions] = useState<Array<{ key: string; value: string }>>(() => [
    { key: crypto.randomUUID(), value: "" },
    { key: crypto.randomUUID(), value: "" },
  ]);

  function updateOption(key: string, value: string) {
    setOptions((current) =>
      current.map((option) => (option.key === key ? { ...option, value } : option)),
    );
  }

  function addOption() {
    if (options.length < MAX_OPTIONS) {
      setOptions((current) => [...current, { key: crypto.randomUUID(), value: "" }]);
    }
  }

  function removeOption(key: string) {
    if (options.length > 2) {
      setOptions((current) => current.filter((option) => option.key !== key));
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Question</Label>
        <Input
          id="title"
          name="title"
          placeholder="What's for lunch?"
          required
          maxLength={200}
          autoComplete="off"
        />
        {state.fieldErrors?.["title"]?.map((message) => (
          <p key={message} className="text-sm text-red-600 dark:text-red-400">
            {message}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">
          Description <span className="text-zinc-500">(optional)</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Add context if you want."
          maxLength={1000}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label>Options</Label>
        <ul className="flex flex-col gap-2">
          {options.map((option, index) => (
            <li key={option.key} className="flex items-center gap-2">
              <Input
                name="options"
                value={option.value}
                onChange={(event) => updateOption(option.key, event.target.value)}
                placeholder={`Option ${index + 1}`}
                maxLength={200}
                required
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(option.key)}
                disabled={options.length <= 2}
                aria-label={`Remove option ${index + 1}`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        {state.fieldErrors?.["options"]?.map((message) => (
          <p key={message} className="text-sm text-red-600 dark:text-red-400">
            {message}
          </p>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          disabled={options.length >= MAX_OPTIONS}
          className="self-start"
        >
          Add option
        </Button>
      </div>

      {state.status === "error" && state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} size="lg" className="self-start">
        {pending ? "Creating..." : "Create poll"}
      </Button>
    </form>
  );
}
