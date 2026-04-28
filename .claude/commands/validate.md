---
description: Run linter, type checker, and tests - report any failures
---

# Validate

Run all validation checks and report results.

---

## Checks to Run

All commands run from the project root (single package.json, Bun monolith):

```bash
# Lint (Biome)
bun run lint

# Type check
bunx tsc --noEmit

# Tests with coverage
bun test
```

---

## Process

1. Run lint, capture output
2. Run type check, capture output
3. Run tests, capture output
4. Collect all failures
5. Report results

---

## Output

Report in this format:

```
## Validation Results

| Check | Result | Details |
|-------|--------|---------|
| Lint | ✅/❌ | {N errors or "passed"} |
| Type check | ✅/❌ | {N errors or "passed"} |
| Tests | ✅/❌ | {N passed, M failed} |

### Summary
- **Status**: ✅ ALL PASSING / ❌ {N} FAILURES
- **Action needed**: {None / list of things to fix}
```

---

## If Failures Found

List each failure with:
1. File and line number
2. Error message
3. Suggested fix (if obvious)

Example:
```
### Failures

1. **src/features/polls/service.ts:42**
   - Error: `Type 'string' is not assignable to type 'number'`
   - Fix: Check the type annotation or value

2. **src/features/polls/components/vote-form.tsx:15**
   - Error: `'x' is defined but never used`
   - Fix: Remove unused variable or prefix with `_`
```
