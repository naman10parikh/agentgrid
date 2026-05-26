# AgentGrid FAQ

## General

### What is AgentGrid?

AgentGrid is a visual multi-agent orchestration tool. It lets you run multiple AI coding agents (Claude Code, Codex, Gemini, etc.) in parallel, monitor their progress, and coordinate their work — all from one interface.

### CLI or App?

Both. The `agentgrid` CLI works in any terminal via tmux. The Electron app adds a visual grid, drag-to-resize panes, preset browser, CEO log, and signal monitoring.

### Is it free?

The CLI is free and open source (MIT). The Electron app is free for personal use.

### What AI agents does it support?

Claude Code, Codex CLI, Gemini CLI, Aider, Goose, Hermes, Cline, GitHub Copilot, Cursor, and any custom terminal command.

---

## Installation

### How do I install the CLI?

```bash
npm install -g agentgrid
```

### How do I install the Electron app?

Download from GitHub Releases or build from source:

```bash
cd tools/agentgrid/app
npm install
npm run build
npm start
```

### Does it require tmux?

The CLI requires tmux. The Electron app uses native PTY (node-pty) and does NOT require tmux.

### What platforms are supported?

macOS (Apple Silicon + Intel) and Linux. Windows support via WSL is planned.

---

## Usage

### How do I create a grid?

**CLI:** `agentgrid 2x3 claude`
**App:** Click a grid preset button or use Cmd+N

### How do I broadcast a message to all agents?

**CLI:** `agentgrid broadcast "your message"`
**App:** Type in the broadcast input bar and press Enter, or use Cmd+Shift+B

### How do I save my grid layout?

**CLI:** `agentgrid save my-team`
**App:** Click "Save" in the toolbar or use Cmd+S

### How do I load a preset?

**CLI:** `agentgrid preset load dev-sprint`
**App:** Open the sidebar → Presets tab → click a preset

### What are harnesses?

Harnesses are YAML templates that define a grid layout with named roles, models, and effort levels. They're reusable team configurations. See `docs/presets.md`.

### How do I monitor agent status?

**CLI:** `agentgrid status` or `agentgrid dashboard`
**App:** Status dots on each pane header (blue=working, green=done, yellow=waiting, red=error)

### What are signals?

Signals are `.done`, `.needs-qa`, and `.migrating` files that agents create in `.claude/vp-signals/` to communicate their status. The app monitors this directory in real-time.

---

## Troubleshooting

### Terminal not rendering?

Ensure `node-pty` is built for your Electron version:

```bash
cd tools/agentgrid/app
npm run postinstall
```

### Grid not spawning?

Check that the agent CLI is installed and in your PATH:

```bash
which claude  # or codex, gemini, aider, etc.
```

### App shows blank window?

Run `npm run build` then `npm start`. If using dev mode: `npm run dev`.

### Pane stuck on "idle"?

The agent may have exited. Try restarting the pane via the context menu or Cmd+R on the focused pane.

---

## Architecture

### How does the CLI ↔ App bridge work?

The app runs a JSON-RPC server on a Unix socket at `~/.agentgrid/ipc.sock`. The CLI connects to this socket to send commands. See `docs/IPC-PROTOCOL.md`.

### Where is state stored?

- Grid state: `~/.agentgrid/last-session.json`
- Presets: `~/.agentgrid/presets/*.json`
- Harnesses: `.claude/harnesses/*.yaml`
- Config: `~/.agentgrid/config.json`
- Session history: `~/.agentgrid/session-history.json`

### How are terminals managed?

Each pane spawns a PTY process via `node-pty`. Terminal output is rendered with `xterm.js` in the Electron renderer. Data is batched at 16ms intervals to prevent IPC flooding.

### What's the max grid size?

Up to 10x10 (100 panes). Performance tested at 100 panes in <50ms creation time.
