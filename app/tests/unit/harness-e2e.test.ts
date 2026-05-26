/**
 * E2E-style tests for harness lifecycle:
 * load harness → create grid from it → verify panes → save back
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Inline minimal implementations to test the flow without mocking
// This simulates the full harness → grid → save cycle

interface HarnessRole {
  name: string;
  agent: string;
  model?: string;
  effort?: string;
  mission?: string;
}

interface Harness {
  name: string;
  description?: string;
  grid: { rows: number; cols: number };
  roles: HarnessRole[];
}

interface PaneConfig {
  id: string;
  label: string;
  agent: string;
  row: number;
  col: number;
}

function loadHarness(dir: string, name: string): Harness | null {
  const file = join(dir, `${name}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8"));
}

function saveHarness(dir: string, harness: Harness): void {
  writeFileSync(join(dir, `${harness.name}.json`), JSON.stringify(harness, null, 2));
}

function createGridFromHarness(harness: Harness): {
  rows: number;
  cols: number;
  panes: PaneConfig[];
} {
  const panes: PaneConfig[] = [];
  for (let i = 0; i < harness.roles.length; i++) {
    const role = harness.roles[i]!;
    panes.push({
      id: `pane-${i}`,
      label: role.name,
      agent: role.agent,
      row: Math.floor(i / harness.grid.cols),
      col: i % harness.grid.cols,
    });
  }
  return { rows: harness.grid.rows, cols: harness.grid.cols, panes };
}

function gridToHarness(
  name: string,
  grid: { rows: number; cols: number; panes: PaneConfig[] },
): Harness {
  return {
    name,
    grid: { rows: grid.rows, cols: grid.cols },
    roles: grid.panes.map((p) => ({
      name: p.label,
      agent: p.agent,
    })),
  };
}

describe("Harness E2E lifecycle", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "harness-e2e-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("full cycle: save → load → grid → save-as", () => {
    // 1. Create a harness
    const original: Harness = {
      name: "dev-sprint",
      description: "4 Claude agents for parallel dev",
      grid: { rows: 2, cols: 2 },
      roles: [
        { name: "VP-ARCHITECT", agent: "claude", model: "claude-opus-4-6", effort: "max" },
        { name: "VP-BUILDER-1", agent: "claude", model: "claude-opus-4-6", effort: "max" },
        { name: "VP-BUILDER-2", agent: "claude", model: "claude-opus-4-6", effort: "max" },
        { name: "VP-QA", agent: "claude", model: "claude-opus-4-6", effort: "max" },
      ],
    };

    // 2. Save it
    saveHarness(tempDir, original);
    expect(existsSync(join(tempDir, "dev-sprint.json"))).toBe(true);

    // 3. Load it back
    const loaded = loadHarness(tempDir, "dev-sprint");
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("dev-sprint");
    expect(loaded!.roles).toHaveLength(4);

    // 4. Create grid from harness
    const grid = createGridFromHarness(loaded!);
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(2);
    expect(grid.panes).toHaveLength(4);
    expect(grid.panes[0]!.label).toBe("VP-ARCHITECT");
    expect(grid.panes[0]!.agent).toBe("claude");
    expect(grid.panes[0]!.row).toBe(0);
    expect(grid.panes[0]!.col).toBe(0);
    expect(grid.panes[3]!.row).toBe(1);
    expect(grid.panes[3]!.col).toBe(1);

    // 5. Save grid as new harness
    const newHarness = gridToHarness("dev-sprint-v2", grid);
    saveHarness(tempDir, newHarness);
    expect(existsSync(join(tempDir, "dev-sprint-v2.json"))).toBe(true);

    // 6. Load the new one and verify
    const reloaded = loadHarness(tempDir, "dev-sprint-v2");
    expect(reloaded!.roles).toHaveLength(4);
    expect(reloaded!.roles[0]!.name).toBe("VP-ARCHITECT");
  });

  it("handles mixed-agent harness", () => {
    const mixed: Harness = {
      name: "mixed-team",
      grid: { rows: 2, cols: 3 },
      roles: [
        { name: "CEO", agent: "claude" },
        { name: "Builder-1", agent: "claude" },
        { name: "Builder-2", agent: "codex" },
        { name: "Researcher", agent: "gemini" },
        { name: "QA", agent: "claude" },
        { name: "Docs", agent: "aider" },
      ],
    };

    saveHarness(tempDir, mixed);
    const grid = createGridFromHarness(mixed);

    expect(grid.panes).toHaveLength(6);
    expect(grid.panes[2]!.agent).toBe("codex");
    expect(grid.panes[3]!.agent).toBe("gemini");
    expect(grid.panes[5]!.agent).toBe("aider");

    // Verify grid position math
    expect(grid.panes[3]!.row).toBe(1); // row 1
    expect(grid.panes[3]!.col).toBe(0); // col 0
    expect(grid.panes[5]!.row).toBe(1); // row 1
    expect(grid.panes[5]!.col).toBe(2); // col 2
  });

  it("handles nonexistent harness gracefully", () => {
    const result = loadHarness(tempDir, "does-not-exist");
    expect(result).toBeNull();
  });

  it("overwrites existing harness on save", () => {
    const v1: Harness = {
      name: "test",
      grid: { rows: 1, cols: 1 },
      roles: [{ name: "Solo", agent: "claude" }],
    };
    saveHarness(tempDir, v1);

    const v2: Harness = {
      name: "test",
      grid: { rows: 2, cols: 2 },
      roles: [
        { name: "A", agent: "claude" },
        { name: "B", agent: "codex" },
        { name: "C", agent: "gemini" },
        { name: "D", agent: "aider" },
      ],
    };
    saveHarness(tempDir, v2);

    const loaded = loadHarness(tempDir, "test");
    expect(loaded!.roles).toHaveLength(4);
    expect(loaded!.grid.rows).toBe(2);
  });

  it("preserves model and effort through roundtrip", () => {
    const harness: Harness = {
      name: "opus-max",
      grid: { rows: 1, cols: 2 },
      roles: [
        { name: "Lead", agent: "claude", model: "claude-opus-4-6", effort: "max" },
        { name: "Support", agent: "claude", model: "claude-sonnet-4-6", effort: "high" },
      ],
    };
    saveHarness(tempDir, harness);
    const loaded = loadHarness(tempDir, "opus-max");
    expect(loaded!.roles[0]!.model).toBe("claude-opus-4-6");
    expect(loaded!.roles[0]!.effort).toBe("max");
    expect(loaded!.roles[1]!.model).toBe("claude-sonnet-4-6");
    expect(loaded!.roles[1]!.effort).toBe("high");
  });
});
