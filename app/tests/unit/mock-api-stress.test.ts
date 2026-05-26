import { describe, it, expect } from "vitest";

describe("Mock API Stress", () => {
  it("create 5x5 grid = 25 panes", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const grid = await mockApi.grid.create(5, 5, "claude", "/tmp");
    expect(grid.panes).toHaveLength(25);
    expect(grid.rows).toBe(5);
    expect(grid.cols).toBe(5);
  });

  it("rapid add 50 panes", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    await mockApi.grid.create(1, 1, "claude", "/tmp");
    for (let i = 0; i < 50; i++) {
      await mockApi.pane.add("claude", "/tmp");
    }
    const grid = await mockApi.grid.get();
    expect(grid!.panes.length).toBe(51);
  });

  it("rename all panes in large grid", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const grid = await mockApi.grid.create(3, 3, "claude", "/tmp");
    for (const pane of grid.panes) {
      await mockApi.pane.rename(pane.id, `VP-${pane.id.slice(-4)}`);
    }
    const updated = await mockApi.grid.get();
    expect(updated!.panes.every((p) => p.label.startsWith("VP-"))).toBe(true);
  });

  it("concurrent onData listeners", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const counts = [0, 0, 0];
    const unsubs = counts.map((_, i) =>
      mockApi.terminal.onData(() => {
        counts[i]++;
      }),
    );
    mockApi.terminal.write("test-pane", "hello");
    await new Promise((r) => setTimeout(r, 100));
    expect(counts.every((c) => c > 0)).toBe(true);
    unsubs.forEach((u) => u());
  });

  it("unsubscribe stops receiving data", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    let count = 0;
    const unsub = mockApi.terminal.onData(() => {
      count++;
    });
    mockApi.terminal.write("p1", "a");
    await new Promise((r) => setTimeout(r, 100));
    const countBefore = count;
    unsub();
    mockApi.terminal.write("p1", "b");
    await new Promise((r) => setTimeout(r, 100));
    expect(count).toBe(countBefore); // no new events
  });

  it("session save and restore cycle", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    await mockApi.grid.create(2, 2, "claude", "/tmp");
    await mockApi.session.save();
    const restored = await mockApi.session.restore();
    // restore returns null in mock (no persistence)
    expect(restored).toBeNull();
  });

  it("tools detect returns array", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const tools = await mockApi.tools.detect();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools[0]).toHaveProperty("tool");
    expect(tools[0]).toHaveProperty("path");
  });

  it("preset operations cycle", async () => {
    const { mockApi } = await import("../../src/renderer/src/lib/mock-api");
    const presets = await mockApi.preset.list();
    expect(presets.length).toBeGreaterThan(0);
    await mockApi.preset.save("test");
    await mockApi.preset.delete("test");
    const exported = await mockApi.preset.export("dev-sprint");
    expect(exported).toBeTruthy();
    await mockApi.preset.import("{}");
  });
});
