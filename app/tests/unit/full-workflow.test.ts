/**
 * Full Workflow Integration Test — simulates a complete CEO session:
 * create grid → assign roles → spawn agents → detect signals → record session
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEST_HOME = join(
  tmpdir(),
  `agentgrid-workflow-${Date.now()}-${Math.random().toString(36).slice(2)}`,
);

vi.mock("os", async () => {
  const actual = await vi.importActual<typeof import("os")>("os");
  return { ...actual, homedir: () => TEST_HOME };
});

const { GridManager } = await import("../../src/main/grid-manager");
const { HarnessLoader } = await import("../../src/main/harness-loader");
const { SignalWatcher } = await import("../../src/main/signal-watcher");
const { routeTask, estimateCost } = await import("../../src/main/task-router");
const { exportSession, importSession } = await import("../../src/main/session-share");

describe("Full CEO Workflow", () => {
  let gm: InstanceType<typeof GridManager>;
  let hl: InstanceType<typeof HarnessLoader>;
  let sw: InstanceType<typeof SignalWatcher>;
  let workDir: string;
  let signalDir: string;

  beforeEach(() => {
    workDir = join(TEST_HOME, "project");
    signalDir = join(workDir, ".claude", "vp-signals");
    mkdirSync(signalDir, { recursive: true });
    gm = new GridManager();
    hl = new HarnessLoader(join(workDir, ".claude", "harnesses"));
    sw = new SignalWatcher();
  });

  afterEach(() => {
    sw.stop();
    rmSync(TEST_HOME, { recursive: true, force: true });
  });

  it("complete session: harness → grid → signals → history → share", () => {
    // 1. Load a built-in harness template
    const templates = hl.getTemplates();
    const sprint = templates.find((t) => t.name === "dev-sprint");
    expect(sprint).toBeDefined();

    // 2. Create grid from harness
    const grid = gm.create(sprint!.grid.rows, sprint!.grid.cols, "claude", workDir);
    expect(grid.panes).toHaveLength(sprint!.roles.length);

    // 3. Assign role labels from harness
    for (let i = 0; i < sprint!.roles.length; i++) {
      gm.renamePane(grid.panes[i].id, sprint!.roles[i].label);
    }
    expect(gm.findPane(grid.panes[0].id)!.label).toBe("CEO");

    // 4. Simulate agents working
    gm.setPaneStatus(grid.panes[0].id, "working");
    gm.setPaneStatus(grid.panes[1].id, "working");

    // 5. Route a task through task-router
    const route = routeTask("Design the new API architecture");
    expect(route.model).toBe("claude-opus-4-6");
    expect(route.effort).toBe("max");

    // 6. Estimate cost
    const cost = estimateCost(route.model, 50000);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(5); // 50K tokens should be < $5

    // 7. Simulate signal files
    writeFileSync(join(signalDir, "builder-1.done"), "COMPLETED");
    sw.start(workDir);
    const signals = sw.scan();
    expect(signals.length).toBeGreaterThanOrEqual(1);
    expect(signals[0].type).toBe("done");

    // 8. Mark panes as done
    gm.setPaneStatus(grid.panes[0].id, "done");
    gm.setPaneStatus(grid.panes[1].id, "done");

    // 9. Record session in history
    gm.recordSession("Sprint complete — all tasks done");
    const history = gm.getSessionHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].doneCount).toBe(2);

    // 10. Export session for sharing
    const encoded = exportSession(gm.get()!, "CEO", "Sprint results");
    expect(encoded.length).toBeGreaterThan(0);

    // 11. Import back and verify
    const imported = importSession(encoded);
    expect(imported).not.toBeNull();
    expect(imported!.grid.panes).toHaveLength(sprint!.roles.length);
    expect(imported!.sharedBy).toBe("CEO");

    // 12. Save as harness for reuse
    const harness = hl.fromGrid("proven-sprint", gm.get()!, "Proven sprint layout");
    hl.save(harness);
    const loaded = hl.load("proven-sprint");
    expect(loaded).not.toBeNull();
    expect(loaded!.roles).toHaveLength(sprint!.roles.length);
  });

  it("preset save → restore → verify roundtrip", () => {
    // Create and configure grid
    const grid = gm.create(2, 3, "claude", workDir);
    gm.renamePane(grid.panes[0].id, "LEAD");
    gm.setPaneStatus(grid.panes[1].id, "working");

    // Save as preset
    gm.savePreset("my-config");

    // Destroy and recreate
    gm.create(1, 1, "codex", "/tmp");
    expect(gm.get()!.panes).toHaveLength(1);

    // Restore preset
    const restored = gm.loadPreset("my-config");
    expect(restored).not.toBeNull();
    expect(restored!.panes).toHaveLength(6);
    expect(restored!.panes[0].label).toBe("LEAD");
  });

  it("equalize after uneven operations", () => {
    const grid = gm.create(2, 3, "claude", workDir);
    // Remove a pane
    gm.removePane(grid.panes[2].id);
    // Add a pane
    gm.addPane("codex", workDir);
    // Equalize
    const equalized = gm.equalize();
    expect(equalized).not.toBeNull();
    // All panes should have rowSpan=1, colSpan=1
    for (const pane of equalized!.panes) {
      expect(pane.rowSpan).toBe(1);
      expect(pane.colSpan).toBe(1);
    }
  });
});
