# AgentGrid Extension Guide

## Overview

AgentGrid exposes a JSON-RPC API over Unix socket that any external tool can use to control grids, panes, presets, and agents programmatically.

## Connecting to AgentGrid

When the Electron app is running, it creates a Unix socket at `~/.agentgrid/ipc.sock`. The socket path is also written to `~/.agentgrid/socket-path` for discovery.

```bash
# Check if AgentGrid is running
SOCK=$(cat ~/.agentgrid/socket-path 2>/dev/null)
if [ -S "$SOCK" ]; then
  echo "AgentGrid is running"
fi
```

## JSON-RPC Protocol

AgentGrid uses JSON-RPC 2.0 over newline-delimited JSON on the Unix socket.

### Request Format

```json
{ "jsonrpc": "2.0", "id": 1, "method": "grid.get", "params": {} }
```

### Response Format

```json
{"jsonrpc":"2.0","id":1,"result":{"rows":2,"cols":3,"panes":[...]}}
```

### Discovering Available Methods

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"rpc.discover"}' | nc -U ~/.agentgrid/ipc.sock
```

Returns all available methods with descriptions.

## Available RPC Methods

| Method              | Description                | Params                         |
| ------------------- | -------------------------- | ------------------------------ |
| `rpc.discover`      | List all methods           | none                           |
| `ping`              | Health check               | none                           |
| `grid.get`          | Get current grid state     | none                           |
| `grid.create`       | Create a new grid          | `rows`, `cols`, `agent`, `cwd` |
| `pane.list`         | List all panes             | none                           |
| `pane.rename`       | Rename a pane              | `paneId`, `label`              |
| `pane.status`       | Set pane status            | `paneId`, `status`             |
| `pane.broadcast`    | Send text to all panes     | `text`                         |
| `preset.list`       | List saved presets         | none                           |
| `preset.load`       | Load a preset              | `name`                         |
| `harness.list`      | List harnesses             | none                           |
| `harness.templates` | Get built-in templates     | none                           |
| `signals.scan`      | Scan signal directory      | none                           |
| `tools.detect`      | Detect installed CLI tools | none                           |

## Building a CLI Extension

```typescript
import { createConnection } from "net";
import { readFileSync } from "fs";

function callAgentGrid(method: string, params?: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socketPath = readFileSync(
      `${process.env.HOME}/.agentgrid/socket-path`,
      "utf-8",
    ).trim();

    const client = createConnection(socketPath, () => {
      const request = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params: params ?? {},
      });
      client.write(request + "\n");
    });

    let data = "";
    client.on("data", (chunk) => {
      data += chunk.toString();
      if (data.includes("\n")) {
        const response = JSON.parse(data.trim());
        client.end();
        if (response.error) reject(new Error(response.error.message));
        else resolve(response.result);
      }
    });

    client.on("error", reject);
    setTimeout(() => {
      client.end();
      reject(new Error("Timeout"));
    }, 5000);
  });
}

// Usage
const grid = await callAgentGrid("grid.get");
console.log("Current grid:", grid);
```

## Building a Claude Code Skill

Create a skill that teaches Claude Code to interact with AgentGrid:

```markdown
# AgentGrid Control Skill

When you need to check agent grid status or control the grid, use these commands:

## Check grid status

\`\`\`bash
echo '{"jsonrpc":"2.0","id":1,"method":"grid.get"}' | nc -U ~/.agentgrid/ipc.sock
\`\`\`

## Broadcast to all agents

\`\`\`bash
echo '{"jsonrpc":"2.0","id":1,"method":"pane.broadcast","params":{"text":"focus on tests"}}' | nc -U ~/.agentgrid/ipc.sock
\`\`\`

## Check signals

\`\`\`bash
echo '{"jsonrpc":"2.0","id":1,"method":"signals.scan"}' | nc -U ~/.agentgrid/ipc.sock
\`\`\`
```

Save this as `~/.claude/skills/agentgrid-control/SKILL.md`.

## Webhook Integration

AgentGrid can fire HTTP webhooks when agents complete tasks. Configure via the app settings or IPC:

```typescript
await callAgentGrid("webhook:add", {
  config: {
    id: "slack-notify",
    name: "Slack Notifications",
    url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    events: ["done", "error"],
    enabled: true,
  },
});
```

## Harness Files

Create custom harness YAML files for reusable team configurations:

```yaml
name: my-custom-team
description: Custom development team
version: 1
grid:
  rows: 2
  cols: 3
roles:
  - label: CEO
    agent: claude
    model: claude-opus-4-6
    effort: max
    position: [0, 0]
  - label: Builder-1
    agent: claude
    position: [0, 1]
  - label: Builder-2
    agent: codex
    position: [0, 2]
  - label: QA
    agent: claude
    position: [1, 0]
  - label: Researcher
    agent: gemini
    position: [1, 1]
  - label: Content
    agent: claude
    position: [1, 2]
```

Save to `.claude/harnesses/my-custom-team.yaml`.
