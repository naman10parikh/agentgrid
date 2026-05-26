import { describe, it, expect } from "vitest";
import { routeTask, estimateCost } from "../../src/main/task-router";

describe("routeTask", () => {
  describe("simple tasks → Haiku", () => {
    it("routes typo fixes to Haiku", () => {
      const route = routeTask("Fix the typo in README");
      expect(route.model).toBe("claude-haiku-4-5-20251001");
      expect(route.effort).toBe("high");
    });

    it("routes rename tasks to Haiku", () => {
      const route = routeTask("Rename the variable to camelCase");
      expect(route.model).toBe("claude-haiku-4-5-20251001");
    });

    it("routes lint/format tasks to Haiku", () => {
      const route = routeTask("Run lint and fix all warnings");
      expect(route.model).toBe("claude-haiku-4-5-20251001");
    });
  });

  describe("medium tasks → Sonnet", () => {
    it("routes refactoring to Sonnet", () => {
      const route = routeTask("Refactor the auth middleware");
      expect(route.model).toBe("claude-sonnet-4-6");
      expect(route.effort).toBe("high");
    });

    it("routes test writing to Sonnet", () => {
      const route = routeTask("Write unit tests for the grid manager");
      expect(route.model).toBe("claude-sonnet-4-6");
    });

    it("routes component building to Sonnet", () => {
      const route = routeTask("Build a new sidebar component");
      expect(route.model).toBe("claude-sonnet-4-6");
    });

    it("routes bug fixes to Sonnet", () => {
      const route = routeTask("Bug fix in the login flow");
      expect(route.model).toBe("claude-sonnet-4-6");
    });
  });

  describe("complex tasks → Opus max", () => {
    it("routes architecture to Opus", () => {
      const route = routeTask("Design the new architecture for the plugin system");
      expect(route.model).toBe("claude-opus-4-6");
      expect(route.effort).toBe("max");
    });

    it("routes security work to Opus", () => {
      const route = routeTask("Review security of the auth system");
      expect(route.model).toBe("claude-opus-4-6");
    });

    it("routes database migrations to Opus", () => {
      const route = routeTask("Migrate database from MongoDB to Postgres");
      expect(route.model).toBe("claude-opus-4-6");
    });

    it("routes rewrites to Opus", () => {
      const route = routeTask("Rewrite the entire state management layer");
      expect(route.model).toBe("claude-opus-4-6");
    });
  });

  describe("research tasks → Opus max", () => {
    it("routes research to Opus", () => {
      const route = routeTask("Research the best ORM for our stack");
      expect(route.model).toBe("claude-opus-4-6");
      expect(route.effort).toBe("max");
    });

    it("routes analysis to Opus", () => {
      const route = routeTask("Analyze competitor features");
      expect(route.model).toBe("claude-opus-4-6");
    });

    it("routes benchmarking to Opus", () => {
      const route = routeTask("Benchmark our API response times");
      expect(route.model).toBe("claude-opus-4-6");
    });
  });

  describe("default handling", () => {
    it("defaults to Sonnet for unknown tasks", () => {
      const route = routeTask("Do something vague");
      expect(route.model).toBe("claude-sonnet-4-6");
    });

    it("always returns all required fields", () => {
      const tasks = [
        "Fix a typo",
        "Build a component",
        "Design the system",
        "Research options",
        "Random task",
      ];
      for (const task of tasks) {
        const route = routeTask(task);
        expect(route.agent).toBeTruthy();
        expect(route.model).toBeTruthy();
        expect(route.effort).toBeTruthy();
        expect(route.reason.length).toBeGreaterThan(0);
      }
    });
  });
});

describe("estimateCost", () => {
  it("calculates Opus cost correctly", () => {
    // 1M tokens at $30/MTok = $30
    expect(estimateCost("claude-opus-4-6", 1_000_000)).toBe(30);
  });

  it("calculates Sonnet cost correctly", () => {
    // 1M tokens at $9/MTok = $9
    expect(estimateCost("claude-sonnet-4-6", 1_000_000)).toBe(9);
  });

  it("calculates Haiku cost correctly", () => {
    // 1M tokens at $2/MTok = $2
    expect(estimateCost("claude-haiku-4-5-20251001", 1_000_000)).toBe(2);
  });

  it("handles small token counts", () => {
    // 1K tokens of Opus = $0.03
    expect(estimateCost("claude-opus-4-6", 1_000)).toBeCloseTo(0.03);
  });

  it("defaults to $15/MTok for unknown models", () => {
    expect(estimateCost("unknown-model", 1_000_000)).toBe(15);
  });

  it("returns 0 for 0 tokens", () => {
    expect(estimateCost("claude-opus-4-6", 0)).toBe(0);
  });
});
