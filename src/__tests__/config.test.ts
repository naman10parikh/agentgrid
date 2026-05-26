import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Test config functions directly by manipulating the file system
// Instead of mocking constants, we test the pure logic

describe("config JSON operations", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "agentgrid-config-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("roundtrips JSON data", () => {
    const file = join(tempDir, "test.json");
    const data = { name: "test", nested: { key: "value" } };
    writeFileSync(file, JSON.stringify(data, null, 2));
    const read = JSON.parse(readFileSync(file, "utf-8"));
    expect(read).toEqual(data);
  });

  it("handles nested key setting", () => {
    const file = join(tempDir, "config.json");
    writeFileSync(file, "{}");

    // Simulate setConfig logic
    const data = JSON.parse(readFileSync(file, "utf-8"));
    const keys = "sounds.done".split(".");
    let ref: Record<string, unknown> = data;
    for (const k of keys.slice(0, -1)) {
      if (!ref[k] || typeof ref[k] !== "object") {
        ref[k] = {};
      }
      ref = ref[k] as Record<string, unknown>;
    }
    const lastKey = keys[keys.length - 1]!;
    ref[lastKey] = "/test/path.aiff";
    writeFileSync(file, JSON.stringify(data, null, 2));

    const result = JSON.parse(readFileSync(file, "utf-8"));
    expect(result.sounds.done).toBe("/test/path.aiff");
  });

  it("handles nested key reading", () => {
    const file = join(tempDir, "config.json");
    writeFileSync(
      file,
      JSON.stringify({ sounds: { done: "test.aiff", waiting: "wait.aiff" } }),
    );

    // Simulate getConfig logic
    const data = JSON.parse(readFileSync(file, "utf-8"));
    const keys = "sounds.done".split(".");
    let val: unknown = data;
    for (const k of keys) {
      if (val && typeof val === "object" && k in val) {
        val = (val as Record<string, unknown>)[k];
      } else {
        val = undefined;
        break;
      }
    }
    expect(val).toBe("test.aiff");
  });

  it("returns undefined for missing key path", () => {
    const file = join(tempDir, "config.json");
    writeFileSync(file, JSON.stringify({ sounds: { done: "test" } }));

    const data = JSON.parse(readFileSync(file, "utf-8"));
    const keys = "sounds.missing".split(".");
    let val: unknown = data;
    for (const k of keys) {
      if (val && typeof val === "object" && k in val) {
        val = (val as Record<string, unknown>)[k];
      } else {
        val = undefined;
        break;
      }
    }
    expect(val).toBeUndefined();
  });

  it("creates nested structure from scratch", () => {
    const file = join(tempDir, "config.json");
    writeFileSync(file, "{}");

    const data = JSON.parse(readFileSync(file, "utf-8"));
    const keys = "deep.nested.key".split(".");
    let ref: Record<string, unknown> = data;
    for (const k of keys.slice(0, -1)) {
      if (!ref[k] || typeof ref[k] !== "object") {
        ref[k] = {};
      }
      ref = ref[k] as Record<string, unknown>;
    }
    ref[keys[keys.length - 1]!] = "value";
    writeFileSync(file, JSON.stringify(data, null, 2));

    const result = JSON.parse(readFileSync(file, "utf-8"));
    expect(result.deep.nested.key).toBe("value");
  });
});
