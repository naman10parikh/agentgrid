import { describe, it, expect, vi } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("cmdHarness save", () => {
  it("records no model or effort, so a loaded harness keeps the defaults", async () => {
    const home = mkdtempSync(join(tmpdir(), "agentgrid-harness-"));
    vi.stubEnv("HOME", home);
    vi.resetModules();
    const { cmdHarness } = await import("../commands/harness.js");
    vi.spyOn(console, "log").mockImplementation(() => {});

    cmdHarness("save", "demo");

    const saved = JSON.parse(readFileSync(join(home, ".agentgrid", "harnesses", "demo.json"), "utf-8"));
    expect(saved.name).toBe("demo");
    expect(saved.model).toBeUndefined();
    expect(saved.effort).toBeUndefined();
  });
});
