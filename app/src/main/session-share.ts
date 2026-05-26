/**
 * Session Share — Serialize grid state into a shareable format.
 * Generates a base64-encoded snapshot that can be imported by another user.
 * Future: serve via URL with a share server.
 */

import { deflateSync, inflateSync } from "zlib";
import type { GridLayout } from "../shared/types";

export interface SharedSession {
  version: 1;
  grid: GridLayout;
  sharedBy: string;
  sharedAt: string;
  description?: string;
}

/**
 * Export a grid as a shareable string (base64-compressed JSON).
 */
export function exportSession(grid: GridLayout, sharedBy: string, description?: string): string {
  const session: SharedSession = {
    version: 1,
    grid: {
      rows: grid.rows,
      cols: grid.cols,
      panes: grid.panes.map((p) => ({
        ...p,
        // Strip runtime state
        pid: undefined,
        metrics: undefined,
      })),
    },
    sharedBy,
    sharedAt: new Date().toISOString(),
    description,
  };

  const json = JSON.stringify(session);
  const compressed = deflateSync(Buffer.from(json));
  return compressed.toString("base64url");
}

/**
 * Import a shared session from a base64-compressed string.
 */
export function importSession(encoded: string): SharedSession | null {
  try {
    const compressed = Buffer.from(encoded, "base64url");
    const json = inflateSync(compressed).toString("utf-8");
    const session = JSON.parse(json) as SharedSession;

    if (session.version !== 1) return null;
    if (!session.grid || !Array.isArray(session.grid.panes)) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Generate a share URL (for future server integration).
 * Currently returns a local agentgrid:// protocol URL.
 */
export function generateShareUrl(encoded: string): string {
  return `agentgrid://import/${encoded}`;
}
