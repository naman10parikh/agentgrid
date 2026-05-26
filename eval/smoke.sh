#!/usr/bin/env bash
# eval/smoke.sh — minimal CLI eval for agentgrid.
# The harness's "immune system": build the CLI, then assert the binary runs and
# exposes its core commands. Exit non-zero on any regression. Run from repo root:
#   bash eval/smoke.sh
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0; FAIL=0
ok()   { echo "  PASS  $1"; PASS=$((PASS+1)); }
bad()  { echo "  FAIL  $1"; FAIL=$((FAIL+1)); }

echo "=== agentgrid CLI smoke eval ==="

# 1. Build artifact exists (build is a prerequisite — run `pnpm build` first).
if [ -f "dist/index.js" ]; then ok "dist/index.js present"; else
  bad "dist/index.js missing — run 'pnpm build' first"; echo "RESULT: FAIL"; exit 1
fi

# 2. --version prints a semver.
VER="$(node dist/index.js --version 2>/dev/null || true)"
if printf '%s' "$VER" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+'; then ok "--version => $VER"; else
  bad "--version did not print a semver (got: '$VER')"; fi

# 3. --help lists the core commands.
HELP="$(node dist/index.js --help 2>/dev/null || true)"
for cmd in grid start status broadcast send save restore; do
  if printf '%s' "$HELP" | grep -qE "^[[:space:]]*$cmd"; then ok "help lists '$cmd'"; else
    bad "help missing command '$cmd'"; fi
done

echo "=== RESULT: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
