# Auto-Migration — Don't Tell Me, Do It (Maintainer Prompt #53)

## The Rule

When context degrades (1 compaction), the system MUST automatically migrate to a fresh session. DO NOT just tell the maintainer "please start a new chat." The system should handle migration autonomously.

## Migration Paths (In Priority Order)

### Path A: auto-switch.sh Is Running

This is the preferred path for overnight and grid operations:

1. Pre-compact hook writes handoff + anchor-state
2. Stop hook detects compaction count >= 1
3. Stop hook writes signal to `/tmp/claude-session-signal`
4. Claude exits cleanly
5. auto-switch.sh detects exit, reads signal
6. auto-switch.sh builds resume prompt with handoff + memory context
7. New `claude -p` session starts with full context injection

**Setup:** `./scripts/auto-switch.sh --overnight` in tmux

### Path B: Standalone Terminal (Cursor, iTerm, etc.)

When auto-switch.sh is NOT running:

1. Pre-compact hook writes handoff + anchor-state
2. Stop hook detects compaction count >= 1
3. Stop hook uses RemoteTrigger to schedule an immediate remote session:
   ```
   RemoteTrigger(action: "create", body: {
     prompt: "Read $PROJECT_ROOT/.claude/handoff.md and continue work.",
     project_path: "$PROJECT_ROOT"
   })
   ```
4. Claude writes to terminal: "Context migrating. Remote session spawned. Check Claude dashboard."
5. New remote session reads handoff and continues

### Path C: AgentGrid App

When running inside AgentGrid Electron:

1. Pre-compact hook writes handoff + anchor-state
2. Stop hook signals the Electron main process via IPC
3. Electron spawns a new pane with fresh Claude instance
4. New instance reads handoff and continues
5. Old pane is marked as "migrated" in UI

## Handoff Quality Standard

The handoff MUST be tight enough that the new session continues seamlessly:

1. **Active company:** name, grid layout, worker pane IDs, what each is doing NOW
2. **Active task:** exact file being edited, line numbers, what's left
3. **Decisions made:** architectural choices, maintainer corrections, trade-offs resolved
4. **Files changed:** full list with brief description of each change
5. **Next 3 actions:** exact steps to take after loading context
6. **Blocker state:** current MAINTAINER-CHECKLIST.md blockers

## Pre-Compact Hook Responsibilities

The pre-compact-memory-flush.sh MUST:

1. Write `.claude/handoff.md` with all 6 sections above
2. Write `.claude/anchor-state.md` with BIG PICTURE + NEXT ACTION
3. Flush daily log with session summary
4. Compress LEARNINGS.md if >500 lines
5. Create backup in `.claude/backups/`

## Anti-Patterns

- Telling the maintainer "please start a new chat" (the WHOLE POINT is autonomous migration)
- Writing a vague handoff ("I was working on stuff")
- Not including file paths in the handoff
- Continuing to work past 1 compaction (quality is already degraded)
- Not testing the migration path end-to-end
