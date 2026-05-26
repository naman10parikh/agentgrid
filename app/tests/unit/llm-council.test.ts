import { describe, it, expect, beforeEach } from "vitest";
import { LLMCouncil } from "../../src/main/llm-council";

describe("LLMCouncil", () => {
  let council: LLMCouncil;

  beforeEach(() => {
    council = new LLMCouncil();
  });

  describe("startSession", () => {
    it("creates a new council session", () => {
      const session = council.startSession({
        id: "q1",
        question: "Should we use PostgreSQL?",
        requiredVotes: 3,
      });
      expect(session.status).toBe("voting");
      expect(session.votes).toHaveLength(0);
    });
  });

  describe("addVote", () => {
    it("records a vote", () => {
      council.startSession({ id: "q1", question: "Test?", requiredVotes: 3 });
      const session = council.addVote("q1", {
        paneId: "p1",
        label: "CEO",
        position: "agree",
        reasoning: "Good idea",
        timestamp: Date.now(),
      });
      expect(session).not.toBeNull();
      expect(session!.votes).toHaveLength(1);
    });

    it("replaces duplicate votes from same pane", () => {
      council.startSession({ id: "q1", question: "Test?", requiredVotes: 3 });
      council.addVote("q1", {
        paneId: "p1",
        label: "CEO",
        position: "agree",
        reasoning: "First vote",
        timestamp: Date.now(),
      });
      council.addVote("q1", {
        paneId: "p1",
        label: "CEO",
        position: "disagree",
        reasoning: "Changed mind",
        timestamp: Date.now(),
      });
      const session = council.getSession("q1");
      expect(session!.votes).toHaveLength(1);
      expect(session!.votes[0].position).toBe("disagree");
    });

    it("auto-decides when enough votes", () => {
      council.startSession({ id: "q1", question: "Test?", requiredVotes: 3 });
      council.addVote("q1", {
        paneId: "p1",
        label: "A",
        position: "agree",
        reasoning: "",
        timestamp: Date.now(),
      });
      council.addVote("q1", {
        paneId: "p2",
        label: "B",
        position: "agree",
        reasoning: "",
        timestamp: Date.now(),
      });
      const session = council.addVote("q1", {
        paneId: "p3",
        label: "C",
        position: "disagree",
        reasoning: "",
        timestamp: Date.now(),
      });
      expect(session!.status).toBe("decided");
      expect(session!.decision).toContain("APPROVED");
    });

    it("rejects when majority disagrees", () => {
      council.startSession({ id: "q1", question: "Test?", requiredVotes: 3 });
      council.addVote("q1", {
        paneId: "p1",
        label: "A",
        position: "disagree",
        reasoning: "",
        timestamp: Date.now(),
      });
      council.addVote("q1", {
        paneId: "p2",
        label: "B",
        position: "disagree",
        reasoning: "",
        timestamp: Date.now(),
      });
      const session = council.addVote("q1", {
        paneId: "p3",
        label: "C",
        position: "agree",
        reasoning: "",
        timestamp: Date.now(),
      });
      expect(session!.status).toBe("decided");
      expect(session!.decision).toContain("REJECTED");
    });

    it("deadlocks when no majority", () => {
      council.startSession({ id: "q1", question: "Test?", requiredVotes: 4 });
      council.addVote("q1", {
        paneId: "p1",
        label: "A",
        position: "agree",
        reasoning: "",
        timestamp: Date.now(),
      });
      council.addVote("q1", {
        paneId: "p2",
        label: "B",
        position: "disagree",
        reasoning: "",
        timestamp: Date.now(),
      });
      council.addVote("q1", {
        paneId: "p3",
        label: "C",
        position: "abstain",
        reasoning: "",
        timestamp: Date.now(),
      });
      const session = council.addVote("q1", {
        paneId: "p4",
        label: "D",
        position: "abstain",
        reasoning: "",
        timestamp: Date.now(),
      });
      expect(session!.status).toBe("deadlocked");
    });

    it("returns null for nonexistent session", () => {
      expect(
        council.addVote("fake", {
          paneId: "p1",
          label: "A",
          position: "agree",
          reasoning: "",
          timestamp: Date.now(),
        }),
      ).toBeNull();
    });
  });

  describe("generatePrompt", () => {
    it("generates a structured prompt", () => {
      const prompt = council.generatePrompt({
        id: "q1",
        question: "Should we use React or Vue?",
        context: "Building a dashboard",
        requiredVotes: 3,
      });
      expect(prompt).toContain("LLM Council");
      expect(prompt).toContain("Should we use React or Vue?");
      expect(prompt).toContain("Building a dashboard");
      expect(prompt).toContain("POSITION:");
      expect(prompt).toContain("REASONING:");
    });
  });

  describe("parseResponse", () => {
    it("parses agree response", () => {
      const vote = council.parseResponse("p1", "CEO", "POSITION: agree\nREASONING: Good approach.");
      expect(vote).not.toBeNull();
      expect(vote!.position).toBe("agree");
      expect(vote!.reasoning).toBe("Good approach.");
    });

    it("parses disagree response", () => {
      const vote = council.parseResponse("p1", "CEO", "POSITION: disagree\nREASONING: Too risky.");
      expect(vote!.position).toBe("disagree");
    });

    it("returns null for unparseable response", () => {
      expect(council.parseResponse("p1", "CEO", "I think we should do it")).toBeNull();
    });
  });

  describe("listSessions", () => {
    it("returns all sessions", () => {
      council.startSession({ id: "q1", question: "A?", requiredVotes: 2 });
      council.startSession({ id: "q2", question: "B?", requiredVotes: 2 });
      expect(council.listSessions()).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("handles unanimous agreement", () => {
      council.startSession({ id: "q1", question: "Obvious?", requiredVotes: 3 });
      council.addVote("q1", {
        paneId: "a",
        label: "A",
        position: "agree",
        reasoning: "Yes",
        timestamp: Date.now(),
      });
      council.addVote("q1", {
        paneId: "b",
        label: "B",
        position: "agree",
        reasoning: "Yes",
        timestamp: Date.now(),
      });
      const session = council.addVote("q1", {
        paneId: "c",
        label: "C",
        position: "agree",
        reasoning: "Yes",
        timestamp: Date.now(),
      });
      expect(session!.status).toBe("decided");
      expect(session!.decision).toContain("APPROVED");
      expect(session!.decision).toContain("3/3");
    });

    it("handles 1-vote council", () => {
      council.startSession({ id: "q1", question: "Solo?", requiredVotes: 1 });
      const session = council.addVote("q1", {
        paneId: "a",
        label: "CEO",
        position: "agree",
        reasoning: "I decide",
        timestamp: Date.now(),
      });
      expect(session!.status).toBe("decided");
    });

    it("won't accept votes after decision", () => {
      council.startSession({ id: "q1", question: "Done?", requiredVotes: 1 });
      council.addVote("q1", {
        paneId: "a",
        label: "A",
        position: "agree",
        reasoning: "",
        timestamp: Date.now(),
      });
      const late = council.addVote("q1", {
        paneId: "b",
        label: "B",
        position: "disagree",
        reasoning: "",
        timestamp: Date.now(),
      });
      expect(late).toBeNull(); // Session already decided
    });

    it("parseResponse handles case-insensitive POSITION", () => {
      const vote = council.parseResponse("p1", "X", "position: AGREE\nreasoning: Case test.");
      expect(vote).not.toBeNull();
      expect(vote!.position).toBe("agree");
    });

    it("parseResponse handles abstain", () => {
      const vote = council.parseResponse("p1", "X", "POSITION: abstain\nREASONING: Not my area.");
      expect(vote).not.toBeNull();
      expect(vote!.position).toBe("abstain");
    });
  });
});
