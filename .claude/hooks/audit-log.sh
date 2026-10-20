#!/bin/bash
# Append-only audit log — inspired by Paperclip's governance model.
# Fires on PostToolUse for all tools. Logs every tool call with timestamp.
# File: .claude/audit.jsonl (JSON Lines format, append-only)

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
AUDIT_FILE="$PROJECT_DIR/.claude/audit.jsonl"
TERMINAL_CONTEXT="${CLAUDE_TERMINAL_CONTEXT:-unknown}"
TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

# Claude Code sends the hook payload as JSON on stdin ({"tool_name", "tool_input": {"file_path"}}).
# Older harnesses set CLAUDE_TOOL_NAME / CLAUDE_TOOL_INPUT_FILE_PATH instead; both are read.
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
FILE_PATH="${CLAUDE_TOOL_INPUT_FILE_PATH:-}"
if [ -z "$TOOL_NAME" ] && [ ! -t 0 ] && command -v python3 >/dev/null 2>&1; then
  PARSED="$(python3 -c 'import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get("tool_name", "unknown") + "\t" + str((d.get("tool_input") or {}).get("file_path", "")))
except Exception:
    print("unknown\t")' 2>/dev/null || true)"
  TOOL_NAME="${PARSED%%$'\t'*}"
  FILE_PATH="${PARSED#*$'\t'}"
fi
TOOL_NAME="${TOOL_NAME:-unknown}"

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

# Atomic append with flock to handle multi-terminal.
# flock ships on Linux (incl. CI ubuntu) but NOT on stock macOS — fall back to a
# plain append there so the audit trail is actually written on every platform.
ENTRY="{\"ts\":\"$TIMESTAMP\",\"tool\":\"$TOOL_NAME\",\"terminal\":\"$TERMINAL_CONTEXT\",\"file\":\"$FILE_PATH\"}"
if command -v flock >/dev/null 2>&1; then
  (
    flock -w 5 200 || exit 0
    echo "$ENTRY" >> "$AUDIT_FILE"
  ) 200>"$AUDIT_FILE.lock"
else
  # No flock available: O_APPEND writes <PIPE_BUF are atomic enough for this trail.
  echo "$ENTRY" >> "$AUDIT_FILE"
fi

# Prune audit log if over 10K lines (keep recent 5K)
if [ -f "$AUDIT_FILE" ]; then
  LINE_COUNT=$(wc -l < "$AUDIT_FILE" | tr -d ' ')
  if [ "$LINE_COUNT" -gt 10000 ]; then
    TEMP=$(mktemp "$AUDIT_FILE.XXXXXX")
    tail -5000 "$AUDIT_FILE" > "$TEMP"
    mv "$TEMP" "$AUDIT_FILE"
  fi
fi
