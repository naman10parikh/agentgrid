---
name: agentgrid
description: Spawn a grid of AI coding agents in one command. Use when the user wants to create parallel agent sessions, set up multi-agent terminal layouts, or launch a team of AI workers across tmux panes.
---

## When to Use

- User asks to "create a grid", "spawn agents", "run N agents in parallel", or "set up a multi-agent team"
- Orchestrating a coding sprint with multiple specialized agents (CEO + builders + QA)
- Running agentgrid as part of a larger workflow (energy fleet, overnight autonomous mode)

## Quick Reference — Core Commands

```bash
# Create a 2x3 grid of Claude agents
agentgrid 2x3 "claude --dangerously-skip-permissions"

# Check all panes status (color-coded)
agentgrid status

# Label the current pane
agentgrid name "VP-FORGE"

# Live auto-refreshing dashboard
agentgrid dashboard
```

## Step-by-Step: Launch a Grid

### 1. Verify inside tmux

```bash
# Must be inside an active tmux session
echo $TMUX   # should print socket path
```

If not in tmux: `agentgrid start` (creates the session).

### 2. Create the grid

```bash
# ROWSxCOLS [agent-command]
agentgrid 2x2 "claude --dangerously-skip-permissions"

# With budget-managed model (reads ANTHROPIC_MODEL env var automatically)
agentgrid 3x2 "claude --dangerously-skip-permissions --chrome"

# Supported agents: claude, codex, gemini, aider, cursor, continue, custom
agentgrid 2x2 codex
```

### 3. Validate the grid

```bash
agentgrid status          # check pane count + statuses
agentgrid equalize        # even out pane sizes
```

### 4. Name each pane (required before injecting missions)

```bash
# In each pane, run:
agentgrid name "CEO"
agentgrid name "BUILDER-1"
agentgrid name "BUILDER-2"
agentgrid name "QA"
```

### 5. Inject missions

```bash
# Send a prompt to a specific pane (get pane IDs from `agentgrid status`)
agentgrid send %42 "You are BUILDER-1. Build the auth module."

# Inject a long mission from a file
agentgrid inject %42 --file .claude/missions/builder-1.md

# Broadcast the same message to ALL panes
agentgrid broadcast "All agents: repo is at /Users/naman/myproject. Begin."
```

## Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| ⚡ WORKING | Blue | Agent is actively processing |
| ⏳ WAITING | Yellow | Agent needs input / permission |
| ✅ DONE | Green | Agent finished its task |
| 💤 IDLE | Gray | No active agent running |

## Pane Management

```bash
agentgrid add right claude     # Add a pane to the right
agentgrid swap up              # Reorder panes
agentgrid kill                 # Clear to 1 pane (clean slate)
```

## Grid Presets (Saved Layouts)

```bash
agentgrid preset list                      # List saved presets
agentgrid preset load engineering-sprint   # Launch a bundled preset
```

Built-in presets live in `presets/`. Custom presets auto-save from `agentgrid save`.

## Sound Alerts

```bash
agentgrid sound test   # Preview alert tones
agentgrid sound off    # Disable sounds
```

## MANDATORY Flags for Claude Workers

When spawning Claude workers that must not block on permission prompts:

```bash
agentgrid 2x3 "claude --dangerously-skip-permissions --chrome"
```

Do NOT pass `--model` or `--effort` directly — those are controlled by `ANTHROPIC_MODEL`
and `CLAUDE_CODE_EFFORT_LEVEL` env vars set by the budget manager.

## Anti-Patterns

- Never use `tmux select-pane` — it steals the user's focus. Use `agentgrid send` instead.
- Never spawn bare `claude` (no flags) — workers will block on permission prompts.
- Never create a new tmux session for the grid — create a new WINDOW inside the current session.
