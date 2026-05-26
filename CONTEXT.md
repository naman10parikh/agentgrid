# agentgrid — Session Context

## What this is

agentgrid spawns a grid of AI coding agents (Claude, Codex, Gemini, Aider, Goose, …) in
one command — each in its own tmux pane — with color-coded status and sound alerts. It is
both a published **TypeScript CLI** (`src/` → `dist/index.js`) and an optional **Electron
desktop app** (`app/`) for visual orchestration. It is also a self-contained agent-native
harness so a coding agent can improve agentgrid itself.

## Current status (verified 2026-05-25)

- **CLI: build-green.** `pnpm build` (tsc) compiles cleanly; `pnpm test` (vitest) is green
  with **37 passing tests** across 6 suites (commands, config, init-gen, tmux, agents,
  constants). Published to npm as `agentgrid` (package version `2.0.0`).
- **Desktop app: active workspace** under `app/` (version `0.1.0`). Electron + electron-vite
  + React + xterm.js. Carries **475 unit tests** (`pnpm --dir app test`) plus a Playwright
  e2e suite (`app/tests/e2e/`). Built independently because it needs the native `node-pty`
  module from its own postinstall.
- **Harness layer:** inherited `.claude/` rules/skills/hooks/sub-agents, `identity/`,
  `memory/`, and the `brain/` knowledge graph are in place and standardized (CP104).

## Shipped (per CHANGELOG)

- **v2.0.0** — Electron desktop app (xterm.js terminals, drag-to-reorder, themes, 50K
  scrollback, WebGL), 30 built-in agent personas, persona picker, compaction detection,
  session persistence, swarm topologies, LLM Council, cost tracking, MCP server, presets,
  broadcast, status dashboard. CLI rewritten bash → TypeScript (CLI command unchanged).
- **v1.0.0** — production CLI: `--json` status output, graceful tmux detection, 30+ tests.
- **v0.7.0** — session-ID restore (resume the exact conversation, not just the latest).
- Earlier (v0.1–v0.5): grids, presets, mixed agents, sounds, dashboard, swap, self-update.

## What's next / open threads

- Keep CLI and app test suites green on every change (two independent gates).
- Sixel/image + Unicode11 polish in the app terminal; topology/council UX iteration.
- Homebrew tap (`Formula/`, `app/homebrew/`) distribution.

## Pointers to deeper docs

- Full command list + FAQ: [README.md](README.md)
- Docs index: [docs/README.md](docs/README.md) · knowledge graph: [brain/MOC - agentgrid.md](brain/MOC%20-%20agentgrid.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · IPC: [docs/IPC-PROTOCOL.md](docs/IPC-PROTOCOL.md)
- CLI reference: [docs/CLI-REFERENCE.md](docs/CLI-REFERENCE.md) · harnesses: [docs/HARNESS-GUIDE.md](docs/HARNESS-GUIDE.md)
- Release history: [CHANGELOG.md](CHANGELOG.md) · agent conventions: [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md)
