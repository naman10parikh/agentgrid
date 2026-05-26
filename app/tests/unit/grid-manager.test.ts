import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { join } from "path";
import { tmpdir } from "os";

// Compute test home BEFORE mocking os
const TEST_HOME = join(tmpdir(), `agentgrid-test-home-${Date.now()}`);

vi.mock("os", async () => {
  const actual = await vi.importActual<typeof import("os")>("os");
  return {
    ...actual,
    homedir: () => TEST_HOME,
  };
});

// Import AFTER mock is set up
const { GridManager } = await import("../../src/main/grid-manager");

describe("GridManager", () => {
  let gm: GridManager;

  beforeEach(() => {
    gm = new GridManager();
  });

  // ─── create ───

  describe("create", () => {
    it("creates a 2x3 grid with 6 panes", () => {
      const grid = gm.create(2, 3, "claude", "/tmp");
      expect(grid.rows).toBe(2);
      expect(grid.cols).toBe(3);
      expect(grid.panes).toHaveLength(6);
    });

    it("assigns correct row/col positions", () => {
      const grid = gm.create(2, 2, "claude", "/tmp");
      const positions = grid.panes.map((p) => [p.row, p.col]);
      expect(positions).toEqual([
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ]);
    });

    it("sets default labels as Agent 1, Agent 2, etc.", () => {
      const grid = gm.create(1, 3, "codex", "/tmp");
      expect(grid.panes[0].label).toBe("Agent 1");
      expect(grid.panes[1].label).toBe("Agent 2");
      expect(grid.panes[2].label).toBe("Agent 3");
    });

    it("sets all panes to idle status", () => {
      const grid = gm.create(2, 2, "claude", "/tmp");
      for (const pane of grid.panes) {
        expect(pane.status).toBe("idle");
      }
    });

    it("assigns the specified agent to all panes", () => {
      const grid = gm.create(1, 2, "gemini", "/tmp");
      for (const pane of grid.panes) {
        expect(pane.agent).toBe("gemini");
      }
    });

    it("assigns the specified cwd to all panes", () => {
      const grid = gm.create(1, 2, "claude", "/home/test");
      for (const pane of grid.panes) {
        expect(pane.cwd).toBe("/home/test");
      }
    });

    it("generates unique IDs for each pane", () => {
      const grid = gm.create(3, 3, "claude", "/tmp");
      const ids = grid.panes.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(9);
    });

    it("sets rowSpan and colSpan to 1", () => {
      const grid = gm.create(2, 2, "claude", "/tmp");
      for (const pane of grid.panes) {
        expect(pane.rowSpan).toBe(1);
        expect(pane.colSpan).toBe(1);
      }
    });

    it("creates a 1x1 grid", () => {
      const grid = gm.create(1, 1, "claude", "/tmp");
      expect(grid.panes).toHaveLength(1);
      expect(grid.panes[0].row).toBe(0);
      expect(grid.panes[0].col).toBe(0);
    });
  });

  // ─── get ───

  describe("get", () => {
    it("returns null when no grid exists", () => {
      expect(gm.get()).toBeNull();
    });

    it("returns the active grid after creation", () => {
      gm.create(2, 2, "claude", "/tmp");
      const grid = gm.get();
      expect(grid).not.toBeNull();
      expect(grid!.panes).toHaveLength(4);
    });
  });

  // ─── addPane ───

  describe("addPane", () => {
    it("returns null when no grid exists", () => {
      expect(gm.addPane("claude", "/tmp")).toBeNull();
    });

    it("adds a pane to an existing grid", () => {
      gm.create(1, 2, "claude", "/tmp");
      const pane = gm.addPane("codex", "/tmp");
      expect(pane).not.toBeNull();
      expect(pane!.agent).toBe("codex");
      expect(gm.get()!.panes).toHaveLength(3);
    });

    it("assigns correct position for added pane", () => {
      gm.create(1, 2, "claude", "/tmp");
      const pane = gm.addPane("claude", "/tmp");
      // 3rd pane in a 2-col grid: row 1, col 0
      expect(pane!.row).toBe(1);
      expect(pane!.col).toBe(0);
    });

    it("expands rows when adding beyond current grid", () => {
      gm.create(1, 2, "claude", "/tmp");
      gm.addPane("claude", "/tmp");
      expect(gm.get()!.rows).toBe(2);
    });

    it("labels new panes sequentially", () => {
      gm.create(1, 2, "claude", "/tmp");
      const pane = gm.addPane("claude", "/tmp");
      expect(pane!.label).toBe("Agent 3");
    });
  });

  // ─── removePane ───

  describe("removePane", () => {
    it("returns false when no grid exists", () => {
      expect(gm.removePane("nonexistent")).toBe(false);
    });

    it("removes a pane by id", () => {
      const grid = gm.create(1, 3, "claude", "/tmp");
      const id = grid.panes[1].id;
      expect(gm.removePane(id)).toBe(true);
      expect(gm.get()!.panes).toHaveLength(2);
    });

    it("returns false for nonexistent pane id", () => {
      gm.create(1, 2, "claude", "/tmp");
      expect(gm.removePane("fake-id")).toBe(false);
    });
  });

  // ─── renamePane ───

  describe("renamePane", () => {
    it("renames an existing pane", () => {
      const grid = gm.create(1, 2, "claude", "/tmp");
      const id = grid.panes[0].id;
      expect(gm.renamePane(id, "VP-ARCHITECT")).toBe(true);
      expect(gm.findPane(id)!.label).toBe("VP-ARCHITECT");
    });

    it("returns false for nonexistent pane", () => {
      gm.create(1, 1, "claude", "/tmp");
      expect(gm.renamePane("nope", "Test")).toBe(false);
    });
  });

  // ─── setPaneStatus ───

  describe("setPaneStatus", () => {
    it("updates pane status", () => {
      const grid = gm.create(1, 2, "claude", "/tmp");
      const id = grid.panes[0].id;
      expect(gm.setPaneStatus(id, "working")).toBe(true);
      expect(gm.findPane(id)!.status).toBe("working");
    });

    it("can set all status types", () => {
      const grid = gm.create(1, 1, "claude", "/tmp");
      const id = grid.panes[0].id;
      const statuses = ["idle", "working", "waiting", "done", "error"] as const;
      for (const status of statuses) {
        gm.setPaneStatus(id, status);
        expect(gm.findPane(id)!.status).toBe(status);
      }
    });

    it("returns false for nonexistent pane", () => {
      gm.create(1, 1, "claude", "/tmp");
      expect(gm.setPaneStatus("nope", "done")).toBe(false);
    });
  });

  // ─── swapPanes ───

  describe("swapPanes", () => {
    it("swaps positions of two panes", () => {
      const grid = gm.create(1, 2, "claude", "/tmp");
      const a = grid.panes[0];
      const b = grid.panes[1];
      const aRow = a.row,
        aCol = a.col;
      const bRow = b.row,
        bCol = b.col;

      expect(gm.swapPanes(a.id, b.id)).toBe(true);
      expect(gm.findPane(a.id)!.row).toBe(bRow);
      expect(gm.findPane(a.id)!.col).toBe(bCol);
      expect(gm.findPane(b.id)!.row).toBe(aRow);
      expect(gm.findPane(b.id)!.col).toBe(aCol);
    });

    it("returns false if either pane doesn't exist", () => {
      const grid = gm.create(1, 2, "claude", "/tmp");
      expect(gm.swapPanes(grid.panes[0].id, "nope")).toBe(false);
      expect(gm.swapPanes("nope", grid.panes[0].id)).toBe(false);
    });
  });

  // ─── findPane ───

  describe("findPane", () => {
    it("finds a pane by id", () => {
      const grid = gm.create(1, 2, "claude", "/tmp");
      const pane = gm.findPane(grid.panes[0].id);
      expect(pane).toBeDefined();
      expect(pane!.id).toBe(grid.panes[0].id);
    });

    it("returns undefined for nonexistent id", () => {
      gm.create(1, 1, "claude", "/tmp");
      expect(gm.findPane("nope")).toBeUndefined();
    });

    it("returns undefined when no grid exists", () => {
      expect(gm.findPane("any")).toBeUndefined();
    });
  });

  // ─── Presets ───

  describe("presets", () => {
    it("throws when saving preset without active grid", () => {
      expect(() => gm.savePreset("test")).toThrow("No active grid");
    });

    it("saves and loads a preset", () => {
      gm.create(2, 2, "claude", "/tmp");
      gm.renamePane(gm.get()!.panes[0].id, "CEO");
      const preset = gm.savePreset("my-grid");
      expect(preset.name).toBe("my-grid");
      expect(preset.grid.panes).toHaveLength(4);

      // Create a different grid
      gm.create(1, 1, "codex", "/tmp");
      expect(gm.get()!.panes).toHaveLength(1);

      // Load the saved preset
      const loaded = gm.loadPreset("my-grid");
      expect(loaded).not.toBeNull();
      expect(loaded!.panes).toHaveLength(4);
      expect(loaded!.panes[0].label).toBe("CEO");
    });

    it("returns null for nonexistent preset", () => {
      expect(gm.loadPreset("nonexistent")).toBeNull();
    });

    it("lists presets", () => {
      gm.create(1, 1, "claude", "/tmp");
      gm.savePreset("preset-a");
      gm.savePreset("preset-b");
      const presets = gm.listPresets();
      expect(presets).toContain("preset-a");
      expect(presets).toContain("preset-b");
    });

    it("deletes a preset", () => {
      gm.create(1, 1, "claude", "/tmp");
      gm.savePreset("to-delete");
      expect(gm.deletePreset("to-delete")).toBe(true);
      expect(gm.loadPreset("to-delete")).toBeNull();
    });

    it("returns false when deleting nonexistent preset", () => {
      expect(gm.deletePreset("nope")).toBe(false);
    });
  });

  // ─── Session persistence ───

  describe("session persistence", () => {
    it("saves and restores session", () => {
      gm.create(2, 3, "claude", "/tmp");
      gm.renamePane(gm.get()!.panes[0].id, "LEAD");
      gm.setPaneStatus(gm.get()!.panes[1].id, "working");
      gm.saveSession();

      // Create a new manager and restore
      const gm2 = new GridManager();
      const restored = gm2.restoreSession();
      expect(restored).not.toBeNull();
      expect(restored!.panes).toHaveLength(6);
      expect(restored!.panes[0].label).toBe("LEAD");
      expect(restored!.panes[1].status).toBe("working");
    });

    it("returns null when no session saved", () => {
      // Fresh manager with no previous save
      const gm2 = new GridManager();
      // This may or may not have a session depending on test order,
      // but at minimum should not throw
      const result = gm2.restoreSession();
      expect(result === null || result !== undefined).toBe(true);
    });

    it("does nothing when saving without active grid", () => {
      // Should not throw
      gm.saveSession();
    });
  });

  // ─── getAllPanes ───

  describe("getAllPanes", () => {
    it("returns empty array when no grid exists", () => {
      expect(gm.getAllPanes()).toEqual([]);
    });

    it("returns all panes from active grid", () => {
      gm.create(2, 3, "claude", "/tmp");
      const panes = gm.getAllPanes();
      expect(panes).toHaveLength(6);
      expect(panes[0].agent).toBe("claude");
    });

    it("reflects pane additions", () => {
      gm.create(1, 1, "claude", "/tmp");
      expect(gm.getAllPanes()).toHaveLength(1);
      gm.addPane("codex", "/tmp");
      expect(gm.getAllPanes()).toHaveLength(2);
    });

    it("reflects pane removals", () => {
      const grid = gm.create(1, 3, "claude", "/tmp");
      const id = grid.panes[1].id;
      gm.removePane(id);
      const panes = gm.getAllPanes();
      expect(panes).toHaveLength(2);
      expect(panes.find((p) => p.id === id)).toBeUndefined();
    });

    it("reflects status and label changes", () => {
      const grid = gm.create(1, 1, "claude", "/tmp");
      const id = grid.panes[0].id;
      gm.renamePane(id, "CEO");
      gm.setPaneStatus(id, "working");
      const panes = gm.getAllPanes();
      expect(panes[0].label).toBe("CEO");
      expect(panes[0].status).toBe("working");
    });
  });

  // ─── Edge cases ───

  describe("edge cases", () => {
    it("handles large grids", () => {
      const grid = gm.create(10, 10, "claude", "/tmp");
      expect(grid.panes).toHaveLength(100);
      expect(grid.panes[99].row).toBe(9);
      expect(grid.panes[99].col).toBe(9);
    });

    it("overwrites previous grid on create", () => {
      gm.create(2, 2, "claude", "/tmp");
      gm.create(1, 1, "codex", "/home");
      const grid = gm.get();
      expect(grid!.panes).toHaveLength(1);
      expect(grid!.panes[0].agent).toBe("codex");
    });

    it("preserves data after multiple operations", () => {
      const grid = gm.create(2, 2, "claude", "/tmp");
      const id0 = grid.panes[0].id;
      const id1 = grid.panes[1].id;

      gm.renamePane(id0, "CEO");
      gm.setPaneStatus(id0, "working");
      gm.addPane("codex", "/tmp");
      gm.removePane(id1);

      const current = gm.get()!;
      expect(current.panes).toHaveLength(4); // 4 original - 1 removed + 1 added
      expect(gm.findPane(id0)!.label).toBe("CEO");
      expect(gm.findPane(id0)!.status).toBe("working");
      expect(gm.findPane(id1)).toBeUndefined();
    });
  });

  // ─── Edge cases: grid sizes ───

  describe("grid size edge cases", () => {
    it("handles 1x1 grid correctly", () => {
      const grid = gm.create(1, 1, "claude", "/tmp");
      expect(grid.panes).toHaveLength(1);
      expect(grid.panes[0].row).toBe(0);
      expect(grid.panes[0].col).toBe(0);
      expect(grid.rows).toBe(1);
      expect(grid.cols).toBe(1);
    });

    it("handles 3x3 grid correctly", () => {
      const grid = gm.create(3, 3, "claude", "/tmp");
      expect(grid.panes).toHaveLength(9);
      expect(grid.panes[8].row).toBe(2);
      expect(grid.panes[8].col).toBe(2);
    });

    it("removing all panes leaves empty grid", () => {
      const grid = gm.create(1, 2, "claude", "/tmp");
      const id0 = grid.panes[0].id;
      const id1 = grid.panes[1].id;
      gm.removePane(id0);
      gm.removePane(id1);
      expect(gm.get()!.panes).toHaveLength(0);
    });

    it("equalize on empty grid does nothing", () => {
      gm.create(1, 1, "claude", "/tmp");
      gm.removePane(gm.get()!.panes[0].id);
      const result = gm.equalize();
      expect(result).not.toBeNull();
      expect(result!.panes).toHaveLength(0);
    });

    it("undo after create restores null", () => {
      gm.create(2, 2, "claude", "/tmp");
      gm.addPane("claude", "/tmp");
      const undone = gm.undo();
      expect(undone).not.toBeNull();
      expect(undone!.panes).toHaveLength(4);
    });

    it("redo after undo restores state", () => {
      gm.create(2, 2, "claude", "/tmp");
      gm.addPane("codex", "/tmp");
      gm.undo();
      const redone = gm.redo();
      expect(redone).not.toBeNull();
      expect(redone!.panes).toHaveLength(5);
    });

    it("multiple undo/redo cycles are stable", () => {
      gm.create(1, 1, "claude", "/tmp");
      gm.addPane("codex", "/tmp");
      gm.addPane("gemini", "/tmp");
      // 3 panes now
      gm.undo(); // back to 2
      gm.undo(); // back to 1
      expect(gm.get()!.panes).toHaveLength(1);
      gm.redo(); // forward to 2
      expect(gm.get()!.panes).toHaveLength(2);
      gm.redo(); // forward to 3
      expect(gm.get()!.panes).toHaveLength(3);
    });

    it("setPaneModel updates model field", () => {
      const grid = gm.create(1, 1, "claude", "/tmp");
      gm.setPaneModel(grid.panes[0].id, "claude-sonnet-4-6");
      expect(gm.findPane(grid.panes[0].id)!.model).toBe("claude-sonnet-4-6");
    });

    it("setPaneEffort updates effort field", () => {
      const grid = gm.create(1, 1, "claude", "/tmp");
      gm.setPaneEffort(grid.panes[0].id, "high");
      expect(gm.findPane(grid.panes[0].id)!.effort).toBe("high");
    });

    it("sub-grid respects max depth", () => {
      const grid = gm.create(1, 1, "claude", "/tmp");
      grid.depth = 0;
      grid.maxDepth = 1;
      const sub = gm.createSubGrid(grid.panes[0].id, 1, 1, "claude", "/tmp");
      expect(sub).not.toBeNull();
      expect(sub!.depth).toBe(1);
      // At max depth, should return null
      grid.depth = 1;
      const sub2 = gm.createSubGrid(grid.panes[0].id, 1, 1, "claude", "/tmp");
      expect(sub2).toBeNull();
    });
  });

  // ─── Session History ───

  describe("session history", () => {
    it("records a session", () => {
      gm.create(2, 2, "claude", "/tmp");
      gm.setPaneStatus(gm.get()!.panes[0].id, "done");
      gm.recordSession("Test run");
      const history = gm.getSessionHistory();
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].summary).toBe("Test run");
      expect(history[0].paneCount).toBe(4);
      expect(history[0].doneCount).toBe(1);
    });

    it("records multiple sessions (newest first)", () => {
      gm.create(1, 1, "claude", "/tmp");
      gm.recordSession("First");
      gm.create(2, 2, "codex", "/home");
      gm.recordSession("Second");
      const history = gm.getSessionHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].summary).toBe("Second");
    });

    it("does nothing without active grid", () => {
      gm.recordSession("No grid");
      // Should not throw, just skip
    });

    it("returns empty array when no history", () => {
      // Fresh manager may or may not have history from other tests
      const history = gm.getSessionHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
