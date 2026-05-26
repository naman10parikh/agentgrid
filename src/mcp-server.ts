#!/usr/bin/env node

/**
 * AgentGrid MCP Server
 *
 * Exposes AgentGrid operations as MCP tools so other Claude Code sessions
 * can interact with grids programmatically.
 *
 * Usage:
 *   claude mcp add agentgrid -- npx agentgrid mcp-serve
 *   OR
 *   node dist/mcp-server.js
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PRESETS_DIR, SESSIONS_DIR, CONFIG_DIR } from "./lib/constants.js";

// MCP protocol types (inline to avoid dependency)
interface McpRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

// Tool definitions
const TOOLS = [
  {
    name: "grid_create",
    description:
      "Create an NxM grid of AI coding agents. Example: 2x3 creates 6 panes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        size: {
          type: "string",
          description: 'Grid dimensions, e.g. "2x3", "3x2", "4x1"',
        },
        agent: {
          type: "string",
          description: 'Agent CLI to use (default: "claude")',
          default: "claude",
        },
        model: {
          type: "string",
          description: "Model override, e.g. claude-opus-4-6",
        },
        effort: {
          type: "string",
          description: "Effort level: low, medium, high, max",
        },
      },
      required: ["size"],
    },
  },
  {
    name: "grid_status",
    description:
      "Get status of all panes in the current grid. Returns pane IDs, labels, statuses, and commands.",
    inputSchema: {
      type: "object" as const,
      properties: {
        json: {
          type: "boolean",
          description: "Return machine-readable JSON output",
          default: true,
        },
      },
    },
  },
  {
    name: "grid_broadcast",
    description: "Send a message to ALL panes in the grid simultaneously.",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: { type: "string", description: "Message to broadcast" },
      },
      required: ["message"],
    },
  },
  {
    name: "grid_kill",
    description: "Kill all panes except one (clean slate).",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "pane_send",
    description:
      "Send a message to a specific pane by ID, index, or label name.",
    inputSchema: {
      type: "object" as const,
      properties: {
        pane: {
          type: "string",
          description: "Pane ID (%123), index (0-N), or label name",
        },
        message: { type: "string", description: "Message to send" },
      },
      required: ["pane", "message"],
    },
  },
  {
    name: "pane_read",
    description: "Capture recent output from a specific pane.",
    inputSchema: {
      type: "object" as const,
      properties: {
        pane: {
          type: "string",
          description: "Pane ID (%123), index (0-N), or label name",
        },
        lines: {
          type: "number",
          description: "Number of lines to capture (default: 50)",
          default: 50,
        },
      },
      required: ["pane"],
    },
  },
  {
    name: "pane_rename",
    description: "Rename a pane (set its label).",
    inputSchema: {
      type: "object" as const,
      properties: {
        pane: { type: "string", description: "Pane ID or index" },
        name: { type: "string", description: "New label for the pane" },
      },
      required: ["pane", "name"],
    },
  },
  {
    name: "pane_add",
    description: "Add a new pane to the grid.",
    inputSchema: {
      type: "object" as const,
      properties: {
        direction: {
          type: "string",
          description: 'Split direction: "right" or "below"',
          default: "right",
        },
        agent: {
          type: "string",
          description: 'Agent to launch (default: "claude")',
          default: "claude",
        },
      },
    },
  },
  {
    name: "preset_list",
    description: "List all saved grid presets.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "preset_load",
    description: "Load and launch a saved preset by name.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Preset name" },
      },
      required: ["name"],
    },
  },
  {
    name: "session_save",
    description:
      "Save the current grid layout, pane names, and state for later restoration.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Session name (auto-generated if omitted)",
        },
      },
    },
  },
  {
    name: "session_restore",
    description: "Restore a previously saved grid session.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Session name to restore" },
      },
      required: ["name"],
    },
  },
  {
    name: "pane_inject",
    description: "Inject a file or long prompt into a specific pane.",
    inputSchema: {
      type: "object" as const,
      properties: {
        pane: { type: "string", description: "Pane ID or index" },
        file: { type: "string", description: "File path to inject" },
        message: {
          type: "string",
          description: "Message text (alternative to file)",
        },
      },
      required: ["pane"],
    },
  },
  {
    name: "grid_equalize",
    description: "Even out all pane sizes in the grid.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "grid_dashboard",
    description:
      "Get a snapshot of the live dashboard (all panes with status).",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

function runAgentgrid(args: string): string {
  try {
    const result = execSync(`agentgrid ${args}`, {
      encoding: "utf-8",
      timeout: 30000,
      env: { ...process.env },
    });
    return result.trim();
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    return `ERROR: ${error.stderr || error.message || "Unknown error"}`;
  }
}

function handleToolCall(
  name: string,
  args: Record<string, unknown>,
): { content: Array<{ type: string; text: string }> } {
  let result: string;

  switch (name) {
    case "grid_create": {
      const size = args["size"] as string;
      const agent = (args["agent"] as string) ?? "claude";
      const flags: string[] = [];
      if (args["model"]) flags.push(`--model ${args["model"]}`);
      if (args["effort"]) flags.push(`--effort ${args["effort"]}`);
      result = runAgentgrid(`grid ${size} ${agent} ${flags.join(" ")}`);
      break;
    }

    case "grid_status": {
      result = runAgentgrid("status --json");
      break;
    }

    case "grid_broadcast": {
      const message = args["message"] as string;
      result = runAgentgrid(`broadcast "${message.replace(/"/g, '\\"')}"`);
      break;
    }

    case "grid_kill": {
      result = runAgentgrid("kill");
      break;
    }

    case "pane_send": {
      const pane = args["pane"] as string;
      const msg = args["message"] as string;
      result = runAgentgrid(`send ${pane} "${msg.replace(/"/g, '\\"')}"`);
      break;
    }

    case "pane_read": {
      const pane = args["pane"] as string;
      const lines = (args["lines"] as number) ?? 50;
      result = runAgentgrid(`read ${pane} -n ${lines}`);
      break;
    }

    case "pane_rename": {
      const pane = args["pane"] as string;
      const newName = args["name"] as string;
      // Use tmux directly for non-current pane naming
      try {
        execSync(`tmux set-option -p -t ${pane} @pane_label "${newName}"`, {
          encoding: "utf-8",
        });
        result = `Renamed pane ${pane} to "${newName}"`;
      } catch {
        result = runAgentgrid(`name "${newName}"`);
      }
      break;
    }

    case "pane_add": {
      const dir = (args["direction"] as string) ?? "right";
      const agent = (args["agent"] as string) ?? "claude";
      result = runAgentgrid(`add ${dir} ${agent}`);
      break;
    }

    case "preset_list": {
      result = runAgentgrid("preset list");
      break;
    }

    case "preset_load": {
      const presetName = args["name"] as string;
      result = runAgentgrid(`launch ${presetName}`);
      break;
    }

    case "session_save": {
      const sessionName = args["name"] as string | undefined;
      result = runAgentgrid(sessionName ? `save ${sessionName}` : "save");
      break;
    }

    case "session_restore": {
      const restoreName = args["name"] as string;
      result = runAgentgrid(`restore ${restoreName}`);
      break;
    }

    case "pane_inject": {
      const targetPane = args["pane"] as string;
      if (args["file"]) {
        result = runAgentgrid(`inject ${targetPane} --file "${args["file"]}"`);
      } else if (args["message"]) {
        const injectMsg = args["message"] as string;
        result = runAgentgrid(
          `inject ${targetPane} --message "${injectMsg.replace(/"/g, '\\"')}"`,
        );
      } else {
        result = "ERROR: Must provide either 'file' or 'message' parameter";
      }
      break;
    }

    case "grid_equalize": {
      result = runAgentgrid("equalize");
      break;
    }

    case "grid_dashboard": {
      result = runAgentgrid("status");
      break;
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
      };
  }

  return { content: [{ type: "text", text: result }] };
}

// ─── MCP stdio transport ───

let buffer = "";

process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk: string) => {
  buffer += chunk;

  // Process complete JSON-RPC messages (newline-delimited)
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const request: McpRequest = JSON.parse(trimmed);
      const response = handleRequest(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + "\n");
      }
    } catch {
      // Skip malformed messages
    }
  }
});

function handleRequest(request: McpRequest): McpResponse | null {
  switch (request.method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "agentgrid",
            version: "2.0.0",
          },
        },
      };

    case "notifications/initialized":
      return null; // No response needed for notifications

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: { tools: TOOLS },
      };

    case "tools/call": {
      const params = request.params as {
        name: string;
        arguments?: Record<string, unknown>;
      };
      const toolResult = handleToolCall(params.name, params.arguments ?? {});
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: toolResult,
      };
    }

    case "ping":
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {},
      };

    default:
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32601, message: `Unknown method: ${request.method}` },
      };
  }
}

// Signal readiness
process.stderr.write("[agentgrid-mcp] Server started. 15 tools available.\n");
