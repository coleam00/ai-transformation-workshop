import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countPollsByStatus } from "@/features/admin/audit";

const STATS = [
  { status: "open", label: "Open" },
  { status: "closed", label: "Closed" },
  { status: "draft", label: "Draft" },
] as const;

export default function AdminPage() {
  const counts = STATS.map((stat) => ({
    ...stat,
    count: countPollsByStatus(stat.status),
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
            Poll stats
          </h1>
        </header>

        <section className="grid grid-cols-3 gap-4">
          {counts.map((stat) => (
            <Card key={stat.status}>
              <CardHeader>
                <CardTitle>{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {stat.count}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
