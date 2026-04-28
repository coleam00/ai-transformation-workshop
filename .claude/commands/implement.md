---
description: Execute an implementation plan with validation loops
argument-hint: <path/to/plan.md>
---

# Implement Plan

**Plan**: $ARGUMENTS

## Your Mission

Execute the plan end-to-end with rigorous self-validation.

**Core Philosophy**: Validation loops catch mistakes early. Run checks after every change. Fix issues immediately.

**Golden Rule**: If validation fails, fix it before moving on. Never accumulate broken state.

---

## Phase 1: LOAD

### Read the Plan

Load the plan file and extract:

- **Summary** - What we're building
- **Patterns to Mirror** - Code to copy from
- **Files to Change** - CREATE/UPDATE list
- **Tasks** - Implementation order
- **Validation Commands** - How to verify
- **Jira Issue** - Check the plan's Metadata table for a Jira Issue key (e.g., `RH-5`). If present, this issue will be updated after implementation is complete.

**If plan not found:**
```
Error: Plan not found at $ARGUMENTS
Create a plan first: /plan "feature description"
```

---

## Phase 2: PREPARE

### Git State

```bash
git branch --show-current
git status
```

| State | Action |
|-------|--------|
| On main, clean | Create branch: `git checkout -b feature/{plan-name}` |
| On main, dirty | STOP: "Stash or commit changes first" |
| On feature branch | Use it |

---

## Phase 3: EXECUTE

**For each task in the plan:**

### 3.1 Verify Assumptions

Before writing any code for a task:

- **Read the target file** you're about to create or modify
- **Read adjacent files** — files it imports from, and files that import it
- **Verify the plan's references** — do the functions, interfaces, tables, or endpoints the plan mentions actually exist? Do they match the plan's expectations?
- **If assumptions are wrong**, adapt your approach before implementing. Document what differs from the plan.

### 3.2 Implement

- Read the **MIRROR** file reference and understand the pattern to follow
- Make the change as specified in the plan
- **Check integration**: verify your change connects correctly to adjacent code — do imports resolve? Do callers/callees still work? Does the data flow correctly across boundaries?

### 3.3 Validate Immediately

**After EVERY task:**

```bash
pnpm run build
```

**If it fails:**
1. Read the error
2. Fix the issue
3. Re-run validation
4. Only proceed when passing

### 3.4 Track Progress

```
Task 1: CREATE src/x.ts ✅
Task 2: UPDATE src/y.ts ✅
```

**If you deviate from the plan**, document what changed and why.

---

## Phase 4: VALIDATE

### Run All Checks

```bash
# Type check
pnpm run build

# Lint
pnpm run lint

# Tests
pnpm test
```

**All must pass with zero errors.**

### Write Tests

You MUST write tests for new code:
- Every new function needs at least one test
- Error cases and edge cases need tests
- Update existing tests if behavior changed
- **Test across boundaries** — don't just test functions in isolation. If you added an API endpoint, test that the endpoint returns the correct response shape and data. If you added a service method, test that it integrates correctly with its callers.

**If tests fail:**
1. Determine: bug in implementation or test?
2. Fix the actual issue
3. Re-run until green

### REQUIRED: End-to-End Verification

> **⚠️ Do NOT proceed to Phase 5 (Report) until all E2E steps below pass.**

Re-read the plan and find the end-to-end testing section. Execute every E2E test listed in the plan as a checklist:

- [ ] Start the application (dev servers, databases, etc.)
- [ ] For EACH end-to-end test in the plan:
  - [ ] Execute the test exactly as described
  - [ ] Verify the expected outcome matches the plan
  - [ ] If it fails: fix the issue, re-run, confirm it passes
- [ ] Confirm all E2E tests pass before proceeding

**If the plan has no E2E tests**, perform a basic smoke test: start the app, exercise the new/changed feature manually, verify it works.

**This is a hard gate.** You cannot report the implementation as complete until E2E verification passes. Static checks and unit tests alone are never sufficient.

---

## Phase 5: REPORT

### Create Report

**Output path**: `.agents/reports/{plan-name}-report.md`

```bash
mkdir -p .agents/reports
```

```markdown
# Implementation Report

**Plan**: `{plan-path}`
**Branch**: `{branch-name}`
**Status**: COMPLETE

## Summary

{Brief description of what was implemented}

## Tasks Completed

| # | Task | File | Status |
|---|------|------|--------|
| 1 | {description} | `src/x.ts` | ✅ |
| 2 | {description} | `src/y.ts` | ✅ |

## Validation Results

| Check | Result |
|-------|--------|
| Type check | ✅ |
| Lint | ✅ |
| Tests | ✅ ({N} passed) |

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `src/x.ts` | CREATE | +{N} |
| `src/y.ts` | UPDATE | +{N}/-{M} |

## Deviations from Plan

{List any deviations with rationale, or "None"}

## Tests Written

| Test File | Test Cases |
|-----------|------------|
| `src/x.test.ts` | {list} |
```

### Archive Plan

```bash
mkdir -p .agents/plans/completed
mv $ARGUMENTS .agents/plans/completed/
```

---

## Phase 6: UPDATE JIRA (if issue specified in plan)

**This phase is mandatory if the plan's Metadata table contains a Jira Issue key.** Skip only if the Jira Issue field is "N/A" or absent.

### 6.1 Resolve Cloud ID

Call `mcp__atlassian__getAccessibleAtlassianResources` to get the `cloudId`.

### 6.2 Transition the Issue

1. Call `mcp__atlassian__getTransitionsForJiraIssue` with `cloudId` and `issueIdOrKey` to get available transitions — each transition has a numeric `id` and a `name`
2. Find the most appropriate transition (prefer "In Review" or "In Progress"; fall back to "Done" if no review state exists)
3. Call `mcp__atlassian__transitionJiraIssue` with:
   - `cloudId`: The Cloud ID
   - `issueIdOrKey`: The issue key
   - `transition`: `{ "id": "{transition_id}" }` — use the numeric ID from step 1, NOT the status name

### 6.3 Add Implementation Comment

Call `mcp__atlassian__addCommentToJiraIssue` with:
- `issueIdOrKey`: The Jira issue key from the plan
- `contentFormat`: `"markdown"`
- `commentBody`: A summary including:
  - What was implemented
  - Branch name
  - Files created/updated (count)
  - Tests written (count)
  - Any deviations from the plan
  - Link to the implementation report file path

### 6.4 Update Issue Description (if needed)

If the implementation resulted in meaningful deviations from the original issue description, call `mcp__atlassian__editJiraIssue` with:
- `cloudId`: The Cloud ID
- `issueIdOrKey`: The issue key
- `contentFormat`: `"markdown"`
- `fields`: An object with the fields to update, e.g. `{ "description": "updated description..." }`

---

## Phase 7: OUTPUT

```markdown
## Implementation Complete

**Plan**: `{plan-path}`
**Branch**: `{branch-name}`
**Status**: ✅ Complete

### Validation

| Check | Result |
|-------|--------|
| Type check | ✅ |
| Lint | ✅ |
| Tests | ✅ |

### Files Changed

- {N} files created
- {M} files updated
- {K} tests written

### Deviations

{Summary or "Implementation matched the plan."}

### Artifacts

- Report: `.agents/reports/{name}-report.md`
- Plan archived: `.agents/plans/completed/`

### Jira

{If issue was updated: "Updated {ISSUE_KEY}: transitioned to {status}, added implementation comment." Otherwise: "No Jira issue linked."}

### Next Steps

1. Review the report
2. Create PR: `gh pr create`
3. Merge when approved
```

---

## Handling Failures

| Failure | Action |
|---------|--------|
| Type check fails | Read error, fix issue, re-run |
| Tests fail | Fix implementation or test, re-run |
| Lint fails | Run `pnpm run lint --fix`, then manual fixes |
| Build fails | Check error output, fix and re-run |
