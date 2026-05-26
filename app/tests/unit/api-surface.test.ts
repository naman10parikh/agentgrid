import { describe, it, expect } from "vitest";

describe("API Surface Validation", () => {
  it("mock API matches preload API shape", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    // Grid
    expect(typeof mockApi.grid.create).toBe("function");
    expect(typeof mockApi.grid.get).toBe("function");
    expect(typeof mockApi.grid.save).toBe("function");
    expect(typeof mockApi.grid.restore).toBe("function");

    // Pane
    expect(typeof mockApi.pane.add).toBe("function");
    expect(typeof mockApi.pane.remove).toBe("function");
    expect(typeof mockApi.pane.rename).toBe("function");
    expect(typeof mockApi.pane.broadcast).toBe("function");
    expect(typeof mockApi.pane.broadcastSubset).toBe("function");
    expect(typeof mockApi.pane.restart).toBe("function");

    // Terminal
    expect(typeof mockApi.terminal.spawn).toBe("function");
    expect(typeof mockApi.terminal.write).toBe("function");
    expect(typeof mockApi.terminal.resize).toBe("function");
    expect(typeof mockApi.terminal.kill).toBe("function");
    expect(typeof mockApi.terminal.onData).toBe("function");
    expect(typeof mockApi.terminal.injectFile).toBe("function");
    expect(typeof mockApi.terminal.autoApprove).toBe("function");

    // Preset
    expect(typeof mockApi.preset.list).toBe("function");
    expect(typeof mockApi.preset.save).toBe("function");
    expect(typeof mockApi.preset.load).toBe("function");
    expect(typeof mockApi.preset.delete).toBe("function");
    expect(typeof mockApi.preset.export).toBe("function");
    expect(typeof mockApi.preset.import).toBe("function");

    // Session
    expect(typeof mockApi.session.save).toBe("function");
    expect(typeof mockApi.session.restore).toBe("function");

    // Tools
    expect(typeof mockApi.tools.getConfig).toBe("function");
    expect(typeof mockApi.tools.detect).toBe("function");

    // App
    expect(typeof mockApi.app.getInfo).toBe("function");
  });

  it("all mock API methods return promises or values", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");

    // These should all resolve without throwing
    await mockApi.grid.create(1, 1, "claude", "/tmp");
    await mockApi.grid.get();
    await mockApi.grid.save("test");
    await mockApi.grid.restore();
    await mockApi.pane.add("claude", "/tmp");
    await mockApi.preset.list();
    await mockApi.session.save();
    await mockApi.tools.getConfig("/tmp");
    await mockApi.tools.detect();
    await mockApi.app.getInfo();
    await mockApi.terminal.autoApprove();
  });

  it("mock API grid create returns valid GridLayout", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const grid = await mockApi.grid.create(2, 3, "claude", "/home");

    expect(grid).toHaveProperty("rows", 2);
    expect(grid).toHaveProperty("cols", 3);
    expect(grid).toHaveProperty("panes");
    expect(grid.panes).toHaveLength(6);

    for (const pane of grid.panes) {
      expect(pane).toHaveProperty("id");
      expect(pane).toHaveProperty("label");
      expect(pane).toHaveProperty("status");
      expect(pane).toHaveProperty("agent");
      expect(pane).toHaveProperty("cwd");
      expect(pane).toHaveProperty("row");
      expect(pane).toHaveProperty("col");
      expect(pane).toHaveProperty("rowSpan");
      expect(pane).toHaveProperty("colSpan");
      expect(pane.status).toBe("idle");
      expect(pane.agent).toBe("claude");
      expect(pane.cwd).toBe("/home");
    }
  });

  it("mock onData returns cleanup function", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const cleanup = mockApi.terminal.onData(() => {});
    expect(typeof cleanup).toBe("function");
    cleanup(); // should not throw
  });
});
