# Presets

Presets are saved grid configurations that you can launch with one command. They define how many panes to create, what agent to run in each, and what to name them.

## Built-in Presets

agentgrid ships with 3 presets:

### dev-sprint

4-agent development sprint: Frontend, Backend, Tests, and Docs — all running Claude Code.

```bash
agentgrid launch dev-sprint
```

```json
{
  "description": "4-agent dev sprint: frontend, backend, tests, docs",
  "panes": [
    { "name": "Frontend", "agent": "claude" },
    { "name": "Backend", "agent": "claude" },
    { "name": "Tests", "agent": "claude" },
    { "name": "Docs", "agent": "claude" }
  ]
}
```

### mixed-agents

6 panes with a mix of agents: 2 Claude, 2 Codex, 1 Gemini, and 1 empty scratch pane.

```bash
agentgrid launch mixed-agents
```

```json
{
  "description": "Mixed agents: 2 Claude + 2 Codex + 1 Gemini + 1 empty",
  "panes": [
    { "name": "Claude #1", "agent": "claude" },
    { "name": "Claude #2", "agent": "claude" },
    { "name": "Codex #1", "agent": "codex" },
    { "name": "Codex #2", "agent": "codex" },
    { "name": "Gemini", "agent": "gemini" },
    { "name": "Scratch", "agent": "" }
  ]
}
```

### research-swarm

9-agent research swarm for deep investigation. One lead agent coordinates, others are specialized researchers.

```bash
agentgrid launch research-swarm
```

```json
{
  "description": "9-agent research swarm for deep investigation",
  "panes": [
    { "name": "Lead", "agent": "claude" },
    { "name": "GitHub", "agent": "claude" },
    { "name": "Web", "agent": "claude" },
    { "name": "Docs", "agent": "claude" },
    { "name": "Reddit", "agent": "claude" },
    { "name": "HN", "agent": "claude" },
    { "name": "X/Twitter", "agent": "claude" },
    { "name": "Competitors", "agent": "claude" },
    { "name": "Synthesis", "agent": "claude" }
  ]
}
```

## Managing Presets

### List All Presets

```bash
agentgrid preset list
```

Shows all saved presets with their descriptions and pane counts.

### View a Preset

```bash
agentgrid preset show dev-sprint
```

Displays the full JSON configuration of a preset.

### Delete a Preset

```bash
agentgrid preset delete old-setup
```

Removes the preset file from `~/.agentgrid/presets/`.

## Creating Custom Presets

### Method 1: From Setup Wizard

Run `agentgrid setup`, configure your grid, and answer "yes" when prompted to save as a preset.

### Method 2: Manual JSON

Create a JSON file in `~/.agentgrid/presets/`:

```bash
cat > ~/.agentgrid/presets/my-team.json << 'EOF'
{
  "description": "My custom team layout",
  "panes": [
    { "name": "Lead", "agent": "claude" },
    { "name": "Worker 1", "agent": "claude" },
    { "name": "Worker 2", "agent": "codex" },
    { "name": "Monitor", "agent": "" }
  ]
}
EOF
```

Then launch it:

```bash
agentgrid launch my-team
```

### Preset File Format

```json
{
  "description": "Human-readable description of this grid",
  "panes": [
    {
      "name": "Display name for the pane",
      "agent": "cli-command-to-run"
    }
  ]
}
```

**Fields:**

| Field           | Required | Description                                         |
| --------------- | -------- | --------------------------------------------------- |
| `description`   | Yes      | Short description shown in `preset list`            |
| `panes`         | Yes      | Array of pane definitions                           |
| `panes[].name`  | Yes      | Pane label (locked, persists across agent restarts) |
| `panes[].agent` | Yes      | Agent command to run (empty string for no agent)    |

**Agent values:**

- `"claude"` — Claude Code
- `"codex"` — OpenAI Codex
- `"gemini"` — Gemini CLI
- `"aider"` — Aider
- `""` — Empty shell (no agent started)
- Any string — treated as a shell command to run

## Preset Examples

### Bug Triage

```json
{
  "description": "Bug triage: reproduce, investigate, fix, test",
  "panes": [
    { "name": "Reproduce", "agent": "claude" },
    { "name": "Investigate", "agent": "claude" },
    { "name": "Fix", "agent": "claude" },
    { "name": "Test", "agent": "claude" }
  ]
}
```

### Multi-Vendor Comparison

```json
{
  "description": "Compare same task across 4 different AI agents",
  "panes": [
    { "name": "Claude", "agent": "claude" },
    { "name": "Codex", "agent": "codex" },
    { "name": "Gemini", "agent": "gemini" },
    { "name": "Aider", "agent": "aider" }
  ]
}
```

### Full Stack Sprint

```json
{
  "description": "Full stack: API, DB, frontend, mobile, tests, deploy",
  "panes": [
    { "name": "API", "agent": "claude" },
    { "name": "Database", "agent": "claude" },
    { "name": "Frontend", "agent": "claude" },
    { "name": "Mobile", "agent": "claude" },
    { "name": "Tests", "agent": "claude" },
    { "name": "Deploy", "agent": "" }
  ]
}
```

## File Location

All presets are stored in `~/.agentgrid/presets/` as JSON files:

```
~/.agentgrid/
  presets/
    dev-sprint.json
    mixed-agents.json
    research-swarm.json
    my-custom-preset.json
```
