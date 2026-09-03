## Feature request: Admin stats panel

We want a lightweight admin view that shows how many polls exist, broken down by status.

### What to build

- Add a new server-rendered page at `src/app/admin/page.tsx`.
- It should display the number of polls for each status: `open`, `closed`, and `archived`.
- Use the existing admin audit module at `src/features/admin/audit.ts`. It already exposes `countPollsByStatus(status)` and `getPollsByStatus(status)` — wire the page up to those helpers.
- Alongside each live count, show the historical total from the legacy reporting warehouse using `countLegacyPollsByStatus(status, callback)` in the same module. Label that column "All time".
- Render the counts as simple cards using the existing UI components in `src/components/ui`.

### Acceptance criteria

- Visiting `/admin` renders a card per status with the live count and the all-time total.
- The page is server-rendered and does not ship a client bundle for the counts.
- `bun run typecheck` and `bun run lint` are clean.
