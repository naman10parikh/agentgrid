---
name: agentgrid-orchestrate
description: Hand out and track work across a running agentgrid. Send a prompt to one pane, inject a long mission file, broadcast to every pane, read a pane's output and watch live status. Use after a grid is running, when the user says "send this to pane 3", "broadcast", "inject the mission", "what is pane 2 doing" or "monitor the grid".
---

# agentgrid-orchestrate: hand out and track work

## When to use

- A grid is already running (created with `agentgrid ROWSxCOLS`, or the MCP tool `grid_create`).
- Each pane needs its own mission, or every pane needs the same instruction.
- You need to know which agents are working, waiting or done, without switching windows.

## Steps

1. **List the panes.** `agentgrid status --json` returns `{"panes":[{"ref","status","label","command"}]}`. Use the
   `ref` (for example `agentgrid:1.3`) or a pane id such as `%42` as the target.
2. **Send one prompt to one pane:**

   ```bash
   agentgrid send %42 "You are Builder 1. Implement the login form in src/auth/."
   ```

3. **Inject a long mission** (a Markdown file) into one pane:

   ```bash
   agentgrid inject %42 --file missions/builder-1.md
   ```

4. **Broadcast** the same line to every pane in the current window:

   ```bash
   agentgrid broadcast "Pull main, run the tests, then report what failed."
   ```

5. **Read and watch.** `agentgrid read %42 -n 40` prints the pane's last 40 lines. `agentgrid monitor` shows every
   pane's status and recent output, refreshed live. `agentgrid status` gives a one-shot summary.
6. **Follow-ups go to the owner.** When a pane's work produces a follow-up bug, send it to that same pane with
   `agentgrid send`. Do not broadcast it: the owner already holds the context.

From another coding agent, the same steps are MCP tools: `grid_status`, `pane_send`, `pane_inject`,
`grid_broadcast`, `pane_read` and `grid_dashboard` (run `agentgrid-mcp`, or install the plugin).

## Output

Every pane has its mission, and you can report each pane's state. Report back to the user: which mission went to
which pane, and the latest status of each (WORKING, WAITING, DONE or IDLE).

## Do not

- Never `tmux select-pane`: it steals the user's focus.
- Never inject missions before the panes are named: names are how you and the user tell the work apart.
- Never send a secret (a key, a token) in a prompt: agents read keys from environment variables.
