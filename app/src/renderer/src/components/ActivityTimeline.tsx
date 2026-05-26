/**
 * ActivityTimeline — Per-agent activity timeline showing status changes over time.
 * Shows a horizontal timeline per pane with colored segments for each status.
 */

import { useMemo } from "react";
import type { GridLayout } from "../types";
import { STATUS_COLORS } from "../types";

interface ActivityTimelineProps {
  grid: GridLayout;
  activities: Array<{
    paneId: string;
    event: string;
    timestamp: number;
    detail?: string;
  }>;
}

export function ActivityTimeline({ grid, activities }: ActivityTimelineProps) {
  const timeRange = useMemo(() => {
    if (activities.length === 0) return { start: Date.now(), end: Date.now() };
    const timestamps = activities.map((a) => a.timestamp);
    return {
      start: Math.min(...timestamps),
      end: Math.max(...timestamps, Date.now()),
    };
  }, [activities]);

  const duration = Math.max(timeRange.end - timeRange.start, 1000); // min 1s

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const eventColor = (event: string): string => {
    const map: Record<string, string> = {
      spawned: STATUS_COLORS.idle,
      working: STATUS_COLORS.working,
      idle: STATUS_COLORS.idle,
      done: STATUS_COLORS.done,
      error: STATUS_COLORS.error,
      restarted: "#eab308",
      signal: "#a78bfa",
    };
    return map[event] ?? "#6b7280";
  };

  if (grid.panes.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          color: "var(--grid-fg-dim)",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        No agents active
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0", overflow: "auto" }}>
      {/* Time axis */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 8px 4px",
          fontSize: 9,
          fontFamily: "var(--font-mono)",
          color: "var(--grid-fg-dim, #6b665c)",
        }}
      >
        <span>{formatTime(timeRange.start)}</span>
        <span>{formatTime(timeRange.end)}</span>
      </div>

      {/* Per-pane timelines */}
      {grid.panes.map((pane) => {
        const paneActivities = activities
          .filter((a) => a.paneId === pane.id)
          .sort((a, b) => a.timestamp - b.timestamp);

        return (
          <div
            key={pane.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 8px",
              fontSize: 10,
            }}
          >
            {/* Label */}
            <span
              style={{
                width: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-mono)",
                color: "var(--grid-fg-muted, #9c9689)",
                flexShrink: 0,
              }}
              title={pane.label}
            >
              {pane.label}
            </span>

            {/* Timeline bar */}
            <div
              style={{
                flex: 1,
                height: 8,
                background: "var(--grid-bg, #141312)",
                borderRadius: 4,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {paneActivities.map((activity, i) => {
                const nextTs =
                  i < paneActivities.length - 1 ? paneActivities[i + 1].timestamp : timeRange.end;
                const left = ((activity.timestamp - timeRange.start) / duration) * 100;
                const width = ((nextTs - activity.timestamp) / duration) * 100;

                return (
                  <div
                    key={i}
                    title={`${activity.event}${activity.detail ? `: ${activity.detail}` : ""}`}
                    style={{
                      position: "absolute",
                      left: `${left}%`,
                      width: `${Math.max(width, 0.5)}%`,
                      height: "100%",
                      background: eventColor(activity.event),
                      opacity: 0.7,
                      transition: "opacity 150ms",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.7";
                    }}
                  />
                );
              })}

              {/* Current status dot */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: STATUS_COLORS[pane.status] ?? "#6b7280",
                  border: "1px solid var(--grid-bg-raised, #1c1b19)",
                }}
              />
            </div>

            {/* Current status */}
            <span
              style={{
                width: 50,
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                color: STATUS_COLORS[pane.status] ?? "#6b7280",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              {pane.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
