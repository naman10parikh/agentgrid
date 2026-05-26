#!/bin/bash
# Logs session summary to daily memory file and session-log.md.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PROJECT_ROOT}"
MEMORY_DIR="$PROJECT_DIR/memory"
DAILY_DIR="$MEMORY_DIR/daily"
TODAY=$(date '+%Y-%m-%d')
DAILY_FILE="$DAILY_DIR/$TODAY.md"
SESSION_LOG="$PROJECT_DIR/.claude/session-log.md"

mkdir -p "$DAILY_DIR"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
MODIFIED=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | wc -l | tr -d ' ')
FILES=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | head -20 | tr '\n' ', ')

echo "## $TIMESTAMP — Session ended | $MODIFIED files modified" >> "$SESSION_LOG"
[ -n "$FILES" ] && echo "Files: $FILES" >> "$SESSION_LOG"
echo "" >> "$SESSION_LOG"

if [ ! -f "$DAILY_FILE" ]; then
  echo "# Session Log — $TODAY" > "$DAILY_FILE"
  echo "" >> "$DAILY_FILE"
fi
echo "### $(date '+%H:%M') — Session ended" >> "$DAILY_FILE"
echo "- Files modified: $MODIFIED" >> "$DAILY_FILE"
echo "" >> "$DAILY_FILE"
