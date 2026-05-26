/**
 * Team Workspaces — shared grid state for multiple users.
 * Local-first: works offline, syncs when connected.
 */

export interface TeamMember {
  id: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: number;
  lastSeenAt: number;
}

export interface TeamWorkspace {
  id: string;
  name: string;
  members: TeamMember[];
  sharedPresets: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SharedSession {
  id: string;
  workspaceId: string;
  gridSnapshot: unknown;
  sharedBy: string;
  shareUrl: string;
  expiresAt: number | null;
  createdAt: number;
}

export class TeamManager {
  private workspaces: TeamWorkspace[] = [];
  private sessions: SharedSession[] = [];
  private idCounter = 1;

  createWorkspace(name: string, ownerName: string): TeamWorkspace {
    const ws: TeamWorkspace = {
      id: `team-${this.idCounter++}`,
      name,
      members: [
        {
          id: `member-${this.idCounter++}`,
          name: ownerName,
          role: "owner",
          joinedAt: Date.now(),
          lastSeenAt: Date.now(),
        },
      ],
      sharedPresets: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.workspaces.push(ws);
    return ws;
  }

  addMember(workspaceId: string, name: string, role: TeamMember["role"] = "member"): boolean {
    const ws = this.workspaces.find((w) => w.id === workspaceId);
    if (!ws) return false;
    ws.members.push({
      id: `member-${this.idCounter++}`,
      name,
      role,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    });
    ws.updatedAt = Date.now();
    return true;
  }

  shareSession(workspaceId: string, gridSnapshot: unknown, sharedBy: string): SharedSession {
    const session: SharedSession = {
      id: `share-${this.idCounter++}`,
      workspaceId,
      gridSnapshot,
      sharedBy,
      shareUrl: `agentgrid://share/${this.idCounter}`,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
      createdAt: Date.now(),
    };
    this.sessions.push(session);
    return session;
  }

  getWorkspace(id: string): TeamWorkspace | undefined {
    return this.workspaces.find((w) => w.id === id);
  }

  listWorkspaces(): TeamWorkspace[] {
    return this.workspaces;
  }

  getSharedSession(id: string): SharedSession | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  listSharedSessions(workspaceId: string): SharedSession[] {
    return this.sessions.filter((s) => s.workspaceId === workspaceId);
  }
}
