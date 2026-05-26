/**
 * Team Workspace — Local-first multi-user workspace management.
 * Stores workspace metadata, member list, and shared grid configs.
 * Server sync is future — this is the local foundation.
 */

import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const TEAM_DIR = join(homedir(), ".agentgrid", "teams");

export interface TeamMember {
  id: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
}

export interface TeamWorkspace {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  sharedPresets: string[];
  sharedHarnesses: string[];
  createdAt: string;
  updatedAt: string;
}

export class TeamWorkspaceManager {
  constructor() {
    mkdirSync(TEAM_DIR, { recursive: true });
  }

  create(name: string, ownerName: string, description?: string): TeamWorkspace {
    const workspace: TeamWorkspace = {
      id: randomUUID().slice(0, 8),
      name,
      description,
      members: [
        {
          id: randomUUID().slice(0, 8),
          name: ownerName,
          role: "owner",
          joinedAt: new Date().toISOString(),
        },
      ],
      sharedPresets: [],
      sharedHarnesses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.save(workspace);
    return workspace;
  }

  get(workspaceId: string): TeamWorkspace | null {
    const file = join(TEAM_DIR, `${workspaceId}.json`);
    if (!existsSync(file)) return null;
    try {
      return JSON.parse(readFileSync(file, "utf-8")) as TeamWorkspace;
    } catch {
      return null;
    }
  }

  list(): TeamWorkspace[] {
    if (!existsSync(TEAM_DIR)) return [];
    return readdirSync(TEAM_DIR)
      .filter((f: string) => f.endsWith(".json"))
      .map((f: string) => {
        try {
          return JSON.parse(readFileSync(join(TEAM_DIR, f), "utf-8")) as TeamWorkspace;
        } catch {
          return null;
        }
      })
      .filter((w): w is TeamWorkspace => w !== null);
  }

  addMember(
    workspaceId: string,
    name: string,
    role: TeamMember["role"] = "member",
  ): TeamWorkspace | null {
    const workspace = this.get(workspaceId);
    if (!workspace) return null;
    workspace.members.push({
      id: randomUUID().slice(0, 8),
      name,
      role,
      joinedAt: new Date().toISOString(),
    });
    workspace.updatedAt = new Date().toISOString();
    this.save(workspace);
    return workspace;
  }

  removeMember(workspaceId: string, memberId: string): boolean {
    const workspace = this.get(workspaceId);
    if (!workspace) return false;
    const idx = workspace.members.findIndex((m) => m.id === memberId);
    if (idx === -1) return false;
    if (workspace.members[idx].role === "owner") return false; // Can't remove owner
    workspace.members.splice(idx, 1);
    workspace.updatedAt = new Date().toISOString();
    this.save(workspace);
    return true;
  }

  sharePreset(workspaceId: string, presetName: string): boolean {
    const workspace = this.get(workspaceId);
    if (!workspace) return false;
    if (!workspace.sharedPresets.includes(presetName)) {
      workspace.sharedPresets.push(presetName);
      workspace.updatedAt = new Date().toISOString();
      this.save(workspace);
    }
    return true;
  }

  shareHarness(workspaceId: string, harnessName: string): boolean {
    const workspace = this.get(workspaceId);
    if (!workspace) return false;
    if (!workspace.sharedHarnesses.includes(harnessName)) {
      workspace.sharedHarnesses.push(harnessName);
      workspace.updatedAt = new Date().toISOString();
      this.save(workspace);
    }
    return true;
  }

  delete(workspaceId: string): boolean {
    const file = join(TEAM_DIR, `${workspaceId}.json`);
    if (!existsSync(file)) return false;
    unlinkSync(file);
    return true;
  }

  private save(workspace: TeamWorkspace): void {
    writeFileSync(join(TEAM_DIR, `${workspace.id}.json`), JSON.stringify(workspace, null, 2));
  }
}
