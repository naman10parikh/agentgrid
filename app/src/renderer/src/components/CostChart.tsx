/**
 * CostChart — Recharts-powered cost & token visualization.
 * Features 114-121: token estimation, per-pane cost, timeline, budget alerts,
 * cost comparison, CSV export, preset cost history.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { GridLayout } from "../types";
import { STATUS_COLORS } from "../types";

// ─── Types ───

interface CostTimelinePoint {
  timestamp: number;
  tokens: number;
  costUsd: number;
}

interface PaneCostInfo {
  tokens: number;
  costUsd: number;
  model: string;
  wordCount: number;
}

interface CostChartProps {
  grid: GridLayout;
  budgetUsd?: number;
  onBudgetExceeded?: (totalCost: number) => void;
}

// ─── Helpers ───

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const PANE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
];

// ─── Component ───

export function CostChart({ grid, budgetUsd = 5, onBudgetExceeded }: CostChartProps) {
  const [totalCost, setTotalCost] = useState<{ tokens: number; costUsd: number }>({
    tokens: 0,
    costUsd: 0,
  });
  const [paneCosts, setPaneCosts] = useState<Map<string, PaneCostInfo>>(new Map());
  const [timelines, setTimelines] = useState<Map<string, CostTimelinePoint[]>>(new Map());
  const [comparison, setComparison] = useState<Record<string, number>>({});
  const [budgetWarned, setBudgetWarned] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll cost data every 3s
  useEffect(() => {
    async function poll() {
      try {
        // Total cost
        const total = await window.api?.cost?.getTotal();
        if (total) {
          setTotalCost(total);
          // Budget alert
          if (total.costUsd >= budgetUsd && !budgetWarned) {
            setBudgetWarned(true);
            onBudgetExceeded?.(total.costUsd);
          }
        }

        // Per-pane costs
        const costs = new Map<string, PaneCostInfo>();
        for (const pane of grid.panes) {
          const info = await window.api?.cost?.getPane(pane.id);
          if (info) costs.set(pane.id, info);
        }
        setPaneCosts(costs);

        // Timelines
        const tl = new Map<string, CostTimelinePoint[]>();
        for (const pane of grid.panes) {
          const data = await window.api?.cost?.getTimeline(pane.id);
          if (data && data.length > 0) tl.set(pane.id, data);
        }
        setTimelines(tl);

        // Model comparison
        const comp = await window.api?.cost?.getComparison();
        if (comp) setComparison(comp);
      } catch {
        // IPC not available (mock mode) — use grid metrics fallback
        const fallbackTotal = {
          tokens: grid.panes.reduce((s, p) => s + (p.metrics?.estimatedTokens ?? 0), 0),
          costUsd: grid.panes.reduce((s, p) => s + (p.metrics?.estimatedCostUsd ?? 0), 0),
        };
        setTotalCost(fallbackTotal);
      }
    }

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [grid.panes, budgetUsd, budgetWarned, onBudgetExceeded]);

  // Export CSV
  const handleExportCsv = useCallback(async () => {
    try {
      const csv = await window.api?.cost?.exportCsv();
      if (!csv) return;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agentgrid-cost-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: build CSV from local state
      const rows = ["pane_id,label,tokens,cost_usd"];
      for (const pane of grid.panes) {
        const info = paneCosts.get(pane.id);
        if (info) {
          rows.push(`${pane.id},"${pane.label}",${info.tokens},${info.costUsd.toFixed(6)}`);
        }
      }
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agentgrid-cost-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [grid.panes, paneCosts]);

  // Build merged timeline for chart
  const chartData = buildChartData(timelines, grid);

  const panesSorted = [...grid.panes]
    .map((p) => ({
      ...p,
      cost: paneCosts.get(p.id)?.costUsd ?? p.metrics?.estimatedCostUsd ?? 0,
      tokens: paneCosts.get(p.id)?.tokens ?? p.metrics?.estimatedTokens ?? 0,
    }))
    .filter((p) => p.tokens > 0)
    .sort((a, b) => b.cost - a.cost);

  const maxTokens = Math.max(1, ...panesSorted.map((p) => p.tokens));

  return (
    <div style={{ padding: "8px 0" }}>
      {/* ─── Summary header ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 12px 8px",
          borderBottom: "1px solid var(--grid-border-subtle, #232220)",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--grid-fg-muted)",
            }}
          >
            {formatTokens(totalCost.tokens)} tokens
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color:
                totalCost.costUsd >= budgetUsd
                  ? "#ef4444"
                  : totalCost.costUsd > budgetUsd * 0.8
                    ? "#eab308"
                    : "var(--grid-fg-secondary)",
            }}
          >
            ${totalCost.costUsd.toFixed(4)}
          </span>
          {totalCost.costUsd >= budgetUsd && (
            <span
              style={{
                fontSize: 9,
                padding: "1px 5px",
                borderRadius: 3,
                background: "#ef444420",
                color: "#ef4444",
                fontFamily: "var(--font-mono)",
              }}
            >
              OVER BUDGET
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setShowChart((v) => !v)}
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--grid-fg-dim)",
              background: "none",
              border: "1px solid var(--grid-border-subtle, #232220)",
              borderRadius: 3,
              padding: "4px 8px",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            {showChart ? "bars" : "chart"}
          </button>
          <button
            onClick={handleExportCsv}
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--grid-fg-dim)",
              background: "none",
              border: "1px solid var(--grid-border-subtle, #232220)",
              borderRadius: 3,
              padding: "4px 8px",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            title="Export cost report as CSV"
          >
            CSV ↓
          </button>
        </div>
      </div>

      {/* ─── Cost comparison tooltip ─── */}
      {Object.keys(comparison).length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "4px 12px 8px",
            fontSize: 9,
            fontFamily: "var(--font-mono)",
            color: "var(--grid-fg-dim)",
            flexWrap: "wrap",
          }}
        >
          {comparison.haiku !== undefined && (
            <span title="If this session used Haiku instead">
              Haiku: ${comparison.haiku.toFixed(4)}
            </span>
          )}
          {comparison.sonnet !== undefined && (
            <span title="If this session used Sonnet instead">
              Sonnet: ${comparison.sonnet.toFixed(4)}
            </span>
          )}
          {comparison.opus !== undefined && (
            <span title="If this session used Opus instead">
              Opus: ${comparison.opus.toFixed(4)}
            </span>
          )}
        </div>
      )}

      {/* ─── Timeline chart ─── */}
      {showChart && chartData.length > 1 && (
        <div style={{ padding: "0 4px", marginBottom: 8 }}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-border-subtle, #232220)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 8, fill: "var(--grid-fg-dim)" }}
                stroke="var(--grid-border-subtle, #232220)"
              />
              <YAxis
                tick={{ fontSize: 8, fill: "var(--grid-fg-dim)" }}
                stroke="var(--grid-border-subtle, #232220)"
                tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                width={50}
              />
              <RechartsTooltip
                contentStyle={{
                  background: "#242320",
                  border: "1px solid var(--grid-border, #2e2d2a)",
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                }}
                labelStyle={{ color: "var(--grid-fg-muted)" }}
                formatter={(value: unknown) => [`$${Number(value ?? 0).toFixed(5)}`, "Cost"]}
              />
              <Line
                type="monotone"
                dataKey="totalCost"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                name="Total"
              />
              {/* Budget line */}
              <Line
                type="monotone"
                dataKey="budget"
                stroke="#ef444466"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                name="Budget"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── Per-agent bars ─── */}
      {panesSorted.length === 0 ? (
        <div
          style={{
            padding: 16,
            textAlign: "center",
            color: "var(--grid-fg-dim)",
            fontSize: 12,
          }}
        >
          No token usage data yet
        </div>
      ) : (
        panesSorted.map((pane, i) => {
          const pct = maxTokens > 0 ? (pane.tokens / maxTokens) * 100 : 0;
          const paneInfo = paneCosts.get(pane.id);

          return (
            <div
              key={pane.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "3px 12px",
                fontSize: 10,
              }}
            >
              {/* Label */}
              <span
                style={{
                  width: 70,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono)",
                  color: "var(--grid-fg-muted)",
                  flexShrink: 0,
                }}
              >
                {pane.label}
              </span>

              {/* Bar */}
              <div
                style={{
                  flex: 1,
                  height: 10,
                  background: "var(--grid-bg, #141312)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background:
                      PANE_COLORS[i % PANE_COLORS.length] ??
                      STATUS_COLORS[pane.status] ??
                      "#6b7280",
                    borderRadius: 3,
                    transition: "width 300ms ease",
                    minWidth: pct > 0 ? 2 : 0,
                  }}
                />
              </div>

              {/* Tokens */}
              <span
                style={{
                  width: 55,
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  color: "var(--grid-fg-dim)",
                  flexShrink: 0,
                }}
              >
                {formatTokens(pane.tokens)}
              </span>

              {/* Cost */}
              <span
                style={{
                  width: 52,
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: pane.cost > 0.5 ? "#eab308" : "var(--grid-fg-dim)",
                  flexShrink: 0,
                }}
              >
                ${pane.cost.toFixed(3)}
              </span>

              {/* Model badge */}
              {paneInfo?.model && (
                <span
                  style={{
                    fontSize: 8,
                    fontFamily: "var(--font-mono)",
                    color: "var(--grid-fg-dim)",
                    opacity: 0.6,
                    flexShrink: 0,
                    width: 36,
                    textAlign: "right",
                  }}
                >
                  {paneInfo.model.includes("opus")
                    ? "opus"
                    : paneInfo.model.includes("sonnet")
                      ? "snnt"
                      : paneInfo.model.includes("haiku")
                        ? "hku"
                        : "?"}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/** Merge per-pane timelines into a single chart dataset */
function buildChartData(
  timelines: Map<string, CostTimelinePoint[]>,
  grid: GridLayout,
): Array<{ time: string; totalCost: number; budget: number }> {
  // Collect all timestamps
  const allPoints: Array<{ timestamp: number; costUsd: number }> = [];
  for (const points of timelines.values()) {
    for (const p of points) {
      allPoints.push(p);
    }
  }

  if (allPoints.length === 0) {
    // Fallback to grid metrics (single point)
    const total = grid.panes.reduce((s, p) => s + (p.metrics?.estimatedCostUsd ?? 0), 0);
    if (total > 0) {
      return [{ time: "now", totalCost: total, budget: 5 }];
    }
    return [];
  }

  // Sort by time and bucket into 10s intervals
  allPoints.sort((a, b) => a.timestamp - b.timestamp);
  const bucketMs = 10_000;
  const buckets = new Map<number, number>();
  for (const p of allPoints) {
    const bucket = Math.floor(p.timestamp / bucketMs) * bucketMs;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + p.costUsd);
  }

  // Build cumulative chart data
  const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
  const data: Array<{ time: string; totalCost: number; budget: number }> = [];

  // For a cumulative view, sum costs at each timestamp across all panes
  // Actually, timeline points already represent cumulative cost per pane
  // So at each time bucket, total = sum of latest value per pane
  const latestPerPane = new Map<string, number>();
  for (const [paneId, points] of timelines) {
    for (const p of points) {
      const bucket = Math.floor(p.timestamp / bucketMs) * bucketMs;
      latestPerPane.set(`${paneId}-${bucket}`, p.costUsd);
    }
  }

  // Simpler approach: just track running total from timeline merging
  for (const [ts] of sorted) {
    let totalAtTime = 0;
    for (const points of timelines.values()) {
      // Find latest point at or before this timestamp
      let latest = 0;
      for (const p of points) {
        if (p.timestamp <= ts + bucketMs) latest = p.costUsd;
      }
      totalAtTime += latest;
    }
    data.push({
      time: formatTime(ts),
      totalCost: totalAtTime,
      budget: 5,
    });
  }

  // Keep last 60 points for readability
  return data.slice(-60);
}
