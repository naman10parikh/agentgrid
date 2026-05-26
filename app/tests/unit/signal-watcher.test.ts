import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { SignalWatcher } from "../../src/main/signal-watcher";

describe("SignalWatcher", () => {
  let watcher: SignalWatcher;
  let testDir: string;
  let signalDir: string;

  beforeEach(() => {
    watcher = new SignalWatcher();
    testDir = join(tmpdir(), `agentgrid-signal-test-${Date.now()}`);
    signalDir = join(testDir, ".claude", "vp-signals");
    mkdirSync(signalDir, { recursive: true });
  });

  afterEach(() => {
    watcher.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("scan", () => {
    it("returns empty array for empty signal dir", () => {
      watcher.start(testDir);
      const signals = watcher.scan();
      expect(signals).toEqual([]);
    });

    it("finds .done signal files", () => {
      writeFileSync(join(signalDir, "builder-1.done"), "COMPLETED 2026-03-23");
      watcher.start(testDir);
      const signals = watcher.scan();
      expect(signals).toHaveLength(1);
      expect(signals[0].role).toBe("builder-1");
      expect(signals[0].type).toBe("done");
      expect(signals[0].content).toBe("COMPLETED 2026-03-23");
    });

    it("finds .needs-qa signal files", () => {
      writeFileSync(join(signalDir, "builder-2.needs-qa"), "Ready for review");
      watcher.start(testDir);
      const signals = watcher.scan();
      expect(signals).toHaveLength(1);
      expect(signals[0].role).toBe("builder-2");
      expect(signals[0].type).toBe("needs-qa");
    });

    it("finds .migrating signal files", () => {
      writeFileSync(join(signalDir, "researcher.migrating"), "Context degraded");
      watcher.start(testDir);
      const signals = watcher.scan();
      expect(signals).toHaveLength(1);
      expect(signals[0].role).toBe("researcher");
      expect(signals[0].type).toBe("migrating");
    });

    it("ignores non-signal files", () => {
      writeFileSync(join(signalDir, "readme.md"), "not a signal");
      writeFileSync(join(signalDir, "builder-1.done"), "COMPLETED");
      watcher.start(testDir);
      const signals = watcher.scan();
      expect(signals).toHaveLength(1);
    });

    it("finds multiple signal files", () => {
      writeFileSync(join(signalDir, "builder-1.done"), "COMPLETED");
      writeFileSync(join(signalDir, "builder-2.done"), "COMPLETED");
      writeFileSync(join(signalDir, "qa.needs-qa"), "Testing");
      watcher.start(testDir);
      const signals = watcher.scan();
      expect(signals).toHaveLength(3);
    });
  });

  describe("start/stop", () => {
    it("starts without error on valid dir", () => {
      expect(() => watcher.start(testDir)).not.toThrow();
    });

    it("starts without error on missing signal dir", () => {
      const emptyDir = join(tmpdir(), `agentgrid-empty-${Date.now()}`);
      mkdirSync(emptyDir, { recursive: true });
      expect(() => watcher.start(emptyDir)).not.toThrow();
      rmSync(emptyDir, { recursive: true, force: true });
    });

    it("stops cleanly", () => {
      watcher.start(testDir);
      expect(() => watcher.stop()).not.toThrow();
    });

    it("can restart after stop", () => {
      watcher.start(testDir);
      watcher.stop();
      expect(() => watcher.start(testDir)).not.toThrow();
    });
  });

  describe("company subdirectories", () => {
    it("scans root-level signals only (subdirs watched separately)", () => {
      const companyDir = join(signalDir, "earning-factory");
      mkdirSync(companyDir, { recursive: true });
      writeFileSync(join(signalDir, "builder-1.done"), "ROOT");
      writeFileSync(join(companyDir, "trader.done"), "SUB");

      watcher.start(testDir);
      // Root scan only gets root-level signals
      const signals = watcher.scan();
      expect(signals).toHaveLength(1);
      expect(signals[0].role).toBe("builder-1");
    });
  });

  describe("getSignalDir", () => {
    it("returns empty string before start", () => {
      expect(watcher.getSignalDir()).toBe("");
    });

    it("returns signal dir path after start", () => {
      watcher.start(testDir);
      expect(watcher.getSignalDir()).toBe(signalDir);
    });
  });
});
