import { describe, it, expect } from "vitest";
import { routeTask, estimateCost } from "../../src/main/task-router";

describe("routeTask", () => {
  describe("simple tasks → Haiku", () => {
    it("routes typo fixes to Haiku", () => {
      const route = routeTask("Fix the typo in README");
      expect(route.model).toBe("haiku");
      expect(route.effort).toBe("high");
    });

    it("routes rename tasks to Haiku", () => {
      const route = routeTask("Rename the variable to camelCase");
      expect(route.model).toBe("haiku");
    });

    it("routes lint/format tasks to Haiku", () => {
      const route = routeTask("Run lint and fix all warnings");
      expect(route.model).toBe("haiku");
    });
  });

  describe("medium tasks → Sonnet", () => {
    it("routes refactoring to Sonnet", () => {
      const route = routeTask("Refactor the auth middleware");
      expect(route.model).toBe("sonnet");
      expect(route.effort).toBe("high");
    });

    it("routes test writing to Sonnet", () => {
      const route = routeTask("Write unit tests for the grid manager");
      expect(route.model).toBe("sonnet");
    });

    it("routes component building to Sonnet", () => {
      const route = routeTask("Build a new sidebar component");
      expect(route.model).toBe("sonnet");
    });

    it("routes bug fixes to Sonnet", () => {
      const route = routeTask("Bug fix in the login flow");
      expect(route.model).toBe("sonnet");
    });
  });

  describe("complex tasks → Opus max", () => {
    it("routes architecture to Opus", () => {
      const route = routeTask("Design the new architecture for the plugin system");
      expect(route.model).toBe("opus");
      expect(route.effort).toBe("max");
    });

    it("routes security work to Opus", () => {
      const route = routeTask("Review security of the auth system");
      expect(route.model).toBe("opus");
    });

    it("routes database migrations to Opus", () => {
      const route = routeTask("Migrate database from MongoDB to Postgres");
      expect(route.model).toBe("opus");
    });

    it("routes rewrites to Opus", () => {
      const route = routeTask("Rewrite the entire state management layer");
      expect(route.model).toBe("opus");
    });
  });

  describe("research tasks → Opus max", () => {
    it("routes research to Opus", () => {
      const route = routeTask("Research the best ORM for our stack");
      expect(route.model).toBe("opus");
      expect(route.effort).toBe("max");
    });

    it("routes analysis to Opus", () => {
      const route = routeTask("Analyze competitor features");
      expect(route.model).toBe("opus");
    });

    it("routes benchmarking to Opus", () => {
      const route = routeTask("Benchmark our API response times");
      expect(route.model).toBe("opus");
    });
  });

  describe("default handling", () => {
    it("defaults to Sonnet for unknown tasks", () => {
      const route = routeTask("Do something vague");
      expect(route.model).toBe("sonnet");
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
    // 1M tokens at $12/MTok = $12
    expect(estimateCost("opus", 1_000_000)).toBe(12);
  });

  it("calculates Sonnet cost correctly", () => {
    // 1M tokens at $6/MTok = $6
    expect(estimateCost("sonnet", 1_000_000)).toBe(6);
  });

  it("calculates Haiku cost correctly", () => {
    // 1M tokens at $0.30/MTok = $0.30
    expect(estimateCost("haiku", 1_000_000)).toBeCloseTo(0.3, 6);
  });

  it("handles small token counts", () => {
    // 1K tokens of Opus = $0.012
    expect(estimateCost("opus", 1_000)).toBeCloseTo(0.012, 6);
  });

  it("prices Default and unknown models as Opus, the CLI default on most plans", () => {
    expect(estimateCost("", 1_000_000)).toBe(12);
    expect(estimateCost("unknown-model", 1_000_000)).toBe(12);
  });

  it("returns 0 for 0 tokens", () => {
    expect(estimateCost("opus", 0)).toBe(0);
  });
});
