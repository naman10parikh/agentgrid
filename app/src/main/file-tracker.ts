/**
 * File Tracker — Track which files each agent pane modifies.
 * Uses git diff to detect changes in each pane's working directory.
 */

import { execSync } from "child_process";

interface FileChange {
  paneId: string;
  files: string[];
  timestamp: number;
}

export class FileTracker {
  private baselines = new Map<string, Set<string>>();
  private changes = new Map<string, FileChange>();

  /**
   * Snapshot the current git state for a pane's working directory.
   * Call this when spawning a new agent.
   */
  baseline(paneId: string, cwd: string): void {
    const files = this.getModifiedFiles(cwd);
    this.baselines.set(paneId, new Set(files));
    this.changes.set(paneId, {
      paneId,
      files: [],
      timestamp: Date.now(),
    });
  }

  /**
   * Check what files changed since baseline.
   */
  diff(paneId: string, cwd: string): string[] {
    const baseline = this.baselines.get(paneId) ?? new Set();
    const current = this.getModifiedFiles(cwd);
    const newFiles = current.filter((f) => !baseline.has(f));

    if (newFiles.length > 0) {
      const change = this.changes.get(paneId);
      if (change) {
        change.files = newFiles;
        change.timestamp = Date.now();
      }
    }

    return newFiles;
  }

  /**
   * Get all tracked changes.
   */
  getAll(): FileChange[] {
    return Array.from(this.changes.values());
  }

  /**
   * Get changes for a specific pane.
   */
  getForPane(paneId: string): FileChange | undefined {
    return this.changes.get(paneId);
  }

  /**
   * Clear tracking for a pane.
   */
  clear(paneId: string): void {
    this.baselines.delete(paneId);
    this.changes.delete(paneId);
  }

  private getModifiedFiles(cwd: string): string[] {
    try {
      const output = execSync(
        "git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null",
        {
          cwd,
          encoding: "utf-8",
          timeout: 5000,
        },
      );
      return [...new Set(output.split("\n").filter(Boolean))];
    } catch {
      return [];
    }
  }
}
