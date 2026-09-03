#!/usr/bin/env bash
#
# Reset the Sonar x Archon demo to a known-good, record-ready state.
#
# Run this before every take. A secure run leaves the quality gate GREEN, and
# leaves a branch, a PR and a bot comment behind. All of that has to go before
# the next take, or the agent reads its own previous answer out of the issue.
#
#   export SONAR_TOKEN=<token>
#   bash scripts/reset-demo.sh
#
# Flags:
#   --no-scan     skip the re-scan (fast cleanup only)
#   --keep-issue  do not close/recreate the demo issue
#
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR" || exit 1

DEMO_TITLE="Add an admin stats panel showing poll counts by status"
DO_SCAN=1
KEEP_ISSUE=0
for a in "$@"; do
  case "$a" in
    --no-scan) DO_SCAN=0 ;;
    --keep-issue) KEEP_ISSUE=1 ;;
  esac
done

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- 1. branches
say "Closing demo PRs and deleting demo branches"
for n in $(gh pr list --state open --json number,headRefName \
             --jq '.[] | select(.headRefName | startswith("demo/") or startswith("archon/")) | .number'); do
  gh pr close "$n" --comment "Closing: demo reset." >/dev/null 2>&1 && echo "  closed PR #$n"
done

for b in $(git ls-remote --heads origin 2>/dev/null \
             | awk '{print $2}' | sed 's|refs/heads/||' \
             | grep -E '^(demo|archon)/' || true); do
  git push origin --delete "$b" >/dev/null 2>&1 && echo "  deleted remote $b"
done

# Worktrees first - a branch checked out in a worktree cannot be deleted.
for wt in $(git worktree list --porcelain | awk '/^worktree /{print $2}' \
              | grep -E '/worktrees/(demo|archon)/' || true); do
  git worktree remove --force "$wt" >/dev/null 2>&1 && echo "  removed worktree $(basename "$wt")"
done
git worktree prune

for b in $(git for-each-ref --format='%(refname:short)' refs/heads \
             | grep -E '^(demo|archon)/' || true); do
  git branch -D "$b" >/dev/null 2>&1 && echo "  deleted local $b"
done

# ---------------------------------------------------------------- 2. the issue
if [ "$KEEP_ISSUE" -eq 0 ]; then
  say "Recreating a clean demo issue"
  # The agent reads issue comments. A previous run's completion report tells it
  # the answer, so the issue is recreated rather than reused.
  for n in $(gh issue list --state open --json number,title \
               --jq ".[] | select(.title == \"$DEMO_TITLE\") | .number"); do
    gh issue close "$n" --comment "Closing: demo reset." >/dev/null 2>&1 && echo "  closed issue #$n"
  done
  NEW=$(gh issue create --title "$DEMO_TITLE" \
          --body-file "$REPO_DIR/scripts/demo-issue.md" 2>/dev/null | tail -1)
  echo "  created $NEW"
  echo "${NEW##*/}" > "$REPO_DIR/.demo-issue-number"
fi

# ---------------------------------------------------------------- 3. the gate
if [ "$DO_SCAN" -eq 1 ]; then
  say "Re-scanning main so the quality gate is RED again"
  if [ -z "${SONAR_TOKEN:-}" ]; then
    echo "  !! SONAR_TOKEN is not set. The gate is probably still GREEN from the"
    echo "     last secure run, which breaks the demo. Export it and re-run."
    exit 1
  fi
  export PATH="$HOME/AppData/Roaming/npm:$HOME/.local/bin:$PATH"
  sonar-scanner -Dsonar.token="$SONAR_TOKEN" -Dsonar.branch.name=main 2>&1 \
    | grep -E "ANALYSIS SUCCESSFUL|^\[ERROR\]" | head -3
  python "$REPO_DIR/scripts/gate_status.py" --wait
  rc=$?
else
  rc=0
fi

if [ "${rc:-0}" -eq 0 ]; then
  say "Ready to record."
else
  say "NOT ready - see the baseline warning above."
fi
exit "${rc:-0}"
