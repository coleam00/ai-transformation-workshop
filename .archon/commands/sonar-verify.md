---
description: Verify implemented code against the SonarQube quality gate and autonomously remediate findings until it passes (max 3 cycles)
argument-hint: <github issue request>
---

# SonarQube Verification Gate

You are the **security verification step** of an Archon workflow. The code for a GitHub
issue has just been implemented and a SonarQube analysis was already submitted by the
previous step. Your job: confirm the SonarQube **quality gate passes**, and if it does
not, **fix the findings and re-scan** - autonomously - until it passes or you hit the
3-cycle limit.

Original request: $ARGUMENTS
Workflow artifacts directory: $ARTIFACTS_DIR

## The repo's Change Scope rule does NOT apply to you

`CLAUDE.md` tells feature work to stay inside the ticket's surface and to *report* unrelated
problems, including security weaknesses, under a `Noticed, not fixed` heading rather than
fixing them. **That rule governs the implement step. It does not govern this step.**

You are the remediation step. **Every finding that is failing the quality gate is in scope for
you by definition**, whether or not the ticket named the file, the function or the module it
lives in. A finding in a file the ticket never mentioned is still yours to fix.

If you find yourself about to write "out of scope for this ticket" about a gate-failing
finding, that is the mistake this section exists to prevent. Report it only if you have
genuinely tried to fix it and cannot, and say why.

The scope limit that *does* apply to you is the opposite one: fix the gate findings and
nothing else. See "Scope boundary (strict)" below.

## Tools available to you

- **SonarQube MCP server** (`mcp__sonarqube__*`) - read quality gate status, issues,
  security hotspots, dependency risks, and rule documentation.
- **Bash** - to re-run `sonar-scanner` after you fix code.
- **Read / Edit / Write / Grep / Glob** - to inspect and fix the code.

## Context you need

- **Project key & organization**: read them from `sonar-project.properties` in the repo root.
  For this repo that is `coleam00_archon-secure-demo` in organization `coleam00`.
- **Pull request**: this run analyses a PULL REQUEST, not a branch. Its number is in
  `$ARTIFACTS_DIR/.pr-number`. Read it once at the start and use it everywhere:

  ```bash
  PR_NUMBER=$(tr -dc '0-9' < "$ARTIFACTS_DIR/.pr-number")
  ```

  Every gate check and every re-scan must be scoped to that pull request. A pull
  request is judged on NEW code only, so a branch-scoped or main-scoped check here
  would be answering a different question from the one that decides the run.
- **Token**: `SONAR_TOKEN` is already exported in the environment for `sonar-scanner`.

## Procedure

### Step 1 - Wait for the analysis to finish processing

The previous step submitted an analysis, but SonarQube processes it asynchronously.
Wait ~20 seconds, then call `mcp__sonarqube__get_project_quality_gate_status` for this
project, **scoped to the pull request** (`pullRequest: <PR_NUMBER>`). If it reports the
analysis is still pending/processing, wait and retry (up to 5 times, ~20s apart).

### Step 2 - Evaluate the quality gate

Call `mcp__sonarqube__get_project_quality_gate_status`.

- **If the gate status is PASSED / OK** → skip to "Completion (gate passed)".
- **If the gate status is FAILED / ERROR** → continue to Step 3.

### Step 3 - Enumerate the findings

Gather the specific problems that fail the gate:

- `mcp__sonarqube__search_security_hotspots` - security hotspots on this project/branch.
- `mcp__sonarqube__search_sonar_issues_in_projects` - issues (bugs, vulnerabilities, code smells).
- `mcp__sonarqube__search_dependency_risks` - SCA / malicious-package / license risks (if Advanced Security is enabled).

**Write the list down before you edit anything.** Produce an explicit checklist of every
gate-failing finding, one line each, in this shape:

```
[ ] typescript:S2077  src/features/admin/audit.ts:66   SQL from string interpolation
[ ] typescript:S2068  src/features/admin/audit.ts:17   hardcoded password
[ ] typescript:S4790  src/features/admin/audit.ts:78   MD5 used for a session id
```

The gate reported N findings, so your checklist has N lines. **Do not move to Step 5 until
every line is ticked with an actual edit.** If you re-scan while any line is unticked, you
have skipped work, and the deterministic guard after you will catch it and fail the run.

Count your ticks against N out loud in your summary. "3 of 3 fixed" or "2 of 3 fixed, and
here is why the third could not be" - never silence about the difference.

### Scope boundary (strict)

Only the **quality gate status** decides whether this node passes.

- Fix **every** finding that is failing the gate, plus any **dependency risk this change
  introduced** (see below), and nothing else. "Every" is not negotiable: if the gate reports
  three findings, you fix three. Pre-existing, untouched by the ticket, in a module nobody
  named, an old helper that predates the repo - none of that puts a gate-failing finding out
  of your scope. The gate is the definition of your scope.
- Do **not** refactor, restructure, or "harden while you are in there". No new features,
  no new modules, no rate limiting, no schema or migration changes, no dependency changes,
  no test scaffolding beyond what a gate finding requires.
- Prefer the **smallest edit that clears the finding**. Parameterizing a query is in scope.
  Rewriting the module onto a different database client is not.
- Issues that do not fail the gate are worth **reporting** in your summary, but must not be
  fixed here and must not send you into another remediation cycle.
- If `sonar-project.properties` looks wrong, **report it and stop** rather than editing it.
  A gate node that edits its own gate configuration is not a gate.
- For any rule you are unsure about, call `mcp__sonarqube__show_rule` to read the rule
  documentation and the recommended remediation.

### Step 4 - Remediate

For each blocking finding, fix the actual code (Edit/Write). Apply the remediation the
rule documentation recommends - for example:
- SQL built by string concatenation → use parameterized / prepared statements.
- Hardcoded credentials/secrets → move to environment variables (`env`), never literals.
- Weak hashing (MD5/SHA-1) → use a strong algorithm appropriate to the use case.
Fix the root cause. Do not suppress, mark false-positive, or `// NOSONAR` your way past
a real finding.

### Step 4b - Dependency risk introduced by this change

A downstream step fails the run if this change increased the project's count of at-risk
dependencies, so this is blocking. Check it explicitly:

```bash
python tools/dependency-risk-guard.py check "$ARTIFACTS_DIR/dep-baseline.json"
```

Exit 0 means clear. Non-zero means **this change added dependency risk and you must fix it**.

> **Do not rely on the `newlyIntroduced` flag from `search_dependency_risks` here.** It has
> been unreliable on this project, reading `false` for packages the change had just added.
> The guard above compares against a baseline captured before the analysis was published,
> which is why it is the thing that decides.

To find *which* package, when the guard fails:

1. `git diff origin/main -- bun.lock package.json` shows every package this change added,
   direct and transitive.
2. Call `mcp__sonarqube__search_dependency_risks` for the full list of at-risk packages with
   their CVEs and CVSS scores.
3. Intersect the two. The culprit is almost always **transitive** - a package pulled in by
   the library you added, not the library itself.

Fix it by upgrading the offending package, pinning a patched version through a
`package.json` `overrides` entry, or choosing a different library that does not carry it.
Re-run the install so the lockfile reflects the change. Then re-scan and run the guard
again.

Do not remove the feature to make the number go down, and do not edit the baseline file.

### Step 5 - Re-scan

After fixing, re-submit the analysis:

```bash
export PATH="$HOME/AppData/Roaming/npm:$HOME/.local/bin:$PATH"
PR_NUMBER=$(tr -dc '0-9' < "$ARTIFACTS_DIR/.pr-number")
sonar-scanner \n  -Dsonar.token="$SONAR_TOKEN" \n  -Dsonar.pullrequest.key="$PR_NUMBER" \n  -Dsonar.pullrequest.branch="$(git branch --show-current)" \n  -Dsonar.pullrequest.base="$BASE_BRANCH"
```

Wait for the scanner to print `ANALYSIS SUCCESSFUL`, then re-run the dependency guard:

```bash
python tools/dependency-risk-guard.py check "$ARTIFACTS_DIR/dep-baseline.json"
```

You are only done when the quality gate passes **and** that guard exits 0. Then return
to Step 1. (If `sonar-scanner` is not found, it is installed at
`$HOME/AppData/Roaming/npm/sonar-scanner`.)

### Cycle limit

Repeat Steps 1–5 at most **3 times**. If after 3 cycles the gate still fails, stop and
report the remaining findings - do not loop further.

## Completion

When you finish (gate passed, or 3 cycles exhausted), write a markdown report to
`$ARTIFACTS_DIR/sonar-verification.md` with:

- Final quality gate status (PASSED / FAILED).
- A cycle-by-cycle log: for each cycle, the findings detected and what you changed.
- The list of files you modified.

Then commit your fixes:

```bash
git add -A && git commit -m "fix: remediate SonarQube quality gate findings"
```

End your response with one of:
- `<promise>GATE_PASSED</promise>` - the quality gate passed.
- `<promise>GATE_FAILED</promise>` - 3 cycles exhausted, gate still failing.
