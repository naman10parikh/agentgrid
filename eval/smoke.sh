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

# 4. The bash CLI hands harness, init and generate to the TypeScript CLI (they used to print "Unknown command").
TMPD="$(mktemp -d "${TMPDIR:-/tmp}/agentgrid-smoke.XXXXXX")"
trap 'rm -rf "$TMPD"' EXIT
if (cd "$TMPD" && HOME="$TMPD" "$ROOT/agentgrid" init >/dev/null 2>&1) && [ -f "$TMPD/.agentgrid.json" ]; then
  ok "agentgrid init writes .agentgrid.json"; else bad "agentgrid init did not reach the TypeScript CLI"; fi
if (cd "$TMPD" && HOME="$TMPD" "$ROOT/agentgrid" generate smoke -t pair >/dev/null 2>&1) &&
   [ -f "$TMPD/.agentgrid/harnesses/smoke.yaml" ]; then
  ok "agentgrid generate writes a harness file"; else bad "agentgrid generate did not reach the TypeScript CLI"; fi
if (cd "$TMPD" && HOME="$TMPD" "$ROOT/agentgrid" harness list 2>&1) | grep -q "Harnesses"; then
  ok "agentgrid harness list runs"; else bad "agentgrid harness list did not reach the TypeScript CLI"; fi

# 5. Without the TypeScript build, the script says in one line how to get it.
#    The one-line installer copies the script alone; an unbuilt clone has src/ but no dist/.
mkdir -p "$TMPD/bin" "$TMPD/clone/src" && cp "$ROOT/agentgrid" "$TMPD/bin/" && cp "$ROOT/agentgrid" "$TMPD/clone/" &&
  touch "$TMPD/clone/src/index.ts"
for spec in "bin|npx -y -p github:naman10parikh/agentgrid agentgrid harness" "clone|npm install"; do
  where="${spec%%|*}"; want="${spec#*|}"
  MSG="$("$TMPD/$where/agentgrid" harness list 2>&1)"; RC=$?
  if [ "$RC" -ne 0 ] && [ "$(printf '%s\n' "$MSG" | wc -l | tr -d ' ')" = "1" ] && printf '%s' "$MSG" | grep -qF "$want"; then
    ok "an unbuilt copy ($where) says: $want"; else bad "an unbuilt copy ($where) said: $MSG"; fi
done

echo "=== RESULT: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
