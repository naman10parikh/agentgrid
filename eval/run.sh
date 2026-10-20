#!/usr/bin/env bash
# eval/run.sh: the full eval, run by `pnpm eval`, by CI on every push and pull request, and by the improvement loop.
#   L1  eval/smoke.sh      the TypeScript CLI builds and exposes its commands
#   L1  eval/surfaces.py   every install and call surface is present and well formed
#   L2  eval/golden.sh     golden behavioural tasks on a private tmux server, pass^k (k=3)
# A change that makes any of them fail is not merged.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
FAILED=""
[ -f dist/index.js ] || { echo "building first (dist/ missing)"; npx tsc || exit 1; }
bash eval/smoke.sh || FAILED="$FAILED smoke"
python3 eval/surfaces.py || FAILED="$FAILED surfaces"
bash eval/golden.sh || FAILED="$FAILED golden"
if [ -n "$FAILED" ]; then echo "EVAL FAIL:$FAILED"; exit 1; fi
echo "EVAL PASS: smoke, surfaces and golden"
