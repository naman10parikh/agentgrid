/**
 * Stress tests — verify the app handles extreme inputs gracefully.
 */
import { describe, it, expect } from "vitest";
import { routeTask, estimateCost } from "../../src/main/task-router";
import { exportSession, importSession } from "../../src/main/session-share";
import type { GridLayout } from "../../src/shared/types";

// Use dynamic import for modules that need os mock
const { GridManager } = await import("../../src/main/grid-manager");
const { HarnessLoader } = await import("../../src/main/harness-loader");

describe("Stress Tests", () => {
  describe("GridManager under load", () => {
    it("handles rapid create/destroy cycles", () => {
      const gm = new GridManager();
      for (let i = 0; i < 50; i++) {
        gm.create(2, 2, "claude", "/tmp");
        const ids = gm.getAllPanes().map((p) => p.id);
        for (const id of ids) gm.removePane(id);
      }
      // Should still work
      const grid = gm.create(1, 1, "claude", "/tmp");
      expect(grid.panes).toHaveLength(1);
    });

    it("handles 1000 status changes", () => {
      const gm = new GridManager();
      gm.create(1, 1, "claude", "/tmp");
      const id = gm.get()!.panes[0].id;
      const statuses = ["idle", "working", "waiting", "done", "error"] as const;
      for (let i = 0; i < 1000; i++) {
        gm.setPaneStatus(id, statuses[i % statuses.length]);
      }
      expect(gm.findPane(id)!.status).toBe("error"); // 999 % 5 = 4 = error
    });

    it("handles 100 concurrent addPane calls", () => {
      const gm = new GridManager();
      gm.create(1, 1, "claude", "/tmp");
      for (let i = 0; i < 100; i++) {
        gm.addPane("claude", "/tmp");
      }
      expect(gm.getAllPanes()).toHaveLength(101);
    });

    it("handles very long pane labels", () => {
      const gm = new GridManager();
      gm.create(1, 1, "claude", "/tmp");
      const id = gm.get()!.panes[0].id;
      const longLabel = "A".repeat(10000);
      gm.renamePane(id, longLabel);
      expect(gm.findPane(id)!.label.length).toBe(10000);
    });

    it("handles empty string operations", () => {
      const gm = new GridManager();
      gm.create(1, 1, "claude", "/tmp");
      const id = gm.get()!.panes[0].id;
      gm.renamePane(id, "");
      expect(gm.findPane(id)!.label).toBe("");
    });
  });

  describe("TaskRouter stress", () => {
    it("routes 1000 tasks without errors", () => {
      const tasks = [
        "Fix typo",
        "Refactor auth",
        "Design new architecture",
        "Research databases",
        "Random task",
      ];
      for (let i = 0; i < 1000; i++) {
        const route = routeTask(tasks[i % tasks.length]);
        expect(route.agent).toBeTruthy();
        expect(route.model).toBeTruthy();
      }
    });

    it("handles empty task description", () => {
      const route = routeTask("");
      expect(route.model).toBe("claude-sonnet-4-6"); // default
    });

    it("handles very long task description", () => {
      const route = routeTask("A".repeat(100000));
      expect(route.agent).toBeTruthy();
    });

    it("cost estimation handles huge token counts", () => {
      const cost = estimateCost("claude-opus-4-6", 1_000_000_000);
      expect(cost).toBe(30000); // $30K for 1B tokens
    });
  });

  describe("Session share stress", () => {
    it("roundtrips a 100-pane grid", () => {
      const panes = Array.from({ length: 100 }, (_, i) => ({
        id: `p${i}`,
        label: `Agent ${i}`,
        status: "idle" as const,
        agent: "claude" as const,
        cwd: "/tmp",
        row: Math.floor(i / 10),
        col: i % 10,
        rowSpan: 1,
        colSpan: 1,
      }));
      const grid: GridLayout = { rows: 10, cols: 10, panes };
      const encoded = exportSession(grid, "stress-test");
      const imported = importSession(encoded);
      expect(imported).not.toBeNull();
      expect(imported!.grid.panes).toHaveLength(100);
    });

    it("compressed size is reasonable for large grids", () => {
      const panes = Array.from({ length: 100 }, (_, i) => ({
        id: `pane-${i}`,
        label: `Worker Agent ${i} with a longer descriptive name`,
        status: "working" as const,
        agent: "claude" as const,
        cwd: `/tmp/projects/project-${i}`,
        row: Math.floor(i / 10),
        col: i % 10,
        rowSpan: 1,
        colSpan: 1,
      }));
      const grid: GridLayout = { rows: 10, cols: 10, panes };
      const encoded = exportSession(grid, "big-grid", "A very large grid for testing");
      // Compressed should be < 5KB for 100 panes
      expect(encoded.length).toBeLessThan(5000);
    });
  });

  describe("HarnessLoader stress", () => {
    it("validates 100 harnesses without errors", () => {
      const loader = new HarnessLoader("/tmp/stress-harnesses");
      for (let i = 0; i < 100; i++) {
        const errors = loader.validate({
          name: `harness-${i}`,
          version: 1,
          grid: { rows: 2, cols: 3 },
          roles: Array.from({ length: 6 }, (_, j) => ({
            label: `Role ${j}`,
            agent: "claude" as const,
            position: [Math.floor(j / 3), j % 3] as [number, number],
          })),
        });
        expect(errors).toHaveLength(0);
      }
    });
  });
});
