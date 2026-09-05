import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPollStatusCounts } from "./get-status-counts";

const STATUSES = ["open", "closed", "archived"] as const;

export default async function AdminPage() {
  const statusCounts = await getPollStatusCounts(STATUSES);

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statusCounts.map(({ status, liveCount, allTimeCount }) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle>{status.charAt(0).toUpperCase() + status.slice(1)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {liveCount}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  All time: {allTimeCount}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
