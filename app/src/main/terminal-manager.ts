/**
 * Terminal Manager — tmux-backed PTY sessions
 * Adapted from Colab AI (collaborator-ai/collab-public) pattern.
 * Each pane gets a tmux daemon session. PTY attaches as client.
 * Eliminates race conditions — tmux handles process isolation.
 */

import { EventEmitter } from "events";
import { platform } from "os";
import {
  tmuxExec,
  tmuxSessionName,
  writeSessionMeta,
  deleteSessionMeta,
  hasSession,
  killSession as tmuxKillSession,
  killAllSessions,
  getTmuxBin,
  SOCKET_NAME,
} from "./tmux-helper";

// Lazy-load node-pty to prevent crash if native module fails
let ptyModule: typeof import("node-pty") | null = null;
try {
  ptyModule = require("node-pty");
} catch (err) {
  console.error("[TerminalManager] Failed to load node-pty:", (err as Error).message);
  console.error("[TerminalManager] Terminals will not be available.");
}

export type HealthStatus = "active" | "idle" | "stuck" | "dead";

// ─── Cost tracking constants ───
// Heuristic: terminal output words × 1.3 ≈ tokens
const TOKENS_PER_WORD = 1.3;
// Model pricing per 1K tokens (input+output blended estimate)
const MODEL_PRICING: Record<string, number> = {
  "claude-opus-4-6": 0.015,
  "claude-sonnet-4-6": 0.003,
  "claude-haiku-4-5-20251001": 0.00025,
  opus: 0.015,
  sonnet: 0.003,
  haiku: 0.00025,
};

function getModelPrice(model: string): number {
  // Try exact match first, then partial
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return MODEL_PRICING.opus;
  if (lower.includes("sonnet")) return MODEL_PRICING.sonnet;
  if (lower.includes("haiku")) return MODEL_PRICING.haiku;
  return MODEL_PRICING.opus; // default to most expensive
}

// Cost timeline sampling interval (record a data point every 10s)
const COST_SAMPLE_INTERVAL_MS = 10_000;

// Compaction detection patterns (Claude Code emits these)
const COMPACTION_PATTERNS = [
  "Context was auto-compacted",
  "conversation was compressed",
  "context window was compacted",
  "auto-compacted to",
  "compaction #",
];

interface TerminalInstance {
  pty: import("node-pty").IPty;
  paneId: string;
  cols: number;
  rows: number;
  lastDataAt: number;
  spawnedAt: number;
  byteCount: number;
  latencySamples: number[];
  pendingLatencyProbe?: number;
  flushCount: number;
  flushStartedAt: number;
  compactionCount: number;
  recentLines: string[];
  // Cost tracking
  wordCount: number;
  estimatedTokens: number;
  model: string;
  costTimeline: Array<{ timestamp: number; tokens: number; costUsd: number }>;
  flushTimer: ReturnType<typeof setTimeout> | null;
}

export class TerminalManager extends EventEmitter {
  private terminals = new Map<string, TerminalInstance>();
  private defaultShell: string;
  readonly available: boolean;

  constructor() {
    super();
    this.available = ptyModule !== null;
    this.defaultShell = this.detectShell();
    if (!this.available) {
      console.error("[TerminalManager] node-pty not available — running in degraded mode");
    }
  }

  private detectShell(): string {
    const env = process.env.SHELL;
    if (env) return env;
    return platform() === "win32" ? "powershell.exe" : "/bin/zsh";
  }

  /** Ensure PATH includes common system binary locations */
  private getEnhancedEnv(extraEnv?: Record<string, string>): Record<string, string> {
    const env = { ...process.env } as Record<string, string>;
    // Packaged Electron apps may not inherit the full shell PATH
    const systemPaths = [
      "/usr/local/bin",
      "/usr/bin",
      "/bin",
      "/usr/sbin",
      "/sbin",
      "/opt/homebrew/bin",
      "/opt/homebrew/sbin",
    ];
    const currentPath = env.PATH || "";
    const missingPaths = systemPaths.filter((p) => !currentPath.includes(p));
    if (missingPaths.length > 0) {
      env.PATH = [...missingPaths, currentPath].join(":");
    }
    return {
      ...env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      LANG: env.LANG || "en_US.UTF-8",
      LC_ALL: env.LC_ALL || "en_US.UTF-8",
      ...extraEnv,
    };
  }

  spawn(
    paneId: string,
    cwd: string,
    cols = 80,
    rows = 24,
    extraEnv?: Record<string, string>,
  ): void {
    if (!ptyModule) {
      console.error("[TerminalManager] Cannot spawn terminal — node-pty not loaded");
      this.emit("error", {
        paneId,
        error: "node-pty native module not available. Check that the app was built correctly.",
      });
      return;
    }

    if (this.terminals.has(paneId)) {
      this.kill(paneId);
    }

    try {
      // Step 1: Create tmux daemon session (Colab AI pattern — no race conditions)
      const sessionName = tmuxSessionName(paneId);
      try {
        tmuxExec(
          "new-session",
          "-d",
          "-s",
          sessionName,
          "-c",
          cwd || process.env.HOME || "/tmp",
          "-x",
          String(cols),
          "-y",
          String(rows),
        );
        writeSessionMeta(paneId, {
          shell: this.defaultShell,
          cwd: cwd || process.env.HOME || "/tmp",
          createdAt: new Date().toISOString(),
        });
        console.log(`[TerminalManager] Created tmux session: ${sessionName}`);
      } catch (tmuxErr) {
        // If tmux session already exists, kill it and retry
        if (hasSession(paneId)) {
          tmuxKillSession(paneId);
          tmuxExec(
            "new-session",
            "-d",
            "-s",
            sessionName,
            "-c",
            cwd || process.env.HOME || "/tmp",
            "-x",
            String(cols),
            "-y",
            String(rows),
          );
        } else {
          throw tmuxErr;
        }
      }

      // Step 2: Attach PTY client to tmux session (no raw shell — tmux manages it)
      const tmuxBin = getTmuxBin();
      const pty = ptyModule.spawn(
        tmuxBin,
        ["-L", SOCKET_NAME, "-u", "attach-session", "-t", sessionName],
        {
          name: "xterm-256color",
          cols,
          rows,
          env: this.getEnhancedEnv(extraEnv),
        },
      );

      const now = Date.now();
      const instance: TerminalInstance = {
        pty,
        paneId,
        cols,
        rows,
        lastDataAt: now,
        spawnedAt: now,
        byteCount: 0,
        latencySamples: [],
        flushCount: 0,
        flushStartedAt: now,
        compactionCount: 0,
        recentLines: [],
        wordCount: 0,
        estimatedTokens: 0,
        model: "claude-opus-4-6",
        costTimeline: [],
        flushTimer: null,
      };
      this.terminals.set(paneId, instance);

      // Step 3: Ensure tmux window matches xterm dimensions
      // (Don't send newline — let shell render its own prompt)
      try {
        tmuxExec("resize-window", "-t", sessionName, "-x", String(cols), "-y", String(rows));
      } catch {
        // Non-fatal
      }

      // Batch PTY output at 5ms intervals (matches VS Code/Colab AI — proven at scale)
      let buffer = "";
      const BATCH_INTERVAL_MS = 5;

      const flushBuffer = () => {
        if (buffer.length > 0) {
          instance.flushCount++;
          this.emit("data", { paneId, data: buffer });
          buffer = "";
          // Log flush stats every 100 flushes
          if (instance.flushCount % 100 === 0) {
            const elapsed = (Date.now() - instance.flushStartedAt) / 1000;
            const rate = instance.flushCount / elapsed;
            console.log(
              `[TerminalManager] ${paneId}: ${instance.flushCount} flushes in ${elapsed.toFixed(1)}s (${rate.toFixed(1)}/s, ${instance.byteCount} bytes)`,
            );
          }
        }
        instance.flushTimer = null;
      };

      pty.onData((data: string) => {
        const now = Date.now();
        instance.lastDataAt = now;
        instance.byteCount += data.length;

        // DEBUG: Log first data from each pane
        if (instance.byteCount <= data.length) {
          console.error(
            `[DEBUG] FIRST DATA from pane ${paneId}: ${data.length} bytes, first 50 chars: ${JSON.stringify(data.slice(0, 50))}`,
          );
        }

        // Latency probe detection: check if response to a pending probe
        if (instance.pendingLatencyProbe) {
          const rtt = now - instance.pendingLatencyProbe;
          instance.latencySamples.push(rtt);
          // Keep last 100 samples for P50/P95 calculation
          if (instance.latencySamples.length > 100) {
            instance.latencySamples.shift();
          }
          instance.pendingLatencyProbe = undefined;
        }

        // Track recent lines for compaction detection + handoff
        const lines = data.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            instance.recentLines.push(line);
            if (instance.recentLines.length > 200) {
              instance.recentLines.shift();
            }
          }
        }

        // Compaction detection (Feature 41)
        const lowerData = data.toLowerCase();
        for (const pattern of COMPACTION_PATTERNS) {
          if (lowerData.includes(pattern.toLowerCase())) {
            instance.compactionCount++;
            this.emit("compaction", {
              paneId,
              count: instance.compactionCount,
              timestamp: now,
            });
            break;
          }
        }

        // Token estimation: count words × 1.3 tokens/word
        // Strip ANSI escape sequences before counting
        const stripped = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
        const words = stripped.split(/\s+/).filter((w) => w.length > 0).length;
        instance.wordCount += words;
        instance.estimatedTokens = Math.round(instance.wordCount * TOKENS_PER_WORD);

        // Sample cost timeline periodically
        const lastSample = instance.costTimeline[instance.costTimeline.length - 1];
        if (!lastSample || now - lastSample.timestamp >= COST_SAMPLE_INTERVAL_MS) {
          const price = getModelPrice(instance.model);
          const costUsd = (instance.estimatedTokens / 1000) * price;
          instance.costTimeline.push({
            timestamp: now,
            tokens: instance.estimatedTokens,
            costUsd,
          });
          // Keep last 360 samples (~1 hour at 10s interval)
          if (instance.costTimeline.length > 360) {
            instance.costTimeline.shift();
          }
          // Emit cost update for budget alerting
          this.emit("costUpdate", {
            paneId,
            tokens: instance.estimatedTokens,
            costUsd,
            model: instance.model,
          });
        }

        buffer += data;
        if (!instance.flushTimer) {
          instance.flushTimer = setTimeout(flushBuffer, BATCH_INTERVAL_MS);
        }
      });

      pty.onExit(({ exitCode }) => {
        if (instance.flushTimer) {
          clearTimeout(instance.flushTimer);
          instance.flushTimer = null;
        }
        this.terminals.delete(paneId);
        this.emit("exit", { paneId, exitCode });
      });

      console.log(
        `[TerminalManager] Spawned PTY for ${paneId}: shell=${this.defaultShell} pid=${pty.pid}`,
      );
    } catch (err) {
      console.error(`[TerminalManager] Failed to spawn PTY for ${paneId}:`, (err as Error).message);
      this.emit("error", {
        paneId,
        error: `Failed to spawn terminal: ${(err as Error).message}`,
      });
    }
  }

  write(paneId: string, data: string): void {
    const instance = this.terminals.get(paneId);
    if (instance) {
      instance.pty.write(data);
    }
  }

  resize(paneId: string, cols: number, rows: number): void {
    const instance = this.terminals.get(paneId);
    if (instance) {
      instance.pty.resize(cols, rows);
      instance.cols = cols;
      instance.rows = rows;
    }
  }

  kill(paneId: string): void {
    const instance = this.terminals.get(paneId);
    if (instance) {
      if (instance.flushTimer) {
        clearTimeout(instance.flushTimer);
        instance.flushTimer = null;
      }
      instance.pty.kill();
      this.terminals.delete(paneId);
    }
    // Also kill the tmux session
    tmuxKillSession(paneId);
  }

  killAll(): void {
    for (const [id] of this.terminals) {
      this.kill(id);
    }
    killAllSessions();
  }

  has(paneId: string): boolean {
    return this.terminals.has(paneId);
  }

  isAlive(paneId: string): boolean {
    const instance = this.terminals.get(paneId);
    return instance !== undefined && instance.pty.pid > 0;
  }

  getPid(paneId: string): number | undefined {
    return this.terminals.get(paneId)?.pty.pid;
  }

  getAll(): string[] {
    return Array.from(this.terminals.keys());
  }

  /** Probe input latency by sending a no-op and measuring round-trip */
  probeLatency(paneId: string): void {
    const instance = this.terminals.get(paneId);
    if (instance) {
      instance.pendingLatencyProbe = Date.now();
      // Send empty escape sequence that produces output without side effects
      instance.pty.write("\x1b[6n"); // Request cursor position — PTY echoes back
    }
  }

  /** Get P50/P95 latency from recent samples */
  getLatency(paneId: string): { p50: number; p95: number; samples: number } | null {
    const instance = this.terminals.get(paneId);
    if (!instance || instance.latencySamples.length === 0) return null;
    const sorted = [...instance.latencySamples].sort((a, b) => a - b);
    const len = sorted.length;
    return {
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      samples: len,
    };
  }

  getStats(paneId: string): {
    byteCount: number;
    lastDataAt: number;
    uptime: number;
    latency: ReturnType<TerminalManager["getLatency"]>;
    flushRate: number;
    flushCount: number;
  } | null {
    const instance = this.terminals.get(paneId);
    if (!instance) return null;
    const elapsed = (Date.now() - instance.flushStartedAt) / 1000;
    return {
      byteCount: instance.byteCount,
      lastDataAt: instance.lastDataAt,
      uptime: Date.now() - instance.spawnedAt,
      latency: this.getLatency(paneId),
      flushRate: elapsed > 0 ? instance.flushCount / elapsed : 0,
      flushCount: instance.flushCount,
    };
  }

  getHealth(paneId: string): HealthStatus {
    const instance = this.terminals.get(paneId);
    if (!instance) return "dead";
    const elapsed = Date.now() - instance.lastDataAt;
    if (elapsed > 5 * 60 * 1000) return "stuck";
    if (elapsed > 30 * 1000) return "idle";
    return "active";
  }

  getCompactionCount(paneId: string): number {
    return this.terminals.get(paneId)?.compactionCount ?? 0;
  }

  getRecentLines(paneId: string, count = 200): string[] {
    const instance = this.terminals.get(paneId);
    if (!instance) return [];
    return instance.recentLines.slice(-count);
  }

  /** Get estimated memory usage as percentage (0-100) based on bytes received */
  getMemoryEstimate(paneId: string): number {
    const instance = this.terminals.get(paneId);
    if (!instance) return 0;
    // Claude Code 1M context ~ 4MB of text. Estimate from bytes received.
    const estimatedContextBytes = 4 * 1024 * 1024;
    return Math.min(100, (instance.byteCount / estimatedContextBytes) * 100);
  }

  getAllHealth(): Record<string, { health: HealthStatus; lastDataAt: number; byteCount: number }> {
    const result: Record<string, { health: HealthStatus; lastDataAt: number; byteCount: number }> =
      {};
    for (const [id, instance] of this.terminals) {
      result[id] = {
        health: this.getHealth(id),
        lastDataAt: instance.lastDataAt,
        byteCount: instance.byteCount,
      };
    }
    return result;
  }

  // ─── Cost tracking (Features 114-121) ───

  setModel(paneId: string, model: string): void {
    const instance = this.terminals.get(paneId);
    if (instance) instance.model = model;
  }

  getCostInfo(
    paneId: string,
  ): { tokens: number; costUsd: number; model: string; wordCount: number } | null {
    const instance = this.terminals.get(paneId);
    if (!instance) return null;
    const price = getModelPrice(instance.model);
    return {
      tokens: instance.estimatedTokens,
      costUsd: (instance.estimatedTokens / 1000) * price,
      model: instance.model,
      wordCount: instance.wordCount,
    };
  }

  getCostTimeline(paneId: string): Array<{ timestamp: number; tokens: number; costUsd: number }> {
    return this.terminals.get(paneId)?.costTimeline ?? [];
  }

  getTotalCost(): { tokens: number; costUsd: number } {
    let totalTokens = 0;
    let totalCost = 0;
    for (const instance of this.terminals.values()) {
      totalTokens += instance.estimatedTokens;
      const price = getModelPrice(instance.model);
      totalCost += (instance.estimatedTokens / 1000) * price;
    }
    return { tokens: totalTokens, costUsd: totalCost };
  }

  /** Get cost comparison: what would this session cost on different models */
  getCostComparison(): Record<string, number> {
    let totalTokens = 0;
    for (const instance of this.terminals.values()) {
      totalTokens += instance.estimatedTokens;
    }
    const result: Record<string, number> = {};
    for (const [model, price] of Object.entries(MODEL_PRICING)) {
      result[model] = (totalTokens / 1000) * price;
    }
    return result;
  }

  /** Export cost data as CSV rows */
  exportCostCsv(): string {
    const headers = "pane_id,label,model,tokens,cost_usd,bytes,duration_ms,started_at";
    const rows: string[] = [headers];
    for (const instance of this.terminals.values()) {
      const price = getModelPrice(instance.model);
      const costUsd = (instance.estimatedTokens / 1000) * price;
      const duration = Date.now() - instance.spawnedAt;
      rows.push(
        [
          instance.paneId,
          `"${instance.paneId}"`, // label fallback
          instance.model,
          instance.estimatedTokens,
          costUsd.toFixed(6),
          instance.byteCount,
          duration,
          new Date(instance.spawnedAt).toISOString(),
        ].join(","),
      );
    }
    return rows.join("\n");
  }
}
