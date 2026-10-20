import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { ToolInjector } from "../../src/main/tool-injector";

describe("Workspace Config (.agentgrid.json)", () => {
  let injector: ToolInjector;
  let testDir: string;

  beforeEach(() => {
    injector = new ToolInjector();
    // Use process.pid to avoid cross-test collisions
    testDir = join(
      tmpdir(),
      `agentgrid-ws-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors — dir may already be gone
    }
  });

  it("uses defaults when no .agentgrid.json exists", () => {
    const config = injector.getConfig(testDir);
    expect(config.agent).toBe("claude");
    expect(config.flags).toEqual([]);
  });

  it("reads defaultAgent from .agentgrid.json", () => {
    writeFileSync(join(testDir, ".agentgrid.json"), JSON.stringify({ defaultAgent: "codex" }));
    const config = injector.getConfig(testDir);
    expect(config.agent).toBe("codex");
  });

  it("reads defaultModel from .agentgrid.json", () => {
    writeFileSync(join(testDir, ".agentgrid.json"), JSON.stringify({ defaultModel: "opus" }));
    const config = injector.getConfig(testDir);
    expect(config.model).toBe("opus");
  });

  it("reads an old defaultModel ID in .agentgrid.json as its alias, or as Default", () => {
    const file = join(testDir, ".agentgrid.json");
    writeFileSync(file, JSON.stringify({ defaultModel: "claude-sonnet-4-6" }));
    expect(injector.getConfig(testDir).model).toBe("sonnet");
    writeFileSync(file, JSON.stringify({ defaultModel: "gemini-2.5-pro" }));
    expect(injector.getConfig(testDir).model).toBe("");
  });

  it("reads defaultEffort from .agentgrid.json", () => {
    writeFileSync(join(testDir, ".agentgrid.json"), JSON.stringify({ defaultEffort: "max" }));
    const config = injector.getConfig(testDir);
    expect(config.effort).toBe("max");
  });

  it("reads defaultFlags from .agentgrid.json", () => {
    writeFileSync(
      join(testDir, ".agentgrid.json"),
      JSON.stringify({ defaultFlags: ["--verbose", "--debug"] }),
    );
    const config = injector.getConfig(testDir);
    expect(config.flags).toEqual(["--verbose", "--debug"]);
  });

  it(".agentgrid.json overrides .claude/settings.json", () => {
    const claudeDir = join(testDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(join(claudeDir, "settings.json"), JSON.stringify({ model: "sonnet" }));
    writeFileSync(join(testDir, ".agentgrid.json"), JSON.stringify({ defaultModel: "opus" }));
    const config = injector.getConfig(testDir);
    expect(config.model).toBe("opus");
  });

  it("falls back to .claude/settings.json when .agentgrid.json has no model", () => {
    const claudeDir = join(testDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(join(claudeDir, "settings.json"), JSON.stringify({ model: "sonnet" }));
    writeFileSync(join(testDir, ".agentgrid.json"), JSON.stringify({ defaultAgent: "codex" }));
    const config = injector.getConfig(testDir);
    expect(config.model).toBe("sonnet");
    expect(config.agent).toBe("codex");
  });
});
