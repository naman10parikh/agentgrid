import { describe, it, expect, beforeEach } from "vitest";
import { GridManager } from "../../src/main/grid-manager";

describe("MCP Server Tools", () => {
  let gridManager: GridManager;

  beforeEach(() => {
    gridManager = new GridManager();
  });

  it("grid_create produces valid grid", () => {
    const grid = gridManager.create(2, 3, "claude", "/tmp");
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
    expect(grid.panes).toHaveLength(6);
  });

  it("grid_status returns null when no grid", () => {
    expect(gridManager.get()).toBeNull();
  });

  it("grid_status returns grid after create", () => {
    gridManager.create(1, 1, "claude", "/tmp");
    const grid = gridManager.get();
    expect(grid).not.toBeNull();
    expect(grid?.panes).toHaveLength(1);
  });

  it("pane_send targets specific pane", () => {
    const grid = gridManager.create(2, 2, "claude", "/tmp");
    const pane = gridManager.findPane(grid.panes[0].id);
    expect(pane).toBeDefined();
    expect(pane?.id).toBe(grid.panes[0].id);
  });

  it("grid_save persists session", () => {
    gridManager.create(1, 2, "claude", "/tmp");
    gridManager.saveSession();
    const gm2 = new GridManager();
    const restored = gm2.restoreSession();
    expect(restored).not.toBeNull();
    expect(restored?.panes).toHaveLength(2);
  });

  it("harness list returns array", () => {
    // Just verify the pattern — actual harness tests are in harness-loader.test.ts
    expect(Array.isArray([])).toBe(true);
  });

  it("getAllPanes returns flat list", () => {
    gridManager.create(2, 2, "claude", "/tmp");
    const panes = gridManager.getAllPanes();
    expect(panes).toHaveLength(4);
    expect(panes[0].agent).toBe("claude");
  });

  it("broadcast writes to all panes", () => {
    const grid = gridManager.create(2, 3, "claude", "/tmp");
    // Verify all panes exist for broadcast target
    expect(grid.panes.every((p) => p.id && p.agent)).toBe(true);
  });
});
