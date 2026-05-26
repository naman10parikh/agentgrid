#!/bin/bash
# Production pre-compaction memory flush — V2 (March 7, 2026).
# Fires on PreCompact event — last chance to persist before context compression.
#
# UPGRADES over V1:
#   1. Writes anchor-state.md — a structured "what we're doing right now" file
#      that survives compaction because session-start re-loads it
#   2. Tracks compaction count per session for chat-switch warnings
#   3. Saves recent user prompt hints (from daily log) into the anchor
#   4. Structured backup with anchor state pattern (not just file dumps)

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PROJECT_ROOT}"
MEMORY_DIR="$PROJECT_DIR/memory"
DAILY_DIR="$MEMORY_DIR/daily"
BACKUP_DIR="$PROJECT_DIR/.claude/backups"
ANCHOR_FILE="$PROJECT_DIR/.claude/anchor-state.md"
COMPACT_COUNTER="/tmp/claude-compact-counter-$$"
SESSION_COUNTER="/tmp/claude-compact-session-count"
TODAY=$(date '+%Y-%m-%d')
DAILY_FILE="$DAILY_DIR/$TODAY.md"
TIMESTAMP=$(date '+%Y-%m-%dT%H-%M-%S')
BACKUP_FILE="$BACKUP_DIR/pre-compact-$TIMESTAMP.md"

LEARNINGS_FILE="$MEMORY_DIR/LEARNINGS.md"
COMPRESS_SCRIPT="$PROJECT_DIR/scripts/memory-compress.sh"
LEARNINGS_THRESHOLD=500

mkdir -p "$DAILY_DIR" "$BACKUP_DIR"

# --- Check LEARNINGS.md size and trigger compression if needed ---
if [ -f "$LEARNINGS_FILE" ]; then
  LEARNINGS_LINES=$(wc -l < "$LEARNINGS_FILE" | tr -d ' ')
  if [ "$LEARNINGS_LINES" -gt "$LEARNINGS_THRESHOLD" ] && [ -x "$COMPRESS_SCRIPT" ]; then
    "$COMPRESS_SCRIPT" 2>/dev/null || true
    echo "LEARNINGS.md was $LEARNINGS_LINES lines — compression triggered."
  elif [ "$LEARNINGS_LINES" -gt "$LEARNINGS_THRESHOLD" ]; then
    echo "WARNING: LEARNINGS.md is $LEARNINGS_LINES lines (threshold: $LEARNINGS_THRESHOLD) but scripts/memory-compress.sh not found."
  fi
fi

if [ ! -f "$DAILY_FILE" ]; then
  echo "# Session Log — $TODAY" > "$DAILY_FILE"
  echo "" >> "$DAILY_FILE"
fi

# --- Track compaction count for this session ---
if [ -f "$SESSION_COUNTER" ]; then
  COUNT=$(cat "$SESSION_COUNTER")
  COUNT=$((COUNT + 1))
else
  COUNT=1
fi
echo "$COUNT" > "$SESSION_COUNTER"

# --- 1. Create structured backup (anchor state pattern) ---
{
  echo "# Pre-Compaction Backup — $TIMESTAMP"
  echo "## Compaction #$COUNT this session"
  echo ""
  echo "## CONTEXT.md snapshot (first 80 lines)"
  echo '```'
  head -80 "$PROJECT_DIR/CONTEXT.md" 2>/dev/null || echo "(not found)"
  echo '```'
  echo ""
  echo "## MEMORY.md snapshot (first 60 lines)"
  echo '```'
  head -60 "$MEMORY_DIR/MEMORY.md" 2>/dev/null || echo "(not found)"
  echo '```'
  echo ""
  echo "## Today's daily log (last 60 lines)"
  echo '```'
  tail -60 "$DAILY_FILE" 2>/dev/null || echo "(empty)"
  echo '```'
  echo ""
  echo "## LEARNINGS.md (last 30 lines)"
  echo '```'
  tail -30 "$MEMORY_DIR/LEARNINGS.md" 2>/dev/null || echo "(empty)"
  echo '```'
  echo ""
  echo "## Git status"
  echo '```'
  cd "$PROJECT_DIR" && git diff --stat HEAD 2>/dev/null || echo "(not a git repo)"
  echo '```'
  echo ""
  echo "## Modified files (uncommitted)"
  echo '```'
  cd "$PROJECT_DIR" && git diff --name-only 2>/dev/null | head -30 || echo "(none)"
  echo '```'
  echo ""
  echo "## Recent commits (last 5)"
  echo '```'
  cd "$PROJECT_DIR" && git log --oneline -5 2>/dev/null || echo "(none)"
  echo '```'
} > "$BACKUP_FILE"

# --- 2. Write anchor-state.md (the critical survival document) ---
# This file is loaded by session-start and by CLAUDE.md auto-memory
TERMINAL_CONTEXT="${CLAUDE_TERMINAL_CONTEXT:-unknown}"
{
  echo "# Anchor State — Written at $TIMESTAMP (Compaction #$COUNT)"
  echo "## Terminal: $TERMINAL_CONTEXT"
  echo ""
  echo "## What Was Happening (PRECISION CAPTURE — under 5K tokens, miss nothing)"
  echo ""
  echo "### [BIG PICTURE] — 3-5 items done this session"
  echo "Read \`memory/daily/$TODAY.md\` for full details."
  echo ""
  echo "### [FILES CHANGED]"
  cd "$PROJECT_DIR" && git diff --name-only 2>/dev/null | head -20 || echo "(none)"
  echo ""
  echo "### [ACTIVE MISSION] — what was being done RIGHT NOW"
  # Capture active company state if it exists
  if [ -f "$PROJECT_DIR/.claude/company-state.md" ]; then
    echo "Company running. Read .claude/company-state.md for full context."
    head -20 "$PROJECT_DIR/.claude/company-state.md" 2>/dev/null
  fi
  # Capture VP missions if they exist (grid was being spawned)
  MISSION_COUNT=$(find "$PROJECT_DIR/.claude/vp-missions" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
  if [ "$MISSION_COUNT" -gt 0 ]; then
    echo ""
    echo "**$MISSION_COUNT VP missions written — grid spawn was in progress.**"
    echo "Mission files in .claude/vp-missions/:"
    ls "$PROJECT_DIR/.claude/vp-missions/"*.md 2>/dev/null | while read f; do
      echo "  - $(basename "$f"): $(head -1 "$f" | sed 's/^# //')"
    done
    echo ""
    echo "**CRITICAL: Resume by spawning the grid. Do NOT pick up random tasks.**"
    echo "Run: agentgrid 2x2 claude (or whatever grid size matches the mission count)"
    echo "Then inject missions via: ./scripts/inject-task.sh %PANE --file .claude/vp-missions/{role}.md"
  fi
  echo ""
  echo "### [NEXT ACTION] — the very next thing to do"
  echo "If missions exist above: SPAWN THE GRID. Do not work on shared task list."
  echo "Otherwise: check task list and daily log for active work."
  echo ""
  echo "### [RECOVERY]"
  echo "Backup: \`.claude/backups/pre-compact-$TIMESTAMP.md\`"
  echo ""
  echo "## Recent Daily Log Entries (last 40 lines)"
  echo ""
  tail -40 "$DAILY_FILE" 2>/dev/null || echo "(no entries yet)"
  echo ""
  echo "## Compaction Health"
  echo ""
  if [ "$COUNT" -ge 1 ]; then
    echo "**CRITICAL: Context has been compacted $COUNT times this session.**"
    echo "**HARD RULE (Maintainer Directive #16): STOP — migrate to fresh chat after 1 compaction.**"
    echo "**Write handoff doc. Tell the maintainer:**"
    echo "**'Context compacted ${COUNT}x — quality is degrading. Start a new chat. Handoff written.'**"
    echo "**DO NOT continue working past this point. 35 compactions in session 64 was unacceptable.**"
  else
    echo "First compaction. One more triggers HARD STOP per Maintainer Directive #16."
    echo "Finish current task quickly, write handoff doc proactively."
  fi
  echo ""
  echo "## Maintainer Prompts (titles — know what he cares about)"
  echo ""
  for f in $(find "$PROJECT_DIR/resources/maintainer-prompts" -name "*.md" -type f 2>/dev/null | sort); do
    TITLE=$(head -1 "$f" | sed 's/^# //')
    echo "  - $(basename "$f"): $TITLE"
  done
  echo ""
  echo "## Inventory"
  echo ""
  SKILL_COUNT=$(find "$PROJECT_DIR/.claude/skills" -name "SKILL.md" -type f 2>/dev/null | wc -l | tr -d ' ')
  echo "Skills: $SKILL_COUNT"
  echo ""
  echo "## Recovery Steps"
  echo ""
  echo "1. Read this file for orientation"
  echo "2. Read \`memory/daily/$TODAY.md\` for full session log"
  echo "3. Read \`.claude/backups/pre-compact-$TIMESTAMP.md\` for detailed snapshot"
  echo "4. Read \`.claude/handoff.md\` for session bridge"
  echo "5. Check \`git diff --stat\` for uncommitted work"
  echo "6. Resume from the last task in the daily log"
} > "$ANCHOR_FILE"

# --- 3. Append compaction marker to daily log ---
MODIFIED_COUNT=$(cd "$PROJECT_DIR" && git diff --name-only 2>/dev/null | wc -l | tr -d ' ')
MODIFIED_FILES=$(cd "$PROJECT_DIR" && git diff --name-only 2>/dev/null | head -10 | tr '\n' ', ')

{
  echo ""
  echo "### [AUTO] Context compaction at $(date '+%H:%M:%S')"
  echo ""
  echo "- Backup: .claude/backups/pre-compact-$TIMESTAMP.md"
  echo "- Compaction #$COUNT this session"
  echo "- Files modified (uncommitted): $MODIFIED_COUNT"
  [ -n "$MODIFIED_FILES" ] && echo "- Changed: $MODIFIED_FILES"
  echo "- **Recovery**: Read backup file above to restore context after compaction."
  echo ""
} >> "$DAILY_FILE"

# --- 4. Prune old backups (keep last 10) ---
ls -t "$BACKUP_DIR"/pre-compact-*.md 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

# --- 5. Write last-session-output for auto-switch continuity ---
LAST_OUTPUT_FILE="$PROJECT_DIR/.claude/last-session-output.md"
{
  echo "# Last Session Final State — $TIMESTAMP (Compaction #$COUNT)"
  echo ""
  echo "## Active Tasks"
  if [ -f "$PROJECT_DIR/.claude/active-task.md" ]; then
    cat "$PROJECT_DIR/.claude/active-task.md"
  else
    echo "(No active task file)"
  fi
  echo ""
  echo "## Handoff Summary"
  if [ -f "$PROJECT_DIR/.claude/handoff.md" ]; then
    head -60 "$PROJECT_DIR/.claude/handoff.md"
  else
    echo "(No handoff doc)"
  fi
  echo ""
  echo "## Uncommitted Work"
  cd "$PROJECT_DIR" && git diff --name-only 2>/dev/null | head -20 || echo "(none)"
  echo ""
  echo "## Recent Commits"
  cd "$PROJECT_DIR" && git log --oneline -5 2>/dev/null || echo "(none)"
  echo ""
  echo "## Session Compaction Count: $COUNT"
  echo "## Exit Reason: context-degraded (auto-switch)"
} > "$LAST_OUTPUT_FILE"

# --- 6. Signal auto-switch runner ---
if [ "$COUNT" -ge 1 ]; then
  echo "context-degraded" > "/tmp/claude-session-signal"
  echo "CRITICAL: Compaction #$COUNT — signaling for fresh session. HARD STOP at 1 compaction — migrate NOW."
elif [ "$COUNT" -eq 1 ]; then
  echo "WARNING: First compaction. Next one triggers HARD STOP. Work efficiently, use sub-agents."
fi

echo "Memory flushed (compaction #$COUNT). Backup: $BACKUP_FILE | Anchor: $ANCHOR_FILE"
