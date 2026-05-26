/**
 * DashboardView — Investor-grade metrics dashboard for the agent grid.
 * Replaces the graph view as the default Cmd+G toggle target.
 * Shows per-pane status cards, token usage, cost, time, signals, errors.
 */
import { useState, useEffect, useCallback } from "react";
import type { GridLayout, PaneConfig, PaneMetrics } from "../types";
import { STATUS_COLORS } from "../types";

interface DashboardViewProps {
  grid: GridLayout;
  focusedPaneId: string | null;
  onPaneFocus: (id: string) => void;
}

interface LiveStats {
  [paneId: string]: {
    bytesReceived: number;
    estimatedTokens: number;
    estimatedCostUsd: number;
    startedAt: number;
    lastActivityAt: number;
  };
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function formatCost(usd: number): string {
  if (usd < 0.01) return "$0.00";
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

export function DashboardView({ grid, focusedPaneId, onPaneFocus }: DashboardViewProps) {
  const [liveStats, setLiveStats] = useState<LiveStats>({});
  const [now, setNow] = useState(Date.now());

  // Poll live terminal stats every 2s
  useEffect(() => {
    async function poll() {
      try {
        const stats = await window.api?.terminal?.getAllStats?.();
        if (stats && typeof stats === "object") {
          setLiveStats(stats as LiveStats);
        }
      } catch {
        /* IPC unavailable */
      }
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, []);

  // Tick clock every second for "time active" display
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalCost = grid.panes.reduce((sum, p) => {
    const stat = liveStats[p.id] ?? p.metrics;
    return sum + (stat?.estimatedCostUsd ?? 0);
  }, 0);

  const totalTokens = grid.panes.reduce((sum, p) => {
    const stat = liveStats[p.id] ?? p.metrics;
    return sum + (stat?.estimatedTokens ?? 0);
  }, 0);

  const maxTokens = Math.max(
    1,
    ...grid.panes.map((p) => {
      const stat = liveStats[p.id] ?? p.metrics;
      return stat?.estimatedTokens ?? 0;
    }),
  );

  const workingCount = grid.panes.filter((p) => p.status === "working").length;
  const doneCount = grid.panes.filter((p) => p.status === "done").length;
  const errorCount = grid.panes.filter((p) => p.status === "error").length;

  return (
    <div className="flex h-full flex-col overflow-auto bg-[#141312] p-4">
      {/* Summary strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Total Cost"
          value={formatCost(totalCost)}
          sub={`${grid.panes.length} panes`}
          accent="#8b5cf6"
        />
        <SummaryCard
          label="Total Tokens"
          value={formatTokens(totalTokens)}
          sub={`${maxTokens > 0 ? formatTokens(maxTokens) + " max" : "—"}`}
          accent="#3b82f6"
        />
        <SummaryCard
          label="Progress"
          value={`${doneCount}/${grid.panes.length}`}
          sub={`${workingCount} working`}
          accent="#22c55e"
        />
        <SummaryCard
          label="Errors"
          value={`${errorCount}`}
          sub={errorCount > 0 ? "needs attention" : "all clear"}
          accent={errorCount > 0 ? "#ef4444" : "#22c55e"}
        />
      </div>

      {/* Per-pane cards — sorted by urgency: error → idle → working → done */}
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...grid.panes]
          .sort((a, b) => {
            const priority: Record<string, number> = {
              error: 0,
              idle: 1,
              waiting: 2,
              working: 3,
              done: 4,
            };
            return (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
          })
          .map((pane) => (
            <PaneCard
              key={pane.id}
              pane={pane}
              stats={liveStats[pane.id]}
              isFocused={pane.id === focusedPaneId}
              now={now}
              maxTokens={maxTokens}
              onFocus={() => onPaneFocus(pane.id)}
            />
          ))}
      </div>
    </div>
  );
}

// ── Summary Card ──

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-lg border border-grid-border bg-grid-surface p-3"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-grid-fg-muted">
        {label}
      </div>
      <div className="mt-1 font-display text-xl text-grid-fg">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] text-grid-fg-muted">{sub}</div>
    </div>
  );
}

// ── Pane Card ──

function PaneCard({
  pane,
  stats,
  isFocused,
  now,
  maxTokens,
  onFocus,
}: {
  pane: PaneConfig;
  stats?: LiveStats[string];
  isFocused: boolean;
  now: number;
  maxTokens: number;
  onFocus: () => void;
}) {
  const metrics = stats ?? pane.metrics;
  const tokens = metrics?.estimatedTokens ?? 0;
  const cost = metrics?.estimatedCostUsd ?? 0;
  const startedAt = metrics?.startedAt ?? 0;
  const lastActivity = metrics?.lastActivityAt ?? 0;
  const elapsed = startedAt > 0 ? now - startedAt : 0;
  const idleFor = lastActivity > 0 ? now - lastActivity : 0;
  const tokenPct = maxTokens > 0 ? Math.min(100, (tokens / maxTokens) * 100) : 0;
  const statusColor = STATUS_COLORS[pane.status] ?? "#6b7280";

  const isIdle = idleFor > 60_000 && pane.status === "working";

  return (
    <button
      onClick={onFocus}
      role="article"
      aria-label={`${pane.label} — ${pane.status}`}
      className={`group cursor-pointer rounded-lg border border-l-2 p-3 text-left transition-all duration-200 ${
        isFocused
          ? "border-grid-accent/50 bg-grid-accent/5"
          : pane.status === "error"
            ? "border-grid-border border-l-red-500 bg-red-950/20 hover:bg-red-950/30"
            : pane.status === "done"
              ? "border-grid-border border-l-green-500/40 bg-grid-surface opacity-60 hover:opacity-80"
              : pane.status === "idle" || pane.status === "waiting"
                ? "border-grid-border border-l-grid-fg-muted/30 bg-grid-surface hover:bg-grid-surface-hover"
                : "border-grid-border border-l-grid-accent/50 bg-grid-surface hover:border-grid-border-hover hover:bg-grid-surface-hover"
      }`}
    >
      {/* Header: name + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: statusColor,
              boxShadow: pane.status === "working" ? `0 0 8px ${statusColor}` : "none",
            }}
          />
          <span className="font-mono text-xs font-medium text-grid-fg">{pane.label}</span>
        </div>
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase"
          style={{
            backgroundColor: `${statusColor}15`,
            color: statusColor,
          }}
        >
          {pane.status}
        </span>
      </div>

      {/* Model + effort row */}
      <div className="mt-2 flex items-center gap-2">
        <span className="font-mono text-[10px] text-grid-fg-muted">
          {pane.model?.replace("claude-", "").replace(/-\d{8}$/, "") ?? "—"}
        </span>
        {pane.effort && (
          <span
            className={`rounded px-1 py-px font-mono text-[10px] ${
              pane.effort === "max"
                ? "bg-grid-accent/15 text-purple-400"
                : "bg-grid-bg text-grid-fg-muted"
            }`}
          >
            {pane.effort}
          </span>
        )}
      </div>

      {/* Token usage bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-grid-fg-muted">Tokens</span>
          <span className="font-mono text-[10px] text-grid-fg-secondary">
            {formatTokens(tokens)}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-grid-bg">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${tokenPct}%`,
              backgroundColor: pane.status === "error" ? "#ef4444" : "#8b5cf6",
            }}
          />
        </div>
      </div>

      {/* Cost + Time row */}
      <div className="mt-2 flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] text-grid-fg-muted">Cost </span>
          <span className="font-mono text-[10px] text-grid-fg-secondary">{formatCost(cost)}</span>
        </div>
        <div>
          <span className="font-mono text-[10px] text-grid-fg-muted">Active </span>
          <span className="font-mono text-[10px] text-grid-fg-secondary">
            {elapsed > 0 ? formatDuration(elapsed) : "—"}
          </span>
        </div>
      </div>

      {/* Idle warning */}
      {isIdle && (
        <div className="mt-2 rounded bg-yellow-500/10 px-2 py-1 font-mono text-[10px] text-yellow-500">
          Idle {formatDuration(idleFor)} — may be stuck
        </div>
      )}

      {/* Error badge */}
      {pane.status === "error" && (
        <div className="mt-2 rounded bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-400">
          Error detected — check terminal output
        </div>
      )}

      {/* Done badge */}
      {pane.status === "done" && (
        <div className="mt-2 rounded bg-green-500/10 px-2 py-1 font-mono text-[10px] text-green-400">
          Completed
        </div>
      )}
    </button>
  );
}
