---
name: agentgrid-sessions
description: Save, restore, and manage agentgrid sessions and presets — persist grid layouts, replay company configurations, and use built-in presets. Use when "save grid", "restore session", "load preset", "replay company" is needed.
---

## When to Use

- Save a working grid layout to replay it later (or overnight)
- Restore a previous company configuration after a crash or new terminal
- Load a bundled preset for common team patterns (dev-sprint, research-swarm, full-company)
- List what sessions/presets are available

## Session Commands

### Save a grid

```bash
# Save current grid layout, pane labels, and agent types
agentgrid save my-company

# Sessions are stored in ~/.agentgrid/sessions/
```

### Restore a grid

```bash
# Restore a previously saved session
agentgrid restore my-company

# This re-creates panes, re-applies labels, and re-launches agents
```

### List saved sessions

```bash
agentgrid preset list   # lists both built-in presets and saved sessions
```

## Built-in Presets

Presets live in `presets/` in the agentgrid package. Launch any with:

```bash
agentgrid preset load <name>
```

| Preset | Panes | Description |
|--------|-------|-------------|
| `dev-sprint` | 4 | CEO + 2 builders + QA |
| `full-company` | 6 | CEO + VP + 3 builders + QA |
| `research-sprint` | 3 | CEO + 2 researchers |
| `research-swarm` | 5 | CEO + 4 parallel researchers |
| `anti-drift-squad` | 3 | CEO + auditor + fixer |
| `design-sprint` | 4 | CEO + designer + builder + QA |
| `earning-factory` | 4 | CEO + 3 earning agents |
| `mixed-agents` | 4 | Mixed: Claude + Codex + Gemini + aider |
| `sparc-pipeline` | 5 | SPARC: spec + pseudocode + arch + refine + complete |

## Typical Session Workflow

```bash
# 1. Create and configure a grid
agentgrid 3x2 "claude --dangerously-skip-permissions --chrome"

# 2. Name each pane (CEO runs in each pane)
agentgrid name "CEO"

# 3. Do your work...

# 4. Save for later
agentgrid save energy-fleet

# — Next session —

# 5. Restore
agentgrid restore energy-fleet

# Agents are re-launched in their labeled panes automatically
```

## Overnight Autonomous Pattern

```bash
# Save after grid is configured and working
agentgrid save overnight-run

# If the session crashes or context degrades, restore:
agentgrid restore overnight-run

# Auto-switch.sh integrates with sessions:
# ./scripts/auto-switch.sh --overnight
# It reads .claude/handoff.md and calls agentgrid restore if a session was saved
```

## Session Storage Location

Sessions are stored as JSON in `~/.agentgrid/sessions/`. Each file contains:
- Grid dimensions
- Pane labels (names)
- Agent command per pane
- Working directory per pane

You can inspect or version-control these files directly.

## Anti-Patterns

- Don't rely on sessions for persistent state — agent context is not saved, only the grid structure.
- Don't restore a session into a tmux window that already has a grid — kill existing panes first.
- Presets launch fresh agents; combine with `agentgrid inject` to re-assign missions.
