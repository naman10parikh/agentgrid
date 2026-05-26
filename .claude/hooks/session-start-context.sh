#!/bin/bash
# Injects full context on session start — V3 (March 7, 2026).
# Maintainer mandate #9: ingest the ENTIRE repo, not just current work.
# Auto-detects unread resources, reports staleness, loads everything Claude needs.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PROJECT_ROOT}"
TODAY=$(date '+%Y-%m-%d')
DAILY_FILE="$PROJECT_DIR/memory/daily/$TODAY.md"

echo "=== ENERGY PLATFORM — SESSION CONTEXT ==="
echo "Date: $TODAY"
echo ""

# Current state (first 20 lines of CONTEXT.md)
if [ -f "$PROJECT_DIR/CONTEXT.md" ]; then
  head -20 "$PROJECT_DIR/CONTEXT.md"
fi

echo ""
echo "=== MAINTAINER CHECKLIST (What the user Needs To Do) ==="
if [ -f "$PROJECT_DIR/MAINTAINER-CHECKLIST.md" ]; then
  cat "$PROJECT_DIR/MAINTAINER-CHECKLIST.md"
fi

echo ""
echo "=== MAINTAINER PROMPTS SUMMARY ==="
PROMPT_COUNT=$(find "$PROJECT_DIR/resources/maintainer-prompts" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "Total maintainer prompts: $PROMPT_COUNT"
# List all prompts with first line (title) for quick reference
for f in $(find "$PROJECT_DIR/resources/maintainer-prompts" -name "*.md" -type f 2>/dev/null | sort); do
  TITLE=$(head -1 "$f" | sed 's/^# //')
  echo "  - $(basename "$f"): $TITLE"
done

echo ""
echo "=== TODAY'S MEMORY ==="
if [ -f "$DAILY_FILE" ]; then
  tail -50 "$DAILY_FILE"
else
  echo "(First session today — no entries yet)"
fi

echo ""
echo "=== LONG-TERM MEMORY ==="
if [ -f "$PROJECT_DIR/memory/MEMORY.md" ]; then
  head -60 "$PROJECT_DIR/memory/MEMORY.md"
fi

echo ""
echo "=== LEARNINGS ==="
if [ -f "$PROJECT_DIR/memory/LEARNINGS.md" ]; then
  LEARNINGS_LINES=$(wc -l < "$PROJECT_DIR/memory/LEARNINGS.md" | tr -d ' ')
  echo "LEARNINGS.md: $LEARNINGS_LINES lines"
  if [ "$LEARNINGS_LINES" -gt 500 ]; then
    echo ">>> WARNING: LEARNINGS.md is $LEARNINGS_LINES lines (limit: 500). Run /memory compress to archive old entries."
  fi
  # Load compressed index: category headers + last 20 entries (not raw dump)
  echo "--- Recent entries (last 20) ---"
  tail -20 "$PROJECT_DIR/memory/LEARNINGS.md"
fi

echo ""
echo "=== RECENT COMMITS ==="
git -C "$PROJECT_DIR" log --oneline -10 2>/dev/null || echo "(no git history)"

# Auto-detect unread resources
UNREAD_COUNT=$(find "$PROJECT_DIR/resources/unread" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNREAD_COUNT" -gt 0 ]; then
  echo ""
  echo "=== ACTION REQUIRED: $UNREAD_COUNT UNREAD RESOURCES ==="
  echo "Files in resources/unread/:"
  find "$PROJECT_DIR/resources/unread" -name "*.md" -type f -exec basename {} \; 2>/dev/null
  echo ""
  echo ">>> Auto-process these with /integrate-resources before starting work."
fi

# Check git status for uncommitted work
MODIFIED=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | wc -l | tr -d ' ')
UNTRACKED=$(git -C "$PROJECT_DIR" ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
if [ "$MODIFIED" -gt 0 ] || [ "$UNTRACKED" -gt 0 ]; then
  echo ""
  echo "=== GIT STATUS: $MODIFIED modified, $UNTRACKED untracked ==="
fi

# Report last research date
LAST_DAILY=$(ls -1 "$PROJECT_DIR/memory/daily/" 2>/dev/null | sort -r | head -1)
if [ -n "$LAST_DAILY" ] && [ "$LAST_DAILY" != "$TODAY.md" ]; then
  echo ""
  echo "=== STALENESS: Last active session was ${LAST_DAILY%.md}. Consider running /research for updates. ==="
fi

# Skills & tools inventory (quick count)
echo ""
echo "=== INVENTORY ==="
SKILL_COUNT=$(find "$PROJECT_DIR/.claude/skills" -name "SKILL.md" -type f 2>/dev/null | wc -l | tr -d ' ')
RULE_COUNT=$(find "$PROJECT_DIR/.claude/rules" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
AGENT_COUNT=$(find "$PROJECT_DIR/.claude/agents" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
RESOURCE_COUNT=$(find "$PROJECT_DIR/resources/read" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "Skills: $SKILL_COUNT | Rules: $RULE_COUNT | Sub-agents: $AGENT_COUNT | Resources: $RESOURCE_COUNT | Maintainer prompts: $PROMPT_COUNT"

# MCP config summary
if [ -f "$PROJECT_DIR/.mcp.json" ]; then
  MCP_COUNT=$(grep -c '"command"' "$PROJECT_DIR/.mcp.json" 2>/dev/null || echo "0")
  echo "MCP servers configured: $MCP_COUNT"
fi

# Quick environment health
echo ""
echo "=== ENVIRONMENT HEALTH ==="
if [ -f "$PROJECT_DIR/packages/web/features.json" ]; then
  TOTAL=$(grep -c '"id":' "$PROJECT_DIR/packages/web/features.json" 2>/dev/null || echo "0")
  PASSING=$(grep -c '"passes": true' "$PROJECT_DIR/packages/web/features.json" 2>/dev/null || echo "0")
  echo "Features: $PASSING/$TOTAL passing"
fi
echo "TypeScript: $(cd "$PROJECT_DIR" && pnpm --filter @energy/web exec tsc --noEmit 2>&1 | grep -c 'error TS' || echo "0") errors"

# Load anchor state if it exists (post-compaction recovery)
ANCHOR_FILE="$PROJECT_DIR/.claude/anchor-state.md"
if [ -f "$ANCHOR_FILE" ]; then
  ANCHOR_AGE=$(( ($(date +%s) - $(stat -f %m "$ANCHOR_FILE" 2>/dev/null || echo "$(date +%s)")) / 60 ))
  if [ "$ANCHOR_AGE" -lt 120 ]; then
    echo ""
    echo "=== POST-COMPACTION ANCHOR STATE (${ANCHOR_AGE}m ago) ==="
    cat "$ANCHOR_FILE"
    echo ""
    echo ">>> IMPORTANT: Context was recently compacted. Read the anchor state above to recover."
    echo ">>> If compaction count >= 3, TELL the maintainer to start a new chat."
  else
    echo ""
    echo "=== NOTE: Stale anchor state found (${ANCHOR_AGE}m old). Ignoring. ==="
    rm -f "$ANCHOR_FILE"
  fi
fi

# Load last-session-output if it exists (auto-switch continuity)
LAST_OUTPUT_FILE="$PROJECT_DIR/.claude/last-session-output.md"
if [ -f "$LAST_OUTPUT_FILE" ]; then
  LAST_OUTPUT_AGE=$(( ($(date +%s) - $(stat -f %m "$LAST_OUTPUT_FILE" 2>/dev/null || echo "$(date +%s)")) / 60 ))
  if [ "$LAST_OUTPUT_AGE" -lt 60 ]; then
    echo ""
    echo "=== LAST SESSION FINAL STATE (${LAST_OUTPUT_AGE}m ago — auto-switch continuity) ==="
    cat "$LAST_OUTPUT_FILE"
    echo ""
    echo ">>> This was the final state of the previous session before it switched."
    echo ">>> Resume from where it left off."
  else
    rm -f "$LAST_OUTPUT_FILE"
  fi
fi

# Terminal-specific context loading
TERMINAL_CONTEXT="${CLAUDE_TERMINAL_CONTEXT:-}"
TERMINALS_DIR="$PROJECT_DIR/.claude/terminals"

if [ -n "$TERMINAL_CONTEXT" ] && [ -f "$TERMINALS_DIR/$TERMINAL_CONTEXT.md" ]; then
  echo ""
  echo "=== TERMINAL CONTEXT: $TERMINAL_CONTEXT ==="
  cat "$TERMINALS_DIR/$TERMINAL_CONTEXT.md"
elif [ -f "$TERMINALS_DIR/_shared.md" ]; then
  echo ""
  echo "=== TERMINAL CONTEXT: shared (set CLAUDE_TERMINAL_CONTEXT for specificity) ==="
  cat "$TERMINALS_DIR/_shared.md"
fi

# Terminal-specific handoff (if exists)
if [ -n "$TERMINAL_CONTEXT" ]; then
  TERMINAL_HANDOFF="$PROJECT_DIR/.claude/terminals/${TERMINAL_CONTEXT}-handoff.md"
  if [ -f "$TERMINAL_HANDOFF" ]; then
    HANDOFF_AGE=$(( ($(date +%s) - $(stat -f %m "$TERMINAL_HANDOFF" 2>/dev/null || echo "$(date +%s)")) / 60 ))
    if [ "$HANDOFF_AGE" -lt 120 ]; then
      echo ""
      echo "=== TERMINAL HANDOFF ($TERMINAL_CONTEXT — ${HANDOFF_AGE}m ago) ==="
      cat "$TERMINAL_HANDOFF"
    fi
  fi
fi

echo ""
echo "=== MEMORY HEALTH ==="
# Check memory archive directory
if [ -d "$PROJECT_DIR/memory/archive" ]; then
  ARCHIVE_COUNT=$(find "$PROJECT_DIR/memory/archive" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
  echo "Archive: $ARCHIVE_COUNT compressed files"
else
  echo ">>> WARNING: memory/archive/ does not exist. Run: mkdir -p memory/archive/"
fi
# Check MCP memory config
if [ -f "$PROJECT_DIR/.mcp.json" ]; then
  if grep -q '"memory"' "$PROJECT_DIR/.mcp.json" 2>/dev/null; then
    echo "Memory MCP: configured in .mcp.json"
  else
    echo ">>> WARNING: Memory MCP not found in .mcp.json. Run /mcp-setup to add it."
  fi
fi
# Check topic files health
TOPIC_COUNT=$(find "$PROJECT_DIR/memory/topics" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "Topic files: $TOPIC_COUNT | Use /memory search before starting work."

echo ""
echo "=== ARCHITECTURE REFERENCE ==="
echo "Read docs/vision/VISION.md lines 1-230 for the full TLDR + architecture."
echo "Read docs/architecture/SWARM-ARCHITECTURE.md for the meta-orchestration framework."

echo ""
echo "=== READY. You are a co-founder with full autonomy. Act accordingly. ==="
