import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { ToolInjector } from "../../src/main/tool-injector";

describe("ToolInjector", () => {
  let injector: ToolInjector;
  let testDir: string;

  beforeEach(() => {
    injector = new ToolInjector();
    testDir = join(tmpdir(), `agentgrid-tool-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("buildCommand", () => {
    it("returns claude command for claude agent", () => {
      const result = injector.buildCommand("claude", testDir);
      expect(result.command).toBe("claude");
    });

    it("returns codex command for codex agent", () => {
      const result = injector.buildCommand("codex", testDir);
      expect(result.command).toBe("codex");
      expect(result.args).toEqual([]);
    });

    it("returns gemini command for gemini agent", () => {
      const result = injector.buildCommand("gemini", testDir);
      expect(result.command).toBe("gemini");
    });

    it("returns goose session command", () => {
      const result = injector.buildCommand("goose", testDir);
      expect(result.command).toBe("goose");
      expect(result.args).toEqual(["session"]);
    });

    it("returns aider command", () => {
      const result = injector.buildCommand("aider", testDir);
      expect(result.command).toBe("aider");
    });

    it("returns hermes command", () => {
      const result = injector.buildCommand("hermes", testDir);
      expect(result.command).toBe("hermes");
    });

    it("returns cline command", () => {
      const result = injector.buildCommand("cline", testDir);
      expect(result.command).toBe("cline");
    });

    it("handles custom agent", () => {
      const result = injector.buildCommand("custom" as any, testDir);
      expect(result.command).toBe("custom");
    });

    it("injects model from workspace settings", () => {
      const claudeDir = join(testDir, ".claude");
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(join(claudeDir, "settings.json"), JSON.stringify({ model: "claude-opus-4-6" }));

      const result = injector.buildCommand("claude", testDir);
      expect(result.args).toContain("--model");
      expect(result.args).toContain("claude-opus-4-6");
    });

    it("injects MCPs from .mcp.json", () => {
      writeFileSync(
        join(testDir, ".mcp.json"),
        JSON.stringify({
          mcpServers: {
            github: { command: "gh-mcp" },
            memory: { command: "mem-mcp" },
          },
        }),
      );

      const result = injector.buildCommand("claude", testDir);
      expect(result.args).toContain("--add-mcp");
      expect(result.args).toContain("github");
      expect(result.args).toContain("memory");
    });

    it("respects model override", () => {
      const claudeDir = join(testDir, ".claude");
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(
        join(claudeDir, "settings.json"),
        JSON.stringify({ model: "claude-sonnet-4-6" }),
      );

      const result = injector.buildCommand("claude", testDir, {
        model: "claude-opus-4-6",
      });
      expect(result.args).toContain("claude-opus-4-6");
      expect(result.args).not.toContain("claude-sonnet-4-6");
    });
  });

  describe("getConfig", () => {
    it("returns default config for empty workspace", () => {
      const config = injector.getConfig(testDir);
      expect(config.agent).toBe("claude");
      expect(config.flags).toEqual([]);
      expect(config.mcps).toEqual([]);
      expect(config.skills).toEqual([]);
      expect(config.model).toBeUndefined();
      expect(config.effort).toBeUndefined();
    });

    it("reads model from workspace settings", () => {
      const claudeDir = join(testDir, ".claude");
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(
        join(claudeDir, "settings.json"),
        JSON.stringify({ model: "claude-opus-4-6", effortLevel: "max" }),
      );

      const config = injector.getConfig(testDir);
      expect(config.model).toBe("claude-opus-4-6");
      expect(config.effort).toBe("max");
    });

    it("lists MCPs from .mcp.json", () => {
      writeFileSync(
        join(testDir, ".mcp.json"),
        JSON.stringify({
          mcpServers: { github: {}, context7: {} },
        }),
      );

      const config = injector.getConfig(testDir);
      expect(config.mcps).toEqual(["github", "context7"]);
    });

    it("lists skills from .claude/skills/", () => {
      const skillsDir = join(testDir, ".claude", "skills");
      mkdirSync(skillsDir, { recursive: true });
      mkdirSync(join(skillsDir, "architect"));
      mkdirSync(join(skillsDir, "deep-think"));

      const config = injector.getConfig(testDir);
      expect(config.skills).toContain("architect");
      expect(config.skills).toContain("deep-think");
    });

    it("ignores hidden files in skills", () => {
      const skillsDir = join(testDir, ".claude", "skills");
      mkdirSync(skillsDir, { recursive: true });
      mkdirSync(join(skillsDir, "architect"));
      writeFileSync(join(skillsDir, ".DS_Store"), "");

      const config = injector.getConfig(testDir);
      expect(config.skills).toEqual(["architect"]);
    });

    it("handles malformed JSON gracefully", () => {
      const claudeDir = join(testDir, ".claude");
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(join(claudeDir, "settings.json"), "not json{{{");

      const config = injector.getConfig(testDir);
      expect(config.model).toBeUndefined();
    });
  });

  describe("detectInstalledTools", () => {
    it("returns an array", () => {
      const tools = injector.detectInstalledTools();
      expect(Array.isArray(tools)).toBe(true);
    });

    it("each entry has tool and path", () => {
      const tools = injector.detectInstalledTools();
      for (const t of tools) {
        expect(typeof t.tool).toBe("string");
        expect(typeof t.path).toBe("string");
        expect(t.path.length).toBeGreaterThan(0);
      }
    });

    it("detects claude if installed", () => {
      const tools = injector.detectInstalledTools();
      // claude should be installed in this dev environment
      const claude = tools.find((t) => t.tool === "claude");
      if (claude) {
        expect(claude.path).toContain("claude");
      }
    });
  });

  describe("getRestartCommand", () => {
    it("returns same command as buildCommand", () => {
      const build = injector.buildCommand("claude", testDir);
      const restart = injector.getRestartCommand("claude", testDir);
      expect(restart.command).toBe(build.command);
      expect(restart.args).toEqual(build.args);
    });

    it("works for all agent types", () => {
      const agents = ["claude", "codex", "gemini", "aider", "goose"] as const;
      for (const agent of agents) {
        const result = injector.getRestartCommand(agent, testDir);
        expect(result.command).toBeTruthy();
      }
    });
  });

  describe("suggestModel", () => {
    it("suggests Opus max for CEO roles", () => {
      const result = injector.suggestModel("CEO");
      expect(result.model).toBe("claude-opus-4-6");
      expect(result.effort).toBe("max");
    });

    it("suggests Opus max for architect roles", () => {
      const result = injector.suggestModel("VP-ARCHITECT");
      expect(result.model).toBe("claude-opus-4-6");
      expect(result.effort).toBe("max");
    });

    it("suggests Opus high for QA roles", () => {
      const result = injector.suggestModel("VP-QA");
      expect(result.model).toBe("claude-opus-4-6");
      expect(result.effort).toBe("high");
    });

    it("suggests Sonnet for builder roles", () => {
      const result = injector.suggestModel("VP-BUILDER-1");
      expect(result.model).toBe("claude-sonnet-4-6");
      expect(result.effort).toBe("high");
    });

    it("suggests Sonnet for content roles", () => {
      const result = injector.suggestModel("content-writer");
      expect(result.model).toBe("claude-sonnet-4-6");
    });

    it("returns Opus as default for unknown roles", () => {
      const result = injector.suggestModel("mystery-agent");
      expect(result.model).toBe("claude-opus-4-6");
    });

    it("always includes a reason", () => {
      const roles = ["CEO", "QA", "builder", "researcher", "writer", "unknown"];
      for (const role of roles) {
        const result = injector.suggestModel(role);
        expect(result.reason.length).toBeGreaterThan(0);
      }
    });
  });

  describe("routeTask", () => {
    it("routes research tasks to Opus", () => {
      const result = injector.routeTask("Research the best database options");
      expect(result.model).toBe("claude-opus-4-6");
      expect(result.effort).toBe("max");
    });

    it("routes architecture tasks to Opus", () => {
      const result = injector.routeTask("Design the API architecture");
      expect(result.model).toBe("claude-opus-4-6");
    });

    it("routes testing tasks to Sonnet", () => {
      const result = injector.routeTask("Write unit tests for the auth module");
      expect(result.model).toBe("claude-sonnet-4-6");
    });

    it("routes fix tasks to Sonnet", () => {
      const result = injector.routeTask("Fix the login bug");
      expect(result.model).toBe("claude-sonnet-4-6");
    });

    it("prefers Codex for generation if available", () => {
      const result = injector.routeTask("Generate a REST API scaffold", [
        { tool: "claude" },
        { tool: "codex" },
      ]);
      expect(result.agent).toBe("codex");
    });

    it("falls back to Claude when Codex not available", () => {
      const result = injector.routeTask("Generate boilerplate", [{ tool: "claude" }]);
      expect(result.agent).toBe("claude");
    });

    it("always returns agent, model, effort, reason", () => {
      const tasks = [
        "Build the UI",
        "Research competitors",
        "Fix a bug",
        "Design system architecture",
        "Some random task",
      ];
      for (const task of tasks) {
        const result = injector.routeTask(task);
        expect(result.agent).toBeTruthy();
        expect(result.model).toBeTruthy();
        expect(result.effort).toBeTruthy();
        expect(result.reason.length).toBeGreaterThan(0);
      }
    });
  });
});
