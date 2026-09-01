import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countPollsByStatus, type PollStatus } from "@/features/admin/audit";

const STATUSES: ReadonlyArray<{ key: PollStatus; label: string }> = [
  { key: "open", label: "Open polls" },
  { key: "closed", label: "Closed polls" },
  { key: "draft", label: "Draft polls" },
];

export default async function AdminPage() {
  const counts = STATUSES.map(({ key, label }) => ({
    label,
    count: countPollsByStatus(key),
  }));

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
            Poll Stats
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Poll counts by status</p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {counts.map(({ label, count }) => (
            <Card key={label}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-zinc-950 dark:text-zinc-50">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
