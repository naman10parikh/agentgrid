#!/usr/bin/env bash
# SessionStart hook for contributors working inside this repository (wired in .claude/settings.json).
# Prints who this agent employee is, its memory bootstrap and the newest rules from LEARNINGS.md, so a coding agent
# starts every session with the repository's own context. Fast and read-only: no network, no build.
set -uo pipefail
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT" || exit 0

echo "=== agentgrid (Lattice): spawn and run grids of coding agents ==="
VERSION="$(grep -m1 '^VERSION=' agentgrid 2>/dev/null | cut -d'"' -f2)"
echo "Version: ${VERSION:-unknown} · Branch: $(git branch --show-current 2>/dev/null || echo '?')"
echo
if [ -f memory/MEMORY.md ]; then
  echo "--- memory/MEMORY.md (bootstrap) ---"
  sed -n '1,40p' memory/MEMORY.md
  echo
fi
if [ -f memory/LEARNINGS.md ]; then
  echo "--- newest rules (memory/LEARNINGS.md) ---"
  grep -E '^\*\*Rule:\*\*' memory/LEARNINGS.md | tail -5
  echo
fi
echo "Search everything: agentgrid memory-search \"<query>\" · Tests: pnpm test · Evals: pnpm eval"
exit 0
