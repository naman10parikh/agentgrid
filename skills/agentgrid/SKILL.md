---
name: agentgrid
description: Spawn a visible grid of AI coding agents (Claude Code, Codex, Gemini CLI, Aider and others) in one command, one agent per tmux pane. Use when the user wants several agent sessions running in parallel, a multi-agent terminal layout, or a team of agents working side by side.
---

# agentgrid: spawn a grid of coding agents

## When to use

- The user asks to "create a grid", "spawn N agents", "run agents in parallel" or "set up a team of agents".
- A piece of work splits into independent parts (a feature, its tests, its docs) that agents can do side by side.
- Another skill or agent needs a running grid before it can hand out missions (see `agentgrid-orchestrate`).

## Steps

1. **Check tmux.** Run `echo $TMUX`. If it prints nothing, run `agentgrid start` to open a tmux session first.
   `agentgrid ROWSxCOLS` splits the window you are in, so run it in the window the user is watching.
2. **Create the grid.** `agentgrid ROWSxCOLS [agent-command]`, for example:

   ```bash
   agentgrid 2x3 claude        # six Claude Code panes
   agentgrid 2x2 codex         # four Codex panes
   agentgrid 3x3               # nine empty shells (up to 10x10)
   ```

   Any terminal command works as the agent: `agentgrid 2x2 "python my_agent.py"`.
3. **Check it.** `agentgrid status --json` lists every pane with its status and label. `agentgrid equalize` evens out
   the sizes.
4. **Name the panes** before handing out work: run `agentgrid name "Builder 1"` inside a pane, or use the MCP tool
   `pane_rename` from outside.
5. **Hand out work** with the `agentgrid-orchestrate` skill (send, inject, broadcast, monitor).

From another coding agent, the same steps are MCP tools: `grid_create`, `grid_status`, `pane_rename`, `pane_add`,
`grid_equalize` and `grid_kill` (run `agentgrid-mcp`, or install the plugin). `agentgrid kill` clears the grid back
to one pane when the work is done.

## Status colors

| Status | Color | Meaning |
| --- | --- | --- |
| ⚡ WORKING | Blue | The agent is working |
| ⏳ WAITING | Yellow | The agent needs input or a permission |
| ✅ DONE | Green | The agent finished |
| IDLE | Gray | No status is set: the pane is idle, or its agent is not Claude Code |

Only Claude Code sets the status, through hooks (`pane-status.sh`, or the plugin's `hooks/hooks.json`).
agentgrid sets up no hooks for other agents and reads no exit codes, so their panes stay IDLE.

## Output

A tiled grid of `ROWS x COLS` panes in the current tmux window, each running the agent command, with labels
`Agent 1` to `Agent N` until renamed. Report back to the user: the grid size, the pane ids from
`agentgrid status --json`, and which agent runs in each pane.

## Do not

- Never use `tmux select-pane` from a script: it steals the user's focus. Use `agentgrid send` instead.
- Never spawn a grid in a hidden or detached session the user cannot see.
- Never add `--dangerously-skip-permissions` to an agent command unless the user asked for it and the grid runs in
  a sandbox.
