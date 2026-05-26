# AgentGrid App

Visual multi-agent orchestration for AI coding tools. Spawn NxM grids of Claude, Codex, Gemini, and other CLI agents in one click.

## Quick Start

```bash
# Development
npm install
npm run dev

# Build
npm run build

# Package for macOS
npm run dist:mac
```

## Features

- **Grid View** — NxM terminal grid with drag-to-resize borders
- **Multi-Agent** — Claude Code, Codex, Gemini, Aider, Goose, Hermes, Cline
- **Broadcast** — Send commands to all panes or a subset
- **Presets** — Save/load grid configurations, 5 built-in harnesses
- **CEO Log** — Real-time structured log with level filtering
- **Sidebar** — Workspaces, presets, tools (MCP/skills/hooks), CEO log
- **Command Palette** — Cmd+K for quick actions
- **Signal Protocol** — Inter-pane .done/.needs-qa/.migrating signals
- **Session Persistence** — Auto-save/restore grid state

## Architecture

Electron 33 + React 19 + xterm.js + node-pty + Tailwind 4

```
Main Process     → Window, IPC, PTY, GridManager, SignalWatcher
Preload          → Type-safe bridge (contextBridge)
Renderer         → React UI with xterm.js terminals
```

See `docs/ARCHITECTURE.md` for full details.

## Keyboard Shortcuts

| Shortcut    | Action             |
| ----------- | ------------------ |
| Cmd+K       | Command palette    |
| Cmd+N       | New grid           |
| Cmd+T       | New pane           |
| Cmd+S       | Save session       |
| Cmd+1-9     | Focus pane         |
| Cmd+Shift+B | Broadcast          |
| Cmd+Shift+E | Equalize panes     |
| Cmd+F       | Search in terminal |
| Cmd+Enter   | Zoom pane          |

## Built-in Harnesses

| Harness            | Grid | Roles                                                   |
| ------------------ | ---- | ------------------------------------------------------- |
| engineering-sprint | 2x3  | CEO, Architect, 2 Builders, QA, Docs                    |
| design-sprint      | 2x2  | CEO, Research, Designer, Review                         |
| research-swarm     | 3x3  | Lead, 4 Analysts, Synthesizer, Writer, Reviewer, Editor |
| content-engine     | 2x2  | CEO, Writer, Editor, Publisher                          |
| oss-launch         | 2x3  | CEO, Builder, Docs, QA, Content, Designer               |

## License

MIT
