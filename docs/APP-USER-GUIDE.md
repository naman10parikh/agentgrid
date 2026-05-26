# AgentGrid App — User Guide

## Getting Started

1. **Launch the app** — `cd tools/agentgrid/app && pnpm dev`
2. **Welcome screen** — Pick a grid size (1x1 through 3x3)
3. **Grid view** — Each cell is a terminal running an AI agent

## Creating a Grid

Click a preset on the welcome screen or use **Cmd+K** to open the command palette and type "new grid".

| Preset | Panes | Use Case                |
| ------ | ----- | ----------------------- |
| 1x1    | 1     | Single agent            |
| 1x2    | 2     | Side-by-side comparison |
| 2x2    | 4     | Quad view               |
| 2x3    | 6     | Engineering sprint      |
| 3x3    | 9     | Research swarm          |

## Terminal Panes

Each pane is a full terminal emulator (xterm.js) backed by a real PTY process. The agent CLI (Claude, Codex, Gemini, etc.) launches automatically.

### Pane Header

- **Status dot** — color-coded (blue=working, gray=idle, green=done, red=error, yellow=waiting)
- **Label** — click the pencil icon to rename
- **Close** — click X to remove the pane

### Pane Interactions

- **Click** a pane to focus it (purple border)
- **Drag a file** onto a pane to inject the file path
- **Double-click** the header to zoom (maximize/restore)

## Control Bar

The bar between the title bar and grid provides:

- **Broadcast input** — type a message and press Enter to send to ALL panes simultaneously
- **Message templates** — dropdown with common commands (/status, continue, etc.)
- **Save** — persist the current grid layout

## Command Palette (Cmd+K)

Press **Cmd+K** (or Ctrl+K) to open the command palette. Type to search:

- Grid creation (New 2x3 Grid, etc.)
- Session management (Save, Restore)
- Communication (Broadcast to All Panes)
- Preset management (Save as Preset)

Arrow keys to navigate, Enter to execute, Escape to close.

## Keyboard Shortcuts

| Shortcut    | Action                |
| ----------- | --------------------- |
| Cmd+K       | Command palette       |
| Cmd+N       | New grid              |
| Cmd+T       | New pane              |
| Cmd+S       | Save session          |
| Cmd+Shift+E | Equalize pane sizes   |
| Cmd+Shift+B | Focus broadcast input |
| Cmd+Z       | Undo grid operation   |
| Cmd+Shift+Z | Redo grid operation   |
| Cmd+]       | Next pane             |
| Cmd+[       | Previous pane         |
| Cmd+1-9     | Focus pane by number  |

## Status Bar

Bottom bar shows:

- Grid dimensions (e.g., 2x3)
- Status summary (e.g., "3 working, 1 idle, 2 done")
- Focused pane info (label, agent, model)
- Estimated cost (tokens and USD)

## System Tray

When you close the window, AgentGrid keeps running in the system tray. Click the tray icon to reopen. Right-click for options:

- Show AgentGrid
- Agent count
- Quit

## Presets

Save your grid configuration as a preset to reuse later:

1. Set up your grid (create, rename panes, configure agents)
2. **Cmd+K** > "Save as Preset" > enter a name
3. Next time: **Cmd+K** > "Load Preset" or use `agentgrid launch <name>` from CLI

## Agent Configuration

Each pane can run a different agent with different settings:

- **Agent** — Claude, Codex, Gemini, Aider, Goose, etc.
- **Model** — claude-opus-4-6, claude-sonnet-4-6, gpt-4.1, etc.
- **Effort** — low, medium, high, max
- **Context window** — token limit (default: 1M)

Click the gear icon in the pane header to change these settings.

## CEO Log

The CEO log tracks all orchestration events in real-time:

- Grid creation
- Pane add/remove
- Broadcasts
- Agent exits (with exit codes)
- Signal file detection (.done, .needs-qa)

Filter by level (info, warning, error, decision, experiment) and export to clipboard.

## Signal Watching

AgentGrid monitors `.claude/vp-signals/` for signal files:

- `role.done` — agent completed its mission
- `role.needs-qa` — code ready for review
- `role.migrating` — agent needs a fresh pane (context degraded)

Signals update pane status indicators automatically.

## Recursive Sub-Grids

A pane can spawn its own sub-grid (grid-within-grid). This enables:

- CEO > VP > Worker hierarchy
- Parallel workstreams with independent orchestration
- Depth limit: configurable (default 3)
