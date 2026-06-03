---
name: agentgrid-orchestrate
description: Orchestrate missions across a running agentgrid — inject tasks, broadcast to all panes, monitor live status, and read pane output. Use after a grid is already running (post agentgrid NxM). Triggers on "send mission", "broadcast", "inject", "monitor panes", "read pane output".
---

## When to Use

- A grid is already running and you need to assign missions to specific panes
- Broadcast a directive to all workers at once
- Poll or read live output from a pane
- Set up a live monitoring loop for a running company
- Inject a long markdown mission file into a pane

## Core Orchestration Commands

### Send to a specific pane

```bash
# Get pane IDs first
agentgrid status

# Send a prompt (adds Enter automatically)
agentgrid send %42 "You are BUILDER-1. Implement the OAuth module in src/auth/"

# Send a long mission from a file
agentgrid inject %42 --file .claude/missions/builder-1.md
```

### Broadcast to all panes

```bash
# All panes in current window receive the same message
agentgrid broadcast "All workers: repo is at /Users/naman/myproject. Read AGENTS.md first."

# Useful for team-wide directives
agentgrid broadcast "STOP — wait for CEO before continuing. Check .claude/vp-signals/."
```

### Read pane output

```bash
# Capture last N lines from a pane
agentgrid read %42 --lines 20

# Useful for checking worker progress without focus-stealing
```

## Live Monitoring

```bash
# Auto-refreshing status view (default: 5s interval)
agentgrid monitor

# Custom refresh interval
agentgrid monitor --interval 10

# One-shot dashboard snapshot
agentgrid dashboard
```

## Status Colors Reference

| Status | Color | Meaning |
|--------|-------|---------|
| ⚡ WORKING | Blue | Agent is actively processing |
| ⏳ WAITING | Yellow | Needs input or permission |
| ✅ DONE | Green | Finished its task |
| 💤 IDLE | Gray | No active agent running |

## Mission Injection Pattern (Signal-Based Workflow)

```bash
# 1. Label panes before injection
agentgrid name "CEO"        # run in each pane
agentgrid name "BUILDER-1"

# 2. Inject missions
agentgrid inject %42 --file .claude/missions/ceo.md
agentgrid inject %43 --file .claude/missions/builder-1.md

# 3. Monitor until all done
agentgrid monitor --interval 5
# Workers signal completion via: echo "DONE" > .claude/vp-signals/{role}.done

# 4. Check signals
ls .claude/vp-signals/*.done
```

## Auto-Approve Permission Prompts (Overnight Runs)

Workers may pause on permission prompts. Send Enter to all:

```bash
# Manual: in each pane, press Enter
# Via tmux fallback (allowed for this specific use case):
for pid in $(tmux list-panes -F '#{pane_id}'); do
  tmux send-keys -t "$pid" "" Enter
done
```

## Anti-Patterns

- Never use `tmux select-pane` — it steals the user's focus. Use `agentgrid send` instead.
- Never broadcast follow-up bugs — use `agentgrid send` to the owning worker (Spotify-queue rule).
- Never inject missions before naming panes — labels are required for signal tracking.
