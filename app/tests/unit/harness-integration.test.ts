/**
 * Harness Integration Tests — Full pipeline: load harness → create grid → verify panes
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { HarnessLoader } from "../../src/main/harness-loader";
import { GridManager } from "../../src/main/grid-manager";

const ENGINEERING_HARNESS = `
name: engineering-sprint
description: Full dev team
version: 1
grid:
  rows: 2
  cols: 3
roles:
  - label: CEO
    agent: claude
    model: claude-opus-4-6
    effort: max
    position: [0, 0]
  - label: Architect
    agent: claude
    position: [0, 1]
  - label: Builder-1
    agent: claude
    position: [0, 2]
  - label: Builder-2
    agent: codex
    position: [1, 0]
  - label: QA
    agent: claude
    position: [1, 1]
  - label: Docs
    agent: claude
    position: [1, 2]
tags:
  - engineering
`;

const SOLO_HARNESS = `
name: solo
description: Single agent
version: 1
grid:
  rows: 1
  cols: 1
roles:
  - label: Agent
    agent: claude
    model: claude-opus-4-6
    position: [0, 0]
`;

describe("Harness → Grid Integration", () => {
  let testDir: string;
  let loader: HarnessLoader;
  let gridManager: GridManager;

  beforeEach(() => {
    testDir = join(tmpdir(), `agentgrid-integration-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    loader = new HarnessLoader(testDir);
    gridManager = new GridManager();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("loads harness and creates matching grid", () => {
    writeFileSync(join(testDir, "engineering-sprint.yaml"), ENGINEERING_HARNESS);

    const harness = loader.load("engineering-sprint");
    expect(harness).not.toBeNull();
    if (!harness) return;

    const grid = gridManager.create(
      harness.grid.rows,
      harness.grid.cols,
      harness.roles[0].agent,
      "/tmp",
    );

    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
    expect(grid.panes).toHaveLength(6);
  });

  it("applies role labels to panes", () => {
    writeFileSync(join(testDir, "engineering-sprint.yaml"), ENGINEERING_HARNESS);

    const harness = loader.load("engineering-sprint");
    if (!harness) throw new Error("Failed to load");

    const grid = gridManager.create(
      harness.grid.rows,
      harness.grid.cols,
      harness.roles[0].agent,
      "/tmp",
    );

    // Apply role labels
    for (const role of harness.roles) {
      const pane = grid.panes.find((p) => p.row === role.position[0] && p.col === role.position[1]);
      if (pane) {
        gridManager.renamePane(pane.id, role.label);
      }
    }

    const ceo = grid.panes.find((p) => p.row === 0 && p.col === 0);
    expect(ceo?.label).toBe("CEO");

    const qa = grid.panes.find((p) => p.row === 1 && p.col === 1);
    expect(qa?.label).toBe("QA");
  });

  it("saves and restores grid from harness", () => {
    writeFileSync(join(testDir, "solo.yaml"), SOLO_HARNESS);

    const harness = loader.load("solo");
    if (!harness) throw new Error("Failed to load");

    gridManager.create(harness.grid.rows, harness.grid.cols, "claude", "/tmp");
    gridManager.saveSession();

    // Create new grid manager and restore
    const gm2 = new GridManager();
    const restored = gm2.restoreSession();

    expect(restored).not.toBeNull();
    expect(restored?.rows).toBe(1);
    expect(restored?.cols).toBe(1);
    expect(restored?.panes).toHaveLength(1);
  });

  it("validates harness before creating grid", () => {
    const invalid = loader.load("nonexistent");
    expect(invalid).toBeNull();
  });

  it("handles harness with mixed agents", () => {
    writeFileSync(join(testDir, "engineering-sprint.yaml"), ENGINEERING_HARNESS);

    const harness = loader.load("engineering-sprint");
    if (!harness) throw new Error("Failed to load");

    const agents = harness.roles.map((r) => r.agent);
    expect(agents).toContain("claude");
    expect(agents).toContain("codex");
  });

  it("round-trips harness save and load", () => {
    const harness = {
      name: "test-roundtrip",
      description: "Round trip test",
      version: 1,
      grid: { rows: 2, cols: 2 },
      roles: [
        { label: "A", agent: "claude" as const, position: [0, 0] as [number, number] },
        { label: "B", agent: "claude" as const, position: [0, 1] as [number, number] },
        { label: "C", agent: "codex" as const, position: [1, 0] as [number, number] },
        { label: "D", agent: "gemini" as const, position: [1, 1] as [number, number] },
      ],
      tags: ["test"],
    };

    loader.save(harness);
    const loaded = loader.load("test-roundtrip");

    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe("test-roundtrip");
    expect(loaded?.roles).toHaveLength(4);
    expect(loaded?.grid.rows).toBe(2);
    expect(loaded?.grid.cols).toBe(2);
  });

  it("lists harnesses after saving multiple", () => {
    writeFileSync(join(testDir, "engineering-sprint.yaml"), ENGINEERING_HARNESS);
    writeFileSync(join(testDir, "solo.yaml"), SOLO_HARNESS);

    const list = loader.list();
    expect(list.length).toBeGreaterThanOrEqual(2);

    const names = list.map((h) => h.name);
    expect(names).toContain("engineering-sprint");
    expect(names).toContain("solo");
  });

  it("deletes a harness", () => {
    writeFileSync(join(testDir, "to-delete.yaml"), SOLO_HARNESS);

    expect(loader.load("to-delete")).not.toBeNull();
    expect(loader.delete("to-delete")).toBe(true);
    expect(loader.load("to-delete")).toBeNull();
  });
});
