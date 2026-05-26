/**
 * Workspace Config — Per-project settings in .agentgrid.json
 *
 * Example .agentgrid.json:
 * {
 *   "defaultAgent": "claude",
 *   "defaultModel": "claude-opus-4-6",
 *   "defaultEffort": "max",
 *   "defaultGrid": "2x3",
 *   "harness": "engineering-sprint",
 *   "mcpServers": ["github", "context7"],
 *   "skills": ["architect", "deep-think"],
 *   "autoApprove": true
 * }
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { CliTool, EffortLevel } from "../shared/types";

export interface WorkspaceConfigData {
  defaultAgent?: CliTool;
  defaultModel?: string;
  defaultEffort?: EffortLevel;
  defaultGrid?: string; // "2x3" format
  harness?: string; // harness name to auto-load
  mcpServers?: string[];
  skills?: string[];
  autoApprove?: boolean;
}

const CONFIG_FILENAME = ".agentgrid.json";

export class WorkspaceConfig {
  private configPath: string;
  private data: WorkspaceConfigData;

  constructor(workspacePath: string) {
    this.configPath = join(workspacePath, CONFIG_FILENAME);
    this.data = this.load();
  }

  private load(): WorkspaceConfigData {
    if (!existsSync(this.configPath)) return {};
    try {
      return JSON.parse(readFileSync(this.configPath, "utf-8"));
    } catch {
      return {};
    }
  }

  get(): WorkspaceConfigData {
    return { ...this.data };
  }

  set(updates: Partial<WorkspaceConfigData>): void {
    this.data = { ...this.data, ...updates };
    this.save();
  }

  private save(): void {
    writeFileSync(this.configPath, JSON.stringify(this.data, null, 2) + "\n");
  }

  getDefaultGrid(): { rows: number; cols: number } | null {
    if (!this.data.defaultGrid) return null;
    const match = this.data.defaultGrid.match(/^(\d+)x(\d+)$/);
    if (!match) return null;
    return { rows: parseInt(match[1], 10), cols: parseInt(match[2], 10) };
  }

  exists(): boolean {
    return existsSync(this.configPath);
  }
}
