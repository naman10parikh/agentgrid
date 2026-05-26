#!/bin/bash
# Task Completion Gate — Ralph Wiggum Loop.
# Runs on Stop event. Blocks stop if there's an active task file.
# Exit 2 = block stop (stderr shown to Claude), Exit 0 = allow.
#
# CIRCUIT BREAKER: If this hook fires >3 times in 60 seconds,
# allow stop to prevent infinite loops.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PROJECT_ROOT}"
TASK_FILE="$PROJECT_DIR/.claude/active-task.md"
COUNTER_FILE="/tmp/claude-task-gate-counter"
MAX_FIRES=3  # Total fires before allowing stop — prevents infinite loops

# --- VP bypass: VPs should never be blocked by stop hooks ---
if [ -n "${TMUX_PANE:-}" ]; then
  PANE_LABEL=$(tmux show-options -p -t "$TMUX_PANE" @pane_label 2>/dev/null | sed 's/@pane_label //' || echo "")
  if echo "$PANE_LABEL" | grep -qiE '^(VP-|AG-|OSS-|Mgr-|Sub-)'; then
    exit 0
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

# Only check: active task file exists and isn't done/blocked
if [ -f "$TASK_FILE" ]; then
  if ! grep -q "^status: done" "$TASK_FILE" 2>/dev/null && ! grep -q "^status: blocked" "$TASK_FILE" 2>/dev/null; then
    TASK_NAME=$(head -1 "$TASK_FILE" | sed 's/^# //')
    echo "Active task: \"$TASK_NAME\" — mark 'status: done' in .claude/active-task.md or keep working." >&2
    exit 2
  else
    rm -f "$TASK_FILE"
  fi
fi

# Removed: uncommitted files check (already in stop-verify.sh — no double-blocking)
# Removed: plan file check (too aggressive — plan always has items)

# Success — reset counter
rm -f "$COUNTER_FILE"
exit 0
