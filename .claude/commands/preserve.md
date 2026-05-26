# /preserve — Update Permanent Memory in Vault

Some learnings are permanent — not session-specific but things Claude should ALWAYS know. This skill updates the vault's permanent memory file.

## What To Do

### Step 1: Identify What to Preserve

Ask the user what to save, or auto-detect from the conversation:

- Project conventions and standards
- Architecture decisions
- Key file paths that changed
- Workflow patterns discovered
- Maintainer directives that are permanent rules
- Tool configurations

### Step 2: Read Current Memory

Read `vault/CLAUDE-MEMORY.md`. Understand what's already there to avoid duplicates.

### Step 3: Update Memory

Add new entries to the appropriate section of `vault/CLAUDE-MEMORY.md`. Standard sections:

```markdown
# Energy Platform — Vault Memory

## Active Workstreams

[What's currently being worked on]

## Architecture Decisions

[Key technical choices and why]

## Conventions & Standards

[Naming, file structure, coding standards]

## Key File Paths

[Where important things live]

## Maintainer Directives (Permanent)

[Rules that never expire]

## Workflows & Patterns

[How we do things]

## Tools & Configuration

[What's installed, how it's configured]
```

### Step 4: Auto-Archive if Too Long

If `vault/CLAUDE-MEMORY.md` exceeds 280 lines after update:

1. Identify completed/outdated sections
2. Move them to `vault/CLAUDE-MEMORY-ARCHIVE.md`
3. Keep core sections (Architecture, Conventions, Maintainer Directives) — never archive these
4. Log what was archived

### Step 5: Sync to Repo Memory

Also update `memory/MEMORY.md` if the preserved info belongs there (keep under 200 lines).
Update `memory/LEARNINGS.md` if it's a lesson learned.

### Step 6: Confirm

Tell the user what was preserved and which sections were updated.

## Key Principle

CLAUDE-MEMORY.md is what `/resume` reads first every session. It must be lean, current, and accurate. Archive aggressively but never delete — old content goes to the archive file.
