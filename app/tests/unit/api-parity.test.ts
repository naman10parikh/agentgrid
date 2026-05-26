/**
 * API Parity Test — verifies mock API covers all preload API methods.
 * Catches drift between the real IPC API and the mock.
 */
import { describe, it, expect } from "vitest";

// We can't import the real preload (needs Electron), but we can
// import the mock and verify its shape matches what components expect.

describe("API Parity", () => {
  it("mock API has all required top-level namespaces", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    expect(mockApi.grid).toBeDefined();
    expect(mockApi.pane).toBeDefined();
    expect(mockApi.terminal).toBeDefined();
    expect(mockApi.preset).toBeDefined();
    expect(mockApi.session).toBeDefined();
    expect(mockApi.tools).toBeDefined();
    expect(mockApi.app).toBeDefined();
    expect(mockApi.signals).toBeDefined();
  });

  it("grid namespace has all methods", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    expect(typeof mockApi.grid.create).toBe("function");
    expect(typeof mockApi.grid.get).toBe("function");
    expect(typeof mockApi.grid.save).toBe("function");
    expect(typeof mockApi.grid.restore).toBe("function");
  });

  it("pane namespace has all methods", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    expect(typeof mockApi.pane.add).toBe("function");
    expect(typeof mockApi.pane.remove).toBe("function");
    expect(typeof mockApi.pane.rename).toBe("function");
    expect(typeof mockApi.pane.setStatus).toBe("function");
    expect(typeof mockApi.pane.broadcast).toBe("function");
  });

  it("terminal namespace has all methods", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    expect(typeof mockApi.terminal.spawn).toBe("function");
    expect(typeof mockApi.terminal.write).toBe("function");
    expect(typeof mockApi.terminal.resize).toBe("function");
    expect(typeof mockApi.terminal.kill).toBe("function");
    expect(typeof mockApi.terminal.onData).toBe("function");
  });

  it("preset namespace has all methods", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    expect(typeof mockApi.preset.list).toBe("function");
    expect(typeof mockApi.preset.save).toBe("function");
    expect(typeof mockApi.preset.load).toBe("function");
    expect(typeof mockApi.preset.delete).toBe("function");
  });

  it("signals namespace has all methods", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    expect(typeof mockApi.signals.start).toBe("function");
    expect(typeof mockApi.signals.stop).toBe("function");
    expect(typeof mockApi.signals.get).toBe("function");
    expect(typeof mockApi.signals.onSignal).toBe("function");
  });

  it("mock grid.create returns valid GridLayout", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    const grid = await mockApi.grid.create(2, 3, "claude", "/tmp");
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
    expect(grid.panes).toHaveLength(6);
    for (const pane of grid.panes) {
      expect(pane.id).toBeTruthy();
      expect(pane.label).toBeTruthy();
      expect(pane.status).toBe("idle");
      expect(pane.agent).toBe("claude");
    }
  });

  it("mock terminal.onData returns unsubscribe function", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    const unsub = mockApi.terminal.onData(() => {});
    expect(typeof unsub).toBe("function");
    unsub(); // Should not throw
  });

  it("mock preset.list returns string array", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    const presets = await mockApi.preset.list();
    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBeGreaterThan(0);
    for (const p of presets) {
      expect(typeof p).toBe("string");
    }
  });
});
