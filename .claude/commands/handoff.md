---
description: Write a handoff document for session continuity. Use when context is degrading or switching tasks.
---

Create a handoff document at `.claude/handoff.md` (OVERWRITE the existing one) with this structure:

## Header

```
# Handoff Document — Session N (description) -> Session N+1
**Created:** [date]
**Reason:** [why: compaction limit, task switch, session end]
```

## CURRENT BLOCKER (if any)

- What's broken right now and the exact error
- Likely causes (ordered by probability)
- Debug steps for next session (exact commands to run)
- What the fix likely requires (files + line numbers)

## What Was Done (This Session)

- Bullet list of all completed work, grouped by session if multi-session handoff
- Include: files modified, features added, bugs fixed, research done
- Be specific — file paths and line numbers

## Maintainer Directives Status (ALL — 001 through latest)

| #   | Directive | Status |
| --- | --------- | ------ |

For EVERY directive in `resources/maintainer-prompts/`, report: DONE / IN PROGRESS / BLOCKED / NOT STARTED

## Key Files Modified (Uncommitted)

| File | What Changed |
| ---- | ------------ |

List every modified file with a 1-line description

## Priority Queue (After Current Blocker)

Numbered list of what to do next, in order of impact

## Maintainer's Vision Summary

1-2 paragraph summary of the maintainer's overall direction (from latest directives)

## Critical Rules (ENFORCED)

List all active rules from CLAUDE.md and LEARNINGS.md that affect work

## Architecture Reference

Key file paths, functions, and their roles

## How To Start Next Session

Step-by-step instructions:

1. Run `/start` — loads ALL context (7 parallel sub-agents)
2. Read this handoff: `.claude/handoff.md`
3. Check daily log for today
4. [Specific next step for current work]
5. Continue from priority queue

## Uncommitted Changes

Summary: N modified + N untracked files. List key ones.

---

ALSO do these:

1. Update `memory/daily/[today].md` with session summary
2. Update `CONTEXT.md` with session progress (increment version)
3. Update `.claude/active-task.md` if the task changed
4. Write `.claude/last-session-output.md` with:
   - Current task list state (all tasks with status)
   - Last 5 actions taken
   - Any errors or blockers encountered
   - The specific next action to take
   - This file gets auto-injected into the next session's context by the SessionStart hook
5. If this handoff is due to compaction (context degraded), tell the maintainer:
   "Context degraded — start a new chat. Run `/start` and everything will be injected."

## Auto-Switch Support

If running under `scripts/auto-switch.sh`, the session will automatically restart after this handoff.
The last-session-output.md file bridges the gap between sessions — it's the "final frame" of this session
that gets injected as the "first frame" of the next session.
