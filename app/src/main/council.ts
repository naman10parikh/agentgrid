/**
 * LLM Council — agents debate before acting.
 * CEO sends a question, each pane's agent responds, then CEO synthesizes.
 */

import { EventEmitter } from "events";

export interface CouncilSession {
  id: string;
  question: string;
  responses: CouncilResponse[];
  synthesis: string | null;
  status: "debating" | "synthesizing" | "resolved";
  createdAt: number;
}

export interface CouncilResponse {
  paneId: string;
  label: string;
  response: string;
  confidence: number; // 0-1
  timestamp: number;
}

export class CouncilManager extends EventEmitter {
  private sessions: CouncilSession[] = [];
  private idCounter = 1;

  create(question: string): CouncilSession {
    const session: CouncilSession = {
      id: `council-${this.idCounter++}`,
      question,
      responses: [],
      synthesis: null,
      status: "debating",
      createdAt: Date.now(),
    };
    this.sessions.push(session);
    this.emit("created", session);
    return session;
  }

  addResponse(
    sessionId: string,
    paneId: string,
    label: string,
    response: string,
    confidence = 0.8,
  ): boolean {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session || session.status !== "debating") return false;
    session.responses.push({ paneId, label, response, confidence, timestamp: Date.now() });
    this.emit("response", { sessionId, paneId, response });
    return true;
  }

  synthesize(sessionId: string, synthesis: string): boolean {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return false;
    session.synthesis = synthesis;
    session.status = "resolved";
    this.emit("resolved", session);
    return true;
  }

  getSession(sessionId: string): CouncilSession | undefined {
    return this.sessions.find((s) => s.id === sessionId);
  }

  listSessions(): CouncilSession[] {
    return this.sessions;
  }
}
