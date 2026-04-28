---
description: Prime agent with codebase understanding
argument-hint: [jira-issues] [confluence-pages]
---

# Prime: Load Project Context

**Input**: $ARGUMENTS

## Objective

Build comprehensive understanding of this codebase by analyzing structure and key files.

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

1. Read `CLAUDE.md` and `CODEBASE-GUIDE.md` for project conventions
2. Study the feature slice (`src/features/polls/`)
3. Study the app routes (`src/app/`)
4. Check recent commits with `git log --oneline -5`

## Output

Produce a scannable summary of what you learned:

- **Project Purpose**: One sentence
- **Tech Stack**
  - Frontend: framework, UI library, state management
  - Backend: framework, database, validation
- **Data Model**: Core entities
- **Key Patterns**: Database, API, state management patterns
- **Current State**: Recent commits, current branch

Use bullet points. Keep it concise.
