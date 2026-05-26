#!/bin/bash
# Post-Compaction Context Restore V2 — fires via SessionStart with "compact" matcher.
# Injects critical context back into Claude's awareness after auto-compaction.
#
# V2 upgrades (maintainer mandate #9):
#   - Includes maintainer prompt titles for continuity
#   - Includes skills/tools inventory count
#   - Includes handoff doc if exists (bridges sessions)
#
# The stdout of this script gets injected directly into Claude's context.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PROJECT_ROOT}"
ANCHOR_FILE="$PROJECT_DIR/.claude/anchor-state.md"
TODAY=$(date '+%Y-%m-%d')
DAILY_FILE="$PROJECT_DIR/memory/daily/$TODAY.md"
TASK_FILE="$PROJECT_DIR/.claude/active-task.md"
HANDOFF_FILE="$PROJECT_DIR/.claude/handoff.md"
SESSION_COUNTER="/tmp/claude-compact-session-count"

echo "=== CONTEXT RESTORED AFTER COMPACTION ==="
echo ""

# 1. Compaction count warning
if [ -f "$SESSION_COUNTER" ]; then
  COUNT=$(cat "$SESSION_COUNTER")
  echo "Compaction count this session: $COUNT"
  if [ "$COUNT" -ge 1 ]; then
    echo ""
    echo "**HARD STOP: Context has been compacted ${COUNT} times this session.**"
    echo "**Maintainer Directive #16: STOP at 1 compaction. 35 compactions in session 64 was unacceptable.**"
    echo "**IMMEDIATELY: Write /handoff, tell maintainer to start new chat. DO NOT continue working.**"
  else
    echo "First compaction. Next one triggers HARD STOP per Directive #16."
    echo "Finish current task quickly, then write handoff proactively."
  fi
  echo ""
fi

# 2. Active task (RALF-WIGM loop — keep working)
if [ -f "$TASK_FILE" ]; then
  echo "=== ACTIVE TASK (resume this) ==="
  cat "$TASK_FILE"
  echo ""
fi

# 3. Anchor state (what was happening right before compaction)
if [ -f "$ANCHOR_FILE" ]; then
  echo "=== ANCHOR STATE (pre-compaction snapshot) ==="
  cat "$ANCHOR_FILE"
  echo ""
fi

# 4. Recent daily log entries (contains maintainer's recent directives)
if [ -f "$DAILY_FILE" ]; then
  echo "=== TODAY'S LOG (last 40 lines) ==="
  tail -40 "$DAILY_FILE"
  echo ""
fi

# 5. Handoff doc (session continuity — bridges sessions)
if [ -f "$HANDOFF_FILE" ]; then
  echo "=== HANDOFF DOC (session continuity) ==="
  head -60 "$HANDOFF_FILE"
  echo ""
fi

# 6. Maintainer prompts summary (know what the maintainer cares about)
echo "=== MAINTAINER PROMPTS (titles) ==="
for f in $(find "$PROJECT_DIR/resources/maintainer-prompts" -name "*.md" -type f 2>/dev/null | sort); do
  TITLE=$(head -1 "$f" | sed 's/^# //')
  echo "  - $(basename "$f"): $TITLE"
done
echo ""

# 7. Current git work (what files are being modified)
MODIFIED=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | grep -v '.claude/backups/' | head -15)
if [ -n "$MODIFIED" ]; then
  echo "=== UNCOMMITTED FILES (your active work) ==="
  echo "$MODIFIED"
  echo ""
fi

# 8. Recent commits (momentum context)
echo "=== RECENT COMMITS ==="
git -C "$PROJECT_DIR" log --oneline -5 2>/dev/null || echo "(none)"
echo ""

# 9. Quick inventory
SKILL_COUNT=$(find "$PROJECT_DIR/.claude/skills" -name "SKILL.md" -type f 2>/dev/null | wc -l | tr -d ' ')
RESOURCE_COUNT=$(find "$PROJECT_DIR/resources/read" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "=== INVENTORY: $SKILL_COUNT skills | $RESOURCE_COUNT resources ==="
echo ""

echo "=== INSTRUCTIONS ==="
if [ -f "$SESSION_COUNTER" ] && [ "$(cat "$SESSION_COUNTER")" -ge 1 ]; then
  echo ">>> HARD STOP — COMPACTION LIMIT REACHED <<<"
  echo ">>> You MUST do ONLY these 3 things, in order:"
  echo ">>>   1. Write handoff doc (.claude/handoff.md)"
  echo ">>>   2. Commit any uncommitted work"
  echo ">>>   3. Tell maintainer: 'Context compacted $(cat "$SESSION_COUNTER")x — start a new chat.'"
  echo ">>> DO NOT continue feature work. DO NOT start new tasks."
  echo ">>> DO NOT ignore this instruction. Session 86 hit 21 compactions because this was ignored."
else
  # Check for active VP missions (grid spawn in progress)
  MISSION_COUNT=$(find "$PROJECT_DIR/.claude/vp-missions" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
  if [ "$MISSION_COUNT" -gt 0 ]; then
    echo ">>> ACTIVE MISSIONS DETECTED ($MISSION_COUNT VP mission files) <<<"
    echo ">>> A grid spawn was in progress before compaction. RESUME IT."
    echo ">>>   1. Read .claude/vp-missions/ to understand the company"
    echo ">>>   2. Spawn grid: agentgrid NxM claude"
    echo ">>>   3. Inject missions: ./scripts/inject-task.sh %PANE --file .claude/vp-missions/{role}.md"
    echo ">>> Do NOT pick up random tasks from the shared task list."
    echo ">>> The mission files ARE your next action."
  else
    echo "1. Read the active task above and RESUME working on it"
    echo "2. Do NOT ask the maintainer what to do — the task file tells you"
  fi
  echo "3. Use sub-agents for research to preserve your context window"
  echo "4. Maintainer prompts are SACRED — if recent one exists, address it first"
  echo "5. Next compaction triggers HARD STOP — work efficiently"
fi
echo "=== END COMPACTION RESTORE ==="
