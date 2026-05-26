import { describe, it, expect } from "vitest";
import { TeamManager } from "../../src/main/team";

describe("TeamManager", () => {
  it("creates a workspace with owner", () => {
    const tm = new TeamManager();
    const ws = tm.createWorkspace("My Team", "Alex");
    expect(ws.name).toBe("My Team");
    expect(ws.members).toHaveLength(1);
    expect(ws.members[0].name).toBe("Alex");
    expect(ws.members[0].role).toBe("owner");
  });

  it("adds members", () => {
    const tm = new TeamManager();
    const ws = tm.createWorkspace("Team", "Owner");
    tm.addMember(ws.id, "Dev1", "member");
    tm.addMember(ws.id, "Dev2", "admin");
    expect(tm.getWorkspace(ws.id)?.members).toHaveLength(3);
  });

  it("shares a session with expiry", () => {
    const tm = new TeamManager();
    const ws = tm.createWorkspace("Team", "Owner");
    const session = tm.shareSession(ws.id, { rows: 2, cols: 2 }, "Owner");
    expect(session.shareUrl).toContain("agentgrid://share/");
    expect(session.expiresAt).toBeGreaterThan(Date.now());
    expect(session.gridSnapshot).toEqual({ rows: 2, cols: 2 });
  });

  it("lists workspaces", () => {
    const tm = new TeamManager();
    tm.createWorkspace("A", "O1");
    tm.createWorkspace("B", "O2");
    expect(tm.listWorkspaces()).toHaveLength(2);
  });

  it("lists shared sessions per workspace", () => {
    const tm = new TeamManager();
    const ws1 = tm.createWorkspace("T1", "O1");
    const ws2 = tm.createWorkspace("T2", "O2");
    tm.shareSession(ws1.id, {}, "O1");
    tm.shareSession(ws1.id, {}, "O1");
    tm.shareSession(ws2.id, {}, "O2");
    expect(tm.listSharedSessions(ws1.id)).toHaveLength(2);
    expect(tm.listSharedSessions(ws2.id)).toHaveLength(1);
  });

  it("rejects member add to nonexistent workspace", () => {
    const tm = new TeamManager();
    expect(tm.addMember("fake-id", "Dev")).toBe(false);
  });
});
