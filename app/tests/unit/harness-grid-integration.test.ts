/**
 * Integration test: HarnessLoader + GridManager
 * Tests the full flow: load harness → create grid → verify panes match roles
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { HarnessLoader } from "../../src/main/harness-loader";
import { GridManager } from "../../src/main/grid-manager";

const SPRINT_HARNESS = `
name: test-sprint
description: Test engineering sprint
version: 1
grid:
  rows: 2
  cols: 2
roles:
  - label: CEO
    agent: claude
    model: claude-opus-4-6
    effort: max
    position: [0, 0]
  - label: Builder
    agent: codex
    position: [0, 1]
  - label: QA
    agent: claude
    position: [1, 0]
  - label: Docs
    agent: gemini
    position: [1, 1]
tags:
  - engineering
`;

describe("Harness → Grid Integration", () => {
  let harnessDir: string;
  let harnessLoader: HarnessLoader;
  let gridManager: GridManager;

  beforeEach(() => {
    harnessDir = join(tmpdir(), `agentgrid-integration-${Date.now()}`);
    mkdirSync(harnessDir, { recursive: true });
    harnessLoader = new HarnessLoader(harnessDir);
    gridManager = new GridManager();
  });

  afterEach(() => {
    rmSync(harnessDir, { recursive: true, force: true });
  });

  it("loads a harness and creates a matching grid", () => {
    writeFileSync(join(harnessDir, "test-sprint.yaml"), SPRINT_HARNESS);

    const harness = harnessLoader.load("test-sprint");
    expect(harness).not.toBeNull();

    // Create grid from harness dimensions
    const grid = gridManager.create(harness!.grid.rows, harness!.grid.cols, "claude", "/tmp");

    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(2);
    expect(grid.panes).toHaveLength(4);

    // Apply harness roles to grid panes
    for (const role of harness!.roles) {
      const [row, col] = role.position;
      const pane = grid.panes.find((p) => p.row === row && p.col === col);
      expect(pane).toBeDefined();
      if (pane) {
        gridManager.renamePane(pane.id, role.label);
        pane.agent = role.agent;
        if (role.model) pane.model = role.model;
        if (role.effort) pane.effort = role.effort;
      }
    }

    // Verify roles were applied
    const ceo = grid.panes.find((p) => p.label === "CEO");
    expect(ceo).toBeDefined();
    expect(ceo!.agent).toBe("claude");
    expect(ceo!.model).toBe("claude-opus-4-6");
    expect(ceo!.effort).toBe("max");

    const builder = grid.panes.find((p) => p.label === "Builder");
    expect(builder).toBeDefined();
    expect(builder!.agent).toBe("codex");

    const docs = grid.panes.find((p) => p.label === "Docs");
    expect(docs).toBeDefined();
    expect(docs!.agent).toBe("gemini");
  });

  it("round-trips: create grid → save as harness → load → verify", () => {
    // Create a grid
    const grid = gridManager.create(1, 3, "claude", "/tmp");
    gridManager.renamePane(grid.panes[0].id, "Lead");
    gridManager.renamePane(grid.panes[1].id, "Worker-A");
    gridManager.renamePane(grid.panes[2].id, "Worker-B");

    // Save as harness using fromGrid
    const harness = harnessLoader.fromGrid("round-trip-test", grid, "Test round trip");
    harnessLoader.save(harness);

    // Load it back
    const loaded = harnessLoader.load("round-trip-test");
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("round-trip-test");
    expect(loaded!.description).toBe("Test round trip");
    expect(loaded!.grid.rows).toBe(1);
    expect(loaded!.grid.cols).toBe(3);
    expect(loaded!.roles).toHaveLength(3);
    expect(loaded!.roles[0].label).toBe("Lead");
    expect(loaded!.roles[1].label).toBe("Worker-A");
    expect(loaded!.roles[2].label).toBe("Worker-B");

    // Validate
    const errors = harnessLoader.validate(loaded!);
    expect(errors).toHaveLength(0);
  });

  it("validates built-in templates can create grids", () => {
    const templates = harnessLoader.getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(3);

    for (const template of templates) {
      // Each template should validate
      const errors = harnessLoader.validate(template);
      expect(errors).toHaveLength(0);

      // Each template should create a valid grid
      const grid = gridManager.create(template.grid.rows, template.grid.cols, "claude", "/tmp");
      expect(grid.panes).toHaveLength(template.grid.rows * template.grid.cols);

      // Roles should fit within the grid
      for (const role of template.roles) {
        const [row, col] = role.position;
        expect(row).toBeLessThan(template.grid.rows);
        expect(col).toBeLessThan(template.grid.cols);
      }
    }
  });

  it("handles saving and deleting harnesses", () => {
    const grid = gridManager.create(1, 1, "claude", "/tmp");
    const harness = harnessLoader.fromGrid("deletable", grid);
    harnessLoader.save(harness);

    expect(harnessLoader.list()).toHaveLength(1);
    expect(harnessLoader.delete("deletable")).toBe(true);
    expect(harnessLoader.list()).toHaveLength(0);
    expect(harnessLoader.load("deletable")).toBeNull();
  });
});
