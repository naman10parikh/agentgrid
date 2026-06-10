/**
 * run-log.ts — Observability spine for agentgrid.
 *
 * An append-only JSONL audit trail that the CLI WRITES on every state-mutating
 * action (grid create, send, broadcast, inject, save/restore, kill, sandbox-run).
 * Each entry records the command, args, wall-clock duration, and outcome — so a
 * grid run leaves a reconstructable trail of what happened and how long it took.
 *
 * Ported from energy's helios `pipeline/run-log.ts`. Best-effort by design: a
 * logging failure must NEVER break a grid operation, so every write is swallowed.
 *
 * Trail location: `<repo>/logs/runs.jsonl` (gitignored runtime state), overridable
 * via the AGENTGRID_RUN_LOG env var (used by tests).
 */
import {
  appendFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
/** Repo root is two levels up from dist/lib (or src/lib in dev). */
const REPO_ROOT = join(HERE, "..", "..");

/** Resolve the active run-log path (env override wins, for tests). */
export function runLogPath(): string {
  return process.env["AGENTGRID_RUN_LOG"] ?? join(REPO_ROOT, "logs", "runs.jsonl");
}

/** One append-only audit record. */
export interface RunLogEntry {
  /** ISO-8601 timestamp of when the action finished. */
  ts: string;
  /** CLI subcommand (e.g. "grid", "broadcast", "sandbox-run"). */
  command: string;
  /** Remaining argv tokens / salient params for the action. */
  args: string[];
  /** Wall-clock duration of the action, milliseconds. */
  durationMs: number;
  /** Whether the action completed cleanly or threw. */
  outcome: "ok" | "error";
  /** Error message when outcome === "error". */
  error?: string;
  /** Optional one-line summary (e.g. "2x3 = 6 panes"). */
  note?: string;
}

/** Append one entry to the JSONL trail. Best-effort — never throws. */
export function recordRun(
  entry: Omit<RunLogEntry, "ts"> & { ts?: string },
  logPath: string = runLogPath(),
): void {
  try {
    const full: RunLogEntry = { ts: entry.ts ?? new Date().toISOString(), ...entry };
    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, JSON.stringify(full) + "\n");
  } catch {
    // Observability is best-effort; a log-write failure must not break a grid op.
  }
}

/** Read the most-recent entries (oldest -> newest), capped at `limit`. */
export function readRuns(
  limit = 20,
  logPath: string = runLogPath(),
): RunLogEntry[] {
  if (!existsSync(logPath)) return [];
  try {
    return readFileSync(logPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .map((l) => JSON.parse(l) as RunLogEntry);
  } catch {
    return [];
  }
}

/**
 * Time a synchronous action and record exactly one run-log entry for it,
 * capturing duration + ok/error outcome. Re-throws after logging so callers
 * see the original error. Used to wrap state-mutating CLI commands.
 */
export function withRunLog<T>(
  command: string,
  args: string[],
  fn: () => T,
  note?: string,
): T {
  const start = Date.now();
  try {
    const result = fn();
    recordRun({ command, args, durationMs: Date.now() - start, outcome: "ok", note });
    return result;
  } catch (err) {
    recordRun({
      command,
      args,
      durationMs: Date.now() - start,
      outcome: "error",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
