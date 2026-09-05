---
description: Classify a GitHub issue as bug, feature, enhancement, refactor, chore or documentation
argument-hint: (none - the issue arrives as $INPUTS.issue)
---

# Issue Classifier

Read the GitHub issue below and decide what kind of work it is. The workflow routes on
your answer: `bug` goes to investigation, everything else goes to planning.

## The issue

$INPUTS.issue

## Classification rules

| Type | Indicators |
|------|------------|
| `bug` | "broken", "error", "crash", "doesn't work", stack traces, a regression |
| `feature` | "add", "new", "support", "would be nice", a net-new capability |
| `enhancement` | "improve", "better", "update existing", "extend", incremental work on something that exists |
| `refactor` | "clean up", "simplify", "reorganize", "restructure" |
| `chore` | "update deps", "upgrade", "maintenance", CI/CD |
| `documentation` | "docs", "readme", "clarify", "examples" |

## Guidance

- Judge the **work being asked for**, not the tone of the writing. A politely worded
  report of something crashing is still a `bug`.
- If it reads as two types at once, pick the one that decides **where the work happens**.
  Adding a feature that also fixes a defect on the way is a `feature`.
- `enhancement` is for improving something that already works. `bug` is for something
  that does not.

Give your reasoning. It is shown in the run output and is what a human reads when the
routing looks wrong.
