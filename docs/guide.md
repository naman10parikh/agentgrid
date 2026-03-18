# User Guide

Complete reference for every agentgrid command.

## Getting Started

### Starting a Session

```bash
agentgrid start              # Create or attach to tmux session
agentgrid start my-project   # Named session
```

If you're already inside tmux, `start` shows available commands. If you're outside, it launches tmux for you.

### Creating Grids

```bash
agentgrid 2x2 claude     # 4 Claude Code panes
agentgrid 3x4 codex      # 12 Codex panes
agentgrid 5x5            # 25 empty panes (no agent)
agentgrid 1x3 aider      # 3 Aider panes in a row
```

**Format:** `ROWSxCOLS [agent]`

- Rows and columns: 1-10 each (max 100 panes)
- Agent is optional — omit it for empty shells
- If the agent isn't installed, agentgrid offers to install it

### Interactive Setup

```bash
agentgrid setup
```

The wizard asks 3 questions:

1. **How many panes?** — Enter a number (e.g., `6`, `50`)
2. **Default agent?** — What runs in most panes (e.g., `claude`)
3. **Override specific panes?** — Customize individuals: `1:codex,5:gemini` or Enter to skip

After setup, you can optionally save the configuration as a preset for reuse.

---

## Pane Management

### Naming Panes

```bash
agentgrid name "Frontend"     # Name the current pane
agentgrid name "VP-Research"  # Names persist — agents can't overwrite them
```

You can also name panes with the keyboard shortcut: `Ctrl+A .`

Names are locked with `allow-rename off` — they survive agent restarts and won't get overwritten by shell processes.

### Broadcasting

```bash
agentgrid broadcast "git pull"         # Send to ALL panes
agentgrid broadcast "npm install"      # Every pane runs the command
```

Sends the text to every pane in the current window and presses Enter. Useful for running setup commands across your entire grid.

### Adding and Swapping Panes

```bash
agentgrid add right claude    # Add a pane to the right
agentgrid add down codex      # Add a pane below
agentgrid swap up             # Swap current pane up
agentgrid swap down           # Swap current pane down
```

### Equalizing Layout

```bash
agentgrid equalize            # Even out all pane sizes
```

Keyboard shortcut: `Ctrl+A E`

### Killing the Grid

```bash
agentgrid kill                # Remove all panes except one
```

---

## Status System

Each pane displays a colored border label showing its current state:

| Status      | Label      | Color  | Sound | When                          |
| ----------- | ---------- | ------ | ----- | ----------------------------- |
| Working     | ⚡ WORKING | Blue   | —     | Agent is processing a prompt  |
| Needs input | ⏳ WAITING | Yellow | Tink  | Agent hit a permission prompt |
| Done        | ✅ DONE    | Green  | Glass | Agent finished responding     |

Status updates happen automatically through agent hooks. The installer sets up Claude Code hooks for you. Codex and OpenCode also support hooks natively.

For agents without hook support (Gemini, Aider, Goose, etc.), status updates based on exit code — green when the process exits successfully.

### How Status Works

The `pane-status.sh` script sets a custom tmux option `@pane_status` on the pane. The tmux `pane-border-format` reads this option and renders the colored label.

Two detection methods (in priority order):

1. **Direct** — uses `$TMUX_PANE` environment variable (fastest)
2. **Process tree walk** — walks the PID tree up to 10 levels to find the tmux pane (for hook subprocesses where `$TMUX_PANE` isn't set)

---

## Sound Alerts

### Viewing Current Sounds

```bash
agentgrid sound               # Show configured sounds
```

### Setting Custom Sounds

```bash
agentgrid sound done ~/Music/tada.mp3         # Custom file
agentgrid sound waiting system:Hero            # macOS built-in
agentgrid sound subagent ~/Music/ping.wav      # Sub-agent notification
```

Supported formats: MP3, WAV, AIFF, M4A, OGG.

### Testing Sounds

```bash
agentgrid sound test          # Preview all 3 sounds
```

### Disabling Sounds

```bash
agentgrid sound off           # Silence all alerts
```

Sounds play through DND/Focus mode. Uses `afplay` on macOS, `paplay` on Linux.

---

## Session Save & Restore

### Saving a Session

```bash
agentgrid save my-grid
```

Captures for each pane:

- Agent type (Claude, Codex, Gemini, etc.)
- Working directory
- Pane name
- **Conversation session ID** (for Claude Code — resumes the exact chat)
- Visible screen buffer (saved as reference text file)

Sessions are stored in `~/.agentgrid/sessions/`.

### Restoring a Session

```bash
agentgrid restore my-grid              # Full restore — layout + resume agents
agentgrid restore my-grid --no-start   # Layout only — no agents started
agentgrid restore                      # List all saved sessions
```

Restore recreates the grid layout, applies pane names, and restarts each agent with the correct resume command:

| Agent       | Resume method                 |
| ----------- | ----------------------------- |
| Claude Code | `claude --resume <sessionId>` |
| Codex       | `codex resume <id>`           |
| Gemini CLI  | `gemini --resume latest`      |
| Goose       | `goose session resume --last` |
| Others      | Fresh start                   |

Claude panes where no message was sent start fresh instead of accidentally hijacking another pane's conversation.

---

## Dashboard

### Static View

```bash
agentgrid dashboard
```

Shows a table of all panes with their index, name, status, and agent.

### Live Dashboard

```bash
agentgrid dashboard live
```

Auto-refreshes every 2 seconds. Press `Ctrl+C` to stop.

---

## Agent Management

### Listing Agents

```bash
agentgrid agents
```

Shows all 10 known agents with their install status (installed/missing).

### Installing Agents

```bash
agentgrid install codex       # Install a specific agent
agentgrid install-all         # Install everything that's missing
```

Install commands per agent:

| Agent       | Install command                            |
| ----------- | ------------------------------------------ |
| Claude Code | `npm install -g @anthropic-ai/claude-code` |
| Codex       | `npm install -g @openai/codex`             |
| Gemini CLI  | `npm install -g @google/gemini-cli`        |
| Aider       | `pip install aider-chat`                   |
| OpenCode    | `npm install -g opencode`                  |
| Goose       | `brew install goose`                       |
| Cline       | `npm install -g @anthropic-ai/cline`       |
| Hermes      | `npm install -g hermes-cli`                |
| Copilot     | `npm install -g @github/copilot`           |
| Cursor      | `brew install --cask cursor`               |

### Claude Code Terminal Setup

```bash
agentgrid terminal-setup
```

Configures all Claude panes in the current window with proper settings. Useful after restoring a session or adding new panes.

---

## Status Command

```bash
agentgrid status
```

Shows all panes in the current session with:

- Pane index and ID
- Name (from `@pane_label`)
- Status (working/waiting/done)
- Running process

Works both inside and outside tmux. Outside tmux, it lists all agentgrid sessions.

---

## Presets

See the [Presets guide](presets.md) for full details.

```bash
agentgrid preset list                  # See saved presets
agentgrid launch dev-sprint            # Launch a preset
agentgrid preset show mixed-agents     # View details
agentgrid preset delete old-setup      # Remove
```

---

## Utility Commands

### Self-Update

```bash
agentgrid update
```

Downloads the latest version from GitHub and replaces the installed binary.

### Detach

```bash
agentgrid detach
```

Exits the tmux session but keeps it running in the background. Reattach with `tmux attach` or `agentgrid start`.

### Version

```bash
agentgrid version
```

### Help

```bash
agentgrid help
```

### Tips

```bash
agentgrid tips
```

Shows usage tips and keyboard shortcuts.

---

## All Commands Reference

```
agentgrid ROWSxCOLS [agent]         Quick grid (e.g. 2x3 claude)
agentgrid setup                     Interactive wizard
agentgrid start [session]           Start/attach tmux (auto-detects)
agentgrid launch [preset]           Launch a saved preset
agentgrid save [name]               Save grid + names + conversations
agentgrid restore [name]            Restore grid and resume all chats
agentgrid restore [name] --no-start Restore layout only (no agents)
agentgrid dashboard                 Grid map with statuses + controls
agentgrid dashboard live            Auto-refreshing dashboard
agentgrid agents                    Show installed/available agents
agentgrid install <agent>           Install a CLI agent
agentgrid install-all               Install all missing agents
agentgrid add [right|down] [agent]  Add pane to existing grid
agentgrid swap [up|down]            Swap current pane position
agentgrid name <name>               Name current pane (locked)
agentgrid broadcast <text>          Send command to all panes
agentgrid equalize                  Even out pane sizes
agentgrid kill                      Clear grid to 1 pane
agentgrid status                    Show all pane statuses
agentgrid preset list               Show saved presets
agentgrid preset show <name>        View preset details
agentgrid preset delete <name>      Delete preset
agentgrid sound                     Show current sounds
agentgrid sound <event> <file>      Set sound (done/waiting/subagent)
agentgrid sound test                Preview sounds
agentgrid sound off                 Disable sounds
agentgrid terminal-setup            Configure all Claude panes
agentgrid tips                      Usage tips
agentgrid update                    Self-update from GitHub
agentgrid detach                    Exit grid (keeps running)
agentgrid version                   Show version
agentgrid help                      Show help
```

---

## Keyboard Shortcuts

| Keys               | Action                              |
| ------------------ | ----------------------------------- |
| **Option+H/J/K/L** | Move between panes (vim-style)      |
| **Option+Arrow**   | Move between panes (arrow keys)     |
| **Option+Z**       | Zoom/unzoom current pane            |
| **Click**          | Switch to pane                      |
| **Ctrl+A \|**      | Split right                         |
| **Ctrl+A -**       | Split down                          |
| **Ctrl+A .**       | Name current pane                   |
| **Ctrl+A E**       | Equalize pane sizes                 |
| **Ctrl+A c**       | New window (tab)                    |
| **Ctrl+A 1-9**     | Switch window by number             |
| **Ctrl+A d**       | Detach (session runs in background) |
| `tmux attach`      | Reattach to background session      |

---

## Configuration

Config file: `~/.agentgrid/config.json`

```json
{
  "default_agent": "claude",
  "sounds": {
    "done": "/System/Library/Sounds/Glass.aiff",
    "waiting": "/System/Library/Sounds/Tink.aiff",
    "sub_agent": "/System/Library/Sounds/Purr.aiff"
  }
}
```

### File Locations

| Path                           | Contents             |
| ------------------------------ | -------------------- |
| `~/.agentgrid/config.json`     | Global configuration |
| `~/.agentgrid/presets/*.json`  | Saved presets        |
| `~/.agentgrid/sessions/*.json` | Saved sessions       |
| `~/.agentgrid/sounds/`         | Custom sound files   |

### Environment Variables

| Variable            | Default     | Description               |
| ------------------- | ----------- | ------------------------- |
| `AGENTGRID_SESSION` | `agentgrid` | Default tmux session name |
