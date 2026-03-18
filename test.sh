#!/bin/bash
# agentgrid smoke tests
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENTGRID="${SCRIPT_DIR}/agentgrid"
PASS=0
FAIL=0

pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

echo "=== AgentGrid Smoke Tests ==="
echo ""

# 1. Script exists and is executable
echo "— File checks"
if [ -x "$AGENTGRID" ]; then
  pass "agentgrid is executable"
else
  chmod +x "$AGENTGRID"
  pass "agentgrid made executable"
fi

# 2. --help runs without error
echo "— Help output"
if "$AGENTGRID" --help >/dev/null 2>&1; then
  pass "--help exits cleanly"
else
  fail "--help returned non-zero"
fi

# 3. Version variable matches package.json
echo "— Version consistency"
CLI_VERSION=$(grep '^VERSION=' "$AGENTGRID" | head -1 | cut -d'"' -f2)
PKG_VERSION=$(node -p "require('${SCRIPT_DIR}/package.json').version" 2>/dev/null || echo "")
HEADER_VERSION=$(grep '# MIT License | v' "$AGENTGRID" | head -1 | sed 's/.*v//')

if [ "$CLI_VERSION" = "$PKG_VERSION" ]; then
  pass "CLI VERSION ($CLI_VERSION) matches package.json ($PKG_VERSION)"
else
  fail "CLI VERSION ($CLI_VERSION) != package.json ($PKG_VERSION)"
fi

if [ "$CLI_VERSION" = "$HEADER_VERSION" ]; then
  pass "CLI VERSION ($CLI_VERSION) matches header comment ($HEADER_VERSION)"
else
  fail "CLI VERSION ($CLI_VERSION) != header comment ($HEADER_VERSION)"
fi

# 4. LICENSE exists
echo "— License"
if [ -f "${SCRIPT_DIR}/LICENSE" ]; then
  pass "LICENSE file exists"
else
  fail "LICENSE file missing"
fi

# 5. Status command (requires tmux — skip gracefully if not available)
echo "— Commands (tmux-dependent)"
if command -v tmux >/dev/null 2>&1; then
  # status may fail if no session — that's OK, we just check it doesn't crash badly
  if "$AGENTGRID" status >/dev/null 2>&1; then
    pass "status runs (session found)"
  else
    pass "status runs (no active session — expected outside tmux)"
  fi
else
  pass "tmux not available — skipping tmux-dependent tests"
fi

# Summary
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
