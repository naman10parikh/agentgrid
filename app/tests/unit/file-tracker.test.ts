import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";
import { FileTracker } from "../../src/main/file-tracker";

describe("FileTracker", () => {
  let tracker: FileTracker;
  let testDir: string;

  beforeEach(() => {
    tracker = new FileTracker();
    testDir = join(tmpdir(), `agentgrid-tracker-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    // Init git repo for diff tracking
    execSync("git init && git add -A && git commit -m init --allow-empty", {
      cwd: testDir,
      stdio: "ignore",
    });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("baselines with empty state", () => {
    tracker.baseline("pane1", testDir);
    const changes = tracker.diff("pane1", testDir);
    expect(changes).toEqual([]);
  });

  it("detects new files after baseline", () => {
    tracker.baseline("pane1", testDir);
    writeFileSync(join(testDir, "new-file.ts"), "export const x = 1;");
    const changes = tracker.diff("pane1", testDir);
    expect(changes).toContain("new-file.ts");
  });

  it("tracks multiple panes independently", () => {
    tracker.baseline("pane1", testDir);
    tracker.baseline("pane2", testDir);

    writeFileSync(join(testDir, "pane1-file.ts"), "// pane 1");
    const p1Changes = tracker.diff("pane1", testDir);
    const p2Changes = tracker.diff("pane2", testDir);

    expect(p1Changes).toContain("pane1-file.ts");
    expect(p2Changes).toContain("pane1-file.ts"); // Same cwd, both see it
  });

  it("returns all tracked changes", () => {
    tracker.baseline("a", testDir);
    tracker.baseline("b", testDir);
    const all = tracker.getAll();
    expect(all).toHaveLength(2);
  });

  it("gets changes for specific pane", () => {
    tracker.baseline("pane1", testDir);
    const change = tracker.getForPane("pane1");
    expect(change).toBeDefined();
    expect(change?.paneId).toBe("pane1");
  });

  it("returns undefined for unknown pane", () => {
    expect(tracker.getForPane("unknown")).toBeUndefined();
  });

  it("clears tracking for a pane", () => {
    tracker.baseline("pane1", testDir);
    tracker.clear("pane1");
    expect(tracker.getForPane("pane1")).toBeUndefined();
  });

  it("handles non-git directory gracefully", () => {
    const nonGitDir = join(tmpdir(), `no-git-${Date.now()}`);
    mkdirSync(nonGitDir, { recursive: true });
    tracker.baseline("pane1", nonGitDir);
    const changes = tracker.diff("pane1", nonGitDir);
    expect(changes).toEqual([]);
    rmSync(nonGitDir, { recursive: true, force: true });
  });
});
