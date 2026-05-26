# Skill: Agent Runtime Adapter (~1,000 Lines)

Build the Energy agent runtime adapter wrapping Claude Agent SDK. This is the core of Phase 1.

## Architecture (From NanoClaw Study)

The adapter has TWO processes:

### 1. Host Process (~500 lines) — Orchestration

Runs on the server. Routes messages, manages sessions, spawns sandboxes.

```
src/runtime/
├── gateway.ts          # HTTP + WebSocket server, message routing
├── session-manager.ts  # Per-user session isolation, SQLite state
├── sandbox-runner.ts   # E2B sandbox spawning, volume mounts, streaming
├── ipc.ts              # File-based IPC (host ↔ sandbox), atomic writes
├── channel-router.ts   # Channel abstraction (web, WhatsApp, API)
├── task-scheduler.ts   # Cron/interval scheduled tasks (HEARTBEAT.md)
├── concurrency.ts      # Max concurrent sandboxes, per-user queuing
└── types.ts            # Shared type definitions
```

### 2. Sandbox Process (~500 lines) — Agent Intelligence

Runs inside E2B sandbox. Calls Claude Agent SDK, executes tools.

```
src/sandbox/
├── agent-loop.ts       # Claude SDK query(), MessageStream for multi-turn
├── tool-registry.ts    # Custom tools via createSdkMcpServer()
├── memory-loader.ts    # Bootstrap: SOUL.md + MEMORY.md + skills/ → context
├── ipc-server.ts       # MCP server exposing send_message, schedule_task
└── hooks.ts            # PreCompact flush, PreToolUse sanitizer
```

## Key Patterns (Extracted from NanoClaw Source)

### The Message Flow

```
Channel → SQLite → Polling Loop (2s) → Spawn Sandbox → Claude SDK query() → Response
```

### Container Isolation (Security Boundary = OS)

- Each user gets their own E2B sandbox (Firecracker microVM)
- Agent files mounted read-only, user memory writable
- Secrets passed via stdin JSON, never written to disk
- Bash hook strips API keys from subprocess env

### The Agent Loop (Inside Sandbox)

```typescript
import { query, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: messageStream, // AsyncIterable for multi-turn
  options: {
    cwd: "/workspace/user",
    allowedTools: [
      "Read",
      "Write",
      "Edit",
      "Bash",
      "Grep",
      "Glob",
      "WebSearch",
      "WebFetch",
      "mcp__energy__*",
    ],
    permissionMode: "bypassPermissions",
    mcpServers: {
      energy: energyMcpServer, // send_message, schedule_task, etc.
    },
    hooks: {
      PreCompact: [{ hooks: [preCompactFlush] }],
      PreToolUse: [{ hooks: [sanitizeBash] }],
    },
  },
})) {
  if (message.type === "result") writeOutput(message);
}
```

### MessageStream (Keep Session Alive for Multi-Turn)

```typescript
class MessageStream {
  private queue: SDKUserMessage[] = [];
  private waiting: (() => void) | null = null;
  private done = false;

  push(text: string): void {
    this.queue.push({ type: "user", message: { role: "user", content: text } });
    this.waiting?.();
  }
  end(): void {
    this.done = true;
    this.waiting?.();
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<SDKUserMessage> {
    while (true) {
      while (this.queue.length > 0) yield this.queue.shift()!;
      if (this.done) return;
      await new Promise<void>((r) => {
        this.waiting = r;
      });
    }
  }
}
```

### File-Based IPC (Host ↔ Sandbox)

```typescript
// Atomic write: temp file → rename (prevents partial reads)
function writeIpc(dir: string, data: object): void {
  const tmp = path.join(dir, `${Date.now()}-${random}.tmp`);
  const final = tmp.replace(".tmp", ".json");
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, final);
}
```

### Tool Registration

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const sendMessageTool = tool(
  "send_message",
  "Send a message to a channel",
  { chatId: z.string(), text: z.string() },
  async (args) => {
    writeIpc(MESSAGES_DIR, { type: "message", ...args });
    return { content: [{ type: "text", text: "Message sent" }] };
  },
);

const scheduleTaskTool = tool(
  "schedule_task",
  "Schedule a recurring task",
  {
    prompt: z.string(),
    schedule_type: z.enum(["cron", "interval", "once"]),
    schedule_value: z.string(),
  },
  async (args) => {
    writeIpc(TASKS_DIR, { type: "schedule_task", ...args });
    return {
      content: [{ type: "text", text: `Scheduled: ${args.schedule_type}` }],
    };
  },
);

const energyMcpServer = createSdkMcpServer({
  name: "energy",
  version: "1.0.0",
  tools: [sendMessageTool, scheduleTaskTool],
});
```

## Dependencies

```json
{
  "@anthropic-ai/claude-agent-sdk": "^0.2.63",
  "@anthropic-ai/sdk": "latest",
  "@modelcontextprotocol/sdk": "latest",
  "zod": "^4.3.6",
  "better-sqlite3": "^11.8.1",
  "cron-parser": "^5.5.0",
  "pino": "^9.6.0"
}
```

## Build Order

1. `types.ts` — shared interfaces
2. `tool-registry.ts` — custom tools via MCP
3. `memory-loader.ts` — reads SOUL.md, skills/, MEMORY.md into context
4. `agent-loop.ts` — wraps Claude SDK query() with our tools + hooks
5. `sandbox-runner.ts` — E2B sandbox lifecycle
6. `session-manager.ts` — per-user isolation in SQLite
7. `gateway.ts` — HTTP + WebSocket server
8. `ipc.ts` — file-based communication
9. Integration tests
10. End-to-end: create agent → deploy → chat → verify memory compounds
