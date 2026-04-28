# AI-Optimized Codebase Guide

Welcome! This guide explains the key principles and patterns that make a codebase "AI-optimized" and shows exactly how they're implemented in this Next.js template.

---

## 📚 Table of Contents

1. [What Makes a Codebase AI-Optimized?](#what-makes-a-codebase-ai-optimized)
2. [Core Principles](#core-principles)
3. [The AI Feedback Loop](#the-ai-feedback-loop)
4. [Architecture: Vertical Slice Pattern](#architecture-vertical-slice-pattern)
5. [Type Safety with TypeScript](#type-safety-with-typescript)
6. [Runtime Validation with Zod](#runtime-validation-with-zod)
7. [Structured Logging](#structured-logging)
8. [Database Layer with Drizzle ORM](#database-layer-with-drizzle-orm)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)
11. [Fast Tooling](#fast-tooling)
12. [Putting It All Together](#putting-it-all-together)

---

## What Makes a Codebase AI-Optimized?

An AI-optimized codebase is designed so that AI agents can:

1. **Understand code quickly** through clear patterns and structure
2. **Self-correct errors** by reading machine-readable feedback
3. **Generate valid code** that passes type checks and validation
4. **Work independently** with minimal human intervention
5. **Iterate rapidly** using fast tools and clear error messages

The key insight: **AI reads error messages like documentation.** If your tools produce clear, structured errors with exact locations and fixes, AI can debug itself.

---

## Core Principles

### 1. Machine-Readable Feedback

Every tool in this codebase produces structured output that AI can parse:

- **TypeScript**: `src/file.ts:45:12 - error TS2322: Type 'X' is not assignable to type 'Y'`
- **Biome**: Lint errors with rule names and auto-fix suggestions
- **Bun Test**: `Expected X, received Y` with exact diffs
- **Pino Logs**: Structured JSON with context fields

### 2. One Source of Truth

Don't duplicate information. Types, validation, and database schemas should derive from a single definition:

- Database schema → Types (via Drizzle's `InferSelectModel`)
- Zod schema → Types (via `z.infer<>`)
- Schema changes → Automatic migration generation

### 3. Fail Fast

Errors should surface immediately, not at runtime:

- Missing environment variables → App won't start
- Type mismatches → Won't compile
- Invalid queries → TypeScript error
- Wrong validation schema → Test failure

### 4. Clear Boundaries

Each layer has one responsibility. Dependencies flow in one direction:

```
API Route → Service → Repository → Database
     ↓         ↓          ↓
  Schemas   Logging    Models
```

### 5. Consistent Patterns

Every feature follows the same structure. Learn it once, apply it everywhere:

```
features/{feature}/
├── models.ts       # Data structures
├── schemas.ts      # Validation
├── repository.ts   # Database queries
├── service.ts      # Business logic
├── errors.ts       # Error types
└── tests/          # Tests
```

---

## The AI Feedback Loop

AI development follows a continuous cycle:

```
1. Write Code
   ↓
2. Run Checks (lint, typecheck, test)
   ↓
3. Parse Errors (structured, with locations)
   ↓
4. Fix Issues (automated or guided)
   ↓
5. Repeat until all checks pass
```

### Running the Feedback Loop

After writing or modifying code, always run:

```bash
bun run lint && npx tsc --noEmit
```

This gives you:
- Lint errors with rule names and auto-fix suggestions
- Type errors with exact file:line:column locations
- Suggestions for fixes (e.g., "Did you mean 'toUpperCase'?")

**Why this matters for AI**: These errors are precise enough for AI to parse and fix automatically.

<details>
<summary>Example: Self-Correction in Action</summary>

**1. Introduce a typo:**
```typescript
// src/features/projects/service.ts
const name = input.name.toUppercase(); // Typo: should be toUpperCase()
```

**2. Run checks:**
```bash
npx tsc --noEmit
```

**3. Get precise error:**
```
src/features/projects/service.ts:48:25 - error TS2551:
Property 'toUppercase' does not exist on type 'string'.
Did you mean 'toUpperCase'?
```

**4. AI parses this and fixes:**
- File: `src/features/projects/service.ts`
- Line: `48`, Column: `25`
- Problem: Property doesn't exist
- Suggestion: Use `toUpperCase` instead

**5. Fix and verify:**
```typescript
const name = input.name.toUpperCase(); // Fixed
```
```bash
npx tsc --noEmit
# ✓ All checks pass
```

</details>

---

## Architecture: Vertical Slice Pattern

### What is Vertical Slice Architecture?

Traditional codebases organize by technical layer (all models together, all services together). Vertical Slice Architecture organizes by feature—each feature owns its entire stack in one folder.

**Traditional (Horizontal):**
```
src/
├── models/         ← All models for all features
├── services/       ← All services for all features
├── repositories/   ← All repositories for all features
└── tests/          ← All tests for all features
```

**Vertical Slice:**
```
src/features/
├── projects/       ← Everything for projects
│   ├── models.ts
│   ├── service.ts
│   ├── repository.ts
│   └── tests/
├── auth/           ← Everything for auth
│   └── ...
└── comments/       ← Everything for comments
    └── ...
```

### Why This Matters for AI

**Locality**: To understand "projects", AI reads one folder, not five.

**Independence**: AI can modify `projects/` without affecting `auth/` or `comments/`.

**Pattern Recognition**: AI learns the structure once and applies it to all features.

**Context Efficiency**: AI needs less context to work on a feature.

### Feature Structure in This Codebase

Every feature in `src/features/` follows this structure:

```
{feature}/
├── models.ts          # Data types from database schema
├── schemas.ts         # Zod validation schemas
├── repository.ts      # Database queries (pure data access)
├── service.ts         # Business logic (orchestration)
├── errors.ts          # Custom error classes
├── index.ts           # Public API (controlled exports)
└── tests/             # All tests for this feature
    ├── service.test.ts
    ├── schemas.test.ts
    └── errors.test.ts
```

### Layer Responsibilities

#### models.ts - "What does the data look like?"

Defines TypeScript types from the database schema. No logic, just types.

<details>
<summary>View implementation: src/features/projects/models.ts</summary>

```typescript
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { projects } from "@/core/database/schema";

// Type for reading from database
export type Project = InferSelectModel<typeof projects>;

// Type for inserting into database
export type NewProject = InferInsertModel<typeof projects>;
```

**Key points:**
- Types are inferred from database schema (single source of truth)
- `InferSelectModel` = what you get when you query
- `InferInsertModel` = what you need when you create

</details>

---

#### schemas.ts - "What's valid input/output?"

Defines Zod schemas for validation. Used in API routes to validate requests.

<details>
<summary>View implementation: src/features/projects/schemas.ts</summary>

```typescript
import { z } from "zod/v4";

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

// TypeScript types inferred from schemas
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
```

**Key points:**
- Validation rules defined once
- TypeScript types generated automatically via `z.infer<>`
- Used in API routes: `CreateProjectSchema.parse(body)`
- Errors are structured with field-level details

</details>

---

#### repository.ts - "How do I access data?"

Pure database operations. No business logic, no validation, no logging—just queries.

<details>
<summary>View implementation: src/features/projects/repository.ts</summary>

```typescript
import { eq } from "drizzle-orm";
import { db } from "@/core/database/client";
import { projects } from "@/core/database/schema";
import type { Project, NewProject } from "./models";

export async function findById(id: string): Promise<Project | undefined> {
  const results = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return results[0];
}

export async function create(data: NewProject): Promise<Project> {
  const results = await db.insert(projects).values(data).returning();
  return results[0]!;
}

export async function update(id: string, data: Partial<Project>): Promise<Project | undefined> {
  const results = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
  return results[0];
}

export async function deleteById(id: string): Promise<boolean> {
  const result = await db.delete(projects).where(eq(projects.id, id));
  return result.rowCount > 0;
}
```

**Key points:**
- Type-safe queries (TypeScript validates field names)
- Pure functions (no side effects except database operations)
- Easy to test (can mock for service tests)
- Single responsibility (data access only)

</details>

---

#### service.ts - "What are the business rules?"

Orchestrates repository calls, applies business logic, handles validation and access control, and logs operations.

<details>
<summary>View implementation: src/features/projects/service.ts</summary>

```typescript
import { getLogger } from "@/core/logging";
import { ProjectAccessDeniedError, ProjectNotFoundError } from "./errors";
import type { Project } from "./models";
import * as repository from "./repository";
import type { CreateProjectInput } from "./schemas";

const logger = getLogger("projects.service");

export async function createProject(input: CreateProjectInput, ownerId: string): Promise<Project> {
  logger.info({ ownerId, name: input.name }, "project.create_started");

  // Business logic: Generate unique slug
  const slug = generateSlug(input.name);

  // Data access: Call repository
  const project = await repository.create({
    name: input.name,
    slug,
    description: input.description ?? null,
    isPublic: input.isPublic,
    ownerId,
  });

  logger.info({ projectId: project.id, slug }, "project.create_completed");
  return project;
}

export async function getProject(id: string, userId: string | null): Promise<Project> {
  logger.info({ projectId: id, userId }, "project.get_started");

  const project = await repository.findById(id);
  if (!project) {
    throw new ProjectNotFoundError(id);
  }

  // Business rule: Access control
  if (!project.isPublic && project.ownerId !== userId) {
    throw new ProjectAccessDeniedError(id);
  }

  logger.info({ projectId: id }, "project.get_completed");
  return project;
}

function generateSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
}
```

**Key points:**
- Logs every operation (start, complete, fail)
- Applies business rules (access control, slug generation)
- Calls repository for data access (never touches DB directly)
- Throws domain-specific errors

</details>

---

#### errors.ts - "What can go wrong?"

Custom error classes with HTTP semantics built-in.

<details>
<summary>View implementation: src/features/projects/errors.ts</summary>

```typescript
import type { HttpStatusCode } from "@/core/api/errors";

export class ProjectError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: HttpStatusCode,
  ) {
    super(message);
    this.name = "ProjectError";
  }
}

export class ProjectNotFoundError extends ProjectError {
  constructor(id: string) {
    super(`Project not found: ${id}`, "PROJECT_NOT_FOUND", 404);
  }
}

export class ProjectAccessDeniedError extends ProjectError {
  constructor(id: string) {
    super(`Access denied to project: ${id}`, "PROJECT_ACCESS_DENIED", 403);
  }
}
```

**Key points:**
- Errors know their HTTP status codes
- Machine-readable error codes (`PROJECT_NOT_FOUND`)
- Carries context (the project ID that wasn't found)
- Used by API error handler to generate responses

</details>

---

#### index.ts - "What's public?"

Controls what other code can import from this feature. Enforces boundaries.

<details>
<summary>View implementation: src/features/projects/index.ts</summary>

```typescript
// Types
export type { Project, NewProject } from "./models";

// Schemas
export { CreateProjectSchema, UpdateProjectSchema } from "./schemas";

// Errors
export { ProjectNotFoundError, ProjectAccessDeniedError } from "./errors";

// Service functions (the main API)
export { createProject, getProject, updateProject, deleteProject } from "./service";

// NOTE: repository is NOT exported - it's internal only
```

**Why this matters:**

```typescript
// ✅ Other code can do this:
import { createProject } from "@/features/projects";

// ❌ Other code CANNOT do this:
import { create } from "@/features/projects/repository";
```

This enforces the rule: "Always go through the service layer, never access the repository directly."

</details>

---

#### tests/ - "Does it work?"

All tests for this feature live here. Tests document expected behavior.

<details>
<summary>View implementation: src/features/projects/tests/service.test.ts</summary>

```typescript
import { describe, expect, it, mock } from "bun:test";
import { createProject, getProject } from "../service";
import { ProjectNotFoundError } from "../errors";

// Mock the repository layer
mock.module("../repository", () => ({
  create: mock(() => Promise.resolve({
    id: "123",
    name: "Test Project",
    slug: "test-project",
    ownerId: "user-123",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  findById: mock(() => Promise.resolve(undefined)),
}));

describe("createProject", () => {
  it("should create project and generate slug", async () => {
    const result = await createProject(
      { name: "My Project", isPublic: true },
      "user-123"
    );
    expect(result.id).toBe("123");
  });
});

describe("getProject", () => {
  it("should throw ProjectNotFoundError when not found", async () => {
    await expect(() => getProject("999", null)).toThrow(ProjectNotFoundError);
  });
});
```

**Key points:**
- Mock repository to test service logic in isolation
- Tests document expected behavior
- Fast execution (no real database calls)
- Clear assertions with expected vs actual

</details>

---

### Data Flow Example

Here's how a request flows through a vertical slice:

```
POST /api/projects
   ↓
API Route (src/app/api/projects/route.ts)
├─ Extracts auth from request
├─ Validates body with CreateProjectSchema
├─ Calls service.createProject(input, userId)
   ↓
Service (src/features/projects/service.ts)
├─ Logs "project.create_started"
├─ Applies business logic (generate slug)
├─ Calls repository.create(data)
   ↓
Repository (src/features/projects/repository.ts)
├─ Executes type-safe database query
├─ Returns Project type
   ↓
Service
├─ Logs "project.create_completed"
├─ Returns Project
   ↓
API Route
├─ Returns JSON response with 201 status
```

**Key insight**: Each layer has one job. Clear boundaries make it easy to test, debug, and understand.

---

## Type Safety with TypeScript

### Why Type Safety Matters for AI

TypeScript provides **compile-time verification**. AI can write code and immediately know if it's valid—without running it.

**Without types:**
```typescript
const user = getUser(id);
const name = user.fullName; // Runtime error: property doesn't exist
```

AI has to run the code to discover the error.

**With types:**
```typescript
const user = getUser(id); // user: User
const name = user.fullName; // TypeScript error: Property 'fullName' does not exist on type 'User'
//            ^^^^^^^^ Instant feedback
```

AI gets instant feedback before execution.

### Strict Mode in This Codebase

<details>
<summary>View configuration: tsconfig.json</summary>

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**What these do:**

- `strict: true` - Enables all strict type checking
- `noUncheckedIndexedAccess: true` - Array access returns `T | undefined` (forces null checks)
- `exactOptionalPropertyTypes: true` - Stricter handling of optional properties
- `verbatimModuleSyntax: true` - Requires explicit `type` imports for types
- `noUnusedLocals: true` - Error on unused variables
- `noUnusedParameters: true` - Error on unused function parameters

</details>

### Type Inference from Database Schema

Types are derived from the database schema—one source of truth.

<details>
<summary>Example: Database Schema → TypeScript Types</summary>

**Database schema** (src/core/database/schema.ts):
```typescript
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  isPublic: boolean("is_public").default(false).notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  ...timestamps,
});
```

**Inferred types** (src/features/projects/models.ts):
```typescript
export type Project = InferSelectModel<typeof projects>;
// Becomes:
// {
//   id: string;
//   name: string;
//   slug: string;
//   description: string | null;
//   isPublic: boolean;
//   ownerId: string;
//   createdAt: Date;
//   updatedAt: Date;
// }
```

**Benefits:**
- Change schema → types update automatically
- Can't query a field that doesn't exist
- TypeScript enforces null checks where needed

</details>

### Type-Safe Queries

Drizzle ORM provides full TypeScript support for queries.

<details>
<summary>Example: Type-Safe Database Queries</summary>

```typescript
import { eq } from "drizzle-orm";
import { db } from "@/core/database/client";
import { projects } from "@/core/database/schema";

// ✅ Valid - TypeScript knows 'id' exists
const results = await db.select().from(projects).where(eq(projects.id, "123"));

// ❌ TypeScript error - 'idd' doesn't exist
const results = await db.select().from(projects).where(eq(projects.idd, "123"));
//                                                           ^^^^
// Property 'idd' does not exist on type '...'
```

**AI benefit**: Can't write invalid queries. If it compiles, the query is structurally correct.

</details>

---

## Runtime Validation with Zod

### Why Runtime Validation Matters

TypeScript provides **compile-time** safety. Zod provides **runtime** safety for external data (API requests, user input, environment variables).

**The problem:**
```typescript
// TypeScript can't validate external data
const data = await request.json(); // Type: any
const project = createProject(data); // What if data is malformed?
```

**The solution:**
```typescript
// Zod validates at runtime
const data = await request.json();
const validated = CreateProjectSchema.parse(data); // Throws if invalid
const project = createProject(validated); // Type-safe and runtime-safe
```

### Schemas in This Codebase

Zod schemas define what's allowed into the system.

<details>
<summary>Example: Input Validation with Zod</summary>

**Schema definition** (src/features/projects/schemas.ts):
```typescript
import { z } from "zod/v4";

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
```

**Usage in API route** (src/app/api/projects/route.ts):
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate with Zod
  const input = CreateProjectSchema.parse(body);
  // ↑ Throws ZodError if validation fails

  // Now input is type-safe and validated
  const project = await service.createProject(input, userId);

  return NextResponse.json(project, { status: 201 });
}
```

**Error example:**
```typescript
// Bad request:
{ name: "", description: "x".repeat(600) }

// Zod error (structured):
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": ["String must contain at least 1 character(s)"],
    "description": ["String must contain at most 500 character(s)"]
  }
}
```

</details>

### Environment Validation

Environment variables are validated at startup—app won't start if config is invalid.

<details>
<summary>View implementation: src/core/config/env.ts</summary>

```typescript
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

// Validated at startup
export const env = {
  nodeEnv: getOptionalEnv("NODE_ENV", "development"),
  logLevel: getOptionalEnv("LOG_LEVEL", "info"),
  appName: getOptionalEnv("APP_NAME", "ai-opti-nextjs-starter"),

  // These MUST be present or app crashes
  supabaseUrl: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  databaseUrl: getRequiredEnv("DATABASE_URL"),
};
```

**Why this matters:**
- Fail fast (errors at startup, not runtime)
- Clear error messages ("Missing X")
- Single source of truth for config

</details>

### Type Inference from Schemas

Zod schemas automatically generate TypeScript types.

<details>
<summary>Example: Schema → Type Inference</summary>

```typescript
// Define schema once
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
});

// Type is inferred automatically
type User = z.infer<typeof UserSchema>;
// Becomes:
// {
//   id: string;
//   email: string;
//   name: string;
//   age?: number;
// }
```

**Benefits:**
- Single source of truth (schema defines both validation and types)
- Can't have mismatched types and validation
- AI writes schema once, gets types free

</details>

---

## Structured Logging

### Why Structured Logging Matters for AI

Traditional logs are unstructured strings:
```
Creating project for user
Project created successfully
Error: Something went wrong
```

AI can't parse these. **Which** project? **Which** user? What failed?

Structured logs are machine-readable JSON:
```json
{"component":"projects.service","userId":"123","name":"My Project","msg":"project.create_started"}
{"component":"projects.service","projectId":"abc","slug":"my-project","msg":"project.create_completed"}
{"component":"projects.service","projectId":"abc","error":"Invalid slug","msg":"project.create_failed"}
```

AI can parse, filter, and trace operations.

### Logging Pattern in This Codebase

We use **Pino** for structured JSON logging with a consistent pattern: `domain.component.action_state`.

<details>
<summary>View implementation: src/core/logging/</summary>

**Base logger** (src/core/logging/logger.ts):
```typescript
import pino from "pino";

export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  base: {
    service: process.env["APP_NAME"] ?? "ai-opti-nextjs-starter",
    environment: process.env["NODE_ENV"] ?? "development",
  },
  // Pretty output in dev, JSON in production
  transport: isDevelopment ? { target: "pino-pretty" } : undefined,
});
```

**Logger factory** (src/core/logging/index.ts):
```typescript
import { logger } from "./logger";
import { getRequestContext } from "./context";

export function getLogger(component: string) {
  const context = getRequestContext();

  return logger.child({
    component,
    requestId: context?.requestId,
    userId: context?.userId,
    correlationId: context?.correlationId,
  });
}
```

**Usage in service** (src/features/projects/service.ts):
```typescript
const logger = getLogger("projects.service");

export async function createProject(input: CreateProjectInput, ownerId: string) {
  logger.info({ ownerId, name: input.name }, "project.create_started");

  try {
    const project = await repository.create(data);
    logger.info({ projectId: project.id, slug }, "project.create_completed");
    return project;
  } catch (error) {
    logger.error({ error }, "project.create_failed");
    throw error;
  }
}
```

</details>

### Action State Pattern

Every operation logs three states: `_started`, `_completed`, `_failed`.

<details>
<summary>Example: Action State Logging</summary>

```typescript
const logger = getLogger("projects.service");

export async function updateProject(id: string, input: UpdateProjectInput, userId: string) {
  // Always log start
  logger.info({ projectId: id, userId }, "project.update_started");

  try {
    const project = await repository.findById(id);
    if (!project) {
      // Log specific failure
      logger.warn({ projectId: id }, "project.update_failed_not_found");
      throw new ProjectNotFoundError(id);
    }

    if (project.ownerId !== userId) {
      // Log specific failure
      logger.warn({ projectId: id, userId }, "project.update_failed_access_denied");
      throw new ProjectAccessDeniedError(id);
    }

    const updated = await repository.update(id, input);

    // Log success
    logger.info({ projectId: id }, "project.update_completed");
    return updated;
  } catch (error) {
    // Log generic failure
    logger.error({ projectId: id, error }, "project.update_failed");
    throw error;
  }
}
```

**Why this pattern:**
- Grep-able: `grep "update_started" logs.json`
- Traceable: Follow one operation from start to end
- Machine-readable: AI can parse and analyze

</details>

### Request Context

Logs automatically include request ID, user ID, and correlation ID using `AsyncLocalStorage`.

<details>
<summary>View implementation: src/core/logging/context.ts</summary>

```typescript
import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string;
  userId?: string;
  correlationId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

export function withRequestContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}
```

**Usage:**
```typescript
// In middleware/proxy
const requestId = generateRequestId();
await withRequestContext({ requestId, userId }, async () => {
  // All logs in this async context automatically include requestId
  await handleRequest();
});
```

**Log output:**
```json
{
  "component": "projects.service",
  "requestId": "abc-123-def",
  "userId": "user-456",
  "msg": "project.create_started"
}
```

</details>

---

## Database Layer with Drizzle ORM

### Why Type-Safe ORMs Matter for AI

Traditional ORMs use strings for queries:
```javascript
// Can write invalid queries
db.query("SELECT * FROM projectss WHERE idd = ?", [id]); // Typos!
```

Type-safe ORMs use TypeScript:
```typescript
// Can't write invalid queries
db.select().from(projects).where(eq(projects.id, id)); // TypeScript validates!
```

If it compiles, the query structure is valid.

### Drizzle in This Codebase

Drizzle is a TypeScript-native ORM with full type inference.

<details>
<summary>View configuration: drizzle.config.ts</summary>

```typescript
import { defineConfig } from "drizzle-kit";
import { env } from "./src/core/config/env";

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./src/core/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.databaseUrl,
  },
});
```

</details>

### Schema Definition

Database tables are defined in TypeScript with full type information.

<details>
<summary>View implementation: src/core/database/schema.ts</summary>

```typescript
import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  ...timestamps,
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  isPublic: boolean("is_public").default(false).notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});
```

**Key features:**
- Type-safe: Field names and types are enforced
- Relationships: Foreign keys with referential actions
- Defaults: Values automatically set by database
- Validation: Length constraints, required fields

</details>

### Type-Safe Queries

Queries are fully typed—autocomplete works, typos are caught.

<details>
<summary>Example: Type-Safe Query Operations</summary>

```typescript
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/core/database/client";
import { projects } from "@/core/database/schema";

// SELECT with type safety
const allProjects = await db.select().from(projects);
// Type: Project[]

// WHERE with autocomplete
const project = await db
  .select()
  .from(projects)
  .where(eq(projects.id, "123"))
  .limit(1);
// projects.id autocompletes
// projects.idd would be a TypeScript error

// Complex WHERE
const userPublicProjects = await db
  .select()
  .from(projects)
  .where(
    and(
      eq(projects.ownerId, userId),
      eq(projects.isPublic, true)
    )
  )
  .orderBy(desc(projects.createdAt));

// INSERT with type checking
const newProject = await db
  .insert(projects)
  .values({
    name: "My Project",
    slug: "my-project",
    ownerId: userId,
    // TypeScript ensures all required fields are present
  })
  .returning();

// UPDATE with type safety
const updated = await db
  .update(projects)
  .set({ name: "New Name" })
  .where(eq(projects.id, projectId))
  .returning();

// DELETE
await db
  .delete(projects)
  .where(eq(projects.id, projectId));
```

**AI benefit:** Can't write queries with wrong field names, wrong types, or missing required fields.

</details>

### Migrations

Drizzle Kit auto-generates SQL migrations from schema changes.

<details>
<summary>Migration workflow</summary>

**1. Update schema:**
```typescript
// Add a new field to projects
export const projects = pgTable("projects", {
  // ... existing fields
  priority: integer("priority").default(0).notNull(),
});
```

**2. Generate migration:**
```bash
bun run db:generate
```

Drizzle Kit creates:
```sql
-- drizzle/migrations/0002_add_priority.sql
ALTER TABLE "projects" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;
```

**3. Apply migration:**
```bash
bun run db:migrate
```

**4. Types update automatically:**
```typescript
type Project = InferSelectModel<typeof projects>;
// Now includes priority: number
```

**Benefits:**
- Schema is source of truth
- Migrations generated automatically
- Type changes propagate everywhere
- Can't forget to update types

</details>

---

## Error Handling

### Why Structured Errors Matter for AI

Generic errors are hard to debug:
```typescript
throw new Error("Something went wrong");
```

Structured errors carry context and know how to be handled:
```typescript
throw new ProjectNotFoundError(projectId);
// Knows: HTTP status 404, error code "PROJECT_NOT_FOUND", which project
```

### Error Architecture

Three layers work together:

1. **Feature errors** - Domain-specific errors with HTTP semantics
2. **API error handler** - Converts any error to consistent JSON response
3. **Error response schema** - Standard error format

<details>
<summary>Layer 1: Feature Errors (src/features/projects/errors.ts)</summary>

```typescript
import type { HttpStatusCode } from "@/core/api/errors";

export class ProjectError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: HttpStatusCode,
  ) {
    super(message);
    this.name = "ProjectError";
  }
}

export class ProjectNotFoundError extends ProjectError {
  constructor(id: string) {
    super(`Project not found: ${id}`, "PROJECT_NOT_FOUND", 404);
  }
}

export class ProjectAccessDeniedError extends ProjectError {
  constructor(id: string) {
    super(`Access denied to project: ${id}`, "PROJECT_ACCESS_DENIED", 403);
  }
}

export class ProjectSlugExistsError extends ProjectError {
  constructor(slug: string) {
    super(`Slug already exists: ${slug}`, "PROJECT_SLUG_EXISTS", 409);
  }
}
```

**Key features:**
- HTTP status code built-in
- Machine-readable error code
- Context in message
- Type-safe

</details>

<details>
<summary>Layer 2: API Error Handler (src/core/api/errors.ts)</summary>

```typescript
import { NextResponse } from "next/server";
import { ZodError } from "zod/v4";

export function handleApiError(error: unknown): NextResponse {
  // Zod validation errors → 400
  if (error instanceof ZodError) {
    const details = error.errors.reduce((acc, err) => {
      const path = err.path.join(".");
      acc[path] = acc[path] || [];
      acc[path].push(err.message);
      return acc;
    }, {} as Record<string, string[]>);

    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
      },
      { status: 400 }
    );
  }

  // Custom errors with statusCode → use their status
  if (error && typeof error === "object" && "statusCode" in error) {
    return NextResponse.json(
      {
        error: error.message || "An error occurred",
        code: error.code || "UNKNOWN_ERROR",
      },
      { status: error.statusCode as number }
    );
  }

  // Unknown errors → 500
  return NextResponse.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}
```

**Usage in API routes:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const project = await service.getProject(id, userId);
    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error); // Consistent error responses
  }
}
```

</details>

<details>
<summary>Layer 3: Error Response Schema (src/shared/schemas/errors.ts)</summary>

```typescript
import { z } from "zod/v4";

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export function createErrorResponse(
  error: string,
  code: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return { error, code, details };
}
```

**Standard error format:**
```json
{
  "error": "Project not found: abc-123",
  "code": "PROJECT_NOT_FOUND",
  "details": null
}
```

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": ["String must contain at least 1 character"],
    "email": ["Invalid email address"]
  }
}
```

</details>

---

## Testing Strategy

### Why Testing Matters for AI

Tests are **executable specifications**. They define what "correct" means.

When tests fail, AI gets:
- What was expected
- What actually happened
- Exact location of failure

This is precise enough for AI to fix automatically.

### Testing Stack

- **Bun test** - 10x faster than Jest
- **Happy DOM** - Lightweight DOM implementation
- **React Testing Library** - Component testing
- **80% coverage** - Required threshold

<details>
<summary>View configuration: bunfig.toml</summary>

```toml
[test]
preload = ["./happydom.ts", "./testing-library.ts"]
coverage = true

[test.coverageThreshold]
line = 80
function = 80
```

</details>

### Test Organization

Tests live with the code they test:

```
src/features/projects/
├── models.ts
├── schemas.ts
├── repository.ts
├── service.ts
├── errors.ts
└── tests/
    ├── service.test.ts     # Business logic tests
    ├── schemas.test.ts     # Validation tests
    └── errors.test.ts      # Error behavior tests
```

### Testing Patterns

<details>
<summary>Example: Testing Schemas (Validation Logic)</summary>

```typescript
// src/features/projects/tests/schemas.test.ts
import { describe, expect, it } from "bun:test";
import { CreateProjectSchema } from "../schemas";

describe("CreateProjectSchema", () => {
  it("should accept valid project data", () => {
    const valid = {
      name: "My Project",
      description: "A test project",
      isPublic: true,
    };

    const result = CreateProjectSchema.parse(valid);
    expect(result).toEqual(valid);
  });

  it("should reject empty name", () => {
    const invalid = { name: "" };

    expect(() => CreateProjectSchema.parse(invalid)).toThrow();
  });

  it("should reject name longer than 100 chars", () => {
    const invalid = { name: "x".repeat(101) };

    expect(() => CreateProjectSchema.parse(invalid)).toThrow();
  });

  it("should use default for isPublic", () => {
    const input = { name: "Test" };

    const result = CreateProjectSchema.parse(input);
    expect(result.isPublic).toBe(false);
  });
});
```

</details>

<details>
<summary>Example: Testing Service (Business Logic)</summary>

```typescript
// src/features/projects/tests/service.test.ts
import { describe, expect, it, mock } from "bun:test";
import { createProject, getProject } from "../service";
import { ProjectNotFoundError } from "../errors";

// Mock the repository layer
mock.module("../repository", () => ({
  create: mock((data) => Promise.resolve({
    id: "test-id",
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  findById: mock(() => Promise.resolve(undefined)),
}));

describe("createProject", () => {
  it("should create project with generated slug", async () => {
    const result = await createProject(
      { name: "My Project", isPublic: true },
      "user-123"
    );

    expect(result.name).toBe("My Project");
    expect(result.slug).toBe("my-project");
    expect(result.ownerId).toBe("user-123");
  });

  it("should handle special characters in name", async () => {
    const result = await createProject(
      { name: "My Project!!!" },
      "user-123"
    );

    expect(result.slug).toBe("my-project");
  });
});

describe("getProject", () => {
  it("should throw ProjectNotFoundError when project doesn't exist", async () => {
    await expect(() => getProject("999", null)).toThrow(ProjectNotFoundError);
  });
});
```

**Key points:**
- Mock repository to isolate business logic
- Test happy paths and error cases
- Clear, descriptive test names
- Fast execution (no database)

</details>

<details>
<summary>Example: Testing API Routes</summary>

```typescript
// src/app/api/projects/route.test.ts
import { describe, expect, it } from "bun:test";
import { POST } from "./route";

describe("POST /api/projects", () => {
  it("should create project with valid data", async () => {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Project",
        description: "A test",
        isPublic: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe("Test Project");
  });

  it("should return 400 for invalid data", async () => {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });
});
```

</details>

### Running Tests

```bash
# Run all tests
bun test

# Watch mode (re-run on file changes)
bun test --watch

# Coverage report
bun test --coverage
```

**Test output example:**
```
✓ CreateProjectSchema > should accept valid project data
✓ CreateProjectSchema > should reject empty name
✓ createProject > should create project with generated slug
✗ createProject > should handle special characters

Expected: "my-project"
Received: "my_project"
  at line 45 in service.test.ts
```

**AI benefit:** Exact expected vs received, with file location. AI can parse and fix.

---

## Fast Tooling

### Why Speed Matters for AI

AI iterates rapidly. Slow tools = slow AI.

**Traditional stack:**
- npm install: 30+ seconds
- Jest tests: 5-10 seconds
- ESLint + Prettier: 3-5 seconds

**This stack:**
- bun install: 2 seconds
- bun test: 0.5 seconds
- Biome: 0.3 seconds

**10-25x faster feedback loop.**

### Bun: Runtime + Package Manager + Test Runner

Bun replaces Node.js, npm, and Jest with one fast tool.

<details>
<summary>Why Bun is faster</summary>

**Package installation:**
- npm uses JavaScript
- Bun uses Zig (native code)
- Result: 10x faster installs

**Test execution:**
- Jest uses Node.js + Babel + tons of transforms
- Bun has native TypeScript support
- Result: 10x faster tests

**Module resolution:**
- Node.js resolves modules at runtime
- Bun caches aggressively
- Result: Faster startup

</details>

<details>
<summary>Commands in this codebase</summary>

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Type check
npx tsc --noEmit

# Lint + format
bun run lint
bun run lint:fix

# Tests
bun test
bun test --watch

# Build
bun run build

# Database
bun run db:generate  # Generate migrations
bun run db:migrate   # Apply migrations
bun run db:push      # Push schema directly (dev only)
bun run db:studio    # Visual database browser
```

</details>

### Biome: Fast Linter + Formatter

Biome replaces ESLint + Prettier with one tool written in Rust.

<details>
<summary>Why Biome is faster</summary>

**Architecture:**
- ESLint: JavaScript, many plugins, slow
- Biome: Rust, single binary, fast
- Result: 10-25x faster

**Features:**
- Linting: Catches errors, enforces rules
- Formatting: Consistent code style
- Auto-fix: Fixes most issues automatically

</details>

<details>
<summary>Configuration: biome.json</summary>

```json
{
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "rules": {
      "suspicious": {
        "noUnusedVariables": "error",
        "noDebugger": "error"
      },
      "style": {
        "useConst": "error",
        "noDefaultExport": "warn"
      },
      "correctness": {
        "useExportType": "error",
        "useImportType": "error"
      }
    }
  }
}
```

**Key rules:**
- `noUnusedVariables` - Error on unused code
- `useConst` - Prefer `const` over `let`
- `useExportType` - Explicit `type` keyword for type exports
- `noDefaultExport` - Named exports only (except Next.js special files)

</details>

---

## Putting It All Together

### The Complete AI Development Workflow

Here's how all these pieces work together:

#### 1. Initial Setup

```bash
# Clone template
git clone <repo>
cd nextjs-ai-optimized-codebase

# Install dependencies (2 seconds)
bun install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Push database schema
bun run db:push
```

#### 2. Create a New Feature

```bash
# Copy the pattern
cp -r src/features/projects src/features/teams

# Update schema
# Edit src/core/database/schema.ts
# Add teams table

# Generate types
bun run db:generate
bun run db:migrate
```

#### 3. Implement Feature

```
Edit files in order:
1. models.ts      - Define types from schema
2. schemas.ts     - Define validation rules
3. errors.ts      - Define error cases
4. repository.ts  - Write database queries
5. service.ts     - Write business logic
6. index.ts       - Export public API
```

#### 4. Run Feedback Loop

```bash
# After each change, run:
bun run lint && npx tsc --noEmit

# Fix any errors reported
# Repeat until all checks pass
```

#### 5. Write Tests

```bash
# Create tests
touch src/features/teams/tests/service.test.ts
touch src/features/teams/tests/schemas.test.ts

# Run tests
bun test --watch

# Fix failing tests
# Repeat until all pass
```

#### 6. Create API Route

```
Create: src/app/api/teams/route.ts

1. Import service functions
2. Validate input with schemas
3. Call service functions
4. Handle errors with handleApiError
5. Return JSON responses
```

#### 7. Verify Everything

```bash
# Run all checks
bun run lint && npx tsc --noEmit && bun test

# If all pass:
git add .
git commit -m "Add teams feature"
```

### Example: Adding a "Priority" Field

Let's walk through adding a priority field to projects:

<details>
<summary>Step-by-step example</summary>

**1. Update database schema:**
```typescript
// src/core/database/schema.ts
export const projects = pgTable("projects", {
  // ... existing fields
  priority: integer("priority").default(0).notNull(),
});
```

**2. Generate migration:**
```bash
bun run db:generate
# Creates: drizzle/migrations/0003_add_priority.sql
bun run db:migrate
```

**3. Types update automatically:**
```typescript
// src/features/projects/models.ts
// Project type now includes priority: number
```

**4. Update validation schema:**
```typescript
// src/features/projects/schemas.ts
export const CreateProjectSchema = z.object({
  // ... existing fields
  priority: z.number().int().min(0).max(10).default(0),
});

export const UpdateProjectSchema = z.object({
  // ... existing fields
  priority: z.number().int().min(0).max(10).optional(),
});
```

**5. Repository is already generic - no changes needed**

**6. Service is already generic - no changes needed**

**7. Run checks:**
```bash
bun run lint && npx tsc --noEmit
# ✓ All checks pass
```

**8. Update tests:**
```typescript
// src/features/projects/tests/schemas.test.ts
it("should accept priority between 0 and 10", () => {
  const valid = { name: "Test", priority: 5 };
  const result = CreateProjectSchema.parse(valid);
  expect(result.priority).toBe(5);
});

it("should reject priority > 10", () => {
  const invalid = { name: "Test", priority: 11 };
  expect(() => CreateProjectSchema.parse(invalid)).toThrow();
});
```

**9. Run tests:**
```bash
bun test
# ✓ All tests pass
```

**Done!** Priority field added with:
- Type safety (TypeScript knows about it)
- Runtime validation (Zod enforces 0-10 range)
- Database constraint (default value)
- Tested (new tests verify behavior)

</details>

---

## Key Takeaways

### For AI Development

1. **Machine-readable errors** - Tools produce structured output AI can parse
2. **Type safety** - Catch bugs at compile-time, not runtime
3. **Single source of truth** - Types derive from schemas and database
4. **Fast feedback** - 10-25x faster tools = faster iteration
5. **Clear patterns** - Consistent structure across all features
6. **Vertical slices** - Features are independent and self-contained

### For Human Developers

1. **Less cognitive load** - One feature, one folder
2. **Faster onboarding** - Learn pattern once, apply everywhere
3. **Safer refactoring** - Types catch breaking changes
4. **Better debugging** - Structured logs with context
5. **Confidence** - Tests define "correct", types prevent errors

### For Your Codebase

1. **Maintainable** - Clear boundaries, consistent patterns
2. **Scalable** - Add features without touching existing code
3. **Debuggable** - Structured logs, clear error messages
4. **Testable** - Isolated layers, easy mocking
5. **AI-friendly** - Everything optimized for AI collaboration

---

## Next Steps

### Explore the Codebase

1. Open `src/features/projects/` - Study the vertical slice pattern
2. Run `bun run dev` - See the app in action
3. Make a change - Experience the feedback loop
4. Run `bun test` - See how tests work
5. Check logs - See structured logging in action

### Try These Exercises

1. **Add a new field** - Add `tags` array to projects
2. **Create a new feature** - Copy `projects/` to `tasks/`
3. **Break something** - Introduce a type error, see the feedback
4. **Write a test** - Add test coverage for edge cases
5. **Check the logs** - Use `grep` to trace a request

### Resources

- [CLAUDE.md](./CLAUDE.md) - Instructions for AI agents
- [README.md](./README.md) - Quick start guide

---

**Welcome to AI-optimized development!** 🚀
