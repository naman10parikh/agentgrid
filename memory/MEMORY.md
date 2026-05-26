# agentgrid — Long-Term Memory (index)

> Inherited memory-harness structure from Energy. One line per durable fact.
> Layers: this index → topics/ deep-dives → daily/ logs → archive/ (compressed >30d, never deleted).

## Architecture Decisions

- agentgrid is two surfaces in one repo: a published **TypeScript CLI** (`src/` → `dist/index.js`) and an optional **Electron desktop app** (`app/`, separate pnpm workspace). The CLI is the npm package; the app is built independently because it needs the native `node-pty` module.
- Built on **tmux**, not a custom daemon/server. Grids are tmux panes (`split-window` + `select-layout tiled`); per-pane metadata uses custom tmux options `@pane_status` and `@pane_label`.
- IPC for the app has a **single source of truth**: `app/packages/shared/src/types.ts` (`IPCChannels`). `docs/IPC-PROTOCOL.md` documents it; never redeclare channels elsewhere.
- Rewritten bash → TypeScript + Electron at **v2.0.0** while keeping the `agentgrid` CLI command surface backward-compatible.

## Key Patterns

- **Status color contract:** ⚡ WORKING (blue) · ⏳ WAITING (yellow) · ✅ DONE (green). Hook-capable agents (Claude/Codex/OpenCode) set status via `pane-status.sh`; others use exit-code detection.
- **Two independent test gates:** CLI `pnpm test` (37 tests) and app `pnpm --dir app test` (475 tests) — green the gate for whichever surface you touched.
- **Never `tmux select-pane`** in code/scripts (steals user focus). Use `capture-pane` to read, `send-keys` to drive.
- **Sound through DND:** `afplay` (macOS) / `paplay` (Linux) play alerts even under Do Not Disturb / Focus.

## Technology Choices

- CLI deps: `commander` (arg parsing), `chalk` (color), `yaml` (harness/preset parsing). Strict TypeScript, named exports, files < 400 lines.
- App stack: Electron + electron-vite + React + xterm.js (WebGL renderer, Unicode11, Sixel), vitest (unit) + Playwright (e2e).
- Distribution: npm (`agentgrid`), one-line `install.sh`, and a Homebrew tap (`Formula/`, `app/homebrew/`).
- Bash 3.2 floor for shell pieces (`install.sh`, `pane-status.sh`) — stock macOS has no associative arrays.

## People & Resources

- Author/maintainer: the repo owner (`naman10parikh` on GitHub/npm).
- Prior-art research: `docs/COLLABORATOR-ANALYSIS.md` + `COLLAB-UI-RESEARCH.md` (patterns only — comparable tool is FSL-1.1 licensed, no code copied).

## What NOT to Do

- Don't assume building the CLI builds the app (or vice-versa) — separate workspaces.
- Don't redeclare IPC channels outside `IPCChannels`.
- Don't repaint the status-color meanings — they are a UX contract.
- Don't break bash 3.2 compatibility in installer/hook scripts.

## Operating Model

- agentgrid dogfoods itself: it is an agent-native harness (`.claude/` rules/skills/hooks/sub-agents, `identity/`, `memory/`, `brain/`) so a coding agent can improve it using its own conventions.
- Commit grammar scoped per surface: `feat(cli)`, `feat(app)`, `feat(harness)`, `feat(preset)`, `docs:` — enables git snap-back at skill / feature / repo granularity.

## Topic Files Index

- (none yet — add `topics/<name>.md` deep-dives as durable threads emerge)
