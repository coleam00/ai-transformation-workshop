import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  countLegacyPollsByStatus,
  countPollsByStatus,
  getPollsByStatus,
} from "@/features/admin/audit";

interface AdminPageProps {
  searchParams: Promise<{ status?: string }>;
}

interface AdminPollRow {
  id: string;
  title: string;
  description: string | null;
}

const STATUSES = ["open", "closed", "archived"] as const;

type PollStatus = (typeof STATUSES)[number];

interface StatusStats {
  status: PollStatus;
  live: number;
  allTime: number;
}

function fetchLegacyCount(status: PollStatus): Promise<number> {
  return new Promise((resolve) => {
    countLegacyPollsByStatus(status, resolve);
  });
}

async function getStatusStats(): Promise<StatusStats[]> {
  const legacyCounts = await Promise.all(STATUSES.map((status) => fetchLegacyCount(status)));
  return STATUSES.map((status, index) => ({
    status,
    live: countPollsByStatus(status),
    allTime: legacyCounts[index] ?? 0,
  }));
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { status } = await searchParams;
  const activeStatus = status ?? "open";

  const polls = getPollsByStatus(activeStatus) as AdminPollRow[];
  const stats = await getStatusStats();

  return (
    <div className="relative min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Admin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Poll audit
          </h1>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Poll stats</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.status}>
                <CardHeader>
                  <CardTitle className="capitalize">{stat.status}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-baseline gap-6">
                  <div>
                    <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {stat.live}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Live
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {stat.allTime}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      All time
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <nav className="flex gap-2">
          {STATUSES.map((option) => (
            <Link
              key={option}
              href={`/admin?status=${option}`}
              className={
                option === activeStatus
                  ? "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                  : "rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }
            >
              {option}
            </Link>
          ))}
        </nav>

        <Card>
          <CardHeader>
            <CardTitle>Polls with status &ldquo;{activeStatus}&rdquo;</CardTitle>
          </CardHeader>
          <CardContent>
            {polls.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No polls with this status.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {polls.map((poll) => (
                  <li key={poll.id} className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{poll.title}</p>
                    {poll.description ? (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {poll.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
