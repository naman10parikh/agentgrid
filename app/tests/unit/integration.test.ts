import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { GridManager } from "../../src/main/grid-manager";
import { ToolInjector } from "../../src/main/tool-injector";
import { SignalWatcher } from "../../src/main/signal-watcher";
import { CouncilManager } from "../../src/main/council";

describe("Integration: Grid + Tools + Signals + Council", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `agentgrid-integration-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("grid create → tool config → signal watch lifecycle", () => {
    const gm = new GridManager();
    const ti = new ToolInjector();
    const sw = new SignalWatcher();

    // Create grid
    const grid = gm.create(2, 2, "claude", testDir);
    expect(grid.panes).toHaveLength(4);

    // Get tool config
    const config = ti.getConfig(testDir);
    expect(config.agent).toBe("claude");

    // Start signal watcher
    const signalDir = join(testDir, ".claude", "vp-signals");
    mkdirSync(signalDir, { recursive: true });
    sw.start(testDir);

    // Write a done signal
    writeFileSync(join(signalDir, "builder-1.done"), "COMPLETED");
    const signals = sw.scan();
    expect(signals).toHaveLength(1);
    expect(signals[0].role).toBe("builder-1");

    // Update pane status based on signal
    gm.setPaneStatus(grid.panes[0].id, "done");
    expect(gm.findPane(grid.panes[0].id)?.status).toBe("done");

    sw.stop();
  });

  it("council debate with grid panes", () => {
    const gm = new GridManager();
    const cm = new CouncilManager();

    const grid = gm.create(1, 3, "claude", testDir);
    const session = cm.create("Best testing strategy?");

    // Each pane responds
    for (const pane of grid.panes) {
      cm.addResponse(session.id, pane.id, pane.label, `Response from ${pane.label}`, 0.8);
    }

    expect(cm.getSession(session.id)?.responses).toHaveLength(3);

    // CEO synthesizes
    cm.synthesize(session.id, "Use integration tests for critical paths");
    expect(cm.getSession(session.id)?.status).toBe("resolved");
  });

  it("preset save → equalize → restore roundtrip", () => {
    const gm = new GridManager();
    const grid = gm.create(2, 3, "claude", testDir);

    // Modify spans
    grid.panes[0].rowSpan = 2;

    // Save preset
    gm.savePreset("test-preset");

    // Equalize
    gm.equalize();
    expect(grid.panes[0].rowSpan).toBe(1);

    // Restore
    const restored = gm.loadPreset("test-preset");
    expect(restored).not.toBeNull();

    // Cleanup
    gm.deletePreset("test-preset");
  });

  it("tool injector reads .agentgrid.json + .claude/settings.json together", () => {
    const ti = new ToolInjector();
    const claudeDir = join(testDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });

    writeFileSync(join(claudeDir, "settings.json"), JSON.stringify({ model: "claude-sonnet-4-6" }));
    writeFileSync(
      join(testDir, ".agentgrid.json"),
      JSON.stringify({ defaultEffort: "max", defaultAgent: "codex" }),
    );
    writeFileSync(join(testDir, ".mcp.json"), JSON.stringify({ mcpServers: { github: {} } }));

    const config = ti.getConfig(testDir);
    expect(config.agent).toBe("codex"); // from .agentgrid.json
    expect(config.model).toBe("claude-sonnet-4-6"); // from .claude/settings.json (no agentgrid override)
    expect(config.effort).toBe("max"); // from .agentgrid.json
    expect(config.mcps).toContain("github"); // from .mcp.json
  });

  it("grid operations are fast enough for real-time UI", () => {
    const gm = new GridManager();
    const start = performance.now();

    // Simulate rapid UI operations
    gm.create(3, 3, "claude", testDir);
    for (let i = 0; i < 100; i++) {
      gm.get();
      gm.getAllPanes();
      gm.findPane(gm.get()!.panes[0].id);
    }
    gm.equalize();
    gm.saveSession();
    gm.restoreSession();

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200); // all ops in <200ms
  });
});
