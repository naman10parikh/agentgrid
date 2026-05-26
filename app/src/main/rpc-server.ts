/**
 * JSON-RPC Server — Unix socket for CLI ↔ App communication.
 * Exposes grid, pane, preset, and harness operations via JSON-RPC 2.0.
 * CLI tools connect to ~/.agentgrid/ipc.sock to control the app.
 */

import { createServer, type Server, type Socket } from "net";
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { EventEmitter } from "events";

const SOCKET_DIR = join(homedir(), ".agentgrid");
const SOCKET_PATH = join(SOCKET_DIR, "ipc.sock");
const SOCKET_BREADCRUMB = join(SOCKET_DIR, "socket-path");

interface RpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface RpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

type RpcHandler = (params: Record<string, unknown>) => unknown | Promise<unknown>;

export class RpcServer extends EventEmitter {
  private server: Server | null = null;
  private connections = new Set<Socket>();
  private methods = new Map<string, { handler: RpcHandler; description: string }>();

  /**
   * Register an RPC method with a handler and description.
   */
  register(method: string, description: string, handler: RpcHandler): void {
    this.methods.set(method, { handler, description });
  }

  /**
   * Start the JSON-RPC server on Unix socket.
   */
  start(): void {
    // Clean up stale socket
    if (existsSync(SOCKET_PATH)) {
      try {
        unlinkSync(SOCKET_PATH);
      } catch {
        // In use — another instance running
        return;
      }
    }

    mkdirSync(SOCKET_DIR, { recursive: true });

    // Built-in methods
    this.register("rpc.discover", "List all available RPC methods", () => {
      const methods: Array<{ method: string; description: string }> = [];
      for (const [name, { description }] of this.methods) {
        methods.push({ method: name, description });
      }
      return methods;
    });

    this.register("ping", "Health check", () => ({ pong: true }));

    this.server = createServer((socket) => {
      this.connections.add(socket);
      let buffer = "";

      socket.on("data", (chunk) => {
        buffer += chunk.toString();
        // Process line-delimited JSON
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.trim()) {
            this.handleMessage(socket, line.trim());
          }
        }
      });

      socket.on("close", () => {
        this.connections.delete(socket);
      });

      socket.on("error", () => {
        this.connections.delete(socket);
      });
    });

    this.server.listen(SOCKET_PATH, () => {
      // Write breadcrumb for CLI discovery
      writeFileSync(SOCKET_BREADCRUMB, SOCKET_PATH);
      this.emit("started", SOCKET_PATH);
    });

    this.server.on("error", (err) => {
      this.emit("error", err);
    });
  }

  /**
   * Stop the server and clean up.
   */
  stop(): void {
    for (const socket of this.connections) {
      socket.destroy();
    }
    this.connections.clear();

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    // Clean up socket and breadcrumb
    try {
      if (existsSync(SOCKET_PATH)) unlinkSync(SOCKET_PATH);
      if (existsSync(SOCKET_BREADCRUMB)) unlinkSync(SOCKET_BREADCRUMB);
    } catch {
      // Ignore cleanup errors
    }
  }

  getSocketPath(): string {
    return SOCKET_PATH;
  }

  private async handleMessage(socket: Socket, message: string): Promise<void> {
    let request: RpcRequest;

    try {
      request = JSON.parse(message) as RpcRequest;
    } catch {
      this.sendResponse(socket, {
        jsonrpc: "2.0",
        id: 0,
        error: { code: -32700, message: "Parse error" },
      });
      return;
    }

    if (!request.method || request.jsonrpc !== "2.0") {
      this.sendResponse(socket, {
        jsonrpc: "2.0",
        id: request.id ?? 0,
        error: { code: -32600, message: "Invalid request" },
      });
      return;
    }

    const entry = this.methods.get(request.method);
    if (!entry) {
      this.sendResponse(socket, {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32601, message: `Method not found: ${request.method}` },
      });
      return;
    }

    try {
      const result = await entry.handler(request.params ?? {});
      this.sendResponse(socket, {
        jsonrpc: "2.0",
        id: request.id,
        result,
      });
    } catch (err) {
      this.sendResponse(socket, {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32000,
          message: err instanceof Error ? err.message : "Internal error",
        },
      });
    }
  }

  private sendResponse(socket: Socket, response: RpcResponse): void {
    try {
      socket.write(JSON.stringify(response) + "\n");
    } catch {
      // Socket may have closed
    }
  }
}
