/**
 * tmux Helper — Adapted from Colab AI (collaborator-ai/collab-public)
 * Uses tmux daemon sessions instead of raw PTY to eliminate race conditions.
 * Each terminal pane gets its own tmux session that persists through crashes.
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface SessionMeta {
  shell: string;
  cwd: string;
  createdAt: string;
}

// The unit tests set both to their own (vitest.config.ts), so a test run never touches the app's live panes.
const SOCKET_NAME = process.env.AGENTGRID_TMUX_SOCKET || "agentgrid";
const SESSION_DIR =
  process.env.AGENTGRID_SESSION_DIR || path.join(os.homedir(), ".agentgrid", "terminal-sessions");

export function getTmuxBin(): string {
  // Use system tmux (available on every macOS via Xcode CLI tools or homebrew)
  // Check common locations
  const locations = ["/opt/homebrew/bin/tmux", "/usr/local/bin/tmux", "/usr/bin/tmux"];
  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }
  return "tmux"; // fallback to PATH
}

function baseArgs(): string[] {
  return ["-L", SOCKET_NAME, "-u"];
}

export function tmuxExec(...args: string[]): string {
  const run = (): string =>
    execFileSync(getTmuxBin(), [...baseArgs(), ...args], {
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  // Right after its last pane closes, the server is still exiting, and a command that reaches it fails with
  // "server exited unexpectedly". Give it a moment to finish, then start fresh, up to three times.
  for (let attempt = 1; ; attempt++) {
    try {
      return run();
    } catch (err) {
      if (attempt === 3 || !(err as Error).message.includes("server exited unexpectedly"))
        throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
}

export function tmuxSessionName(paneId: string): string {
  return `ag-${paneId}`;
}

function ensureSessionDir(): void {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

function metaPath(paneId: string): string {
  return path.join(SESSION_DIR, `${paneId}.json`);
}

export function writeSessionMeta(paneId: string, meta: SessionMeta): void {
  ensureSessionDir();
  fs.writeFileSync(metaPath(paneId), JSON.stringify(meta));
}

export function readSessionMeta(paneId: string): SessionMeta | null {
  try {
    const raw = fs.readFileSync(metaPath(paneId), "utf8");
    return JSON.parse(raw) as SessionMeta;
  } catch {
    return null;
  }
}

export function deleteSessionMeta(paneId: string): void {
  try {
    fs.unlinkSync(metaPath(paneId));
  } catch {
    // no-op if doesn't exist
  }
}

export function hasSession(paneId: string): boolean {
  const name = tmuxSessionName(paneId);
  try {
    tmuxExec("has-session", "-t", name);
    return true;
  } catch {
    return false;
  }
}

export function killSession(paneId: string): void {
  const name = tmuxSessionName(paneId);
  try {
    tmuxExec("kill-session", "-t", name);
  } catch {
    // session may already be dead
  }
  deleteSessionMeta(paneId);
}

export function killAllSessions(): void {
  try {
    tmuxExec("kill-server");
  } catch {
    // server may not be running
  }
}

export { SOCKET_NAME, SESSION_DIR };
