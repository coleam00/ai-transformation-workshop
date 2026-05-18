import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countPollsByStatus } from "@/features/admin/audit";

export default async function AdminPage() {
  const openCount = countPollsByStatus("open");
  const closedCount = countPollsByStatus("closed");
  const draftCount = countPollsByStatus("draft");

  return (
    <div className="relative min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50">
            Admin Stats
          </h1>
          <p className="text-lg leading-7 text-zinc-600 dark:text-zinc-300">
            Poll counts grouped by status.
          </p>
        </header>

        <section className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Open</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{openCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{closedCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{draftCount}</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
