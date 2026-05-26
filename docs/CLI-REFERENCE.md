# AgentGrid CLI Reference

## Installation

```bash
npm install -g agentgrid
```

## Quick Start

```bash
# Create a 2x3 grid of Claude Code agents
agentgrid 2x3 claude

# Create a 1x2 grid with Codex
agentgrid 1x2 codex

# Mixed agents via interactive wizard
agentgrid setup
```

## Commands

### Grid Creation

```bash
agentgrid NxM [agent]
```

Create an NxM grid of terminal panes, each running the specified AI agent.

| Argument | Default  | Description                                                                               |
| -------- | -------- | ----------------------------------------------------------------------------------------- |
| `NxM`    | required | Grid dimensions (e.g., `2x3`, `1x4`, `3x3`)                                               |
| `agent`  | `claude` | AI tool: `claude`, `codex`, `gemini`, `aider`, `goose`, `hermes`, `cline`, or any command |

### `agentgrid setup`

Interactive wizard with grid preview. Lets you configure dimensions, agent type, and preset selection.

### `agentgrid status`

Show status of all panes with color-coded indicators.

```
⚡ Agent 1 [WORKING]  ✅ Agent 2 [DONE]  ⏳ Agent 3 [WAITING]
```

Flags:

- `--json` — Output as JSON for scripting

### `agentgrid dashboard`

Live auto-refreshing dashboard. Shows all pane statuses, updates every 3 seconds.

### `agentgrid name "label"`

Set a label for the current pane (e.g., `agentgrid name "VP-ARCHITECT"`).

### `agentgrid broadcast "message"`

Send a message to ALL panes simultaneously. The text is typed into each terminal.

```bash
agentgrid broadcast "focus on the auth module"
```

### `agentgrid add [direction] [agent]`

Add a new pane to the grid.

```bash
agentgrid add right claude    # Add pane to the right
agentgrid add below codex     # Add pane below
```

### `agentgrid swap [direction]`

Swap the current pane with an adjacent pane.

```bash
agentgrid swap up
agentgrid swap down
```

### `agentgrid equalize`

Reset all panes to equal sizes.

### `agentgrid kill`

Close all panes and reset to a single pane.

---

## Presets

### `agentgrid preset list`

Show all saved and built-in presets.

### `agentgrid preset save [name]`

Save the current grid layout as a named preset.

### `agentgrid preset load [name]`

Load a saved preset and recreate the grid.

Built-in presets:

- `dev-sprint` — 4 Claude agents in 2x2
- `research-swarm` — 9 agents in 3x3
- `mixed-agents` — 6 agents across Claude, Codex, Gemini

---

## Session Management

### `agentgrid save [name]`

Save the current grid state including pane names, agent types, working directories, and conversation session IDs.

### `agentgrid restore [name]`

Restore a saved session. Recreates the grid and attempts to reconnect to previous conversations.

---

## Sound Alerts

### `agentgrid sound test`

Preview all notification sounds.

### `agentgrid sound off`

Disable sound alerts.

### `agentgrid sound on`

Re-enable sound alerts.

Sounds trigger on:

- Agent completes task (done sound)
- Agent needs input (waiting sound)
- Sub-agent spawned (subagent sound)

---

## Configuration

Config stored at `~/.agentgrid/config.json`.

```json
{
  "sounds": {
    "enabled": "true",
    "done": "/System/Library/Sounds/Glass.aiff",
    "waiting": "/System/Library/Sounds/Tink.aiff"
  },
  "defaults": {
    "agent": "claude",
    "rows": "2",
    "cols": "3"
  }
}
```

Presets stored at `~/.agentgrid/presets/`.
Sessions stored at `~/.agentgrid/sessions/`.

---

## Supported Agents

| Agent       | Command      | Notes                           |
| ----------- | ------------ | ------------------------------- |
| Claude Code | `claude`     | Default. Anthropic's CLI agent  |
| Codex       | `codex`      | OpenAI's coding agent           |
| Gemini CLI  | `gemini`     | Google's Gemini agent           |
| Aider       | `aider`      | Open-source coding assistant    |
| Goose       | `goose`      | Block's AI agent                |
| Hermes      | `hermes`     | Self-improving agent            |
| Cline       | `cline`      | VS Code agent, CLI mode         |
| Copilot     | `gh copilot` | GitHub Copilot CLI              |
| Cursor      | `cursor`     | AI-powered editor               |
| Custom      | Any command  | `agentgrid 2x2 "python bot.py"` |

---

## Environment Variables

| Variable            | Description                                     |
| ------------------- | ----------------------------------------------- |
| `AGENTGRID_SESSION` | Custom tmux session name (default: `agentgrid`) |

---

## Examples

```bash
# Quick research team
agentgrid 3x3 claude

# Mixed multi-model team
agentgrid setup  # → select agents per pane

# Save your favorite layout
agentgrid name "CEO"
agentgrid save "my-team"

# Restore it later
agentgrid restore "my-team"

# Monitor progress
agentgrid dashboard

# Send instructions to all
agentgrid broadcast "write tests for the auth module"
```

---

## See Also

- [AgentGrid App](./ARCHITECTURE.md) — Visual Mission Control
- [Collaborator Analysis](./COLLABORATOR-ANALYSIS.md) — Competitive research
- [IPC Protocol](./IPC-PROTOCOL.md) — App communication protocol
