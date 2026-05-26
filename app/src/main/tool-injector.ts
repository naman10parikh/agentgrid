/**
 * Tool Injector — Read workspace/global configs, build CLI flags
 * When spawning claude/codex/gemini, inject model, MCPs, skills, effort.
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { execSync } from "child_process";
import type { CliTool, ToolConfig } from "../shared/types";

interface ClaudeSettings {
  model?: string;
  effortLevel?: string;
  mcpServers?: Record<string, unknown>;
}

interface AgentGridWorkspaceConfig {
  defaultAgent?: CliTool;
  defaultModel?: string;
  defaultEffort?: string;
  defaultFlags?: string[];
  defaultPreset?: string;
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

export class ToolInjector {
  /**
   * Build the launch command + args for a given CLI tool.
   */
  buildCommand(
    agent: CliTool,
    cwd: string,
    overrides?: Partial<ToolConfig> & { systemPrompt?: string },
  ): { command: string; args: string[] } {
    switch (agent) {
      case "claude":
        return this.buildClaudeCommand(cwd, overrides);
      case "codex":
        return { command: "codex", args: [] };
      case "gemini":
        return { command: "gemini", args: [] };
      case "aider":
        return { command: "aider", args: [] };
      case "goose":
        return { command: "goose", args: ["session"] };
      case "hermes":
        return { command: "hermes", args: [] };
      case "cline":
        return { command: "cline", args: [] };
      default:
        return { command: agent, args: [] };
    }
  }

  private buildClaudeCommand(
    cwd: string,
    overrides?: Partial<ToolConfig> & { systemPrompt?: string },
  ): { command: string; args: string[] } {
    const args: string[] = [];

    // Read workspace settings
    const workspaceSettings = readJson<ClaudeSettings>(join(cwd, ".claude", "settings.json"));
    const globalSettings = readJson<ClaudeSettings>(join(homedir(), ".claude", "settings.json"));

    // Model
    const model = overrides?.model ?? workspaceSettings?.model ?? globalSettings?.model;
    if (model) {
      args.push("--model", model);
    }

    // Effort level
    const effort =
      overrides?.effort ?? workspaceSettings?.effortLevel ?? globalSettings?.effortLevel;
    if (effort) {
      args.push("--effort", effort);
    }

    // System prompt from persona (Feature: per-persona injection)
    if (overrides?.systemPrompt) {
      args.push("--system-prompt", overrides.systemPrompt);
    }

    // MCPs from workspace .mcp.json
    const mcpConfig = readJson<Record<string, unknown>>(join(cwd, ".mcp.json"));
    if (mcpConfig) {
      const servers = (mcpConfig as Record<string, unknown>).mcpServers;
      if (servers && typeof servers === "object") {
        for (const name of Object.keys(servers as Record<string, unknown>)) {
          if (overrides?.mcps?.includes(name) !== false) {
            args.push("--add-mcp", name);
          }
        }
      }
    }

    return { command: "claude", args };
  }

  /**
   * Get tool config summary for a workspace.
   */
  getConfig(cwd: string): ToolConfig {
    const workspaceSettings = readJson<ClaudeSettings>(join(cwd, ".claude", "settings.json"));
    const agentgridConfig = readJson<AgentGridWorkspaceConfig>(join(cwd, ".agentgrid.json"));

    return {
      agent: agentgridConfig?.defaultAgent ?? "claude",
      flags: agentgridConfig?.defaultFlags ?? [],
      mcps: this.listMcps(cwd),
      skills: this.listSkills(cwd),
      model: agentgridConfig?.defaultModel ?? workspaceSettings?.model,
      effort: agentgridConfig?.defaultEffort ?? workspaceSettings?.effortLevel,
    };
  }

  private listMcps(cwd: string): string[] {
    const mcpConfig = readJson<Record<string, unknown>>(join(cwd, ".mcp.json"));
    if (!mcpConfig) return [];
    const servers = (mcpConfig as Record<string, unknown>).mcpServers;
    if (!servers || typeof servers !== "object") return [];
    return Object.keys(servers as Record<string, unknown>);
  }

  /**
   * Suggest optimal model based on role/task complexity.
   * CEO and architect roles get Opus; simple workers get Sonnet.
   */
  suggestModel(role: string): { model: string; effort: string; reason: string } {
    const r = role.toLowerCase();

    // CEO/Lead roles → Opus max
    if (r.includes("ceo") || r.includes("lead") || r.includes("architect")) {
      return {
        model: "claude-opus-4-6",
        effort: "max",
        reason: "Orchestration/architecture role needs maximum reasoning",
      };
    }

    // QA roles → Opus high (needs careful analysis)
    if (r.includes("qa") || r.includes("test") || r.includes("review")) {
      return {
        model: "claude-opus-4-6",
        effort: "high",
        reason: "Quality assurance needs thorough analysis",
      };
    }

    // Research → Opus high
    if (r.includes("research") || r.includes("explore")) {
      return {
        model: "claude-opus-4-6",
        effort: "high",
        reason: "Research benefits from deep reasoning",
      };
    }

    // Builder/worker → Sonnet (fast, capable enough for implementation)
    if (r.includes("builder") || r.includes("worker") || r.includes("dev")) {
      return {
        model: "claude-sonnet-4-6",
        effort: "high",
        reason: "Implementation work — Sonnet is fast and capable",
      };
    }

    // Content/docs → Sonnet
    if (r.includes("content") || r.includes("doc") || r.includes("write")) {
      return {
        model: "claude-sonnet-4-6",
        effort: "medium",
        reason: "Content generation — Sonnet handles well",
      };
    }

    // Default → Opus (safe default)
    return {
      model: "claude-opus-4-6",
      effort: "high",
      reason: "Default — using Opus for unknown role type",
    };
  }

  /**
   * Route a task to the best available agent + model.
   * Analyzes task keywords to pick optimal agent and model.
   */
  routeTask(
    taskDescription: string,
    installedTools?: Array<{ tool: CliTool }>,
  ): { agent: CliTool; model: string; effort: string; reason: string } {
    const desc = taskDescription.toLowerCase();
    const available = installedTools?.map((t) => t.tool) ?? ["claude"];

    // Code generation tasks → prefer Codex if available
    if (
      (desc.includes("generate") || desc.includes("scaffold") || desc.includes("boilerplate")) &&
      available.includes("codex")
    ) {
      return {
        agent: "codex",
        model: "gpt-5.3-codex",
        effort: "high",
        reason: "Code generation task — Codex optimized for scaffolding",
      };
    }

    // Research / analysis → Claude Opus
    if (desc.includes("research") || desc.includes("analyze") || desc.includes("investigate")) {
      return {
        agent: "claude",
        model: "claude-opus-4-6",
        effort: "max",
        reason: "Research task — Opus excels at deep analysis",
      };
    }

    // Architecture / design → Claude Opus
    if (desc.includes("architect") || desc.includes("design") || desc.includes("plan")) {
      return {
        agent: "claude",
        model: "claude-opus-4-6",
        effort: "max",
        reason: "Architecture task — needs maximum reasoning depth",
      };
    }

    // Testing → Claude Sonnet (fast, good enough)
    if (desc.includes("test") || desc.includes("qa") || desc.includes("verify")) {
      return {
        agent: "claude",
        model: "claude-sonnet-4-6",
        effort: "high",
        reason: "Testing task — Sonnet is fast and thorough",
      };
    }

    // Simple implementation → Sonnet
    if (desc.includes("fix") || desc.includes("update") || desc.includes("change")) {
      return {
        agent: "claude",
        model: "claude-sonnet-4-6",
        effort: "high",
        reason: "Implementation task — Sonnet handles well",
      };
    }

    // Default → Claude Opus
    return {
      agent: available.includes("claude") ? "claude" : available[0],
      model: "claude-opus-4-6",
      effort: "high",
      reason: "Default routing — using best available model",
    };
  }

  /**
   * Detect which CLI tools are installed on this system.
   */
  detectInstalledTools(): Array<{ tool: CliTool; path: string }> {
    const tools: Array<{ tool: CliTool; command: string }> = [
      { tool: "claude", command: "claude" },
      { tool: "codex", command: "codex" },
      { tool: "gemini", command: "gemini" },
      { tool: "aider", command: "aider" },
      { tool: "goose", command: "goose" },
      { tool: "hermes", command: "hermes" },
      { tool: "cline", command: "cline" },
    ];

    const installed: Array<{ tool: CliTool; path: string }> = [];
    for (const { tool, command } of tools) {
      try {
        const path = execSync(`which ${command}`, { encoding: "utf-8" }).trim();
        if (path) {
          installed.push({ tool, path });
        }
      } catch {
        // Not installed
      }
    }
    return installed;
  }

  /**
   * Restart an agent in a pane by killing and re-spawning.
   */
  getRestartCommand(agent: CliTool, cwd: string): { command: string; args: string[] } {
    return this.buildCommand(agent, cwd);
  }

  private listSkills(cwd: string): string[] {
    const skillsDir = join(cwd, ".claude", "skills");
    if (!existsSync(skillsDir)) return [];
    try {
      return readdirSync(skillsDir).filter((f: string) => !f.startsWith("."));
    } catch {
      return [];
    }
  }

  /**
   * Get git diff stats for a directory (what files changed).
   */
  getFileChanges(cwd: string): Array<{ file: string; insertions: number; deletions: number }> {
    try {
      const output = execSync("git diff --stat --numstat HEAD 2>/dev/null || true", {
        cwd,
        encoding: "utf-8",
        timeout: 5000,
      });
      return output
        .trim()
        .split("\n")
        .filter((line: string) => line.match(/^\d/))
        .map((line: string) => {
          const [ins, del, file] = line.split("\t");
          return {
            file: file ?? "",
            insertions: parseInt(ins ?? "0", 10),
            deletions: parseInt(del ?? "0", 10),
          };
        })
        .filter((e: { file: string }) => e.file);
    } catch {
      return [];
    }
  }
}
