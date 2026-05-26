import { useMemo } from "react";
import type { GridLayout, PaneStatus } from "../types";

interface AgentTimelineProps {
  grid: GridLayout;
  durationMinutes?: number;
}

const STATUS_COLORS: Record<PaneStatus, string> = {
  idle: "#3a3834",
  working: "#3b82f6",
  waiting: "#eab308",
  done: "#22c55e",
  error: "#ef4444",
};

/**
 * Thin horizontal timeline at the bottom of graph view.
 * Each pane gets a row. Color blocks = simulated activity.
 */
export function AgentTimeline({ grid, durationMinutes = 30 }: AgentTimelineProps) {
  const buckets = durationMinutes; // 1 bucket per minute

  // Generate simulated timeline data per pane
  const timelineData = useMemo(() => {
    return grid.panes.map((pane) => {
      const data: PaneStatus[] = [];
      const now = Date.now();
      const startedAt = pane.metrics?.startedAt || now - durationMinutes * 60 * 1000;
      const elapsed = Math.min(durationMinutes, Math.floor((now - startedAt) / 60000));

      for (let i = 0; i < buckets; i++) {
        if (i >= buckets - elapsed) {
          // Active period — simulate based on current status
          if (pane.status === "done" && i < buckets - 2) {
            data.push("working");
          } else if (pane.status === "error" && i === buckets - 1) {
            data.push("error");
          } else {
            data.push(pane.status);
          }
        } else {
          data.push("idle");
        }
      }
      return { paneId: pane.id, label: pane.label, data };
    });
  }, [grid, buckets, durationMinutes]);

  return (
    <div className="agent-timeline border-t border-grid-border bg-[#141312] px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: "var(--grid-fg-dim, #6b665c)", fontFamily: "var(--font-mono)" }}
        >
          Activity Timeline
        </span>
        <span
          className="text-[10px]"
          style={{ color: "var(--grid-fg-dim, #6b665c)", fontFamily: "var(--font-mono)" }}
        >
          {durationMinutes}m
        </span>
      </div>
      <div className="flex flex-col gap-[2px]">
        {timelineData.map((row) => (
          <div key={row.paneId} className="flex items-center gap-2">
            <span
              className="w-16 truncate text-right text-[10px]"
              style={{ color: "var(--grid-fg-muted, #9c9689)", fontFamily: "var(--font-mono)" }}
            >
              {row.label}
            </span>
            <div className="flex flex-1 gap-[1px]">
              {row.data.map((status, i) => (
                <div
                  key={i}
                  className="h-[6px] flex-1 rounded-[1px]"
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                  title={`${row.label} — ${status} (${i}m)`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
