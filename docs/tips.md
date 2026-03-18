# Tips & Tricks

Power user patterns for getting the most out of agentgrid.

## Keyboard Navigation

agentgrid configures vim-style pane navigation:

| Shortcut         | Action                                     |
| ---------------- | ------------------------------------------ |
| **Option+H**     | Move left                                  |
| **Option+J**     | Move down                                  |
| **Option+K**     | Move up                                    |
| **Option+L**     | Move right                                 |
| **Option+Z**     | Zoom/unzoom pane (toggle fullscreen)       |
| **Option+Arrow** | Move between panes (arrow key alternative) |

These work without a prefix key — just hold Option and press the direction.

## tmux Prefix Commands

agentgrid sets the prefix to `Ctrl+A` (instead of tmux's default `Ctrl+B`):

| Shortcut     | Action                            |
| ------------ | --------------------------------- | ---------------- |
| `Ctrl+A      | `                                 | Split pane right |
| `Ctrl+A -`   | Split pane down                   |
| `Ctrl+A .`   | Rename current pane               |
| `Ctrl+A E`   | Equalize all pane sizes           |
| `Ctrl+A c`   | Create new window (like a tab)    |
| `Ctrl+A 1-9` | Switch to window by number        |
| `Ctrl+A d`   | Detach (keeps everything running) |

## Working With Multiple Windows

tmux "windows" are like tabs — they let you organize groups of panes:

```bash
# Create a new window
Ctrl+A c

# Switch between windows
Ctrl+A 1    # Window 1
Ctrl+A 2    # Window 2

# Create another grid in the new window
agentgrid 2x2 claude
```

Use windows to separate concerns: one window for your main sprint, another for research, another for monitoring.

## Background Sessions

Detach your session and it keeps running:

```bash
agentgrid detach         # Or Ctrl+A d
# ... do other things ...
agentgrid start          # Reattach to your grid
```

All agents continue working while detached. When you come back, everything is exactly where you left it.

## Session Save/Restore Workflow

Save before detaching for the night:

```bash
agentgrid save tonight
agentgrid detach
```

Resume tomorrow:

```bash
agentgrid restore tonight
```

Each Claude pane resumes its exact conversation — not just the most recent one.

## Claude Code Integration

### Automatic Status Hooks

The installer sets up 3 Claude Code hooks:

1. **UserPromptSubmit** — sets status to "running" (blue)
2. **PermissionRequest** — sets status to "needs-input" (yellow) + plays sound
3. **Stop** — sets status to "done" (green) + plays sound

These are stored in `~/.claude/settings.json`. You can verify them:

```bash
cat ~/.claude/settings.json | python3 -m json.tool | grep -A5 agentgrid
```

### Injecting Prompts

Send a task to a specific pane using tmux:

```bash
# Send text to pane %5
tmux send-keys -t %5 "Build a login form with email/password" Enter
```

Or broadcast to all panes:

```bash
agentgrid broadcast "git pull && npm install"
```

### Claude Code Permission Auto-Approve

When a Claude pane shows "WAITING" (yellow), the agent needs permission approval. You can auto-approve by sending Enter:

```bash
# Auto-approve the permission prompt in pane %5
tmux send-keys -t %5 Enter
```

## Custom Sound Packs

### macOS System Sounds

Use any built-in macOS sound with the `system:` prefix:

```bash
agentgrid sound done system:Glass
agentgrid sound waiting system:Hero
agentgrid sound subagent system:Submarine
```

Available macOS sounds: Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink.

### Custom Audio Files

```bash
agentgrid sound done ~/Music/success.mp3
agentgrid sound waiting ~/Music/alert.wav
```

Supported formats: MP3, WAV, AIFF, M4A, OGG.

### Disable Sounds

```bash
agentgrid sound off
```

## Scripting with agentgrid

### Example: Dev Sprint Script

```bash
#!/bin/bash
# dev-sprint.sh — Launch a 4-agent sprint

agentgrid 2x2 claude
sleep 2

# Name each pane
tmux set-option -p -t :.1 @pane_label "Frontend"
tmux set-option -p -t :.2 @pane_label "Backend"
tmux set-option -p -t :.3 @pane_label "Tests"
tmux set-option -p -t :.4 @pane_label "Docs"

echo "Sprint ready!"
```

### Example: Earning Agent Fleet

```bash
#!/bin/bash
# earning-fleet.sh — 7 named agents for autonomous tasks

agentgrid 2x4
tmux set-option -p -t :.1 @pane_label "Mercury (Trading)"
tmux set-option -p -t :.2 @pane_label "Venus (Bounties)"
tmux set-option -p -t :.3 @pane_label "Mars (Crypto)"
tmux set-option -p -t :.4 @pane_label "Jupiter (Gigs)"
tmux set-option -p -t :.5 @pane_label "Saturn (Products)"
tmux set-option -p -t :.6 @pane_label "Neptune (Content)"
tmux set-option -p -t :.7 @pane_label "Pluto (Outreach)"
tmux set-option -p -t :.8 @pane_label "HQ (Monitor)"
```

## Reading Pane Output

Capture what an agent has been doing:

```bash
# Capture visible content of pane %5
tmux capture-pane -t %5 -p

# Capture with scrollback (last 500 lines)
tmux capture-pane -t %5 -p -S -500
```

## Troubleshooting

### "sessions should be nested with care"

You're trying to start tmux inside tmux. agentgrid handles this automatically — just use `agentgrid start` and it will detect your current session.

### Pane statuses not updating

1. Check hooks are installed: `cat ~/.claude/settings.json | grep agentgrid`
2. Reinstall hooks: run the installer again or use `agentgrid terminal-setup`
3. Verify `pane-status.sh` is in PATH: `which agentgrid-pane-status`

### Sounds not playing

- **macOS:** Sounds use `afplay`, which bypasses DND. Check the file path: `afplay /System/Library/Sounds/Glass.aiff`
- **Linux:** Sounds use `paplay`. Install PulseAudio if missing: `sudo apt install pulseaudio-utils`
- **Test sounds:** `agentgrid sound test`

### Pane names disappearing

agentgrid locks pane names with `allow-rename off`. If names still reset, check if something is overwriting `~/.tmux.conf`. The agentgrid section should include:

```
set -g allow-rename off
setw -g automatic-rename off
```

### Grid looks uneven

Run `agentgrid equalize` or press `Ctrl+A E` to re-tile all panes evenly.

## Environment Variables

| Variable            | Default     | Description               |
| ------------------- | ----------- | ------------------------- |
| `AGENTGRID_SESSION` | `agentgrid` | Default tmux session name |

Set this before launching to use a custom session name:

```bash
export AGENTGRID_SESSION=my-project
agentgrid start
```
