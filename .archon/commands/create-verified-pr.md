---
description: Open a draft pull request that carries the SonarQube quality gate result in its body
argument-hint: <the original issue request>
---

# Create the verified draft pull request

This runs only after the quality gate has passed AND a deterministic guard has confirmed
it from outside the agent. The pull request therefore carries a verification section: the
reader should not have to go and check whether the gate was green.

**Issue**: $ARGUMENTS
**Classification**: $INPUTS.classification
**Gate result**: $INPUTS.verification

## Steps

1. **Commit anything outstanding.** Run `git status`. If there are uncommitted changes,
   stage and commit them. The remediation step edits files, so expect some.
2. **Push the branch**: `git push -u origin HEAD`
3. **Read the run's artifacts** before writing the body:
   - `$ARTIFACTS_DIR/investigation.md` or `$ARTIFACTS_DIR/plan.md`
   - `$ARTIFACTS_DIR/implementation.md`
   - `$ARTIFACTS_DIR/sonar-verification.md` ← the gate's own report
4. **Check for an existing PR**: `gh pr list --head $(git branch --show-current)`.
   If one is already open, update it rather than opening a second.
5. **Use the repo's template** if there is one, at `.github/pull_request_template.md`
   or `.github/PULL_REQUEST_TEMPLATE.md`.
6. **Open it as a draft**: `gh pr create --draft --base $BASE_BRANCH`
   - Title: imperative mood, under 70 characters
   - Body: what changed and why, then the section below
   - Close the issue with `Fixes #<number>`
7. **Record the identifiers**:

   ```bash
   gh pr view --json number -q '.number' > "$ARTIFACTS_DIR/.pr-number"
   gh pr view --json url    -q '.url'    > "$ARTIFACTS_DIR/.pr-url"
   ```

## The SonarQube Verification section

Include this in the body, from `sonar-verification.md` and the gate result above:

- **Final quality gate status**, and the conditions behind it (`security_rating`,
  `vulnerabilities`, `security_hotspots_reviewed`).
- **Every finding the gate reported, and what was done about it.** One line each, with
  the rule key and the file and line: what it was, and the remediation applied.
- **Count them out**: "3 of 3 fixed". If any were not fixed, say which and why.
- **Before and after** on the numbers, e.g. `security_rating` 4 to 1, `vulnerabilities`
  3 to 0.
- **Any dependency risk** the change introduced and how it was resolved.

State it plainly. This section is the evidence a reviewer relies on instead of re-running
the scan themselves, so an overstatement here is worse than no section at all.

## Scope

Open the pull request and nothing else. Do not edit code, and do not re-run the scanner.
The verification already happened; your job is to report it accurately.
