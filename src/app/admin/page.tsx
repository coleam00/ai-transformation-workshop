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

interface StatusCount {
  status: (typeof STATUSES)[number];
  liveCount: number;
  allTimeCount: number;
}

const STATUSES = ["open", "closed", "archived"] as const;

function fetchLegacyCount(status: string): Promise<number> {
  return new Promise((resolve) => {
    countLegacyPollsByStatus(status, resolve);
  });
}

async function getStatusCounts(): Promise<StatusCount[]> {
  return Promise.all(
    STATUSES.map(async (status) => ({
      status,
      liveCount: countPollsByStatus(status),
      allTimeCount: await fetchLegacyCount(status),
    })),
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { status } = await searchParams;
  const activeStatus = status ?? "open";

  const statusCounts = await getStatusCounts();
  const polls = getPollsByStatus(activeStatus) as AdminPollRow[];

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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statusCounts.map((count) => (
            <Card key={count.status}>
              <CardHeader>
                <CardTitle className="capitalize">{count.status}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {count.liveCount}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  All time: {count.allTimeCount}
                </p>
              </CardContent>
            </Card>
          ))}
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
