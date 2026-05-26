# From CLI to Mission Control: Building AgentGrid

**TL;DR:** We turned a 1,387-line bash script into a full Electron app with 25 React components, 45+ IPC channels, and 278 tests — in a single session using 6 parallel AI agents.

## The Problem

Multi-agent AI coding is here. Claude Code, Codex, Gemini CLI, Aider, Goose — every week there's a new tool. But orchestrating them together? That's still tmux + bash scripts + prayer.

We built AgentGrid CLI to solve this: `agentgrid 2x3 claude` spawns a 6-pane grid of Claude Code agents. It works. But it's tmux-dependent, CLI-only, and impossible to monitor at scale.

## The Solution: AgentGrid App

A native Electron app that replaces tmux with real terminal emulation (xterm.js + node-pty), adds visual grid management, and provides CEO-level monitoring for agent swarms.

### What it does:

- **Visual Grid Builder** — Click to create NxM grids of any AI coding tool
- **Real Terminal Panes** — Each pane runs a real PTY with GPU-accelerated rendering
- **Broadcast** — Send prompts to all agents at once, or target specific panes
- **Signal Watcher** — Auto-detects when agents complete work (.done files)
- **CEO Log** — Real-time activity log with level filtering and export
- **Command Palette** — Cmd+K to access any action instantly
- **Preset System** — Save and restore grid configurations
- **Cross-Model Support** — Mix Claude, Codex, Gemini, Aider in one grid

### Architecture:

- **15 main process modules** — grid manager, terminal manager, tool injector, signal watcher, harness loader, license manager, RPC server, MCP server, webhook manager
- **25 React components** — from TerminalPane to SwarmAnimation
- **45+ IPC channels** — typed end-to-end with TypeScript
- **278 tests** — unit, integration, benchmarks, all passing
- **Mock API** — full UI works in browser without Electron for rapid development

## How We Built It

We used AgentGrid to build AgentGrid. A 6-agent grid:

- VP-RESEARCHER — competitive analysis
- VP-ARCHITECT — system design
- VP-ELECTRON — main process + IPC
- VP-FRONTEND — React components + design
- VP-CLI — TypeScript CLI port
- VP-QA — testing + quality gates

345 TODO items. 324 completed (93%). In one session.

## Try It

```bash
# CLI (free forever)
npm install -g agentgrid
agentgrid 2x2 claude

# App (download)
git clone https://github.com/naman10parikh/Energy
cd Energy/tools/agentgrid/app
npm install && npx electron-vite dev
```

## What's Next

- Team workspaces (shared grids)
- Cloud-hosted agent swarms
- Template marketplace
- Mobile companion app

---

_Built with Energy. Powered by Claude._
