import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  CLAUDE_MODEL_OPTIONS,
  PRICE_PER_MTOK,
  estimateCostUsd,
  modelOptionsFor,
  normalizeModel,
} from "../../src/shared/models";
import { TerminalManager } from "../../src/main/terminal-manager";

// A full model ID: claude-<family>-<version>, or a dated snapshot.
const MODEL_ID = /claude-(opus|sonnet|haiku)-\d|\d{8}|gpt-\d|gemini-\d/;

describe("model picker options", () => {
  it("offers Default first, then the Claude Code aliases", () => {
    expect(CLAUDE_MODEL_OPTIONS.map((o) => o.value)).toEqual(["", "opus", "sonnet", "haiku"]);
    expect(CLAUDE_MODEL_OPTIONS[0].label).toBe("Default");
  });

  it("offers Claude Code the aliases and every other CLI Default only", () => {
    expect(modelOptionsFor("claude")).toEqual(CLAUDE_MODEL_OPTIONS);
    for (const agent of ["codex", "gemini", "aider", "goose", "hermes", "cline", "custom"]) {
      expect(modelOptionsFor(agent)).toEqual([{ value: "", label: "Default" }]);
    }
  });

  it("names no model ID", () => {
    for (const o of CLAUDE_MODEL_OPTIONS) {
      expect(o.value).not.toMatch(MODEL_ID);
      expect(o.label).not.toMatch(/\d/);
    }
  });
});

describe("normalizeModel (reading a saved model)", () => {
  it("maps an old Claude model ID to its alias", () => {
    expect(normalizeModel("claude-opus-4-6")).toBe("opus");
    expect(normalizeModel("claude-sonnet-4-6")).toBe("sonnet");
    expect(normalizeModel("claude-haiku-4-5")).toBe("haiku");
    expect(normalizeModel("claude-haiku-4-5-20251001")).toBe("haiku");
  });

  it("maps an old GPT or Gemini ID, and 'default', to Default", () => {
    for (const old of ["gpt-4.1", "gpt-4o", "gpt-5.3", "gpt-5.3-codex", "gemini-2.5-pro"]) {
      expect(normalizeModel(old)).toBe("");
    }
    expect(normalizeModel("gemini-2.5-flash")).toBe("");
    expect(normalizeModel("default")).toBe("");
  });

  it("keeps aliases, Default and other values as they are", () => {
    for (const value of ["", "opus", "sonnet", "haiku", "opus[1m]", "opusplan"]) {
      expect(normalizeModel(value)).toBe(value);
    }
  });

  it("returns undefined for a missing or non-string value", () => {
    expect(normalizeModel(undefined)).toBeUndefined();
    expect(normalizeModel(42 as unknown as string)).toBeUndefined();
  });
});

describe("prices", () => {
  it("are keyed by alias, with Opus the dearest of the three", () => {
    expect(Object.keys(PRICE_PER_MTOK)).toEqual(["opus", "sonnet", "haiku"]);
    expect(PRICE_PER_MTOK.opus).toBeGreaterThan(PRICE_PER_MTOK.sonnet);
    expect(PRICE_PER_MTOK.sonnet).toBeGreaterThan(PRICE_PER_MTOK.haiku);
  });

  it("the cost tracker compares by alias only", () => {
    const comparison = new TerminalManager().getCostComparison();
    expect(Object.keys(comparison)).toEqual(["opus", "sonnet", "haiku"]);
  });

  it("estimate a pane's cost at its own model's price, and Default or an unknown model as Opus", () => {
    expect(estimateCostUsd(1_000_000, "sonnet")).toBe(PRICE_PER_MTOK.sonnet);
    expect(estimateCostUsd(1_000_000, "claude-haiku-4-5")).toBe(PRICE_PER_MTOK.haiku);
    expect(estimateCostUsd(1_000_000, "")).toBe(PRICE_PER_MTOK.opus);
    expect(estimateCostUsd(1_000_000, undefined)).toBe(PRICE_PER_MTOK.opus);
    expect(estimateCostUsd(500_000, "opus")).toBe(PRICE_PER_MTOK.opus / 2);
  });
});

describe("switching one pane's model or effort", () => {
  // Claude Code saves a typed /model or /effort as the person's default for every new session.
  const pane = readFileSync(
    join(__dirname, "../../src/renderer/src/components/TerminalPane.tsx"),
    "utf-8",
  );

  it("never types /model or /effort into the running session", () => {
    expect(pane).not.toMatch(/write\(pane\.id, `\/(model|effort) /);
  });

  it("saves the pane's own choice, then restarts it so the launch passes --model or --effort", () => {
    expect(pane).toMatch(
      /setModel\(pane\.id, model\)\s*\.then\(\(\) => window\.api\?\.pane\?\.restart\(pane\.id\)\)/,
    );
    expect(pane).toMatch(
      /setEffort\(pane\.id, effort\)\s*\.then\(\(\) => window\.api\?\.pane\?\.restart\(pane\.id\)\)/,
    );
  });
});
