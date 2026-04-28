import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPollWithOptions,
  hasVoted,
  PollNotFoundError,
  type PollWithOptions,
} from "@/features/polls";
import { VoteForm } from "@/features/polls/components/vote-form";
import { getVoterToken } from "@/features/polls/voter-token";

interface VotePageProps {
  params: Promise<{ id: string }>;
}

export default async function VotePage({ params }: VotePageProps) {
  const { id } = await params;

  let poll: PollWithOptions;
  try {
    poll = getPollWithOptions(id);
  } catch (error) {
    if (error instanceof PollNotFoundError) {
      notFound();
    }
    throw error;
  }

  const token = await getVoterToken();
  if (token && hasVoted(id, token)) {
    redirect(`/poll/${id}/results`);
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{poll.title}</CardTitle>
            {poll.description ? (
              <CardDescription className="text-base">{poll.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            <VoteForm pollId={poll.id} options={poll.options} />
          </CardContent>
        </Card>

        <p className="text-center text-sm">
          <Link
            href={`/poll/${poll.id}/results`}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            See current results →
          </Link>
        </p>
      </main>
    </div>
  );
}
