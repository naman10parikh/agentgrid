import { describe, it, expect } from "vitest";
import { CouncilManager } from "../../src/main/council";

describe("CouncilManager", () => {
  it("creates a council session", () => {
    const cm = new CouncilManager();
    const session = cm.create("Should we use React or Vue?");
    expect(session.id).toContain("council");
    expect(session.question).toBe("Should we use React or Vue?");
    expect(session.status).toBe("debating");
    expect(session.responses).toHaveLength(0);
  });

  it("adds responses from agents", () => {
    const cm = new CouncilManager();
    const session = cm.create("Best architecture?");
    cm.addResponse(session.id, "pane-1", "Agent 1", "Monolith is simpler", 0.7);
    cm.addResponse(session.id, "pane-2", "Agent 2", "Microservices scale better", 0.9);
    const updated = cm.getSession(session.id);
    expect(updated?.responses).toHaveLength(2);
    expect(updated?.responses[1].confidence).toBe(0.9);
  });

  it("synthesizes and resolves", () => {
    const cm = new CouncilManager();
    const session = cm.create("Deploy strategy?");
    cm.addResponse(session.id, "p1", "A1", "Blue-green", 0.8);
    cm.synthesize(session.id, "Use blue-green with canary for critical paths");
    const resolved = cm.getSession(session.id);
    expect(resolved?.status).toBe("resolved");
    expect(resolved?.synthesis).toContain("blue-green");
  });

  it("rejects response after resolution", () => {
    const cm = new CouncilManager();
    const session = cm.create("Test?");
    cm.synthesize(session.id, "Done");
    expect(cm.addResponse(session.id, "p1", "A1", "Late", 0.5)).toBe(false);
  });

  it("lists all sessions", () => {
    const cm = new CouncilManager();
    cm.create("Q1");
    cm.create("Q2");
    expect(cm.listSessions()).toHaveLength(2);
  });
});
