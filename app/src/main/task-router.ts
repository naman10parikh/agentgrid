/**
 * Smart Task Router — auto-assign work based on task complexity.
 * Simple heuristic: classify task by keywords → pick model + effort.
 */

import type { CliTool, EffortLevel } from "../shared/types";

interface TaskRoute {
  agent: CliTool;
  model: string;
  effort: EffortLevel;
  reason: string;
}

const COMPLEXITY_KEYWORDS = {
  simple: [
    "typo",
    "rename",
    "fix import",
    "add comment",
    "update version",
    "lint",
    "format",
    "console.log",
  ],
  medium: [
    "refactor",
    "test",
    "component",
    "function",
    "endpoint",
    "api route",
    "style",
    "css",
    "bug fix",
  ],
  complex: [
    "architecture",
    "design",
    "security",
    "performance",
    "migrate",
    "rewrite",
    "system",
    "database",
    "auth",
  ],
  research: [
    "research",
    "investigate",
    "analyze",
    "compare",
    "evaluate",
    "study",
    "benchmark",
    "audit",
  ],
};

function classifyTask(description: string): "simple" | "medium" | "complex" | "research" {
  const lower = description.toLowerCase();
  for (const [level, keywords] of Object.entries(COMPLEXITY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return level as "simple" | "medium" | "complex" | "research";
    }
  }
  return "medium"; // Default
}

export function routeTask(description: string): TaskRoute {
  const complexity = classifyTask(description);

  switch (complexity) {
    case "simple":
      return {
        agent: "claude",
        model: "claude-haiku-4-5-20251001",
        effort: "high",
        reason: `Simple task (matched keywords). Haiku is sufficient.`,
      };
    case "medium":
      return {
        agent: "claude",
        model: "claude-sonnet-4-6",
        effort: "high",
        reason: `Medium complexity. Sonnet provides good quality/cost balance.`,
      };
    case "complex":
      return {
        agent: "claude",
        model: "claude-opus-4-6",
        effort: "max",
        reason: `Complex task requiring deep reasoning. Opus with max effort.`,
      };
    case "research":
      return {
        agent: "claude",
        model: "claude-opus-4-6",
        effort: "max",
        reason: `Research task. Opus for comprehensive analysis.`,
      };
  }
}

export function estimateCost(model: string, estimatedTokens: number): number {
  // Approximate costs per 1M tokens (input + output blend)
  const costs: Record<string, number> = {
    "claude-opus-4-6": 30,
    "claude-sonnet-4-6": 9,
    "claude-haiku-4-5-20251001": 2,
  };
  const costPer1M = costs[model] ?? 15;
  return (estimatedTokens / 1_000_000) * costPer1M;
}
