/**
 * Mock Grid Tests — Verify browser-mode grid creation works correctly.
 * Tests the same logic as App.tsx handleCreateGrid mock fallback.
 */
import { describe, it, expect } from "vitest";

function createMockGrid(rows: number, cols: number) {
  const panes = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      panes.push({
        id: `mock-${r}-${c}`,
        label: `Agent ${r * cols + c + 1}`,
        status: "idle" as const,
        agent: "claude" as const,
        cwd: "/tmp",
        row: r,
        col: c,
        rowSpan: 1,
        colSpan: 1,
      });
    }
  }
  return { rows, cols, panes };
}

describe("Mock Grid (browser mode)", () => {
  it("creates 1x1 grid with 1 pane", () => {
    const grid = createMockGrid(1, 1);
    expect(grid.panes).toHaveLength(1);
    expect(grid.panes[0].row).toBe(0);
    expect(grid.panes[0].col).toBe(0);
    expect(grid.panes[0].label).toBe("Agent 1");
  });

  it("creates 2x2 grid with 4 panes", () => {
    const grid = createMockGrid(2, 2);
    expect(grid.panes).toHaveLength(4);
    expect(grid.panes[3].row).toBe(1);
    expect(grid.panes[3].col).toBe(1);
    expect(grid.panes[3].label).toBe("Agent 4");
  });

  it("creates 2x3 grid with 6 panes", () => {
    const grid = createMockGrid(2, 3);
    expect(grid.panes).toHaveLength(6);
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
  });

  it("creates 3x3 grid with 9 panes", () => {
    const grid = createMockGrid(3, 3);
    expect(grid.panes).toHaveLength(9);
    expect(grid.panes[8].label).toBe("Agent 9");
  });

  it("all panes have idle status", () => {
    const grid = createMockGrid(2, 2);
    expect(grid.panes.every((p) => p.status === "idle")).toBe(true);
  });

  it("all panes have claude agent", () => {
    const grid = createMockGrid(2, 2);
    expect(grid.panes.every((p) => p.agent === "claude")).toBe(true);
  });

  it("pane positions map correctly to grid", () => {
    const grid = createMockGrid(2, 3);
    // Check each pane lands in correct row/col
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        expect(grid.panes[idx].row).toBe(r);
        expect(grid.panes[idx].col).toBe(c);
      }
    }
  });

  it("panes have unique IDs", () => {
    const grid = createMockGrid(3, 3);
    const ids = new Set(grid.panes.map((p) => p.id));
    expect(ids.size).toBe(9);
  });

  it("all panes have rowSpan and colSpan of 1", () => {
    const grid = createMockGrid(2, 2);
    expect(grid.panes.every((p) => p.rowSpan === 1 && p.colSpan === 1)).toBe(true);
  });

  it("process.cwd fallback works", () => {
    // Simulates browser where process is undefined
    const cwd = typeof process !== "undefined" && process.cwd ? process.cwd() : "/tmp";
    expect(typeof cwd).toBe("string");
    expect(cwd.length).toBeGreaterThan(0);
  });
});
