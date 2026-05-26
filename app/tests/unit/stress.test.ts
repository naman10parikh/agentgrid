import { describe, it, expect } from "vitest";
import { GridManager } from "../../src/main/grid-manager";
import { CouncilManager } from "../../src/main/council";
import { TeamManager } from "../../src/main/team";

describe("Stress Tests", () => {
  it("create and destroy 50 grids sequentially", () => {
    const gm = new GridManager();
    for (let i = 0; i < 50; i++) {
      gm.create(2, 2, "claude", "/tmp");
      expect(gm.get()?.panes).toHaveLength(4);
    }
  });

  it("1000 pane status updates", () => {
    const gm = new GridManager();
    const grid = gm.create(2, 2, "claude", "/tmp");
    const id = grid.panes[0].id;
    const statuses = ["idle", "working", "waiting", "done", "error"] as const;
    for (let i = 0; i < 1000; i++) {
      gm.setPaneStatus(id, statuses[i % statuses.length]);
    }
    expect(gm.findPane(id)?.status).toBeDefined();
  });

  it("500 rename operations", () => {
    const gm = new GridManager();
    const grid = gm.create(1, 1, "claude", "/tmp");
    const id = grid.panes[0].id;
    for (let i = 0; i < 500; i++) {
      gm.renamePane(id, `Agent-${i}`);
    }
    expect(gm.findPane(id)?.label).toBe("Agent-499");
  });

  it("council with 20 respondents", () => {
    const cm = new CouncilManager();
    const session = cm.create("Architecture decision?");
    for (let i = 0; i < 20; i++) {
      cm.addResponse(session.id, `pane-${i}`, `Agent ${i}`, `Response ${i}`, Math.random());
    }
    expect(cm.getSession(session.id)?.responses).toHaveLength(20);
    cm.synthesize(session.id, "Consensus reached");
    expect(cm.getSession(session.id)?.status).toBe("resolved");
  });

  it("10 concurrent council sessions", () => {
    const cm = new CouncilManager();
    const sessions = Array.from({ length: 10 }, (_, i) => cm.create(`Q${i}`));
    for (const s of sessions) {
      cm.addResponse(s.id, "p1", "A1", "R1");
    }
    expect(cm.listSessions()).toHaveLength(10);
    expect(cm.listSessions().every((s) => s.responses.length === 1)).toBe(true);
  });

  it("team with 50 members", () => {
    const tm = new TeamManager();
    const ws = tm.createWorkspace("Big Team", "Owner");
    for (let i = 0; i < 50; i++) {
      tm.addMember(ws.id, `Dev${i}`);
    }
    expect(tm.getWorkspace(ws.id)?.members).toHaveLength(51); // owner + 50
  });

  it("200 sequential add/remove maintains grid integrity", () => {
    const gm = new GridManager();
    gm.create(1, 1, "claude", "/tmp");
    for (let i = 0; i < 200; i++) {
      const pane = gm.addPane("claude", "/tmp");
      expect(pane).not.toBeNull();
      if (pane && i % 2 === 0) {
        gm.removePane(pane.id);
      }
    }
    // Should have 1 original + 100 kept (odd iterations)
    expect(gm.get()!.panes.length).toBe(101);
  });
});
