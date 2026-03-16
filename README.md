# agentgrid

**Spawn a grid of AI coding agents in one command.**

```bash
agentgrid 2x3 claude    # 6 Claude Code instances, evenly tiled
agentgrid 3x3 codex     # 9 Codex instances
agentgrid setup          # Interactive wizard — 3 questions, done
```

agentgrid creates grids of terminal panes, runs your agent in each one, and shows you which are done (green), need input (yellow), or working (blue) — with sound alerts.

Works with Claude Code, Codex, Gemini CLI, Aider, Goose, Cline, Hermes, Copilot, Cursor, or any terminal command.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/naman10parikh/agentgrid/main/install.sh | bash
```

One command. Installs tmux (if needed), configures everything, sets up agent hooks. 60 seconds.

Supports: **macOS** (Homebrew) · **Linux** (apt/dnf/pacman) · **Windows** (WSL)

## Quick Start

```bash
# Option 1: Quick grid — same agent in every pane
agentgrid 2x3 claude

# Option 2: Interactive setup — pick agents per pane
agentgrid setup

# Option 3: Launch a saved preset
agentgrid launch dev-sprint
```

**That's it.** agentgrid auto-detects if you're in tmux. If not, it launches tmux for you. No manual setup needed.

## Features

### Grid Layouts
```bash
agentgrid 2x2 claude     # 4 panes
agentgrid 3x4 codex      # 12 panes
agentgrid 5x5            # 25 empty panes
```
All panes are automatically equalized. Re-equalize anytime: `Ctrl+A then E`

### Interactive Setup (3 Inputs for 50 Panes)
```bash
agentgrid setup
```
1. How many panes? → `50`
2. Default agent? → `claude`
3. Override specific panes? → `1:codex,25:gemini` (or Enter to skip)

Done. 50 panes, configured in 3 inputs. Optionally save as a preset.

### Status Labels
Each pane shows a colored label:

| Status | Label | Color | Sound |
|--------|-------|-------|-------|
| Working | ⚡ WORKING | Blue | — |
| Needs input | ⏳ WAITING | Yellow | Tink |
| Done | ✅ DONE | Green | Glass |

Updates automatically via agent hooks (Claude Code, Codex, OpenCode).

### Custom Sounds
```bash
agentgrid sound done ~/Music/tada.mp3        # Your own audio file
agentgrid sound waiting system:Hero           # macOS built-in sound
agentgrid sound test                          # Preview all 3 sounds
agentgrid sound off                           # Silence
```
Supports MP3, WAV, AIFF, M4A, OGG. Plays through DND/Focus mode.

### Presets (Save & Reuse)
```bash
agentgrid preset list                         # See saved presets
agentgrid launch dev-sprint                   # Launch a preset
agentgrid preset show mixed-agents            # View details
agentgrid preset delete old-setup             # Remove
```
3 built-in: `dev-sprint` (4 panes), `mixed-agents` (6 panes), `research-swarm` (9 panes).

### Session Save & Restore
```bash
agentgrid save my-grid                        # Save current layout + names
agentgrid restore my-grid                     # Restore in any new terminal
```
Grid layout and pane names are preserved. Restore your exact setup anywhere.

### Agent Detection & Installation
```bash
agentgrid agents                              # Show installed/available
agentgrid install codex                       # Install one agent
agentgrid install-all                         # Install everything missing
```
10 known agents. Any command works as a custom agent — agentgrid doesn't limit you.

### Pane Management
```bash
agentgrid name "Spark Agent"                  # Name pane (locked)
agentgrid broadcast "git pull"                # Send to ALL panes
agentgrid equalize                            # Even out sizes
agentgrid kill                                # Clear grid to 1 pane
agentgrid status                              # See all panes + status
```
Pane names persist — agents can't overwrite them.

## Keyboard Shortcuts

| Keys | Action |
|------|--------|
| **Option+H/J/K/L** | Move between panes (H=left, J=down, K=up, L=right) |
| **Option+Arrow** | Move between panes |
| **Click** | Switch to pane |
| **Ctrl+A \|** | Split right |
| **Ctrl+A -** | Split down |
| **Ctrl+A .** | Name current pane |
| **Ctrl+A E** | Equalize sizes |
| **Ctrl+A c** | New window (tab/group) |
| **Ctrl+A 1-9** | Switch window |
| **Ctrl+A d** | Detach (session runs in background) |
| `tmux attach` | Reattach to background session |

## Supported Agents

| Agent | Command | Install | Auto Status |
|-------|---------|---------|-------------|
| Claude Code | `claude` | Built-in | Yes (hooks) |
| Codex | `codex` | `npm install -g @openai/codex` | Yes (hooks) |
| Gemini CLI | `gemini` | `npm install -g @google/gemini-cli` | Exit code |
| Aider | `aider` | `pip install aider-chat` | Exit code |
| OpenCode | `opencode` | `npm install -g opencode` | Yes (hooks) |
| Goose | `goose` | `brew install goose` | Exit code |
| Cline | `cline` | `npm install -g @anthropic-ai/cline` | Exit code |
| Hermes | `hermes` | `npm install -g hermes-cli` | Exit code |
| Copilot | `copilot` | `npm install -g @github/copilot` | Exit code |
| Cursor | `cursor` | `brew install --cask cursor` | Exit code |
| **Any command** | `<your-cmd>` | — | Exit code |

**Custom agents:** Use literally any terminal command. agentgrid doesn't restrict what you run.

## All Commands

```
agentgrid ROWSxCOLS [agent]     Quick grid (e.g. 2x3 claude)
agentgrid setup                 Interactive wizard
agentgrid start [session]       Start/attach tmux (auto-detects)
agentgrid launch [preset]       Launch preset (or wizard if no name)
agentgrid save [name]           Save grid layout + pane names
agentgrid restore [name]        Restore grid in any terminal
agentgrid agents                Show installed/available agents
agentgrid install <agent>       Install a CLI agent
agentgrid install-all           Install all missing agents
agentgrid name <name>           Name current pane (locked)
agentgrid broadcast <text>      Send command to all panes
agentgrid equalize              Even out pane sizes
agentgrid kill                  Clear grid to 1 pane
agentgrid status                Show all pane statuses
agentgrid preset list           Show saved presets
agentgrid preset show <name>    View preset details
agentgrid preset delete <name>  Delete preset
agentgrid sound                 Show current sounds
agentgrid sound <event> <file>  Set sound (done/waiting/subagent)
agentgrid sound test            Preview sounds
agentgrid sound off             Disable sounds
agentgrid version               Show version
agentgrid help                  Show help
```

## Configuration

Config: `~/.agentgrid/config.json`

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
Presets: `~/.agentgrid/presets/*.json`
Sessions: `~/.agentgrid/sessions/*.json`
Custom sounds: `~/.agentgrid/sounds/`

## How It Works

agentgrid is built on tmux. No daemon, no server, no Electron.

1. Creates tmux sessions with grid layouts (`select-layout tiled`)
2. Labels panes with `@pane_status` and `@pane_label` custom tmux options
3. Installs Claude Code hooks that update status on start/stop/input-needed
4. Plays sounds via `afplay` (macOS) or `paplay` (Linux) — bypasses DND
5. Locks pane names using `allow-rename off` + custom `@pane_label`

## Works With

**Terminals:** Ghostty, iTerm2, Terminal.app, Kitty, WezTerm, Alacritty, Windows Terminal (WSL)

**IDEs:** Cursor (integrated terminal), VS Code (integrated terminal)

**OS:** macOS, Linux (Ubuntu, Fedora, Arch), Windows (via WSL)

## License

MIT
