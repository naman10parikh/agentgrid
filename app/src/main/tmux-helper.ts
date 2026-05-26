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

const SOCKET_NAME = "agentgrid";
const SESSION_DIR = path.join(os.homedir(), ".agentgrid", "terminal-sessions");

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
  return execFileSync(getTmuxBin(), [...baseArgs(), ...args], {
    encoding: "utf8",
    timeout: 5000,
  }).trim();
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
