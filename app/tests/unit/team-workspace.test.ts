import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { join } from "path";
import { tmpdir } from "os";
import { rmSync } from "fs";

const TEST_HOME = join(tmpdir(), `agentgrid-team-test-${Date.now()}`);

vi.mock("os", async () => {
  const actual = await vi.importActual<typeof import("os")>("os");
  return { ...actual, homedir: () => TEST_HOME };
});

const { TeamWorkspaceManager } = await import("../../src/main/team-workspace");

describe("TeamWorkspaceManager", () => {
  let mgr: InstanceType<typeof TeamWorkspaceManager>;

  beforeEach(() => {
    mgr = new TeamWorkspaceManager();
  });

  afterEach(() => {
    rmSync(TEST_HOME, { recursive: true, force: true });
  });

  it("creates a workspace with owner", () => {
    const ws = mgr.create("My Team", "Alex");
    expect(ws.name).toBe("My Team");
    expect(ws.members).toHaveLength(1);
    expect(ws.members[0].name).toBe("Alex");
    expect(ws.members[0].role).toBe("owner");
  });

  it("retrieves by ID", () => {
    const ws = mgr.create("Team", "Owner");
    const loaded = mgr.get(ws.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("Team");
  });

  it("lists all workspaces", () => {
    mgr.create("A", "Owner");
    mgr.create("B", "Owner");
    expect(mgr.list()).toHaveLength(2);
  });

  it("adds members", () => {
    const ws = mgr.create("Team", "Owner");
    const updated = mgr.addMember(ws.id, "Alice", "admin");
    expect(updated!.members).toHaveLength(2);
    expect(updated!.members[1].name).toBe("Alice");
    expect(updated!.members[1].role).toBe("admin");
  });

  it("removes members but not owner", () => {
    const ws = mgr.create("Team", "Owner");
    mgr.addMember(ws.id, "Alice");
    const alice = mgr.get(ws.id)!.members[1];
    expect(mgr.removeMember(ws.id, alice.id)).toBe(true);
    expect(mgr.get(ws.id)!.members).toHaveLength(1);
  });

  it("cannot remove owner", () => {
    const ws = mgr.create("Team", "Owner");
    const ownerId = ws.members[0].id;
    expect(mgr.removeMember(ws.id, ownerId)).toBe(false);
  });

  it("shares presets", () => {
    const ws = mgr.create("Team", "Owner");
    expect(mgr.sharePreset(ws.id, "dev-sprint")).toBe(true);
    expect(mgr.get(ws.id)!.sharedPresets).toContain("dev-sprint");
  });

  it("shares harnesses", () => {
    const ws = mgr.create("Team", "Owner");
    expect(mgr.shareHarness(ws.id, "engineering")).toBe(true);
    expect(mgr.get(ws.id)!.sharedHarnesses).toContain("engineering");
  });

  it("deletes workspace", () => {
    const ws = mgr.create("ToDelete", "Owner");
    expect(mgr.delete(ws.id)).toBe(true);
    expect(mgr.get(ws.id)).toBeNull();
  });

  it("returns null/false for nonexistent workspace", () => {
    expect(mgr.get("fake")).toBeNull();
    expect(mgr.addMember("fake", "Alice")).toBeNull();
    expect(mgr.removeMember("fake", "id")).toBe(false);
    expect(mgr.delete("fake")).toBe(false);
  });
});
