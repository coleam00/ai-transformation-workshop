---
description: Verify implemented code against the SonarQube quality gate and autonomously remediate findings until it passes (max 3 cycles)
argument-hint: <github issue request>
---

# SonarQube Verification Gate

You are the **security verification step** of an Archon workflow. The code for a GitHub
issue has just been implemented and a SonarQube analysis was already submitted by the
previous step. Your job: confirm the SonarQube **quality gate passes**, and if it does
not, **fix the findings and re-scan** — autonomously — until it passes or you hit the
3-cycle limit.

Original request: $ARGUMENTS
Workflow artifacts directory: $ARTIFACTS_DIR

## Tools available to you

- **SonarQube MCP server** (`mcp__sonarqube__*`) — read quality gate status, issues,
  security hotspots, dependency risks, and rule documentation.
- **Bash** — to re-run `sonar-scanner` after you fix code.
- **Read / Edit / Write / Grep / Glob** — to inspect and fix the code.

## Context you need

- **Project key & organization**: read them from `sonar-project.properties` in the repo root.
- **Branch**: all scans and gate checks target the `main` branch on SonarQube Cloud.
- **Token**: `SONAR_TOKEN` is already exported in the environment for `sonar-scanner`.

## Procedure

### Step 1 — Wait for the analysis to finish processing

The previous step submitted an analysis, but SonarQube processes it asynchronously.
Wait ~20 seconds, then call `mcp__sonarqube__get_project_quality_gate_status` for this
project (branch `main`). If it reports the analysis is still pending/processing, wait and
retry (up to 5 times, ~20s apart).

### Step 2 — Evaluate the quality gate

Call `mcp__sonarqube__get_project_quality_gate_status`.

- **If the gate status is PASSED / OK** → skip to "Completion (gate passed)".
- **If the gate status is FAILED / ERROR** → continue to Step 3.

### Step 3 — Enumerate the findings

Gather the specific problems that fail the gate:

- `mcp__sonarqube__search_security_hotspots` — security hotspots on this project/branch.
- `mcp__sonarqube__search_sonar_issues_in_projects` — issues (bugs, vulnerabilities, code smells).
- `mcp__sonarqube__search_dependency_risks` — SCA / malicious-package / license risks (if Advanced Security is enabled).
- For any rule you are unsure about, call `mcp__sonarqube__show_rule` to read the rule
  documentation and the recommended remediation.

### Step 4 — Remediate

For each blocking finding, fix the actual code (Edit/Write). Apply the remediation the
rule documentation recommends — for example:
- SQL built by string concatenation → use parameterized / prepared statements.
- Hardcoded credentials/secrets → move to environment variables (`env`), never literals.
- Weak hashing (MD5/SHA-1) → use a strong algorithm appropriate to the use case.
Fix the root cause. Do not suppress, mark false-positive, or `// NOSONAR` your way past
a real finding.

### Step 5 — Re-scan

After fixing, re-submit the analysis:

```bash
sonar-scanner -Dsonar.token="$SONAR_TOKEN" -Dsonar.branch.name=main
```

Then return to Step 1.

### Cycle limit

Repeat Steps 1–5 at most **3 times**. If after 3 cycles the gate still fails, stop and
report the remaining findings — do not loop further.

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
- `<promise>GATE_PASSED</promise>` — the quality gate passed.
- `<promise>GATE_FAILED</promise>` — 3 cycles exhausted, gate still failing.
