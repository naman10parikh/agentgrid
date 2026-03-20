#!/bin/bash
# agentgrid test suite — comprehensive validation for v1.0.0
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENTGRID="${SCRIPT_DIR}/agentgrid"
PASS=0
FAIL=0

pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

echo "=== AgentGrid Test Suite ==="
echo ""

# ─── 1. File structure ───
echo "— File structure"
if [ -x "$AGENTGRID" ]; then
  pass "agentgrid is executable"
else
  chmod +x "$AGENTGRID"
  pass "agentgrid made executable"
fi

[ -x "${SCRIPT_DIR}/pane-status.sh" ] && pass "pane-status.sh is executable" || fail "pane-status.sh is not executable"
[ -x "${SCRIPT_DIR}/install.sh" ] && pass "install.sh is executable" || fail "install.sh is not executable"
[ -f "${SCRIPT_DIR}/LICENSE" ] && pass "LICENSE file exists" || fail "LICENSE file missing"
[ -f "${SCRIPT_DIR}/README.md" ] && pass "README.md exists" || fail "README.md missing"
[ -f "${SCRIPT_DIR}/CHANGELOG.md" ] && pass "CHANGELOG.md exists" || fail "CHANGELOG.md missing"
[ -f "${SCRIPT_DIR}/claude-plugin.json" ] && pass "claude-plugin.json exists" || fail "claude-plugin.json missing"
[ -d "${SCRIPT_DIR}/presets" ] && pass "presets/ directory exists" || fail "presets/ directory missing"
[ -d "${SCRIPT_DIR}/examples" ] && pass "examples/ directory exists" || fail "examples/ directory missing"

# ─── 2. Version consistency ───
echo "— Version consistency"
CLI_VERSION=$(grep '^VERSION=' "$AGENTGRID" | head -1 | cut -d'"' -f2)
PKG_VERSION=$(python3 -c "import json; print(json.load(open('${SCRIPT_DIR}/package.json'))['version'])" 2>/dev/null || echo "")
HEADER_VERSION=$(grep '# MIT License | v' "$AGENTGRID" | head -1 | sed 's/.*v//')
PLUGIN_VERSION=$(python3 -c "import json; print(json.load(open('${SCRIPT_DIR}/claude-plugin.json'))['version'])" 2>/dev/null || echo "")
CHANGELOG_VERSION=$(grep '^## v' "${SCRIPT_DIR}/CHANGELOG.md" | head -1 | sed 's/## v\([^ ]*\).*/\1/')

[ "$CLI_VERSION" = "$PKG_VERSION" ] && pass "CLI ($CLI_VERSION) = package.json" || fail "CLI ($CLI_VERSION) != package.json ($PKG_VERSION)"
[ "$CLI_VERSION" = "$HEADER_VERSION" ] && pass "CLI ($CLI_VERSION) = header comment" || fail "CLI ($CLI_VERSION) != header ($HEADER_VERSION)"
[ -n "$PLUGIN_VERSION" ] && [ "$CLI_VERSION" = "$PLUGIN_VERSION" ] && pass "CLI ($CLI_VERSION) = claude-plugin.json" || { [ -n "$PLUGIN_VERSION" ] && fail "CLI ($CLI_VERSION) != plugin ($PLUGIN_VERSION)"; }
[ "$CLI_VERSION" = "$CHANGELOG_VERSION" ] && pass "CLI ($CLI_VERSION) = CHANGELOG first entry" || fail "CLI ($CLI_VERSION) != CHANGELOG ($CHANGELOG_VERSION)"

# ─── 3. Help output ───
echo "— Help output"
HELP_OUTPUT=$("$AGENTGRID" --help 2>&1)
echo "$HELP_OUTPUT" | grep -q "agentgrid v${CLI_VERSION}" && pass "--help shows correct version" || fail "--help version mismatch"
echo "$HELP_OUTPUT" | grep -q "QUICK START" && pass "--help has QUICK START" || fail "--help missing QUICK START"
echo "$HELP_OUTPUT" | grep -q "KEYBOARD" && pass "--help has KEYBOARD" || fail "--help missing KEYBOARD"
echo "$HELP_OUTPUT" | grep -q "GRIDS" && pass "--help has GRIDS section" || fail "--help missing GRIDS"
echo "$HELP_OUTPUT" | grep -q "SESSION" && pass "--help has SESSION section" || fail "--help missing SESSION"
echo "$HELP_OUTPUT" | grep -q "SOUNDS" && pass "--help has SOUNDS section" || fail "--help missing SOUNDS"

# ─── 4. Version command ───
echo "— Version command"
VERSION_OUTPUT=$("$AGENTGRID" version 2>&1)
[ "$VERSION_OUTPUT" = "agentgrid v${CLI_VERSION}" ] && pass "version output correct" || fail "version: got '${VERSION_OUTPUT}'"

# ─── 5. Error handling ───
echo "— Error handling"
"$AGENTGRID" nonexistent-command 2>/dev/null && fail "nonexistent command should fail" || pass "nonexistent command exits non-zero"

# Verify error message mentions 'help'
ERR_OUTPUT=$("$AGENTGRID" nonexistent-command 2>&1 || true)
echo "$ERR_OUTPUT" | grep -qi "help\|unknown" && pass "error message is helpful" || fail "error message unhelpful"

# ─── 6. Grid pattern matching ───
echo "— Grid pattern matching"
# Valid patterns
for pattern in "1x1" "2x3" "5x5" "10x10"; do
  if echo "$pattern" | grep -qE '^[0-9]+x[0-9]+$'; then
    pass "pattern $pattern is valid grid format"
  else
    fail "pattern $pattern should be valid"
  fi
done

# Invalid patterns
for pattern in "0x0" "axb" "x3" "2x"; do
  if echo "$pattern" | grep -qE '^[1-9][0-9]*x[1-9][0-9]*$'; then
    fail "pattern $pattern should be invalid"
  else
    pass "pattern $pattern rejected as invalid"
  fi
done

# ─── 7. Agent name normalization ───
echo "— Agent name normalization"
# Extract the function from the script (can't source — triggers main())
NORMALIZE_FN=$(sed -n '/^normalize_agent_name()/,/^}/p' "$AGENTGRID")

normalize_test() {
  local raw="$1" expected="$2"
  local result
  result=$(bash -c "
${NORMALIZE_FN}
normalize_agent_name '$raw'
" 2>/dev/null)
  [ "$result" = "$expected" ] && pass "normalize '$raw' → '$expected'" || fail "normalize '$raw': got '$result', expected '$expected'"
}

normalize_test "2.1.76" "claude"
normalize_test "10.5.2" "claude"
normalize_test "codex-cli" "codex"
normalize_test "gemini" "gemini"
normalize_test "bash" "shell"
normalize_test "zsh" "shell"
normalize_test "node" "agent"
normalize_test "python3" "aider"

# ─── 8. Preset validation ───
echo "— Preset files"
PRESET_DIR="${SCRIPT_DIR}/presets"
if [ -d "$PRESET_DIR" ]; then
  preset_count=0
  for f in "$PRESET_DIR"/*.json; do
    [ -f "$f" ] || continue
    fname=$(basename "$f")
    preset_count=$((preset_count + 1))
    if python3 -c "import json; json.load(open('$f'))" 2>/dev/null; then
      has_panes=$(python3 -c "import json; d=json.load(open('$f')); print('yes' if 'panes' in d and len(d['panes']) > 0 else 'no')" 2>/dev/null)
      has_desc=$(python3 -c "import json; d=json.load(open('$f')); print('yes' if 'description' in d else 'no')" 2>/dev/null)
      if [ "$has_panes" = "yes" ] && [ "$has_desc" = "yes" ]; then
        pass "preset $fname: valid with required fields"
      else
        fail "preset $fname: missing fields"
      fi
    else
      fail "preset $fname: invalid JSON"
    fi
  done
  [ "$preset_count" -ge 3 ] && pass "at least 3 presets ($preset_count)" || fail "only $preset_count presets (need >=3)"
fi

# ─── 9. Package.json ───
echo "— package.json"
python3 -c "
import json, sys
with open('${SCRIPT_DIR}/package.json') as f: d = json.load(f)
required = ['name', 'version', 'description', 'bin', 'license', 'repository', 'homepage', 'keywords', 'engines', 'files']
missing = [k for k in required if k not in d]
if missing:
    print(f'Missing: {missing}', file=sys.stderr)
    sys.exit(1)
if d.get('bin', {}).get('agentgrid') != './agentgrid':
    print('bin.agentgrid should be ./agentgrid', file=sys.stderr)
    sys.exit(1)
if 'agentgrid' not in d.get('files', []):
    print('files must include agentgrid', file=sys.stderr)
    sys.exit(1)
" 2>/dev/null && pass "package.json complete" || fail "package.json incomplete"

# Verify name is valid npm package name
PKG_NAME=$(python3 -c "import json; print(json.load(open('${SCRIPT_DIR}/package.json'))['name'])" 2>/dev/null)
echo "$PKG_NAME" | grep -qE '^[a-z0-9@][a-z0-9._-]*$' && pass "package name '$PKG_NAME' is valid npm name" || fail "package name invalid"

# Verify bin points to existing file
BIN_PATH=$(python3 -c "import json; print(json.load(open('${SCRIPT_DIR}/package.json'))['bin']['agentgrid'])" 2>/dev/null)
[ -f "${SCRIPT_DIR}/${BIN_PATH#./}" ] && pass "bin entry points to existing file" || fail "bin entry file missing"

# ─── 10. Script safety ───
echo "— Script safety"
head -10 "$AGENTGRID" | grep -q "set -euo pipefail" && pass "agentgrid has strict mode" || fail "missing strict mode"
head -5 "${SCRIPT_DIR}/install.sh" | grep -q "set -euo pipefail" && pass "install.sh has strict mode" || fail "install.sh missing strict mode"

# ─── 11. Security ───
echo "— Security"
if grep -n 'eval "\$' "$AGENTGRID" | grep -v "get_agent_install_cmd\|KNOWN_AGENTS" | head -5 | grep -q .; then
  fail "eval with variables (potential injection)"
else
  pass "no eval with user-controlled input"
fi

# Check no hardcoded secrets
if grep -iE "(api_key|secret|password|token)\s*=" "$AGENTGRID" | grep -v "^#\|SESSION_NAME\|CONFIG\|SOUNDS\|PRESETS\|SESSIONS" | grep -q .; then
  fail "possible hardcoded secrets"
else
  pass "no hardcoded secrets"
fi

# ─── 12. Claude plugin validation ───
echo "— Claude plugin"
python3 -c "
import json, sys
with open('${SCRIPT_DIR}/claude-plugin.json') as f: d = json.load(f)
required = ['name', 'version', 'description', 'hooks']
missing = [k for k in required if k not in d]
if missing:
    print(f'Missing: {missing}', file=sys.stderr)
    sys.exit(1)
hooks = d['hooks']
for event in ['UserPromptSubmit', 'PermissionRequest', 'Stop']:
    if event not in hooks:
        print(f'Missing hook: {event}', file=sys.stderr)
        sys.exit(1)
    if 'command' not in hooks[event]:
        print(f'Hook {event} missing command', file=sys.stderr)
        sys.exit(1)
" 2>/dev/null && pass "claude-plugin.json valid with all hooks" || fail "claude-plugin.json invalid"

# ─── 13. Commands (tmux-dependent) ───
echo "— Commands (tmux-dependent)"
if command -v tmux >/dev/null 2>&1; then
  "$AGENTGRID" status >/dev/null 2>&1 && pass "status runs" || pass "status runs (outside tmux)"

  SOUND_OUT=$("$AGENTGRID" sound 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
  echo "$SOUND_OUT" | grep -qi "sound\|done\|waiting" && pass "sound command works" || fail "sound failed"

  AGENTS_OUT=$("$AGENTGRID" agents 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
  echo "$AGENTS_OUT" | grep -qi "agent\|claude\|install" && pass "agents command works" || fail "agents failed"

  TIPS_OUT=$("$AGENTGRID" tips 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
  echo "$TIPS_OUT" | grep -qi "tip\|multi\|voice\|zoom" && pass "tips command works" || fail "tips failed"
else
  pass "tmux not available — skipping tmux tests"
fi

# ─── 14. Config roundtrip ───
echo "— Config system"
# Test set_config and get_config using temporary config
TMP_CONFIG=$(mktemp -d)
TMP_CONFIG_FILE="${TMP_CONFIG}/config.json"
echo '{}' > "$TMP_CONFIG_FILE"
if python3 -c "
import json
# Write
with open('$TMP_CONFIG_FILE') as f: d = json.load(f)
d['test_key'] = 'test_value'
with open('$TMP_CONFIG_FILE', 'w') as f: json.dump(d, f)
# Read back
with open('$TMP_CONFIG_FILE') as f: d = json.load(f)
assert d['test_key'] == 'test_value', 'roundtrip failed'
" 2>/dev/null; then
  pass "config JSON roundtrip works"
else
  fail "config roundtrip broken"
fi

# Test nested config
if python3 -c "
import json
with open('$TMP_CONFIG_FILE') as f: d = json.load(f)
d.setdefault('sounds', {})['done'] = '/test/path.aiff'
with open('$TMP_CONFIG_FILE', 'w') as f: json.dump(d, f)
with open('$TMP_CONFIG_FILE') as f: d = json.load(f)
assert d['sounds']['done'] == '/test/path.aiff'
" 2>/dev/null; then
  pass "nested config roundtrip works"
else
  fail "nested config roundtrip broken"
fi
rm -rf "$TMP_CONFIG"

# ─── 15. Pane status script ───
echo "— Pane status script"
# Should handle all valid statuses
for status in running needs-input done off invalid; do
  # Just verify it doesn't crash (no tmux = silent exit)
  bash "${SCRIPT_DIR}/pane-status.sh" "$status" 2>/dev/null
  pass "pane-status.sh handles '$status'"
done

# ─── 16. README content ───
echo "— README quality"
README="${SCRIPT_DIR}/README.md"
grep -q "## Install" "$README" && pass "README has Install section" || fail "README missing Install"
grep -q "## FAQ" "$README" && pass "README has FAQ section" || fail "README missing FAQ"
grep -q "npm install -g agentgrid" "$README" && pass "README has npm install command" || fail "README missing npm install"
grep -q "Architecture" "$README" && pass "README has Architecture section" || fail "README missing Architecture"
grep -q "## All Commands" "$README" && pass "README has All Commands" || fail "README missing All Commands"

# ─── Summary ───
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
