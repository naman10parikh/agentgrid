import { describe, it, expect } from "vitest";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type PaneStatus,
  type CliTool,
  type EffortLevel,
  type GridLayout,
  type PaneConfig,
} from "../../src/shared/types";

describe("Shared Types", () => {
  describe("STATUS_COLORS", () => {
    it("has colors for all statuses", () => {
      const statuses: PaneStatus[] = ["idle", "working", "waiting", "done", "error"];
      for (const s of statuses) {
        expect(STATUS_COLORS[s]).toBeDefined();
        expect(STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe("STATUS_LABELS", () => {
    it("has labels for all statuses", () => {
      const statuses: PaneStatus[] = ["idle", "working", "waiting", "done", "error"];
      for (const s of statuses) {
        expect(STATUS_LABELS[s]).toBeDefined();
        expect(typeof STATUS_LABELS[s]).toBe("string");
      }
    });
  });

  describe("Type shapes", () => {
    it("PaneConfig has required fields", () => {
      const pane: PaneConfig = {
        id: "test",
        label: "Test",
        status: "idle",
        agent: "claude",
        cwd: "/tmp",
        row: 0,
        col: 0,
        rowSpan: 1,
        colSpan: 1,
      };
      expect(pane.id).toBe("test");
      expect(pane.status).toBe("idle");
    });

    it("GridLayout has rows, cols, panes", () => {
      const grid: GridLayout = {
        rows: 2,
        cols: 3,
        panes: [],
      };
      expect(grid.rows).toBe(2);
      expect(grid.cols).toBe(3);
      expect(grid.panes).toEqual([]);
    });

    it("CliTool accepts all agent types", () => {
      const tools: CliTool[] = [
        "claude",
        "codex",
        "gemini",
        "aider",
        "goose",
        "hermes",
        "cline",
        "custom",
      ];
      expect(tools).toHaveLength(8);
    });

    it("EffortLevel accepts all levels", () => {
      const levels: EffortLevel[] = ["low", "medium", "high", "max"];
      expect(levels).toHaveLength(4);
    });
  });
});
