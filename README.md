# agentgrid

[![npm version](https://img.shields.io/npm/v/agentgrid.svg)](https://www.npmjs.com/package/agentgrid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20WSL-blue.svg)](#works-with)
[![Tests](https://img.shields.io/badge/tests-30%2B%20passing-brightgreen.svg)](#tests)
[![No Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](#how-it-works)

**Your AI agents deserve a proper office.**

One command. Six agents. All working in parallel.

```bash
npx agentgrid 2x3 claude
```

```
┌──────────────┬──────────────┬──────────────┐
│ ⚡ Agent 1    │ ⚡ Agent 2    │ ⚡ Agent 3    │
│ fixing auth  │ writing tests│ updating docs│
├──────────────┼──────────────┼──────────────┤
│ ✅ Agent 4    │ ⏳ Agent 5    │ ⚡ Agent 6    │
│ done — 3min  │ needs input  │ refactoring  │
└──────────────┴──────────────┴──────────────┘
```

agentgrid creates grids of terminal panes, launches your AI coding agent in each one, and shows you who's working (blue), who's done (green), and who needs you (yellow) — with sound alerts.

Works with **Claude Code, Codex, Gemini CLI, Aider, Goose, Cline, Hermes, Copilot, Cursor**, or literally any terminal command.

<!-- GIF demo: agentgrid 2x3 claude spawning 6 panes, tasks injected, status colors updating -->

## Install

```bash
npm install -g agentgrid
```

Or with curl:

```bash
curl -fsSL https://raw.githubusercontent.com/naman10parikh/agentgrid/main/install.sh | bash
```

Installs tmux (if needed), configures hooks, sets up sounds. 60 seconds.

**Requirements:** bash, tmux, python3 &middot; **Supports:** macOS &middot; Linux &middot; Windows (WSL)

## Quick Start

```bash
# Same agent in every pane
agentgrid 2x3 claude

# Interactive wizard — pick agents per pane, save as preset
agentgrid setup

# Launch a saved configuration
agentgrid launch dev-sprint
```

agentgrid auto-detects tmux. If you're not inside a tmux session, it creates one for you.

## Why agentgrid?

You have 6 tasks. You could run them sequentially in one Claude session (slow), or open 6 terminal tabs manually (tedious). agentgrid gives you:

- **One command** to spawn any grid layout (2x2, 3x5, 5x5)
- **Color-coded status** so you know who needs attention at a glance
- **Sound alerts** when an agent finishes or needs input (works through DND)
- **Save & restore** entire grid configurations with conversation history
- **Zero dependencies** — built on tmux, the tool you already have

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   agentgrid CLI                  │
│  (1,400 lines of bash — no daemon, no server)   │
├────────────┬────────────┬───────────────────────┤
│  Grid      │  Session   │  Status               │
│  Engine    │  Manager   │  System               │
│            │            │                        │
│  split     │  save      │  @pane_status          │
│  layout    │  restore   │  @pane_label           │
│  equalize  │  presets   │  color-coded           │
├────────────┴────────────┴───────────────────────┤
│                    tmux                          │
│  panes · sessions · custom options · hooks       │
├─────────────────────────────────────────────────┤
│              Terminal Emulator                   │
│  Ghostty · iTerm2 · Kitty · WezTerm · Terminal  │
└─────────────────────────────────────────────────┘
```

No Electron. No WebSocket server. No process manager. Just tmux — the battle-tested terminal multiplexer that's already on your machine.

## Features

### Grid Layouts

```bash
agentgrid 2x2 claude     # 4 panes
agentgrid 3x4 codex      # 12 panes
agentgrid 5x5            # 25 empty panes (up to 10x10)
```

Panes auto-equalize. Re-equalize anytime: `agentgrid equalize`

### Interactive Setup

```bash
agentgrid setup
```

Visual wizard with grid preview. 4 steps:

1. Grid size → `2x3` or just `6`
2. Default agent → `claude`
3. Configure individual panes (names, agents)
4. Save as preset (optional)

### Status Labels

| Status      | Label      | Color  | Sound |
| ----------- | ---------- | ------ | ----- |
| Working     | ⚡ WORKING | Blue   | —     |
| Needs input | ⏳ WAITING | Yellow | Tink  |
| Done        | ✅ DONE    | Green  | Glass |

Status updates automatically via agent hooks (Claude Code, Codex, OpenCode). Other agents use exit code detection.

### Dashboard

```bash
agentgrid dashboard          # Snapshot with controls
agentgrid dashboard live     # Auto-refreshing every 2s
```

Table view of all panes with name, agent, and status. Quick action menu included.

### Session Save & Restore

```bash
agentgrid save my-grid                    # Save everything
agentgrid restore my-grid                 # Restore + resume conversations
agentgrid restore my-grid --no-start      # Layout only, no agents
```

Save captures each pane's agent, directory, name, and **conversation session ID**. Restore resumes the exact conversation — not just the most recent one.

Per-agent resume: Claude (`--resume <id>`), Codex (`codex resume <id>`), Gemini (`--resume latest`), Goose (`session resume --last`).

### Presets

```bash
agentgrid preset list                     # See saved presets
agentgrid launch dev-sprint               # Launch one
agentgrid preset show mixed-agents        # View details
agentgrid preset delete old-setup         # Remove
```

3 built-in: `dev-sprint` (4 panes), `mixed-agents` (6 panes), `research-swarm` (9 panes).

### Broadcast

```bash
agentgrid broadcast "git pull && pnpm test"    # Send to ALL panes
agentgrid broadcast "/status"                  # Send a slash command
```

### Custom Sounds

```bash
agentgrid sound done ~/Music/tada.mp3          # Your own audio
agentgrid sound waiting system:Hero            # macOS built-in
agentgrid sound test                           # Preview all 3
agentgrid sound off                            # Silence
```

MP3, WAV, AIFF, M4A, OGG. Plays through DND/Focus mode via `afplay` (macOS) or `paplay` (Linux).

### Pane Management

```bash
agentgrid name "Auth Worker"         # Name current pane (locked)
agentgrid add right claude           # Add pane to grid
agentgrid swap up                    # Reorder panes
agentgrid equalize                   # Even out sizes
agentgrid kill                       # Clear to 1 pane
agentgrid status                     # All pane statuses
agentgrid status --json              # Machine-readable (for scripts)
```

### Agent Detection & Installation

```bash
agentgrid agents                     # Show installed/available
agentgrid install codex              # Install one
agentgrid install-all                # Install all missing
```

## Supported Agents

| Agent           | Command      | Install                              | Auto Status |
| --------------- | ------------ | ------------------------------------ | ----------- |
| Claude Code     | `claude`     | `npm i -g @anthropic-ai/claude-code` | Yes (hooks) |
| Codex           | `codex`      | `npm i -g @openai/codex`             | Yes (hooks) |
| Gemini CLI      | `gemini`     | `npm i -g @google/gemini-cli`        | Exit code   |
| Aider           | `aider`      | `pip install aider-chat`             | Exit code   |
| OpenCode        | `opencode`   | `npm i -g opencode`                  | Yes (hooks) |
| Goose           | `goose`      | `brew install goose`                 | Exit code   |
| Cline           | `cline`      | `npm i -g @anthropic-ai/cline`       | Exit code   |
| Hermes          | `hermes`     | `npm i -g hermes-cli`                | Exit code   |
| Copilot         | `copilot`    | `npm i -g @github/copilot`           | Exit code   |
| Cursor          | `cursor`     | `brew install --cask cursor`         | Exit code   |
| **Any command** | `<your-cmd>` | —                                    | Exit code   |

agentgrid doesn't restrict what you run. Any terminal command works as an agent.

## All Commands

```
GRIDS
  agentgrid ROWSxCOLS [agent]         Create grid (e.g. 2x3 claude)
  agentgrid setup                     Interactive wizard with grid preview

PRESETS
  agentgrid launch <name>             Launch a saved preset
  agentgrid preset list               Show presets
  agentgrid preset show <name>        View details
  agentgrid preset delete <name>      Delete

SESSIONS
  agentgrid save [name]               Save grid + names + conversations
  agentgrid restore [name]            Restore grid + resume chats
  agentgrid restore [name] --no-start Layout only (no agents)

AGENTS
  agentgrid agents                    Detect installed agents
  agentgrid install <agent>           Install one
  agentgrid install-all               Install all missing

CONTROL
  agentgrid dashboard                 Grid map + controls
  agentgrid dashboard live            Auto-refreshing (2s)
  agentgrid status                    All pane statuses
  agentgrid status --json             Machine-readable output
  agentgrid add [right|down] [agent]  Add pane to grid
  agentgrid swap [up|down]            Swap pane position

PANES
  agentgrid name <name>               Name current pane (locked)
  agentgrid broadcast <text>          Send to all panes
  agentgrid equalize                  Even out sizes
  agentgrid kill                      Clear to 1 pane

SOUNDS
  agentgrid sound                     Show current sounds
  agentgrid sound <event> <file>      Set sound
  agentgrid sound test                Preview all
  agentgrid sound off                 Disable

SETUP
  agentgrid start [session]           Start/attach tmux
  agentgrid terminal-setup            Configure Claude panes
  agentgrid tips                      Usage tips
  agentgrid update                    Self-update from GitHub
  agentgrid detach                    Exit (grid keeps running)
  agentgrid version                   Show version
  agentgrid help                      Show help
```

## Keyboard Shortcuts

| Keys               | Action                      |
| ------------------ | --------------------------- |
| **Option+H/J/K/L** | Navigate panes (vim-style)  |
| **Option+Arrow**   | Navigate panes              |
| **Click**          | Switch to pane              |
| **Ctrl+A \|**      | Split right                 |
| **Ctrl+A -**       | Split down                  |
| **Ctrl+A z**       | Zoom (fullscreen toggle)    |
| **Ctrl+A E**       | Equalize sizes              |
| **Ctrl+A { }**     | Swap pane up/down           |
| **Ctrl+A Space**   | Cycle layouts               |
| **Ctrl+A c**       | New window                  |
| **Ctrl+A 1-9**     | Switch window               |
| **Ctrl+A d**       | Detach (runs in background) |
| **Drag borders**   | Resize panes with mouse     |

## Configuration

```
~/.agentgrid/
├── config.json          # Global settings (sounds, defaults)
├── presets/             # Saved grid configurations
│   ├── dev-sprint.json
│   ├── mixed-agents.json
│   └── research-swarm.json
├── sessions/            # Saved session state (save/restore)
└── sounds/              # Custom sound files
```

Example `config.json`:

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

## How It Works

agentgrid is ~1,400 lines of bash. No daemon, no server, no background process.

1. **Grid engine** — creates tmux panes using `split-window` + `select-layout tiled`
2. **Status system** — custom tmux options (`@pane_status`, `@pane_label`) for per-pane metadata
3. **Agent hooks** — Claude Code/Codex hooks call `pane-status.sh` on start/stop/input-needed
4. **Sound alerts** — `afplay` (macOS) or `paplay` (Linux), works through DND/Focus mode
5. **Session persistence** — JSON snapshots of pane layout, agent type, directory, conversation ID
6. **Agent detection** — walks process tree (`ps -o args`) to identify agents behind `node` processes

## Claude Code Plugin

agentgrid ships as a Claude Code plugin. Add it to any project:

```json
{
  "name": "agentgrid",
  "hooks": {
    "UserPromptSubmit": { "command": "agentgrid-pane-status running" },
    "PermissionRequest": { "command": "agentgrid-pane-status needs-input" },
    "Stop": { "command": "agentgrid-pane-status done" }
  }
}
```

This enables automatic status updates — panes turn blue when working, yellow when waiting for permission, green when done.

## Works With

**Terminals:** Ghostty, iTerm2, Terminal.app, Kitty, WezTerm, Alacritty, Windows Terminal (WSL)

**IDEs:** Cursor (integrated terminal), VS Code (integrated terminal)

**OS:** macOS, Linux (Ubuntu, Fedora, Arch), Windows (via WSL)

## FAQ

**Q: Do I need tmux installed?**
A: agentgrid installs tmux automatically if it's missing (via Homebrew on macOS, apt/dnf/pacman on Linux).

**Q: Can I mix different agents in the same grid?**
A: Yes. Use `agentgrid setup` to assign different agents per pane, or start with a uniform grid and override individual panes.

**Q: What happens when I close my terminal?**
A: The tmux session keeps running in the background. Reattach with `agentgrid start` or `tmux attach`.

**Q: Can I use this with my own CLI tool?**
A: Yes. Any command works: `agentgrid 2x2 "python my_agent.py"`. agentgrid doesn't restrict what runs in each pane.

**Q: How does save/restore work with conversations?**
A: `agentgrid save` captures each pane's conversation session ID by walking the process tree. `agentgrid restore` uses agent-specific resume flags (`--resume` for Claude, `codex resume` for Codex, etc.) to pick up where you left off.

**Q: What's the maximum grid size?**
A: 10x10 (100 panes). In practice, 3x3 or 4x4 is the sweet spot for most monitors.

**Q: Does it work in VS Code / Cursor terminal?**
A: Yes. The integrated terminal supports tmux. Run `agentgrid 2x2 claude` directly.

## Tests

```bash
cd tools/agentgrid && bash test.sh
```

30+ tests covering file structure, version consistency, help output, preset validation, package.json fields, grid pattern matching, security (no eval injection), and command execution.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE).
