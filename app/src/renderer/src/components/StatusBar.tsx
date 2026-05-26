import { useState, useEffect, useRef, useCallback } from "react";
import type { GridLayout } from "../types";

interface TerminalStats {
  byteCount: number;
  lastDataAt: number;
  uptime: number;
  latency: { p50: number; p95: number; samples: number } | null;
}

interface StatusBarProps {
  grid: GridLayout;
  focusedPaneId: string | null;
}

export function StatusBar({ grid, focusedPaneId }: StatusBarProps) {
  const focusedPane = focusedPaneId ? grid.panes.find((p) => p.id === focusedPaneId) : null;

  const [connectedPanes, setConnectedPanes] = useState<Set<string>>(new Set());
  const [focusedLatency, setFocusedLatency] = useState<{
    p50: number;
    p95: number;
  } | null>(null);
  const [appVersion, setAppVersion] = useState("v0.1.0");
  const [liveCost, setLiveCost] = useState<{ tokens: number; costUsd: number } | null>(null);
  const [costComparison, setCostComparison] = useState<Record<string, number> | null>(null);
  const [showCostTooltip, setShowCostTooltip] = useState(false);
  const [actionsStatus, setActionsStatus] = useState<{
    conclusion: string;
    name: string;
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll terminal stats every 2s for connection status + latency
  useEffect(() => {
    async function pollStats() {
      try {
        const allStats: Record<string, TerminalStats | null> | undefined =
          await window.api?.terminal?.getAllStats?.();
        if (allStats) {
          const connected = new Set<string>();
          for (const [paneId, stats] of Object.entries(allStats)) {
            if (stats) connected.add(paneId);
          }
          setConnectedPanes(connected);

          if (focusedPaneId && allStats[focusedPaneId]?.latency) {
            const lat = allStats[focusedPaneId]!.latency!;
            setFocusedLatency({ p50: lat.p50, p95: lat.p95 });
          } else {
            setFocusedLatency(null);
          }
        }
      } catch {
        // IPC not available (mock mode)
      }

      // Poll live cost data
      try {
        const total = await window.api?.cost?.getTotal();
        if (total) setLiveCost(total);
        const comp = await window.api?.cost?.getComparison();
        if (comp) setCostComparison(comp);
      } catch {
        // IPC not available
      }
    }

    pollStats();
    pollRef.current = setInterval(pollStats, 2000);

    // Pause polling when window is backgrounded (H20 fix)
    const handleVisibility = () => {
      if (document.hidden) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else {
        pollStats();
        pollRef.current = setInterval(pollStats, 2000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [focusedPaneId]);

  // Fetch app version once
  useEffect(() => {
    window.api?.app
      ?.getInfo()
      .then((info) => {
        if (info?.version) setAppVersion(`v${info.version}`);
      })
      .catch(() => {
        /* fallback to default */
      });
  }, []);

  // Feature 146: Poll GitHub Actions status every 60s
  useEffect(() => {
    let cancelled = false;
    const cwd = focusedPane?.cwd;
    if (!cwd) return;
    const fetch = async () => {
      try {
        const run = await window.api?.github?.actionsStatus(cwd);
        if (run && !cancelled) {
          setActionsStatus({ conclusion: run.conclusion || run.status, name: run.name });
        }
      } catch {
        // gh not available
      }
    };
    fetch();
    const id = setInterval(fetch, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [focusedPane?.cwd]);

  const hasPty = !!window.api?.terminal?.write;
  const total = grid.panes.length;
  const activeCount = connectedPanes.size;
  const doneCount = grid.panes.filter((p) => p.status === "done").length;
  const workingCount = grid.panes.filter((p) => p.status === "working").length;
  const errorCount = grid.panes.filter((p) => p.status === "error").length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const totalTokens = grid.panes.reduce((sum, p) => sum + (p.metrics?.estimatedTokens ?? 0), 0);
  const totalCost = grid.panes.reduce((sum, p) => sum + (p.metrics?.estimatedCostUsd ?? 0), 0);

  return (
    <div className="flex h-6 shrink-0 items-center justify-between border-t border-grid-border/60 bg-grid-surface/80 px-3 font-mono text-[10px] text-grid-fg-muted">
      {/* Left: grid dimensions + connection status */}
      <div className="flex items-center gap-2.5">
        {/* Grid NxM */}
        <span className="text-grid-fg-secondary">
          {grid.rows}x{grid.cols}
        </span>

        <span className="text-grid-fg-dim">|</span>

        {/* PTY connection: active/total */}
        <span
          className="flex items-center gap-1"
          title={hasPty ? `${activeCount} PTY connected / ${total} total` : "Mock mode — no PTY"}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              !hasPty
                ? "animate-pulse-dot bg-amber-500"
                : activeCount === total
                  ? "bg-green-500"
                  : activeCount > 0
                    ? "bg-yellow-500"
                    : "bg-red-500"
            }`}
          />
          <span className="tabular-nums">{hasPty ? `${activeCount}/${total}` : "mock"}</span>
        </span>

        <span className="text-grid-fg-dim">|</span>

        {/* Status counts */}
        <span aria-live="polite" className="flex items-center gap-2.5">
          {workingCount > 0 && <span className="text-status-working">{workingCount} active</span>}
          {errorCount > 0 && <span className="text-status-error">{errorCount} err</span>}
          {doneCount > 0 && <span className="text-status-done">{doneCount} done</span>}
        </span>
      </div>

      {/* Center: progress bar */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-16 overflow-hidden rounded-full bg-grid-border/60">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: progress === 100 ? "var(--status-done)" : "var(--grid-accent)",
            }}
          />
        </div>
        <span className="tabular-nums">
          {doneCount}/{total}
        </span>
      </div>

      {/* Right: focused pane info + latency + version */}
      <div className="flex items-center gap-2.5">
        {/* Focused pane model + effort */}
        {focusedPane && (
          <>
            <span className="text-grid-fg-secondary" title="Focused pane">
              {focusedPane.label}
            </span>
            {focusedPane.model && (
              <span
                className="rounded bg-grid-bg/60 px-1 py-0.5 text-grid-accent"
                title={`Model: ${focusedPane.model}`}
              >
                {focusedPane.model.replace("claude-", "").replace("-20251001", "")}
              </span>
            )}
            {focusedPane.effort && (
              <span
                className="rounded bg-grid-bg/60 px-1 py-0.5 text-status-working"
                title={`Effort: ${focusedPane.effort}`}
              >
                {focusedPane.effort}
              </span>
            )}
          </>
        )}

        {/* Terminal latency (from PERF-DEV instrumentation) */}
        {focusedLatency && (
          <span
            className={`tabular-nums ${
              focusedLatency.p50 > 50
                ? "text-status-error"
                : focusedLatency.p50 > 20
                  ? "text-yellow-500"
                  : "text-green-500"
            }`}
            title={`P50: ${focusedLatency.p50}ms | P95: ${focusedLatency.p95}ms`}
          >
            {focusedLatency.p50}ms
          </span>
        )}

        {/* Token + cost metrics (live from IPC or fallback to grid metrics) */}
        {(liveCost ? liveCost.tokens : totalTokens) > 0 && (
          <span className="tabular-nums">
            {(() => {
              const t = liveCost ? liveCost.tokens : totalTokens;
              return t > 1000 ? `${(t / 1000).toFixed(1)}K` : t;
            })()}{" "}
            tok
          </span>
        )}
        {(liveCost ? liveCost.costUsd : totalCost) > 0 && (
          <span
            className="tabular-nums cursor-help"
            style={{ position: "relative" }}
            onMouseEnter={() => setShowCostTooltip(true)}
            onMouseLeave={() => setShowCostTooltip(false)}
          >
            ${(liveCost ? liveCost.costUsd : totalCost).toFixed(3)}
            {/* Cost comparison tooltip */}
            {showCostTooltip && costComparison && (
              <span
                style={{
                  position: "absolute",
                  bottom: "100%",
                  right: 0,
                  marginBottom: 4,
                  background: "#242320",
                  border: "1px solid var(--grid-border, #2e2d2a)",
                  borderRadius: 4,
                  padding: "6px 10px",
                  whiteSpace: "nowrap",
                  zIndex: 100,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  fontSize: 9,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: "var(--grid-fg-muted)", display: "block" }}>
                  Same work on:
                </span>
                {costComparison.haiku !== undefined && (
                  <span style={{ color: "#22c55e", display: "block" }}>
                    Haiku: ${costComparison.haiku.toFixed(4)}
                  </span>
                )}
                {costComparison.sonnet !== undefined && (
                  <span style={{ color: "#3b82f6", display: "block" }}>
                    Sonnet: ${costComparison.sonnet.toFixed(4)}
                  </span>
                )}
                {costComparison.opus !== undefined && (
                  <span style={{ color: "#8b5cf6", display: "block" }}>
                    Opus: ${costComparison.opus.toFixed(4)}
                  </span>
                )}
              </span>
            )}
          </span>
        )}

        {/* GitHub Actions status (Feature 146) */}
        {actionsStatus && (
          <span
            className={`rounded px-1 py-0.5 ${
              actionsStatus.conclusion === "success"
                ? "bg-green-500/15 text-green-400"
                : actionsStatus.conclusion === "failure"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-amber-500/15 text-amber-400"
            }`}
            title={`CI: ${actionsStatus.name} — ${actionsStatus.conclusion}`}
          >
            CI:
            {actionsStatus.conclusion === "success"
              ? "pass"
              : actionsStatus.conclusion === "failure"
                ? "fail"
                : "run"}
          </span>
        )}

        {/* App version */}
        <span className="text-grid-accent">AgentGrid {appVersion}</span>
      </div>
    </div>
  );
}
