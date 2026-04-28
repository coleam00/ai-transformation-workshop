import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listRecentPolls } from "@/features/polls";
import { CreatePollForm } from "@/features/polls/components/create-poll-form";

export default async function Home() {
  const recentPolls = listRecentPolls(5);

  return (
    <div className="relative min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Dynamous AI Transformation Workshop
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            Quick polls. Live results.
          </h1>
          <p className="max-w-xl text-lg leading-7 text-zinc-600 dark:text-zinc-300">
            Create a poll in seconds. Share the link. Watch the votes come in. Built on the Next.js
            AI-optimized template, with the Claude Code AI layer driving every feature.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Create a poll</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePollForm />
          </CardContent>
        </Card>

        {recentPolls.length > 0 ? (
          <section className="flex flex-col gap-4">
            <Separator />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Recent polls</h2>
            <ul className="flex flex-col gap-3">
              {recentPolls.map((poll) => (
                <li key={poll.id}>
                  <Link
                    href={`/poll/${poll.id}`}
                    className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{poll.title}</p>
                    {poll.description ? (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {poll.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      Created {formatRelative(poll.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const then = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const diffSeconds = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
