/**
 * Task Router Integration — verifies routing interacts correctly with grid and tools.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "path";
import { tmpdir } from "os";
import { mkdirSync, rmSync } from "fs";

const TEST_HOME = join(
  tmpdir(),
  `agentgrid-tr-int-${Date.now()}-${Math.random().toString(36).slice(2)}`,
);

vi.mock("os", async () => {
  const actual = await vi.importActual<typeof import("os")>("os");
  return { ...actual, homedir: () => TEST_HOME };
});

const { GridManager } = await import("../../src/main/grid-manager");
const { routeTask, estimateCost } = await import("../../src/main/task-router");
const { ToolInjector } = await import("../../src/main/tool-injector");

describe("Task Router + Grid + ToolInjector Integration", () => {
  let gm: InstanceType<typeof GridManager>;
  let ti: InstanceType<typeof ToolInjector>;
  let workDir: string;

  beforeEach(() => {
    workDir = join(TEST_HOME, "project");
    mkdirSync(workDir, { recursive: true });
    gm = new GridManager();
    ti = new ToolInjector();
  });

  afterEach(() => {
    rmSync(TEST_HOME, { recursive: true, force: true });
  });

  it("routes tasks and builds commands for each role", () => {
    const grid = gm.create(2, 3, "claude", workDir);
    const roles = ["CEO", "VP-ARCHITECT", "VP-BUILDER-1", "VP-QA", "VP-RESEARCHER", "VP-CONTENT"];

    for (let i = 0; i < roles.length; i++) {
      gm.renamePane(grid.panes[i].id, roles[i]);
    }

    // Route tasks for each role
    const tasks = [
      "Design the system architecture",
      "Investigate competitor features",
      "Build the login component",
      "Write unit tests for auth",
      "Fix the typo in README",
      "Refactor the API endpoints",
    ];

    for (const task of tasks) {
      const route = routeTask(task);
      expect(route.agent).toBeTruthy();
      expect(route.model).toBeTruthy();

      const cmd = ti.buildCommand(route.agent, workDir, { model: route.model });
      expect(cmd.command).toBeTruthy();
    }
  });

  it("cost estimation scales with token count", () => {
    const costs = [100, 1000, 10000, 100000, 1000000].map((tokens) =>
      estimateCost("claude-opus-4-6", tokens),
    );

    // Each should be greater than the last
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1]);
    }
  });

  it("different tasks get different models", () => {
    const simple = routeTask("Fix the typo in line 42");
    const complex = routeTask("Design the distributed architecture");

    // Simple should get cheaper model
    expect(estimateCost(simple.model, 10000)).toBeLessThan(estimateCost(complex.model, 10000));
  });

  it("model suggestion aligns with task routing", () => {
    const route = routeTask("Research and investigate the best database options");
    const suggestion = ti.suggestModel("VP-RESEARCHER");

    // Both should pick Opus for research
    expect(route.model).toBe("claude-opus-4-6");
    expect(suggestion.model).toBe("claude-opus-4-6");
  });

  it("grid panes can store routed model assignments", () => {
    const grid = gm.create(1, 3, "claude", workDir);

    const tasks = ["Fix typo", "Build component", "Design architecture"];

    for (let i = 0; i < tasks.length; i++) {
      const route = routeTask(tasks[i]);
      grid.panes[i].model = route.model;
      grid.panes[i].effort = route.effort;
    }

    // Verify different models assigned
    expect(grid.panes[0].model).toBe("claude-haiku-4-5-20251001"); // typo = simple
    expect(grid.panes[2].model).toBe("claude-opus-4-6"); // architecture = complex
  });
});
