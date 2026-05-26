---
description: Recovery protocol when things go wrong. Shows recent changes, offers revert options, re-loads context.
---

Recovery mode activated. Steps:

1. Show recent git log (last 10 commits) with `git log --oneline -10`
2. Show current uncommitted changes with `git diff --stat`
3. If ccundo is installed, show `ccundo list` for recent operations
4. Ask user: "What went wrong? Options: (a) revert last commit, (b) stash changes, (c) ccundo to specific point, (d) just re-read context and continue"
5. Execute chosen recovery
6. Re-read CONTEXT.md to get back on track
7. Resume work from the last known good state
