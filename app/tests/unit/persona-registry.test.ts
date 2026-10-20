import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEST_HOME = join(tmpdir(), `agentgrid-persona-${process.pid}-${Date.now()}`);

vi.mock("os", async () => {
  const actual = await vi.importActual<typeof import("os")>("os");
  return { ...actual, homedir: () => TEST_HOME };
});

const { PersonaRegistry } = await import("../../src/main/persona-registry");
const { ToolInjector } = await import("../../src/main/tool-injector");

describe("PersonaRegistry models", () => {
  beforeEach(() => {
    mkdirSync(join(TEST_HOME, ".agentgrid", "personas"), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_HOME, { recursive: true, force: true });
  });

  it("built-in personas name an alias, never a model ID", () => {
    const models = new Set(new PersonaRegistry().getAll().map((p) => p.defaultModel));
    for (const model of models) {
      expect(["", "opus", "sonnet", "haiku"]).toContain(model);
    }
  });

  it("a persona with no model gets Default, so its pane launches with no --model flag", () => {
    const registry = new PersonaRegistry();
    const json = JSON.stringify([{ id: "plain", name: "Plain", systemPrompt: "Do the work." }]);
    expect(registry.importFromJson(json)).toBe(1);
    const persona = registry.get("plain")!;
    expect(persona.defaultModel).toBe("");
    const cwd = join(TEST_HOME, "project");
    mkdirSync(cwd, { recursive: true });
    const { args } = new ToolInjector().buildCommand("claude", cwd, {
      model: persona.defaultModel,
    });
    expect(args).not.toContain("--model");
  });

  it("loads a saved persona's old model ID as its alias", () => {
    const saved = { id: "old", name: "Old", systemPrompt: "p", defaultModel: "claude-sonnet-4-6" };
    writeFileSync(join(TEST_HOME, ".agentgrid", "personas", "old.json"), JSON.stringify(saved));
    expect(new PersonaRegistry().get("old")!.defaultModel).toBe("sonnet");
  });

  it("imports a persona's old model ID as its alias", () => {
    const registry = new PersonaRegistry();
    const json = JSON.stringify([
      { id: "imp", name: "Imp", systemPrompt: "p", defaultModel: "claude-opus-4-6" },
    ]);
    registry.importFromJson(json);
    expect(registry.get("imp")!.defaultModel).toBe("opus");
  });
});
