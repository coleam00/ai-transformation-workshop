# AI Transformation Workshop — Agentic Engineering

Workshop materials and a working demo app for **"Principles of Agentic Engineering: Scaling your Development with AI"** by Cole Medin.

This repo packages a complete reference implementation of how to build software in an AI-first organization:

- **The methodology** — the AI layer concept, the PIV loop, and five golden rules that compound over time
- **A portable AI layer** — 15 commands and 2 skills you can drop into any project today
- **A live demo app** — a deliberately scarce poll builder used as the canvas for the workshop's live build

If you attended the workshop, this is the canonical reference for everything you saw. If you didn't, the workflow below works just as well on your own codebase.

---

## The Methodology

### The AI Layer — Your Second Codebase

Every codebase now has two layers: the code itself, and the AI layer — all the context that tells your coding agent how to work in your codebase.

Three components:

1. **Global rules** (`CLAUDE.md`) — always loaded. Tech stack, code patterns, testing standards, deployment commands. Keep it tight.
2. **On-demand context** — reference docs, style guides, API patterns. Loaded only when relevant so it doesn't bloat every session.
3. **Commands and skills** — packaged, reusable workflows. `/create-prd`, `/prime`, `/plan`, `/implement`. This is where you standardize *how your team builds*.

When the `.claude/` folder is checked into source control alongside your code, AI improvements work exactly like code improvements. Pull requests, reviews, the whole team benefits.

### The PIV Loop — Plan, Implement, Validate

The core methodology for reliable, repeatable AI-assisted development.

**Plan.** `/prime` loads context (Jira ticket, codebase tree, recent git log). Then `/plan` produces a structured plan with a validation strategy baked in *before any code is written*. Sub-agents do parallel research, but never implementation — they have their own context windows, so you get tens of thousands of tokens of exploration in exchange for a short summary.

**Implement.** Context reset, then `/implement` executes the plan in a fresh window. The plan is everything the agent needs.

**Validate.** A five-layer pyramid:

```
Layer 5: Manual testing            ← You (golden path + edge cases)
Layer 4: Code review               ← You (with AI assist)
Layer 3: Integration / E2E         ← Agent + browser automation, iterates
Layer 2: Unit tests                ← Agent handles, iterates
Layer 1: Type checking + linting   ← Agent handles, iterates
```

The goal is to push the line between layers 3 and 4 as far down as possible. When the agent handles the bottom three and catches everything it can, your review is faster and cleaner.

### The Five Golden Rules

1. **Commandify everything.** If you type something more than twice, it should be a command. Reusable, shareable, evolvable.
2. **Reduce assumptions.** Questions before PRD. Review the PRD before Jira. Review the plan before executing. The most dangerous thing in AI-assisted development isn't the model making mistakes — it's the model making assumptions. Every question it asks is an assumption it's not making.
3. **Context is king.** Reset between planning and implementation. Sub-agents for research only. On-demand context over a bloated `CLAUDE.md`.
4. **Git log is memory.** Commit frequently, commit descriptively. Your agent reads this history on every prime.
5. **System evolution.** Every bug your coding agent makes is a chance to improve the AI layer so it never makes that mistake again. Your system compounds.

---

## What's In This Repo

```
.claude/
├── CLAUDE-template.md          # Starter rules for new projects
├── commands/                   # 15 reusable workflows
│   ├── prime, prime-server, prime-client, prime-endpoint, prime-components
│   ├── create-prd, prd-interactive, create-rules
│   ├── create-stories          # PRD → Jira issues via Atlassian MCP
│   ├── plan, implement
│   ├── validate, review, security-review
│   └── install
└── skills/
    ├── agent-browser/          # Browser automation for E2E validation
    └── pptx-generator/         # PowerPoint slide generation

.agents/
├── PRDs/                       # Generated PRDs land here
└── stories/                    # Generated Jira story manifests land here

.mcp.json                       # Atlassian MCP (Jira + Confluence) wired in

src/                            # The demo poll application
CLAUDE.md                       # Project-specific rules for the demo
CODEBASE-GUIDE.md               # Deep dive on AI-optimized patterns
```

### Command Reference

| Command | Purpose |
|---------|---------|
| `/install` | Install dependencies, push schema, start dev server |
| `/prime [JIRA-KEY]` | Load codebase + Jira context for planning |
| `/prime-server`, `/prime-client`, `/prime-endpoint`, `/prime-components` | Focused primers for specific layers |
| `/create-rules` | Generate or update `CLAUDE.md` for a new codebase |
| `/create-prd` | Generate a PRD from a brain dump (with interactive questions) |
| `/prd-interactive` | Step-by-step PRD generation for non-technical builders |
| `/create-stories` | Convert a PRD into Jira stories with acceptance criteria, push via MCP |
| `/plan` | Produce a detailed implementation plan with a validation strategy |
| `/implement` | Execute a plan in a fresh context window |
| `/validate` | Run lint + type check + tests, report failures |
| `/review`, `/security-review` | Code review patterns for PRs |

---

## The Demo Application

A deliberately scarce anonymous poll app: basic creation, single-choice voting, a static results page. The "Quick polls. Live results." tagline on the home page is intentionally a lie — results don't actually update. That gap is the canvas the workshop uses to walk a real PIV loop, building live presentation mode end to end.

**Stack:** Next.js 16, React 19, TypeScript strict, Tailwind 4, shadcn/ui, Drizzle ORM, better-sqlite3, Bun.

### Setup

```bash
bun install
bun run db:push     # creates local.db
bun run dev         # http://localhost:3000
```

That's it. No auth, no environment variables, no external services.

### Commands

```bash
bun run dev          # dev server (Next.js with --webpack flag)
bun run build        # production build
bun run lint         # Biome
bun run lint:fix     # auto-fix lint and formatting
bun test             # Bun test runner with coverage
bun run db:studio    # Drizzle Studio GUI for the database
```

### Architecture

The poll feature lives in a single vertical slice at `src/features/polls/`:

```
src/features/polls/
├── models.ts        # Drizzle types
├── schemas.ts       # Zod validation
├── repository.ts    # Database queries (no business logic)
├── service.ts       # Business logic, throws typed errors
├── errors.ts        # Custom error classes with HTTP status codes
├── actions.ts       # Server Actions called by Client Components
├── voter-token.ts   # Cookie-based duplicate vote prevention
├── components/      # UI components
└── tests/           # Feature tests
```

For the patterns that make this codebase AI-friendly (machine-readable feedback, vertical slices, fail-fast errors), see [`CODEBASE-GUIDE.md`](./CODEBASE-GUIDE.md). For project-specific Claude Code rules, see [`CLAUDE.md`](./CLAUDE.md).

---

## Using This AI Layer in Your Own Project

The `.claude/` directory is portable. To adopt it:

1. Copy `.claude/` and `.mcp.json` into your repo
2. Run `/create-rules` to generate a `CLAUDE.md` tailored to your stack
3. Update `.mcp.json` with your own MCP servers (Atlassian, Linear, GitHub Issues, Asana — the same `/create-stories` workflow works for any of them)
4. Start with `/prime`, then a brain dump into `/create-prd`, then `/create-stories`, then `/plan`, then `/implement`

Your team's standard for how it builds is now version-controlled and reviewable.

---

## Resources

- [`CODEBASE-GUIDE.md`](./CODEBASE-GUIDE.md) — patterns and principles in depth
- [Dynamous community](https://dynamous.ai) — the Agentic Engineering course goes deeper
