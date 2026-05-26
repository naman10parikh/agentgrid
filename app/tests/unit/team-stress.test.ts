import { describe, it, expect } from "vitest";
import { TeamManager } from "../../src/main/team";

describe("Team Manager Stress", () => {
  it("100 workspaces", () => {
    const tm = new TeamManager();
    for (let i = 0; i < 100; i++) {
      tm.createWorkspace(`Team-${i}`, `Owner-${i}`);
    }
    expect(tm.listWorkspaces()).toHaveLength(100);
  });

  it("share 200 sessions across workspaces", () => {
    const tm = new TeamManager();
    const ws = tm.createWorkspace("Main", "CEO");
    for (let i = 0; i < 200; i++) {
      tm.shareSession(ws.id, { grid: `snapshot-${i}` }, "CEO");
    }
    expect(tm.listSharedSessions(ws.id)).toHaveLength(200);
  });

  it("member roles are preserved", () => {
    const tm = new TeamManager();
    const ws = tm.createWorkspace("Org", "Admin");
    tm.addMember(ws.id, "Dev1", "member");
    tm.addMember(ws.id, "Lead", "admin");
    tm.addMember(ws.id, "Viewer", "viewer");
    const members = tm.getWorkspace(ws.id)!.members;
    expect(members.find((m) => m.name === "Admin")?.role).toBe("owner");
    expect(members.find((m) => m.name === "Dev1")?.role).toBe("member");
    expect(members.find((m) => m.name === "Lead")?.role).toBe("admin");
    expect(members.find((m) => m.name === "Viewer")?.role).toBe("viewer");
  });

  it("shared session has valid URL and expiry", () => {
    const tm = new TeamManager();
    const ws = tm.createWorkspace("T", "O");
    const session = tm.shareSession(ws.id, {}, "O");
    expect(session.shareUrl).toMatch(/^agentgrid:\/\/share\//);
    expect(session.expiresAt).toBeGreaterThan(Date.now());
    // Expiry is ~24h from now
    const hoursUntilExpiry = (session.expiresAt! - Date.now()) / (1000 * 60 * 60);
    expect(hoursUntilExpiry).toBeGreaterThan(23);
    expect(hoursUntilExpiry).toBeLessThan(25);
  });

  it("get nonexistent workspace returns undefined", () => {
    const tm = new TeamManager();
    expect(tm.getWorkspace("fake")).toBeUndefined();
  });

  it("get nonexistent session returns undefined", () => {
    const tm = new TeamManager();
    expect(tm.getSharedSession("fake")).toBeUndefined();
  });
});

describe("Council Manager Stress", () => {
  it("session with 0 responses can be synthesized", async () => {
    const { CouncilManager } = await import("../../src/main/council");
    const cm = new CouncilManager();
    const session = cm.create("Quick decision?");
    expect(cm.synthesize(session.id, "Just do it")).toBe(true);
    expect(cm.getSession(session.id)?.status).toBe("resolved");
  });

  it("synthesize nonexistent session returns false", async () => {
    const { CouncilManager } = await import("../../src/main/council");
    const cm = new CouncilManager();
    expect(cm.synthesize("fake-id", "nope")).toBe(false);
  });

  it("response with 0 confidence", async () => {
    const { CouncilManager } = await import("../../src/main/council");
    const cm = new CouncilManager();
    const s = cm.create("Test?");
    cm.addResponse(s.id, "p1", "A1", "Unsure", 0);
    expect(cm.getSession(s.id)?.responses[0].confidence).toBe(0);
  });

  it("response with 1.0 confidence", async () => {
    const { CouncilManager } = await import("../../src/main/council");
    const cm = new CouncilManager();
    const s = cm.create("Test?");
    cm.addResponse(s.id, "p1", "A1", "Certain!", 1.0);
    expect(cm.getSession(s.id)?.responses[0].confidence).toBe(1.0);
  });

  it("get nonexistent session returns undefined", async () => {
    const { CouncilManager } = await import("../../src/main/council");
    const cm = new CouncilManager();
    expect(cm.getSession("nope")).toBeUndefined();
  });
});
