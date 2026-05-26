#!/bin/bash
# Context Monitor — GSD-inspired health check on session start.
# Checks: planning state, stale tasks, memory drift, uncommitted work age.
# Runs alongside session-start-context.sh.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PROJECT_ROOT}"
TODAY=$(date '+%Y-%m-%d')
WARNINGS=""

# 1. Check for stale planning state (GSD pattern: .planning/ directory)
PLANNING_DIR="$PROJECT_DIR/.claude/plan.md"
if [ -f "$PLANNING_DIR" ]; then
  PLAN_AGE=$(( ($(date +%s) - $(stat -f %m "$PLANNING_DIR" 2>/dev/null || echo "$(date +%s)")) / 3600 ))
  if [ "$PLAN_AGE" -gt 24 ]; then
    WARNINGS="$WARNINGS\n[CONTEXT MONITOR] plan.md is ${PLAN_AGE}h old. Review or archive it."
  fi
fi

# 2. Check uncommitted work age (oldest modified file)
OLDEST_MODIFIED=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | head -1)
if [ -n "$OLDEST_MODIFIED" ]; then
  UNCOMMITTED_COUNT=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | wc -l | tr -d ' ')
  if [ "$UNCOMMITTED_COUNT" -gt 50 ]; then
    WARNINGS="$WARNINGS\n[CONTEXT MONITOR] $UNCOMMITTED_COUNT uncommitted files. Consider committing stable work."
  fi
fi

# 3. Check memory file sizes (prevent bloat)
LEARNINGS_SIZE=$(wc -l < "$PROJECT_DIR/memory/LEARNINGS.md" 2>/dev/null || echo "0")
if [ "$LEARNINGS_SIZE" -gt 500 ]; then
  WARNINGS="$WARNINGS\n[CONTEXT MONITOR] LEARNINGS.md is $LEARNINGS_SIZE lines. Consider archiving older entries."
fi

# 4. Check daily log exists for today
DAILY_FILE="$PROJECT_DIR/memory/daily/$TODAY.md"
if [ ! -f "$DAILY_FILE" ]; then
  WARNINGS="$WARNINGS\n[CONTEXT MONITOR] No daily log for $TODAY. Will be auto-created."
fi

# 5. Check CONTEXT.md staleness (warn if not updated today)
if [ -f "$PROJECT_DIR/CONTEXT.md" ]; then
  CONTEXT_MOD_AGE=$(( ($(date +%s) - $(stat -f %m "$PROJECT_DIR/CONTEXT.md" 2>/dev/null || echo "$(date +%s)")) / 3600 ))
  if [ "$CONTEXT_MOD_AGE" -gt 48 ]; then
    WARNINGS="$WARNINGS\n[CONTEXT MONITOR] CONTEXT.md not modified in ${CONTEXT_MOD_AGE}h. Consider updating."
  fi
fi

if [ -n "$WARNINGS" ]; then
  echo -e "\n=== CONTEXT HEALTH CHECK ===$WARNINGS"
fi
