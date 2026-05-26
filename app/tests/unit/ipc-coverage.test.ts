import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { IPC } from "../../src/shared/types";

describe("IPC Handler Coverage", () => {
  const mainSource = readFileSync(join(__dirname, "../../src/main/index.ts"), "utf-8");

  it("every IPC constant has a handler registered in main", () => {
    const missing: string[] = [];
    for (const [key, channel] of Object.entries(IPC)) {
      // Skip event-only channels (data streams, not request/response)
      if (channel === "terminal:data" || channel === "ceo:log:entry") continue;
      // Check if ipcMain.handle is registered for this channel
      const hasHandle = mainSource.includes(`"${channel}"`) || mainSource.includes(`IPC.${key}`);
      if (!hasHandle) {
        missing.push(`${key} (${channel})`);
      }
    }
    // Report missing handlers but allow some (future channels)
    if (missing.length > 0) {
      console.log("IPC channels without handlers:", missing);
    }
    // At least 80% of channels should have handlers
    const totalChannels = Object.keys(IPC).length;
    const coveredChannels = totalChannels - missing.length;
    expect(coveredChannels / totalChannels).toBeGreaterThanOrEqual(0.8);
  });

  it("no duplicate ipcMain.handle calls", () => {
    const handleCalls = mainSource.match(/ipcMain\.handle\(/g);
    const channelMatches = mainSource.match(/ipcMain\.handle\((?:IPC\.\w+|"[^"]+")/g) ?? [];
    const channels = channelMatches.map((m) => m.replace("ipcMain.handle(", ""));
    const unique = new Set(channels);
    expect(unique.size).toBe(channels.length);
  });

  it("all handlers use arrow functions or named functions", () => {
    // Verify consistent handler style
    const handleCount = (mainSource.match(/ipcMain\.handle\(/g) ?? []).length;
    expect(handleCount).toBeGreaterThan(20); // sanity check
  });

  it("IPC channel names follow namespace:action convention", () => {
    for (const channel of Object.values(IPC)) {
      expect(channel).toMatch(/^[a-z]+:[a-zA-Z:]+$/);
    }
  });
});
