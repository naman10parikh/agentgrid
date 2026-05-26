import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";

const CLI = join(__dirname, "..", "..", "dist", "index.js");

describe("agentgrid init", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `ag-init-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates .agentgrid.json", () => {
    execSync(`node ${CLI} init`, { cwd: testDir });
    expect(existsSync(join(testDir, ".agentgrid.json"))).toBe(true);
  });

  it("creates example harness", () => {
    execSync(`node ${CLI} init`, { cwd: testDir });
    expect(
      existsSync(join(testDir, ".agentgrid", "harnesses", "example.yaml")),
    ).toBe(true);
  });

  it("config has correct defaults", () => {
    execSync(`node ${CLI} init`, { cwd: testDir });
    const config = JSON.parse(
      readFileSync(join(testDir, ".agentgrid.json"), "utf-8"),
    );
    expect(config.defaultAgent).toBe("claude");
    expect(config.defaultModel).toBe("claude-opus-4-6");
    expect(config.defaultEffort).toBe("max");
    expect(config.defaultGrid).toBe("2x3");
  });

  it("--force overwrites existing config", () => {
    execSync(`node ${CLI} init`, { cwd: testDir });
    execSync(`node ${CLI} init --force`, { cwd: testDir });
    expect(existsSync(join(testDir, ".agentgrid.json"))).toBe(true);
  });
});

describe("agentgrid generate", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `ag-gen-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates harness YAML file", () => {
    execSync(`node ${CLI} gen test-harness --template squad`, { cwd: testDir });
    expect(
      existsSync(join(testDir, ".agentgrid", "harnesses", "test-harness.yaml")),
    ).toBe(true);
  });

  it("squad template has 4 roles", () => {
    execSync(`node ${CLI} gen my-squad --template squad`, { cwd: testDir });
    const content = readFileSync(
      join(testDir, ".agentgrid", "harnesses", "my-squad.yaml"),
      "utf-8",
    );
    expect(content).toContain("Lead");
    expect(content).toContain("Builder");
    expect(content).toContain("QA");
    expect(content).toContain("Docs");
  });

  it("company template has 6 roles", () => {
    execSync(`node ${CLI} gen my-company --template company`, { cwd: testDir });
    const content = readFileSync(
      join(testDir, ".agentgrid", "harnesses", "my-company.yaml"),
      "utf-8",
    );
    expect(content).toContain("CEO");
    expect(content).toContain("Architect");
  });

  it("solo template has 1 role", () => {
    execSync(`node ${CLI} gen solo-agent --template solo`, { cwd: testDir });
    const content = readFileSync(
      join(testDir, ".agentgrid", "harnesses", "solo-agent.yaml"),
      "utf-8",
    );
    expect(content).toContain("Agent");
    expect(content).toContain("rows: 1");
    expect(content).toContain("cols: 1");
  });
});
