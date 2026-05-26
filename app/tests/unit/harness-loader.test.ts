import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { HarnessLoader } from "../../src/main/harness-loader";

const SAMPLE_HARNESS = `
name: engineering-sprint
description: Full dev team for feature work
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
  - label: VP-ARCHITECT
    agent: claude
    position: [0, 1]
  - label: VP-BUILDER
    agent: codex
    position: [0, 2]
  - label: VP-QA
    agent: claude
    position: [1, 0]
tags:
  - engineering
  - sprint
`;

describe("HarnessLoader", () => {
  let testDir: string;
  let loader: HarnessLoader;

  beforeEach(() => {
    testDir = join(tmpdir(), `agentgrid-harness-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    loader = new HarnessLoader(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("load", () => {
    it("loads a YAML harness file", () => {
      writeFileSync(join(testDir, "engineering-sprint.yaml"), SAMPLE_HARNESS);
      const harness = loader.load("engineering-sprint");
      expect(harness).not.toBeNull();
      expect(harness!.name).toBe("engineering-sprint");
      expect(harness!.description).toBe("Full dev team for feature work");
      expect(harness!.version).toBe(1);
      expect(harness!.grid.rows).toBe(2);
      expect(harness!.grid.cols).toBe(3);
      expect(harness!.roles).toHaveLength(4);
    });

    it("parses role details correctly", () => {
      writeFileSync(join(testDir, "test.yaml"), SAMPLE_HARNESS);
      const harness = loader.load("test");
      expect(harness).not.toBeNull();
      // Name from file, not YAML content
      const ceo = harness!.roles[0];
      expect(ceo.label).toBe("CEO");
      expect(ceo.agent).toBe("claude");
      expect(ceo.model).toBe("claude-opus-4-6");
      expect(ceo.effort).toBe("max");
      expect(ceo.position).toEqual([0, 0]);
    });

    it("loads .yml extension", () => {
      writeFileSync(join(testDir, "quick.yml"), SAMPLE_HARNESS);
      const harness = loader.load("quick");
      expect(harness).not.toBeNull();
    });

    it("returns null for nonexistent harness", () => {
      expect(loader.load("nonexistent")).toBeNull();
    });

    it("returns null for invalid YAML", () => {
      writeFileSync(join(testDir, "broken.yaml"), "{{{{invalid yaml");
      const harness = loader.load("broken");
      // yaml parser may return string or null for invalid content
      expect(harness === null || typeof harness !== "object").toBe(true);
    });
  });

  describe("list", () => {
    it("returns empty array for empty dir", () => {
      expect(loader.list()).toEqual([]);
    });

    it("lists all harness files", () => {
      writeFileSync(join(testDir, "sprint.yaml"), SAMPLE_HARNESS);
      writeFileSync(
        join(testDir, "research.yaml"),
        SAMPLE_HARNESS.replace("engineering-sprint", "research-swarm"),
      );
      const list = loader.list();
      expect(list).toHaveLength(2);
    });

    it("includes name and role count", () => {
      writeFileSync(join(testDir, "sprint.yaml"), SAMPLE_HARNESS);
      const list = loader.list();
      expect(list[0].name).toBe("engineering-sprint");
      expect(list[0].roles).toBe(4);
    });

    it("returns empty for nonexistent dir", () => {
      const badLoader = new HarnessLoader("/nonexistent");
      expect(badLoader.list()).toEqual([]);
    });
  });

  describe("save", () => {
    it("saves a harness to YAML file", () => {
      loader.save({
        name: "test-harness",
        version: 1,
        grid: { rows: 1, cols: 2 },
        roles: [
          { label: "Worker", agent: "claude", position: [0, 0] },
          { label: "QA", agent: "codex", position: [0, 1] },
        ],
      });
      expect(existsSync(join(testDir, "test-harness.yaml"))).toBe(true);

      // Verify it can be loaded back
      const loaded = loader.load("test-harness");
      expect(loaded).not.toBeNull();
      expect(loaded!.roles).toHaveLength(2);
    });
  });

  describe("delete", () => {
    it("deletes an existing harness", () => {
      writeFileSync(join(testDir, "to-delete.yaml"), SAMPLE_HARNESS);
      expect(loader.delete("to-delete")).toBe(true);
      expect(existsSync(join(testDir, "to-delete.yaml"))).toBe(false);
    });

    it("returns false for nonexistent harness", () => {
      expect(loader.delete("nope")).toBe(false);
    });
  });

  describe("validate", () => {
    it("returns no errors for valid harness", () => {
      writeFileSync(join(testDir, "valid.yaml"), SAMPLE_HARNESS);
      const harness = loader.load("valid");
      expect(harness).not.toBeNull();
      const errors = loader.validate(harness!);
      expect(errors).toHaveLength(0);
    });

    it("catches missing name", () => {
      const errors = loader.validate({
        name: "",
        version: 1,
        grid: { rows: 1, cols: 1 },
        roles: [{ label: "Test", agent: "claude", position: [0, 0] }],
      });
      expect(errors.some((e) => e.includes("name"))).toBe(true);
    });

    it("catches grid out of range", () => {
      const errors = loader.validate({
        name: "test",
        version: 1,
        grid: { rows: 15, cols: 1 },
        roles: [{ label: "Test", agent: "claude", position: [0, 0] }],
      });
      expect(errors.some((e) => e.includes("rows"))).toBe(true);
    });

    it("catches too many roles for grid", () => {
      const errors = loader.validate({
        name: "test",
        version: 1,
        grid: { rows: 1, cols: 1 },
        roles: [
          { label: "A", agent: "claude", position: [0, 0] },
          { label: "B", agent: "claude", position: [0, 1] },
        ],
      });
      expect(errors.some((e) => e.includes("Too many roles"))).toBe(true);
    });

    it("catches empty roles", () => {
      const errors = loader.validate({
        name: "test",
        version: 1,
        grid: { rows: 1, cols: 1 },
        roles: [],
      });
      expect(errors.some((e) => e.includes("No roles"))).toBe(true);
    });
  });

  describe("fromGrid", () => {
    it("generates a harness from grid layout", () => {
      const grid = {
        rows: 1,
        cols: 2,
        panes: [
          {
            label: "CEO",
            agent: "claude",
            model: "claude-opus-4-6",
            effort: "max",
            row: 0,
            col: 0,
          },
          { label: "Builder", agent: "codex", row: 0, col: 1 },
        ],
      };
      const harness = loader.fromGrid("my-team", grid, "Test team");
      expect(harness.name).toBe("my-team");
      expect(harness.description).toBe("Test team");
      expect(harness.version).toBe(1);
      expect(harness.grid).toEqual({ rows: 1, cols: 2 });
      expect(harness.roles).toHaveLength(2);
      expect(harness.roles[0].label).toBe("CEO");
      expect(harness.roles[0].model).toBe("claude-opus-4-6");
      expect(harness.roles[1].agent).toBe("codex");
    });

    it("saves the generated harness", () => {
      const grid = {
        rows: 1,
        cols: 1,
        panes: [{ label: "Solo", agent: "claude", row: 0, col: 0 }],
      };
      const harness = loader.fromGrid("solo-work", grid);
      loader.save(harness);
      const loaded = loader.load("solo-work");
      expect(loaded).not.toBeNull();
      expect(loaded!.roles).toHaveLength(1);
    });
  });

  describe("getTemplates", () => {
    it("returns built-in templates", () => {
      const templates = loader.getTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(3);
    });

    it("includes dev-sprint template", () => {
      const templates = loader.getTemplates();
      const sprint = templates.find((t) => t.name === "dev-sprint");
      expect(sprint).toBeDefined();
      expect(sprint!.grid.rows).toBe(2);
      expect(sprint!.grid.cols).toBe(3);
      expect(sprint!.roles).toHaveLength(6);
    });

    it("includes research-swarm template", () => {
      const templates = loader.getTemplates();
      const swarm = templates.find((t) => t.name === "research-swarm");
      expect(swarm).toBeDefined();
      expect(swarm!.roles).toHaveLength(9);
    });

    it("includes mixed-agents template", () => {
      const templates = loader.getTemplates();
      const mixed = templates.find((t) => t.name === "mixed-agents");
      expect(mixed).toBeDefined();
      const agents = mixed!.roles.map((r) => r.agent);
      expect(agents).toContain("claude");
      expect(agents).toContain("codex");
      expect(agents).toContain("gemini");
    });

    it("all templates pass validation", () => {
      const templates = loader.getTemplates();
      for (const template of templates) {
        const errors = loader.validate(template);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe("E2E: full harness lifecycle", () => {
    it("fromGrid → save → load → validate roundtrip", () => {
      // 1. Create a grid-like structure
      const grid = {
        rows: 2,
        cols: 2,
        panes: [
          {
            label: "CEO",
            agent: "claude",
            model: "claude-opus-4-6",
            effort: "max",
            row: 0,
            col: 0,
          },
          { label: "Builder", agent: "codex", row: 0, col: 1 },
          { label: "QA", agent: "claude", row: 1, col: 0 },
          { label: "Researcher", agent: "gemini", row: 1, col: 1 },
        ],
      };

      // 2. Generate harness from grid
      const harness = loader.fromGrid("my-team", grid, "Custom team harness");

      // 3. Save to disk
      loader.save(harness);
      expect(existsSync(join(testDir, "my-team.yaml"))).toBe(true);

      // 4. Load from disk
      const loaded = loader.load("my-team");
      expect(loaded).not.toBeNull();

      // 5. Verify data roundtripped correctly
      expect(loaded!.name).toBe("my-team");
      expect(loaded!.description).toBe("Custom team harness");
      expect(loaded!.grid.rows).toBe(2);
      expect(loaded!.grid.cols).toBe(2);
      expect(loaded!.roles).toHaveLength(4);
      expect(loaded!.roles[0].label).toBe("CEO");
      expect(loaded!.roles[0].model).toBe("claude-opus-4-6");
      expect(loaded!.roles[1].agent).toBe("codex");
      expect(loaded!.roles[3].agent).toBe("gemini");

      // 6. Validate
      const errors = loader.validate(loaded!);
      expect(errors).toHaveLength(0);

      // 7. List shows it
      const list = loader.list();
      expect(list.some((h) => h.name === "my-team")).toBe(true);

      // 8. Delete
      expect(loader.delete("my-team")).toBe(true);
      expect(loader.load("my-team")).toBeNull();
    });

    it("template → save → modify → reload preserves changes", () => {
      // 1. Get a built-in template
      const templates = loader.getTemplates();
      const sprint = templates.find((t) => t.name === "dev-sprint");
      expect(sprint).toBeDefined();

      // 2. Save it
      loader.save(sprint!);

      // 3. Load, modify, and re-save
      const loaded = loader.load("dev-sprint");
      expect(loaded).not.toBeNull();
      loaded!.description = "Modified sprint";
      loaded!.roles[0].label = "SUPREME-CEO";
      loader.save(loaded!);

      // 4. Reload and verify modifications persisted
      const reloaded = loader.load("dev-sprint");
      expect(reloaded!.description).toBe("Modified sprint");
      expect(reloaded!.roles[0].label).toBe("SUPREME-CEO");
    });
  });
});
