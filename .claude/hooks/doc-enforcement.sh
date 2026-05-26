#!/bin/bash
# PostToolUse hook — warns when markdown files are created/edited
# WARNING only — never blocks (always exit 0)

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only process Write/Edit on .md files
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  exit 0
fi

if [[ "$FILE_PATH" != *.md ]]; then
  exit 0
fi

# Skip vault files, hooks, skills
if [[ "$FILE_PATH" == */vault/* || "$FILE_PATH" == */.claude/hooks/* || "$FILE_PATH" == */.claude/skills/* || "$FILE_PATH" == */.claude/plans/* ]]; then
  exit 0
fi

WARNINGS=""

# Check 1: Is this file in a directory with an INDEX.md?
DIR=$(dirname "$FILE_PATH")
if [[ -f "$DIR/INDEX.md" ]]; then
  BASENAME=$(basename "$FILE_PATH")
  if ! grep -q "$BASENAME" "$DIR/INDEX.md" 2>/dev/null; then
    WARNINGS="${WARNINGS}[DOC-HOOK] INDEX.md in $(basename $DIR)/ may need updating — new/modified file: $BASENAME\n"
  fi
fi

# Check 2: Does a corresponding vault note exist?
BASENAME=$(basename "$FILE_PATH" .md)
VAULT_DIR="$PROJECT_ROOT/vault"
if [[ -d "$VAULT_DIR" ]]; then
  VAULT_MATCH=$(grep -rl "$BASENAME" "$VAULT_DIR" --include="*.md" 2>/dev/null | head -1)
  if [[ -z "$VAULT_MATCH" ]]; then
    WARNINGS="${WARNINGS}[DOC-HOOK] No vault note references '$BASENAME'. Consider creating one in vault/.\n"
  fi
fi

if [[ -n "$WARNINGS" ]]; then
  echo -e "$WARNINGS" >&2
fi

exit 0
