---
description: Learn how to build new API endpoints end-to-end
argument-hint: [jira-issues] [confluence-pages]
---

# Prime Endpoint: How to Build New Endpoints

**Input**: $ARGUMENTS

## Objective

Understand the full endpoint pattern from database to UI so you can build new endpoints correctly.

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

Study these files in order (this is the full data flow for the polls feature):

1. **Models**: `src/features/polls/models.ts` — TypeScript types inferred from schema
2. **Schemas**: `src/features/polls/schemas.ts` — Zod validation for inputs
3. **Repository**: `src/features/polls/repository.ts` — Drizzle queries (no business logic here)
4. **Service**: `src/features/polls/service.ts` — business logic, calls repository, throws typed errors
5. **Errors**: `src/features/polls/errors.ts` — custom error classes with HTTP status codes
6. **Actions**: `src/features/polls/actions.ts` — Server Actions called by Client Components
7. **Components**: `src/features/polls/components/` — forms use `useActionState` to call Server Actions

## Output

Produce a scannable summary of what you learned:

- **Type Flow**: Models inferred from Drizzle schema → used in service → passed to components
- **Validation**: Zod schemas in `schemas.ts` validated in service layer (not middleware)
- **Service Pattern**: Service calls repository, catches DB errors, throws domain errors
- **Server Action Pattern**: Action validates, calls service, catches domain errors, returns state object
- **Component Pattern**: Client Components use `useActionState(action, initialState)` for mutations; Server Components fetch directly from service for reads

Use bullet points. Keep it concise.
