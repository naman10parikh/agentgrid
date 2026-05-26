import { describe, it, expect } from "vitest";

// Test the mock API logic directly
describe("Mock API", () => {
  it("creates a grid with correct dimensions", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const grid = await mockApi.grid.create(2, 3, "claude", "/tmp");
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
    expect(grid.panes).toHaveLength(6);
  });

  it("panes have correct row/col positions", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const grid = await mockApi.grid.create(2, 2, "claude", "/tmp");
    expect(grid.panes[0].row).toBe(0);
    expect(grid.panes[0].col).toBe(0);
    expect(grid.panes[1].row).toBe(0);
    expect(grid.panes[1].col).toBe(1);
    expect(grid.panes[2].row).toBe(1);
    expect(grid.panes[2].col).toBe(0);
    expect(grid.panes[3].row).toBe(1);
    expect(grid.panes[3].col).toBe(1);
  });

  it("get returns created grid", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    await mockApi.grid.create(1, 1, "claude", "/tmp");
    const grid = await mockApi.grid.get();
    expect(grid).not.toBeNull();
    expect(grid?.panes).toHaveLength(1);
  });

  it("add pane increases count", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    await mockApi.grid.create(1, 2, "claude", "/tmp");
    await mockApi.pane.add("claude", "/tmp");
    const grid = await mockApi.grid.get();
    expect(grid?.panes).toHaveLength(3);
  });

  it("remove pane decreases count", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const grid = await mockApi.grid.create(1, 2, "claude", "/tmp");
    const paneId = grid.panes[0].id;
    await mockApi.pane.remove(paneId);
    const updated = await mockApi.grid.get();
    expect(updated?.panes).toHaveLength(1);
  });

  it("rename pane updates label", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const grid = await mockApi.grid.create(1, 1, "claude", "/tmp");
    await mockApi.pane.rename(grid.panes[0].id, "CEO");
    const updated = await mockApi.grid.get();
    expect(updated?.panes[0].label).toBe("CEO");
  });

  it("preset list returns defaults", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const presets = await mockApi.preset.list();
    expect(presets).toContain("dev-sprint");
    expect(presets).toContain("research-swarm");
  });

  it("app info returns mock version", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const info = await mockApi.app.getInfo();
    expect(info.version).toContain("mock");
  });

  it("onData receives terminal output", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const received: string[] = [];
    mockApi.terminal.onData((d) => received.push(d.data));
    mockApi.terminal.write("test-pane", "hello");
    await new Promise((r) => setTimeout(r, 100));
    expect(received.length).toBeGreaterThan(0);
  });
});
