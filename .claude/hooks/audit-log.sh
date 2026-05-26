#!/bin/bash
# Append-only audit log — inspired by Paperclip's governance model.
# Fires on PostToolUse for all tools. Logs every tool call with timestamp.
# File: .claude/audit.jsonl (JSON Lines format, append-only)

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PROJECT_ROOT}"
AUDIT_FILE="$PROJECT_DIR/.claude/audit.jsonl"
TERMINAL_CONTEXT="${CLAUDE_TERMINAL_CONTEXT:-unknown}"
TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"

# Only log significant tools (skip reads/searches to avoid noise)
case "$TOOL_NAME" in
  Write|Edit|Bash|Agent|NotebookEdit|TaskCreate|TaskUpdate|CronCreate)
    # These are state-changing — always log
    ;;
  *)
    # Skip read-only tools to keep audit log focused
    exit 0
    ;;
esac

# Extract file path if available
FILE_PATH="${CLAUDE_TOOL_INPUT_FILE_PATH:-}"

# Atomic append with flock to handle multi-terminal
(
  flock -w 5 200 || exit 0
  echo "{\"ts\":\"$TIMESTAMP\",\"tool\":\"$TOOL_NAME\",\"terminal\":\"$TERMINAL_CONTEXT\",\"file\":\"$FILE_PATH\"}" >> "$AUDIT_FILE"
) 200>"$AUDIT_FILE.lock"

# Prune audit log if over 10K lines (keep recent 5K)
if [ -f "$AUDIT_FILE" ]; then
  LINE_COUNT=$(wc -l < "$AUDIT_FILE" | tr -d ' ')
  if [ "$LINE_COUNT" -gt 10000 ]; then
    TEMP=$(mktemp "$AUDIT_FILE.XXXXXX")
    tail -5000 "$AUDIT_FILE" > "$TEMP"
    mv "$TEMP" "$AUDIT_FILE"
  fi
fi
