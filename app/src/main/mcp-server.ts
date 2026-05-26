/**
 * AgentGrid MCP Server — Expose grid operations via Model Context Protocol.
 *
 * Two modes:
 * 1. **Embedded** (inside Electron): Uses direct manager references
 * 2. **Standalone** (stdio): Connects to AgentGrid via RPC socket
 *
 * For Claude Code integration, register in .mcp.json:
 *   { "agentgrid": { "command": "node", "args": ["tools/agentgrid/app/out/main/mcp-server.js"] } }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createConnection, type Socket } from "net";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const SOCKET_DIR = join(homedir(), ".agentgrid");
const SOCKET_PATH = join(SOCKET_DIR, "ipc.sock");
const BREADCRUMB_PATH = join(SOCKET_DIR, "socket-path");

// ─── RPC Client (connects to running AgentGrid app) ───

let rpcIdCounter = 0;

function getSocketPath(): string {
  if (existsSync(BREADCRUMB_PATH)) {
    return readFileSync(BREADCRUMB_PATH, "utf-8").trim();
  }
  return SOCKET_PATH;
}

function rpcCall(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socketPath = getSocketPath();
    if (!existsSync(socketPath)) {
      reject(new Error("AgentGrid app is not running. Launch it first."));
      return;
    }

    const socket: Socket = createConnection(socketPath);
    const id = ++rpcIdCounter;
    let buffer = "";

    socket.on("connect", () => {
      const request = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
      socket.write(request);
    });

    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const response = JSON.parse(line.trim());
          if (response.id === id) {
            socket.end();
            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        } catch {
          // Ignore parse errors on partial data
        }
      }
    });

    socket.on("error", (err) => {
      reject(new Error(`Cannot connect to AgentGrid: ${err.message}`));
    });

    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error("RPC call timed out after 10s"));
    });
  });
}

// ─── MCP Server ───

const server = new McpServer({
  name: "agentgrid",
  version: "0.1.0",
});

// Tool: grid_create
server.tool(
  "grid_create",
  "Create a new agent grid with the specified dimensions",
  {
    rows: z.number().int().min(1).max(6).describe("Number of rows (1-6)"),
    cols: z.number().int().min(1).max(6).describe("Number of columns (1-6)"),
    agent: z
      .enum(["claude", "codex", "gemini", "aider", "goose", "hermes", "cline", "custom"])
      .default("claude")
      .describe("CLI tool to run in each pane"),
  },
  async ({ rows, cols, agent }) => {
    const cwd = process.cwd();
    const result = await rpcCall("grid.create", { rows, cols, agent, cwd });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// Tool: grid_status
server.tool("grid_status", "Get current grid layout and pane health status", {}, async () => {
  const grid = await rpcCall("grid.get", {});
  const health = await rpcCall("health.getAll", {}).catch(() => null);
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ grid, health }, null, 2) }],
  };
});

// Tool: pane_send
server.tool(
  "pane_send",
  "Send text/command to a specific terminal pane",
  {
    paneId: z.string().describe("The pane ID to send text to"),
    text: z.string().describe("Text or command to send (newline appended automatically)"),
  },
  async ({ paneId, text }) => {
    await rpcCall("terminal.write", { paneId, data: text + "\n" });
    return { content: [{ type: "text" as const, text: `Sent to ${paneId}: ${text}` }] };
  },
);

// Tool: pane_read
server.tool(
  "pane_read",
  "Read the last N lines of output from a terminal pane",
  {
    paneId: z.string().describe("The pane ID to read from"),
    lines: z.number().int().min(1).max(500).default(50).describe("Number of lines to read"),
  },
  async ({ paneId, lines }) => {
    const result = await rpcCall("terminal.read", { paneId, lines });
    return { content: [{ type: "text" as const, text: String(result) }] };
  },
);

// Tool: broadcast
server.tool(
  "broadcast",
  "Send a message to ALL terminal panes simultaneously",
  {
    message: z.string().describe("Message to broadcast to all panes"),
  },
  async ({ message }) => {
    await rpcCall("pane.broadcast", { text: message });
    return { content: [{ type: "text" as const, text: `Broadcast sent: ${message}` }] };
  },
);

// Tool: preset_load
server.tool(
  "preset_load",
  "Load a saved grid preset by name",
  {
    name: z.string().describe("Name of the preset to load"),
  },
  async ({ name }) => {
    const result = await rpcCall("preset.load", { name });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// Tool: preset_list
server.tool("preset_list", "List all saved grid presets", {}, async () => {
  const result = await rpcCall("preset.list", {});
  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
});

// Tool: pane_rename
server.tool(
  "pane_rename",
  "Rename a pane label",
  {
    paneId: z.string().describe("The pane ID to rename"),
    label: z.string().describe("New label for the pane"),
  },
  async ({ paneId, label }) => {
    await rpcCall("pane.rename", { paneId, label });
    return { content: [{ type: "text" as const, text: `Renamed ${paneId} to "${label}"` }] };
  },
);

// ─── Standalone entry point (stdio transport) ───

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`AgentGrid MCP server failed: ${err}\n`);
  process.exit(1);
});
