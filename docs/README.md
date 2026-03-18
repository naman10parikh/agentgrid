# agentgrid

> Spawn a grid of AI coding agents in one command.

```bash
agentgrid 2x3 claude    # 6 Claude Code instances, evenly tiled
agentgrid 3x3 codex     # 9 Codex instances
agentgrid setup          # Interactive wizard — 3 questions, done
```

agentgrid creates grids of terminal panes, runs your agent in each one, and shows you which are done (green), need input (yellow), or working (blue) — with sound alerts.

Works with **Claude Code**, **Codex**, **Gemini CLI**, **Aider**, **Goose**, **Cline**, **Hermes**, **Copilot**, **Cursor**, or any terminal command.

## Why agentgrid?

Running multiple AI coding agents means juggling tmux splits, remembering pane IDs, and manually checking which agents finished. agentgrid solves this:

- **One command** to create any grid layout (2x2 to 10x10)
- **Visual status** — colored borders show working/waiting/done at a glance
- **Sound alerts** — hear when agents finish or need input (works through DND)
- **Session save/restore** — pick up exactly where you left off, including conversation history
- **Presets** — save grid configurations and reuse them
- **Any agent** — not locked to one vendor. Use Claude, Codex, Gemini, or literally any CLI command

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/naman10parikh/agentgrid/main/install.sh | bash
```

One command. Installs tmux (if needed), configures everything, sets up agent hooks. 60 seconds.

**Supports:** macOS (Homebrew), Linux (apt/dnf/pacman), Windows (WSL)

**Or via npm:**

```bash
npm install -g agentgrid
```

## Quick Start

```bash
# Option 1: Quick grid — same agent in every pane
agentgrid 2x3 claude

# Option 2: Interactive setup — pick agents per pane
agentgrid setup

# Option 3: Launch a saved preset
agentgrid launch dev-sprint
```

agentgrid auto-detects if you're in tmux. If not, it launches tmux for you. No manual setup needed.

## How It Works

agentgrid is built on tmux. No daemon, no server, no Electron.

1. Creates tmux sessions with grid layouts (`select-layout tiled`)
2. Labels panes with `@pane_status` and `@pane_label` custom tmux options
3. Installs Claude Code hooks that update status on start/stop/input-needed
4. Plays sounds via `afplay` (macOS) or `paplay` (Linux) — bypasses DND
5. Locks pane names using `allow-rename off` + custom `@pane_label`

## Supported Agents

| Agent           | Command      | Install                              | Auto Status |
| --------------- | ------------ | ------------------------------------ | ----------- |
| Claude Code     | `claude`     | Built-in                             | Yes (hooks) |
| Codex           | `codex`      | `npm install -g @openai/codex`       | Yes (hooks) |
| Gemini CLI      | `gemini`     | `npm install -g @google/gemini-cli`  | Exit code   |
| Aider           | `aider`      | `pip install aider-chat`             | Exit code   |
| OpenCode        | `opencode`   | `npm install -g opencode`            | Exit code   |
| Goose           | `goose`      | `brew install goose`                 | Exit code   |
| Cline           | `cline`      | `npm install -g @anthropic-ai/cline` | Exit code   |
| Hermes          | `hermes`     | `npm install -g hermes-cli`          | Exit code   |
| Copilot         | `copilot`    | `npm install -g @github/copilot`     | Exit code   |
| Cursor          | `cursor`     | `brew install --cask cursor`         | Exit code   |
| **Any command** | `<your-cmd>` | —                                    | Exit code   |

Custom agents: use literally any terminal command. agentgrid doesn't restrict what you run.

## Works With

**Terminals:** Ghostty, iTerm2, Terminal.app, Kitty, WezTerm, Alacritty, Windows Terminal (WSL)

**IDEs:** Cursor (integrated terminal), VS Code (integrated terminal)

**OS:** macOS, Linux (Ubuntu, Fedora, Arch), Windows (via WSL)

## Next Steps

- [User Guide](guide.md) — every command explained with examples
- [Presets](presets.md) — save, load, and create custom grid configurations
- [Tips & Tricks](tips.md) — power user shortcuts and integration patterns
