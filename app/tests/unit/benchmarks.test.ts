import { describe, it, expect } from "vitest";
import { GridManager } from "../../src/main/grid-manager";

describe("Performance Benchmarks", () => {
  it("creates a 2x3 grid in <10ms", () => {
    const gm = new GridManager();
    const start = performance.now();
    gm.create(2, 3, "claude", "/tmp");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
  });

  it("creates a 10x10 grid in <50ms", () => {
    const gm = new GridManager();
    const start = performance.now();
    gm.create(10, 10, "claude", "/tmp");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
    expect(gm.get()?.panes.length).toBe(100);
  });

  it("finds pane by ID in <1ms (100 panes)", () => {
    const gm = new GridManager();
    const grid = gm.create(10, 10, "claude", "/tmp");
    const targetId = grid.panes[50].id;
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      gm.findPane(targetId);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 1000).toBeLessThan(1); // <1ms per lookup
  });

  it("saves and restores preset in <100ms", () => {
    const gm = new GridManager();
    gm.create(2, 3, "claude", "/tmp");
    const start = performance.now();
    gm.savePreset("bench-test");
    gm.loadPreset("bench-test");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
    gm.deletePreset("bench-test");
  });

  it("equalize resets all spans in <5ms", () => {
    const gm = new GridManager();
    const grid = gm.create(3, 3, "claude", "/tmp");
    // Modify some spans
    grid.panes[0].rowSpan = 2;
    grid.panes[1].colSpan = 3;
    const start = performance.now();
    gm.equalize();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
    expect(grid.panes.every((p) => p.rowSpan === 1 && p.colSpan === 1)).toBe(true);
  });

  it("getAllPanes returns in <1ms", () => {
    const gm = new GridManager();
    gm.create(5, 5, "claude", "/tmp");
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      gm.getAllPanes();
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 10000).toBeLessThan(1);
  });
});
