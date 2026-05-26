import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createConnection } from "net";
import { RpcServer } from "../../src/main/rpc-server";

describe("RpcServer", () => {
  let server: RpcServer;

  beforeEach(() => {
    server = new RpcServer();
  });

  afterEach(() => {
    server.stop();
  });

  describe("register", () => {
    it("registers a method", () => {
      server.register("test.echo", "Echo input", (p) => p);
      // No error means success
    });
  });

  describe("start/stop", () => {
    it("starts without error", () => {
      expect(() => server.start()).not.toThrow();
    });

    it("stops without error", () => {
      server.start();
      expect(() => server.stop()).not.toThrow();
    });

    it("can restart after stop", () => {
      server.start();
      server.stop();
      expect(() => server.start()).not.toThrow();
    });
  });

  describe("built-in methods", () => {
    it("has rpc.discover and ping by default", (ctx) => {
      return new Promise<void>((resolve, reject) => {
        server.start();
        server.on("started", (socketPath: string) => {
          const client = createConnection(socketPath, () => {
            // Send discover request
            client.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "rpc.discover",
              }) + "\n",
            );
          });

          let data = "";
          client.on("data", (chunk) => {
            data += chunk.toString();
            if (data.includes("\n")) {
              const response = JSON.parse(data.trim());
              try {
                expect(response.jsonrpc).toBe("2.0");
                expect(response.id).toBe(1);
                expect(Array.isArray(response.result)).toBe(true);
                const methods = response.result.map((m: { method: string }) => m.method);
                expect(methods).toContain("rpc.discover");
                expect(methods).toContain("ping");
                client.end();
                resolve();
              } catch (e) {
                client.end();
                reject(e);
              }
            }
          });

          client.on("error", reject);
          // Timeout
          setTimeout(() => {
            client.end();
            reject(new Error("Timeout"));
          }, 3000);
        });
      });
    });

    it("responds to ping", () => {
      return new Promise<void>((resolve, reject) => {
        server.start();
        server.on("started", (socketPath: string) => {
          const client = createConnection(socketPath, () => {
            client.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "ping",
              }) + "\n",
            );
          });

          let data = "";
          client.on("data", (chunk) => {
            data += chunk.toString();
            if (data.includes("\n")) {
              const response = JSON.parse(data.trim());
              try {
                expect(response.result).toEqual({ pong: true });
                client.end();
                resolve();
              } catch (e) {
                client.end();
                reject(e);
              }
            }
          });

          client.on("error", reject);
          setTimeout(() => {
            client.end();
            reject(new Error("Timeout"));
          }, 3000);
        });
      });
    });
  });

  describe("error handling", () => {
    it("returns error for unknown method", () => {
      return new Promise<void>((resolve, reject) => {
        server.start();
        server.on("started", (socketPath: string) => {
          const client = createConnection(socketPath, () => {
            client.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 3,
                method: "nonexistent",
              }) + "\n",
            );
          });

          let data = "";
          client.on("data", (chunk) => {
            data += chunk.toString();
            if (data.includes("\n")) {
              const response = JSON.parse(data.trim());
              try {
                expect(response.error).toBeDefined();
                expect(response.error.code).toBe(-32601);
                client.end();
                resolve();
              } catch (e) {
                client.end();
                reject(e);
              }
            }
          });

          client.on("error", reject);
          setTimeout(() => {
            client.end();
            reject(new Error("Timeout"));
          }, 3000);
        });
      });
    });
  });

  describe("custom methods", () => {
    it("calls registered handler", () => {
      return new Promise<void>((resolve, reject) => {
        server.register("test.add", "Add two numbers", (p) => {
          return (p.a as number) + (p.b as number);
        });
        server.start();
        server.on("started", (socketPath: string) => {
          const client = createConnection(socketPath, () => {
            client.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 4,
                method: "test.add",
                params: { a: 3, b: 7 },
              }) + "\n",
            );
          });

          let data = "";
          client.on("data", (chunk) => {
            data += chunk.toString();
            if (data.includes("\n")) {
              const response = JSON.parse(data.trim());
              try {
                expect(response.result).toBe(10);
                client.end();
                resolve();
              } catch (e) {
                client.end();
                reject(e);
              }
            }
          });

          client.on("error", reject);
          setTimeout(() => {
            client.end();
            reject(new Error("Timeout"));
          }, 3000);
        });
      });
    });
  });

  describe("getSocketPath", () => {
    it("returns the socket path", () => {
      const path = server.getSocketPath();
      expect(path).toContain(".agentgrid");
      expect(path).toContain("ipc.sock");
    });
  });

  describe("invalid JSON", () => {
    it("returns parse error for malformed JSON", () => {
      return new Promise<void>((resolve, reject) => {
        server.start();
        server.on("started", (socketPath: string) => {
          const client = createConnection(socketPath, () => {
            client.write("this is not json\n");
          });

          let data = "";
          client.on("data", (chunk) => {
            data += chunk.toString();
            if (data.includes("\n")) {
              const response = JSON.parse(data.trim());
              try {
                expect(response.error).toBeDefined();
                expect(response.error.code).toBe(-32700);
                client.end();
                resolve();
              } catch (e) {
                client.end();
                reject(e);
              }
            }
          });

          client.on("error", reject);
          setTimeout(() => {
            client.end();
            reject(new Error("Timeout"));
          }, 3000);
        });
      });
    });
  });

  describe("async handlers", () => {
    it("supports async method handlers", () => {
      return new Promise<void>((resolve, reject) => {
        server.register("test.async", "Async handler", async (p) => {
          await new Promise((r) => setTimeout(r, 10));
          return { delayed: true, input: p.value };
        });
        server.start();
        server.on("started", (socketPath: string) => {
          const client = createConnection(socketPath, () => {
            client.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 10,
                method: "test.async",
                params: { value: 42 },
              }) + "\n",
            );
          });

          let data = "";
          client.on("data", (chunk) => {
            data += chunk.toString();
            if (data.includes("\n")) {
              const response = JSON.parse(data.trim());
              try {
                expect(response.result).toEqual({ delayed: true, input: 42 });
                client.end();
                resolve();
              } catch (e) {
                client.end();
                reject(e);
              }
            }
          });

          client.on("error", reject);
          setTimeout(() => {
            client.end();
            reject(new Error("Timeout"));
          }, 5000);
        });
      });
    });
  });

  describe("concurrent connections", () => {
    it("handles 5 simultaneous clients", () => {
      return new Promise<void>((resolve, reject) => {
        server.register("test.echo", "Echo", (p) => p);
        server.start();
        server.on("started", (socketPath: string) => {
          let completed = 0;
          const total = 5;

          for (let i = 0; i < total; i++) {
            const client = createConnection(socketPath, () => {
              client.write(
                JSON.stringify({
                  jsonrpc: "2.0",
                  id: i,
                  method: "test.echo",
                  params: { clientId: i },
                }) + "\n",
              );
            });

            let data = "";
            client.on("data", (chunk) => {
              data += chunk.toString();
              if (data.includes("\n")) {
                const response = JSON.parse(data.trim());
                try {
                  expect(response.result.clientId).toBe(i);
                  client.end();
                  completed++;
                  if (completed === total) resolve();
                } catch (e) {
                  client.end();
                  reject(e);
                }
              }
            });

            client.on("error", reject);
          }

          setTimeout(() => reject(new Error("Timeout")), 5000);
        });
      });
    });
  });
});
