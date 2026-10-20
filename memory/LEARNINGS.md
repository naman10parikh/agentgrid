# agentgrid — LEARNINGS (append-only)

Every error → root cause → rule. Auto-compressed when >500 lines (memory-compress.sh).

## 2026-05-25 — Two workspaces, two test gates

**What:** The CLI (`src/`, `pnpm test`) and the desktop app (`app/`, `pnpm --dir app test`)
are separate pnpm workspaces with separate dependency trees.
**Root cause:** v2.0.0 split a single bash script into a TS CLI plus an Electron app; the app
depends on the native `node-pty` module built by its own postinstall.
**Rule:** A change is only "done" when the gate for the surface it touched is green. Verify
the CLI with `pnpm build && pnpm test` (37 tests) and the app with `pnpm --dir app test`
(475 tests) — don't assume one covers the other.

## 2026-05-25 — IPC channels have one source of truth

**What:** Electron main↔renderer channels could drift if redeclared in multiple files.
**Root cause:** Typed IPC needs the renderer and main to agree on channel names/shapes.
**Rule:** Declare every channel once in `app/packages/shared/src/types.ts` (`IPCChannels`),
extend that interface to add channels, and let `docs/IPC-PROTOCOL.md` document it. Never
hand-write a channel string elsewhere.

## 2026-05-25 — `tmux select-pane` steals the user's focus

**What:** Selecting a pane programmatically yanks the user's cursor mid-task.
**Root cause:** `select-pane` is a focus-changing operation, not a read.
**Rule:** Banned in agentgrid code and scripts. Read panes with `tmux capture-pane`; drive
them with `tmux send-keys`.


## 2026-10-19 — `((c++))` stops a bash 5 script under `set -e`

**What:** `agentgrid broadcast` reached only the first pane on Linux, and `agentgrid status` stopped after the first
idle pane. macOS (bash 3.2) hid it.
**Root cause:** from bash 4.1, `set -e` treats `((expr))` that evaluates to 0 as a failure, and `c++` evaluates to the
old value, 0, on the first pass. The golden eval proved it inside a Linux sandbox.
**Rule:** count with `c=$((c+1))`, never `((c++))`, in any script that runs under `set -e`. Run the golden eval on
Linux (CI does) before calling a shell change done.

## 2026-10-19 — Claude Code hooks read JSON from stdin

**What:** the PostToolUse audit hook logged nothing in real sessions.
**Root cause:** it read `CLAUDE_TOOL_NAME`, which Claude Code does not set; the payload arrives as JSON on stdin
(`tool_name`, `tool_input.file_path`).
**Rule:** a hook reads its stdin payload first and falls back to environment variables. Test a hook by piping a real
payload into it and checking the side effect.

## 2026-10-19 — Tool input never reaches a shell

**What:** the MCP server built shell strings (`execSync("agentgrid send ... \"msg\"")`), escaping only double quotes,
so a message holding `$(...)` or backticks would have run on the host.
**Root cause:** string commands go through `/bin/sh`.
**Rule:** pass tool input to commands as an argument array (`execFileSync(cmd, args)`), never inside a command string.

## 2026-10-19 — `npm install -g github:...` cannot build a TypeScript package

**What:** `npm install -g github:naman10parikh/agentgrid` failed with `tsc: command not found`, while
`npx -y -p github:naman10parikh/agentgrid` worked.
**Root cause:** for a global install, npm prepares a git dependency without its dev dependencies, so the `prepare`
script cannot find TypeScript.
**Rule:** document `npx -y -p github:...` for one-off runs and `git clone ... && npm install && npm install -g .` for a
kept copy. Never advertise an install line that was not run from an empty folder.

## 2026-10-19 — install-all could install a stranger's package

**What broke:** four agent install commands pointed at the wrong thing: `npm i -g opencode` and
`@anthropic-ai/cline` do not exist, `hermes-cli` on npm is an unrelated tool, `brew install goose` is a database
migration tool, and the `cursor` cask is the editor, not its agent CLI.
**Root cause:** the commands were written from memory, never checked against npm or Homebrew.
**Rule:** an install command is added only after `npm view` or `brew info` shows the vendor's package, and it goes
into `install-allowlist.json` with its source; a test fails for any command not listed. An agent with no verifiable
package gets its vendor's install page instead of a command.

> Inherited cross-cutting rules live in `.claude/rules/` and are glob-loaded every session.
> Append new entries above this line as they are discovered.
