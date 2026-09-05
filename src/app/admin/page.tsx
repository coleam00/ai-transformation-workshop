import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countLegacyPollsByStatus, countPollsByStatus } from "@/features/admin/audit";

const STATUSES = ["open", "closed", "archived"] as const;

function getLegacyCount(status: string): Promise<number> {
  return new Promise((resolve) => {
    countLegacyPollsByStatus(status, resolve);
  });
}

async function getStatusCounts() {
  return Promise.all(
    STATUSES.map(async (status) => ({
      status,
      liveCount: countPollsByStatus(status),
      legacyTotal: await getLegacyCount(status),
    })),
  );
}

export default async function AdminPage() {
  const stats = await getStatusCounts();

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
            Poll stats
          </h1>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(({ status, liveCount, legacyTotal }) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="capitalize">{status}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {liveCount}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  All time: {legacyTotal}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
