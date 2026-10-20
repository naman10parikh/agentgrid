#!/usr/bin/env bash
# eval/golden.sh: golden behavioural tasks for agentgrid's job, which is to spawn, drive and track a grid of agents.
#
# Every task runs the real thing: the bash CLI, the MCP server (dist/mcp-server.js) and the plugin hook command read
# from hooks/hooks.json. All of it runs against a private tmux server (tmux -L <name>), so the user's own tmux is never
# touched. Pass^k: the whole lifecycle must pass K rounds in a row (default 3), because one pass is not evidence.
#
#   pnpm build && bash eval/golden.sh      needs tmux, python3 and node
#   AG_EVAL_K=1 bash eval/golden.sh        one round, for a quick local check
#
# Writes a JSON summary to logs/eval-golden.json (gitignored), which the improvement loop reads.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

K="${AG_EVAL_K:-3}"
SOCK="agentgrid-eval-$$"
SESSION="ageval"
OUT="${AG_EVAL_OUT:-$ROOT/logs/eval-golden.json}"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/agentgrid-eval.XXXXXX")"
unset TMUX TMUX_PANE
export AGENTGRID_RUN_LOG="$TMP/runs.jsonl"   # the panes and the MCP server inherit it

T() { tmux -L "$SOCK" "$@"; }
cleanup() { T kill-server >/dev/null 2>&1; rm -rf "$TMP"; }
trap cleanup EXIT

for dep in tmux python3 node; do
  command -v "$dep" >/dev/null 2>&1 || { echo "FAIL: $dep is required for the golden eval"; exit 1; }
done
[ -f dist/mcp-server.js ] || { echo "FAIL: dist/mcp-server.js missing, run 'pnpm build' first"; exit 1; }

PASS=0; FAIL=0; LOG=""
ok()  { echo "  PASS  r$ROUND $1"; PASS=$((PASS+1)); LOG="$LOG{\"round\":$ROUND,\"task\":\"$1\",\"pass\":true},"; }
bad() { echo "  FAIL  r$ROUND $1: $2"; FAIL=$((FAIL+1)); LOG="$LOG{\"round\":$ROUND,\"task\":\"$1\",\"pass\":false},"; }

# wait_for <seconds> <command...>: poll every 0.2s until the command succeeds.
wait_for() {
  local limit=$(( $1 * 5 )) i=0; shift
  while [ "$i" -lt "$limit" ]; do "$@" >/dev/null 2>&1 && return 0; sleep 0.2; i=$((i+1)); done
  return 1
}
panes() { T list-panes -t "$SESSION:1" 2>/dev/null | wc -l | tr -d ' '; }
has_panes() { [ "$(panes)" = "$1" ]; }
file_exists() { [ -s "$1" ]; }
# The token is the command's output, never its typed text (the pane types `echo X_$((40+2))` and prints X_42).
pane_shows() { T capture-pane -p -t "$SESSION:1.$1" 2>/dev/null | grep -q "$2"; }
all_panes_show() { local p; for p in 1 2 3 4; do pane_shows "$p" "$1" || return 1; done; }
pane_status_is() { [ "$(T display-message -p -t "$SESSION:1.$1" '#{@pane_status}' 2>/dev/null)" = "$2" ]; }

# run_step <name> <script body>: run a shell script inside pane 1 (as a user would), wait for its exit code.
run_step() {
  printf '%s\n' "$2" > "$TMP/$1.sh"
  T send-keys -t "$SESSION:1.1" "sh '$TMP/$1.sh' > '$TMP/$1.out' 2>&1; echo \$? > '$TMP/$1.rc'" Enter
  wait_for 20 file_exists "$TMP/$1.rc"
}

hook_cmd() {  # the command the plugin runs on an event, read from hooks/hooks.json
  python3 -c "import json,sys; print(json.load(open('hooks/hooks.json'))['hooks'][sys.argv[1]][0]['hooks'][0]['command'])" "$1"
}

mcp_session() {  # drive the MCP server over stdio; prints one JSON result per line
  SOCKET_PATH="$(T display-message -p '#{socket_path}')" ROOT="$ROOT" SESSION="$SESSION" python3 - <<'PY'
import json, os, subprocess
env = dict(os.environ)
env["PATH"] = os.environ["ROOT"] + os.pathsep + env["PATH"]       # `agentgrid` resolves to this checkout
env["TMUX"] = os.environ["SOCKET_PATH"] + ",0,0"                    # point the CLI at the private server
calls = [
    {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
    {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
    {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "grid_status", "arguments": {}}},
    {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "pane_send",
        "arguments": {"pane": os.environ["SESSION"] + ":1.3", "message": "echo AGMCP_$((6*7))"}}},
]
p = subprocess.run(["node", "dist/mcp-server.js"], input="\n".join(json.dumps(c) for c in calls) + "\n",
                   capture_output=True, text=True, env=env, timeout=60)
by_id = {}
for line in p.stdout.splitlines():
    try:
        msg = json.loads(line)
        by_id[msg["id"]] = msg
    except (ValueError, KeyError):
        pass
tools = by_id.get(2, {}).get("result", {}).get("tools", [])
status_text = by_id.get(3, {}).get("result", {}).get("content", [{}])[0].get("text", "")
try:
    status_panes = len(json.loads(status_text).get("panes", []))
except ValueError:
    status_panes = -1
send_text = by_id.get(4, {}).get("result", {}).get("content", [{}])[0].get("text", "")
print(json.dumps({"init": by_id.get(1, {}).get("result", {}).get("serverInfo", {}).get("name"),
                  "tools": len(tools), "status_panes": status_panes, "send": send_text[:120]}))
PY
}

printf 'set -g base-index 1\nsetw -g pane-base-index 1\nset -g default-command "bash --norc --noprofile"\n' > "$TMP/tmux.conf"
echo "=== agentgrid golden eval: $K round(s) on a private tmux server ==="
START=$(date +%s)
ROUND=1
while [ "$ROUND" -le "$K" ]; do
  rm -f "$TMP"/*.rc
  T -f "$TMP/tmux.conf" new-session -d -s "$SESSION" -x 200 -y 50

  # G1: one command spawns a 2x2 grid with an agent (sh stands in for a coding agent) in every pane.
  T send-keys -t "$SESSION:1.1" "cd '$ROOT' && ./agentgrid 2x2 sh; echo \$? > '$TMP/grid.rc'" Enter
  if wait_for 20 file_exists "$TMP/grid.rc" && [ "$(cat "$TMP/grid.rc")" = "0" ] && wait_for 10 has_panes 4; then
    ok "grid-2x2-spawns-4-panes"
  else bad "grid-2x2-spawns-4-panes" "panes=$(panes)"; fi
  sleep 1  # let each pane start its agent

  # G2: status --json reports every pane, machine-readable.
  if run_step status "'$ROOT/agentgrid' status --json" &&
     [ "$(python3 -c "import json; print(len(json.load(open('$TMP/status.out'))['panes']))" 2>/dev/null)" = "4" ]; then
    ok "status-json-lists-4-panes"
  else bad "status-json-lists-4-panes" "$(head -c 200 "$TMP/status.out" 2>/dev/null)"; fi

  # G3: broadcast reaches every pane, and every pane's agent runs it (the output differs from the typed text).
  if run_step broadcast "'$ROOT/agentgrid' broadcast 'echo AGEVAL_\$((40+2))'" && wait_for 10 all_panes_show AGEVAL_42; then
    ok "broadcast-runs-in-all-4-panes"
  else bad "broadcast-runs-in-all-4-panes" "$(cat "$TMP/broadcast.out" 2>/dev/null | tail -2) | $(for q in 1 2 3 4; do printf 'pane %s: %s / ' "$q" "$(T capture-pane -p -t "$SESSION:1.$q" | grep -v '^$' | tail -2 | tr '\n' ' ')"; done)"; fi

  # G4: the plugin's hook commands (hooks/hooks.json) color a pane: running, then done.
  # Claude Code exports CLAUDE_PLUGIN_ROOT to the hook process; the pane does the same here.
  T send-keys -t "$SESSION:1.2" "export CLAUDE_PLUGIN_ROOT='$ROOT'; $(hook_cmd UserPromptSubmit)" Enter
  if wait_for 10 pane_status_is 2 running; then
    T send-keys -t "$SESSION:1.2" "$(hook_cmd Stop)" Enter
    if wait_for 10 pane_status_is 2 done; then ok "plugin-hooks-set-pane-status"
    else bad "plugin-hooks-set-pane-status" "Stop hook did not set done"; fi
  else bad "plugin-hooks-set-pane-status" "UserPromptSubmit hook did not set running"; fi

  # G5: another coding agent drives the grid through the MCP server: list tools, read status, send to one pane.
  MCP="$(mcp_session 2>/dev/null)"
  if [ "$(printf '%s' "$MCP" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["init"]=="agentgrid" and d["tools"]==15 and d["status_panes"]==4)' 2>/dev/null)" = "True" ] &&
     wait_for 10 pane_shows 3 AGMCP_42; then
    ok "mcp-status-and-pane-send"
  else bad "mcp-status-and-pane-send" "$MCP"; fi

  # G6: kill clears the grid back to one pane.
  if run_step kill "'$ROOT/agentgrid' kill" && wait_for 10 has_panes 1; then ok "kill-clears-to-1-pane"
  else bad "kill-clears-to-1-pane" "panes=$(panes)"; fi

  # G7: every state-changing action left a line in the append-only run log (bash CLI and MCP path alike).
  if python3 - "$AGENTGRID_RUN_LOG" <<'PY'
import json, sys
seen = {json.loads(l)["command"] for l in open(sys.argv[1]) if l.strip()}
sys.exit(0 if {"grid", "broadcast", "send", "kill"} <= seen else 1)
PY
  then ok "run-log-records-grid-broadcast-send-kill"
  else bad "run-log-records-grid-broadcast-send-kill" "$(cut -c1-80 "$AGENTGRID_RUN_LOG" 2>/dev/null | tr '\n' ' ')"; fi
  rm -f "$AGENTGRID_RUN_LOG"

  T kill-server >/dev/null 2>&1
  ROUND=$((ROUND+1))
done

SECS=$(( $(date +%s) - START ))
TOTAL=$((PASS+FAIL))
mkdir -p "$(dirname "$OUT")"
printf '{"eval":"golden","k":%s,"pass":%s,"fail":%s,"total":%s,"seconds":%s,"results":[%s]}\n' \
  "$K" "$PASS" "$FAIL" "$TOTAL" "$SECS" "${LOG%,}" > "$OUT"
echo "=== golden: $PASS/$TOTAL passed over $K round(s) in ${SECS}s ==="
[ "$FAIL" -eq 0 ]
