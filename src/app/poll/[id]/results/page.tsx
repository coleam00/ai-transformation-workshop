import Link from "next/link";
import { notFound } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getResults, hasVoted, PollNotFoundError, type PollResults } from "@/features/polls";
import { getVoterToken } from "@/features/polls/voter-token";

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;

  let results: PollResults;
  try {
    results = getResults(id);
  } catch (error) {
    if (error instanceof PollNotFoundError) {
      notFound();
    }
    throw error;
  }

  const token = await getVoterToken();
  const userVoted = token ? hasVoted(id, token) : false;

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
            <CardTitle className="text-2xl">{results.poll.title}</CardTitle>
            {results.poll.description ? (
              <CardDescription className="text-base">{results.poll.description}</CardDescription>
            ) : null}
            <p className="pt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {results.totalVotes} {results.totalVotes === 1 ? "vote" : "votes"} so far
            </p>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4">
              {results.options.map((option) => {
                const percentage =
                  results.totalVotes === 0
                    ? 0
                    : Math.round((option.voteCount / results.totalVotes) * 100);
                return (
                  <li key={option.id} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {option.text}
                      </span>
                      <span className="text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                        {option.voteCount} {option.voteCount === 1 ? "vote" : "votes"} ·{" "}
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full bg-zinc-900 transition-all dark:bg-zinc-100"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {!userVoted ? (
          <p className="text-center text-sm">
            <Link
              href={`/poll/${results.poll.id}`}
              className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              ← You haven't voted yet. Cast your vote.
            </Link>
          </p>
        ) : (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">Thanks for voting.</p>
        )}
      </main>
    </div>
  );
}
