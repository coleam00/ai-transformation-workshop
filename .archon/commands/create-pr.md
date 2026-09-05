---
description: Open a pull request for the current branch and link the issue it closes
argument-hint: <the original issue request>
---

# Create the pull request

**Issue**: $ARGUMENTS
**Classification**: $INPUTS.classification

## Steps

1. **Commit anything outstanding.** Run `git status`. If there are uncommitted changes,
   stage and commit them.
2. **Push the branch**: `git push -u origin HEAD`
3. **Read the run's artifacts** for context before writing the body:
   - `$ARTIFACTS_DIR/investigation.md` or `$ARTIFACTS_DIR/plan.md`
   - `$ARTIFACTS_DIR/implementation.md`
4. **Check for an existing PR**: `gh pr list --head $(git branch --show-current)`.
   If one is already open, update it rather than opening a second.
5. **Use the repo's template** if there is one, at `.github/pull_request_template.md`
   or `.github/PULL_REQUEST_TEMPLATE.md`.
6. **Open it**: `gh pr create --base $BASE_BRANCH`
   - Title: imperative mood, under 70 characters
   - Body: what changed and why, in the template's shape if one exists
   - Close the issue with `Fixes #<number>`
7. **Record the identifiers** so later nodes can find the PR:

   ```bash
   gh pr view --json number -q '.number' > "$ARTIFACTS_DIR/.pr-number"
   gh pr view --json url    -q '.url'    > "$ARTIFACTS_DIR/.pr-url"
   ```

## Scope

Open the pull request and nothing else. Do not amend the implementation, do not fix
anything you notice on the way, and do not add commits beyond staging work that is
already in the tree. If something looks wrong, say so in the PR body under a
`Noticed, not fixed` heading and recommend a follow-up issue.
