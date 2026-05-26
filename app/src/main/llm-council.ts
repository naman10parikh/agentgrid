/**
 * LLM Council — Multiple agents debate/discuss before acting.
 * CEO sends a question to N panes, collects responses, synthesizes.
 */

export interface CouncilQuestion {
  id: string;
  question: string;
  context?: string;
  requiredVotes: number;
}

export interface CouncilVote {
  paneId: string;
  label: string;
  position: "agree" | "disagree" | "abstain";
  reasoning: string;
  timestamp: number;
}

export interface CouncilSession {
  question: CouncilQuestion;
  votes: CouncilVote[];
  status: "voting" | "decided" | "deadlocked";
  decision?: string;
  startedAt: number;
}

export class LLMCouncil {
  private sessions = new Map<string, CouncilSession>();

  /**
   * Start a new council session — ask a question to the group.
   */
  startSession(question: CouncilQuestion): CouncilSession {
    const session: CouncilSession = {
      question,
      votes: [],
      status: "voting",
      startedAt: Date.now(),
    };
    this.sessions.set(question.id, session);
    return session;
  }

  /**
   * Record a vote from a pane.
   */
  addVote(questionId: string, vote: CouncilVote): CouncilSession | null {
    const session = this.sessions.get(questionId);
    if (!session || session.status !== "voting") return null;

    // Replace existing vote from same pane
    const existing = session.votes.findIndex((v) => v.paneId === vote.paneId);
    if (existing !== -1) {
      session.votes[existing] = vote;
    } else {
      session.votes.push(vote);
    }

    // Check if we have enough votes
    if (session.votes.length >= session.question.requiredVotes) {
      this.decide(session);
    }

    return session;
  }

  /**
   * Get a council session by ID.
   */
  getSession(questionId: string): CouncilSession | null {
    return this.sessions.get(questionId) ?? null;
  }

  /**
   * List all sessions.
   */
  listSessions(): CouncilSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Generate the prompt to send to each council member.
   */
  generatePrompt(question: CouncilQuestion): string {
    return [
      "You are participating in an LLM Council decision.",
      "",
      `QUESTION: ${question.question}`,
      question.context ? `CONTEXT: ${question.context}` : "",
      "",
      "Respond with exactly this format:",
      "POSITION: agree | disagree | abstain",
      "REASONING: Your explanation in 2-3 sentences.",
      "",
      "Be concise. State your position clearly.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  /**
   * Parse a council member's response into a vote.
   */
  parseResponse(paneId: string, label: string, response: string): CouncilVote | null {
    const posMatch = response.match(/POSITION:\s*(agree|disagree|abstain)/i);
    const reasonMatch = response.match(/REASONING:\s*(.+)/is);

    if (!posMatch) return null;

    return {
      paneId,
      label,
      position: posMatch[1].toLowerCase() as CouncilVote["position"],
      reasoning: reasonMatch?.[1]?.trim() ?? "No reasoning provided",
      timestamp: Date.now(),
    };
  }

  private decide(session: CouncilSession): void {
    const agrees = session.votes.filter((v) => v.position === "agree").length;
    const disagrees = session.votes.filter((v) => v.position === "disagree").length;
    const total = session.votes.length;

    if (agrees > total / 2) {
      session.status = "decided";
      session.decision = `APPROVED (${agrees}/${total} agree)`;
    } else if (disagrees > total / 2) {
      session.status = "decided";
      session.decision = `REJECTED (${disagrees}/${total} disagree)`;
    } else {
      session.status = "deadlocked";
      session.decision = `DEADLOCKED (${agrees} agree, ${disagrees} disagree, ${total - agrees - disagrees} abstain)`;
    }
  }
}
