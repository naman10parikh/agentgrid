---
name: agentgrid-sessions
description: Save, restore and replay agentgrid layouts. Save a working grid (layout, pane names, agent commands, conversation ids), restore it after a crash or a reboot, and launch the built-in team presets. Use when the user says "save this grid", "restore my session", "launch a preset" or "set up the same team again".
---

# agentgrid-sessions: save, restore and replay grids

## When to use

- A grid is set up the way the user likes, and they want it back tomorrow.
- A terminal closed, a machine rebooted, or an agent crashed, and the team must come back as it was.
- The user wants a ready-made team layout (a preset) instead of building one by hand.

## Steps

1. **Save the current grid:**

   ```bash
   agentgrid save my-team
   ```

   This records each pane's agent command, directory, name and conversation id in
   `~/.agentgrid/sessions/my-team.json`.
2. **Restore it later:**

   ```bash
   agentgrid restore my-team             # layout, names, and resumed conversations
   agentgrid restore my-team --no-start  # layout and names only, no agents
   ```

   Restore resumes each conversation with the agent's own flag: Claude `--resume <id>`, Codex
   `codex resume <id>`, Gemini `--resume latest`, Goose `session resume --last`.
3. **Use a preset.** `agentgrid preset list` shows them; `agentgrid preset show <name>` prints one;
   `agentgrid launch <name>` starts it. Built-in presets ship in `presets/`:

   | Preset | Panes | What it sets up |
   | --- | --- | --- |
   | `dev-sprint` | 4 | Frontend, Backend, Tests, Docs |
   | `mixed-agents` | 6 | two Claude, two Codex, one Gemini, one scratch shell |
   | `design-sprint` | 4 | Discovery, Composer, Builder, Customer-Zero |
   | `research-sprint` | 4 | a lead researcher, web, repositories, a synthesizer |
   | `sparc-pipeline` | 6 | a lead, then Specification, Pseudocode, Architecture, Refinement, Completion |
   | `anti-drift-squad` | 8 | a coordinator, research, architecture, two coders, tests, review, QA |
   | `research-swarm` | 9 | a lead, seven sources (GitHub, web, docs, forums, X, competitors), a synthesis pane |
   | `full-company` | 9 | a lead, architecture, frontend, backend, QA, content, research, DevOps, design |
   | `earning-factory` | 9 | a lead, six task agents, a dashboard, QA |

   From another coding agent these are MCP tools: `session_save`, `session_restore`, `preset_list` and `preset_load`.
4. **Re-assign work** after a restore with the `agentgrid-orchestrate` skill: a restore brings back the grid and the
   conversations, not the missions in flight.

## Output

A saved session file in `~/.agentgrid/sessions/`, or a grid rebuilt from one. Report back to the user: the session
or preset name, the number of panes, and whether each agent resumed its conversation.

## Do not

- Do not restore into a window that already holds a grid: run `agentgrid kill` first.
- Do not treat a saved session as a backup of the agents' work: commit the work to git.
