---
description: Prime agent with server/backend codebase understanding
argument-hint: [jira-issues] [confluence-pages]
---

# Prime Server: Load Backend Context

**Input**: $ARGUMENTS

## Objective

Build comprehensive understanding of the server codebase by analyzing structure and key files.

## Process

### Step 0: Load External Context (if provided)

The first argument is an optional Jira issue key or comma-separated list of keys (e.g., `RH-5` or `RH-5,RH-6,RH-7`). The second argument is an optional Confluence page ID or comma-separated list of IDs (e.g., `123456` or `123456,789012`).

If Jira issues are provided:
1. Call `mcp__atlassian__getAccessibleAtlassianResources` to get the `cloudId`
2. For each issue key, call `mcp__atlassian__getJiraIssue` with `responseContentFormat: "markdown"` to fetch the issue summary, description, acceptance criteria, and any other relevant context
3. Use this context to inform your understanding of what work is expected

If Confluence page IDs are provided:
1. Call `mcp__atlassian__getAccessibleAtlassianResources` to get the `cloudId` (skip if already retrieved above)
2. For each page ID, call `mcp__atlassian__getConfluencePage` with `contentFormat: "markdown"` to fetch the page content
3. Use this context as additional background for understanding the project

### Step 1: Analyze the Codebase

1. Study the vertical feature slice (`src/features/polls/`) — models, schemas, repository, service, actions
2. Study the database setup (`src/core/database/`) — schema, client, migrations
3. Study the shared utilities (`src/shared/`)
4. Check `package.json` for backend dependencies (Drizzle, better-sqlite3, Zod, Pino)

## Output

Produce a scannable summary of what you learned:

- **Purpose**: What the data layer does
- **Tech Stack**: Next.js Server Actions, Drizzle ORM, SQLite (better-sqlite3), Zod, Pino
- **Data Model**: Core tables (polls, poll_options, votes) and their relationships
- **Patterns**: Vertical slice (models → schemas → repository → service → actions), error classes with HTTP status codes
- **Server Actions**: How mutations flow from UI → action → service → repository

Use bullet points. Keep it concise.
