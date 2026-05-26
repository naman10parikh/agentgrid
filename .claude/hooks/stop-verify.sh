#!/bin/bash
# Runs before Claude stops to verify work quality.
# Exit code 2 = block stop (stderr shown to Claude).
# Exit code 0 = allow stop.
#
# CIRCUIT BREAKER: If this hook fires >3 times in 60 seconds,
# allow stop to prevent infinite loops (e.g. during rate limits).

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PROJECT_ROOT}"
COUNTER_FILE="/tmp/claude-stop-verify-counter"
MAX_FIRES=3  # Total fires before allowing stop — prevents infinite loops

# --- VP bypass: VPs should never be blocked by stop hooks ---
# If running in a VP pane (not CEO), allow stop immediately.
# VP panes have @pane_label set to VP-*, AG-*, OSS-*, Mgr-*, etc.
if [ -n "${TMUX_PANE:-}" ]; then
  PANE_LABEL=$(tmux show-options -p -t "$TMUX_PANE" @pane_label 2>/dev/null | sed 's/@pane_label //' || echo "")
  if echo "$PANE_LABEL" | grep -qiE '^(VP-|AG-|OSS-|Mgr-|Sub-)'; then
    exit 0  # VPs always allowed to stop — CEO handles commits
  fi
fi
# --- End VP bypass ---

# --- Circuit breaker (total fires, not just windowed) ---
NOW=$(date +%s)
if [ -f "$COUNTER_FILE" ]; then
  FIRE_COUNT=$(wc -l < "$COUNTER_FILE" | tr -d ' ')
  # Always allow stop after MAX_FIRES total (not just within window)
  if [ "$FIRE_COUNT" -ge "$MAX_FIRES" ]; then
    rm -f "$COUNTER_FILE"
    exit 0
  fi
  echo "$NOW" >> "$COUNTER_FILE"
else
  echo "$NOW" > "$COUNTER_FILE"
fi
# --- End circuit breaker ---

# Check: compaction count — if >= 1, FORCE stop (each compaction loses 70-80% of detail)
SESSION_COUNTER="/tmp/claude-compact-session-count"
if [ -f "$SESSION_COUNTER" ]; then
  COMPACT_COUNT=$(cat "$SESSION_COUNTER")
  if [ "$COMPACT_COUNT" -ge 1 ]; then
    # Auto-write handoff signal for auto-switch.sh to detect
    echo "COMPACTION_EXIT $(date '+%Y-%m-%d %H:%M:%S')" > /tmp/claude-session-signal

    # Write migration instructions file (Path B — standalone terminal)
    MIGRATION_FILE="$PROJECT_DIR/.claude/migration-pending.md"
    cat > "$MIGRATION_FILE" << 'MIGRATION_EOF'
# Auto-Migration Pending

Context compacted. A fresh session should continue this work.

## To resume (pick one):
1. **Auto-switch (recommended):** `./scripts/auto-switch.sh --interactive`
2. **Manual:** Start new `claude` session, then: `/ceo-launch` → "Continue from handoff"
3. **Remote trigger:** Already scheduled if RemoteTrigger API is available

## Context preserved in:
- `.claude/handoff.md` — full session state
- `.claude/anchor-state.md` — pre-compaction snapshot
- `memory/daily/{today}.md` — session log
- `memory/LEARNINGS.md` — all patterns

## Maintainer directive: "Don't tell me to create a new chat — DO IT."
MIGRATION_EOF

    echo "Context compacted ${COMPACT_COUNT}x — FORCING stop. Handoff + anchor-state written. Migration instructions at .claude/migration-pending.md. Run: ./scripts/auto-switch.sh --interactive" >&2
    rm -f "$COUNTER_FILE"
    exit 0
  fi
fi

# Check: uncommitted SOURCE files — WARNING only, not blocking
# The repo often has many uncommitted files during active development
MODIFIED=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | grep -v '.claude/backups/' | grep -v 'pnpm-lock' | grep -v 'memory/daily/' | wc -l | tr -d ' ')
if [ "$MODIFIED" -gt 50 ]; then
  echo "You have $MODIFIED uncommitted source files. Consider updating CONTEXT.md and committing before stopping." >&2
  # WARNING only — do not block (exit 2). The maintainer should not be blocked from stopping.
fi

# Success — reset counter
rm -f "$COUNTER_FILE"
exit 0
