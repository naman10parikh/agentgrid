# /compress — Save Session to Vault

Before ending a productive session, run this to preserve what happened so future sessions can pick up seamlessly.

## What To Do

### Step 1: Ask What to Preserve

Ask the user which categories to save (or auto-detect from conversation):

- Key learnings
- Solutions & fixes
- Decisions made
- Files modified
- Setup & config changes
- Pending tasks
- Errors & workarounds
- Maintainer directives

### Step 2: Create Session Log

Write a session log to `vault/sessions/YYYY-MM-DD-HH-MM-TOPIC.md` with this format:

```markdown
---
type: session
date: YYYY-MM-DD
time: HH:MM
topics: [topic1, topic2]
projects: [Energy]
status: completed
---

# Session: YYYY-MM-DD HH:MM — TOPIC

## Quick Reference

**Topics:** comma-separated list
**Outcome:** one-line summary of what was accomplished

## Decisions Made

- Decision 1
- Decision 2

## Key Learnings

- Learning 1
- Learning 2

## Files Modified

- path/to/file — what changed

## Pending Tasks

- [ ] Task 1
- [ ] Task 2

## Maintainer Directives (if any)

- Directive 1

## Errors & Workarounds

- Error → Fix

---

## Session Summary

[2-3 paragraph narrative of the session]
```

### Step 3: Update Daily Note

Append a summary to `vault/daily/YYYY-MM-DD.md`:

```markdown
### HH:MM — Session: TOPIC

- Outcome: one-line
- Files modified: N
- Decisions: list
- See full log: [[Sessions/YYYY-MM-DD-HH-MM-TOPIC]]
```

If the daily note doesn't exist, create it with YAML frontmatter:

```yaml
---
type: daily
date: YYYY-MM-DD
---
```

### Step 4: Update memory/daily log too

Also append to `memory/daily/YYYY-MM-DD.md` (the repo-side daily log) so both systems stay in sync.

### Step 5: Confirm

Tell the user what was saved and where. Show the file paths.

## Key Principle

The vault is the RETRIEVAL layer. Session logs go there so `/resume` can find them later. The Quick Reference section is designed for fast AI scanning — keep it concise.
