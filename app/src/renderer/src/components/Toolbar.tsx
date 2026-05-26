import { useState, useCallback } from "react";
import type { GridLayout, CliTool } from "../types";
import { MicButton } from "./MicButton";

interface ToolbarProps {
  grid: GridLayout | null;
  onCreateGrid: (rows: number, cols: number, agent: CliTool) => void;
  onAddPane: () => void;
}

const GRID_PRESETS = [
  { label: "1×1", rows: 1, cols: 1 },
  { label: "1×2", rows: 1, cols: 2 },
  { label: "2×2", rows: 2, cols: 2 },
  { label: "2×3", rows: 2, cols: 3 },
  { label: "3×3", rows: 3, cols: 3 },
] as const;

export function Toolbar({ grid, onCreateGrid, onAddPane }: ToolbarProps) {
  const [broadcastText, setBroadcastText] = useState("");
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const handleBroadcast = useCallback(() => {
    if (!broadcastText.trim() || !grid) return;
    // Broadcast to all panes
    for (const pane of grid.panes) {
      window.api?.terminal?.write(pane.id, broadcastText + "\n");
    }
    setBroadcastText("");
  }, [broadcastText, grid]);

  const handleSave = useCallback(async () => {
    await window.api?.session?.save();
  }, []);

  const paneCount = grid?.panes.length ?? 0;
  const workingCount = grid?.panes.filter((p) => p.status === "working").length ?? 0;
  const doneCount = grid?.panes.filter((p) => p.status === "done").length ?? 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 12px",
        height: 36,
        background: "var(--grid-bg-raised, #1c1b19)",
        borderBottom: "1px solid var(--grid-border-subtle, #232220)",
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      {/* Layout selector */}
      <div style={{ position: "relative" }}>
        <ToolbarButton
          label={grid ? `${grid.rows}×${grid.cols}` : "New Grid"}
          onClick={() => setShowLayoutMenu(!showLayoutMenu)}
          active={showLayoutMenu}
        />
        {showLayoutMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 99,
              }}
              onClick={() => setShowLayoutMenu(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--grid-bg-elevated, #242320)",
                border: "1px solid var(--grid-border, #2e2d2a)",
                borderRadius: 6,
                padding: 4,
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                minWidth: 110,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              {GRID_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    onCreateGrid(preset.rows, preset.cols, "claude");
                    setShowLayoutMenu(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "6px 12px",
                    background: "transparent",
                    border: "none",
                    color: "var(--grid-fg, #e8e4de)",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: 4,
                    transition: "background 100ms",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--grid-bg-raised, #1c1b19)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {preset.label} Grid
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Status counts */}
      {grid && (
        <>
          <StatusBadge count={paneCount} label="panes" color="var(--grid-fg-dim, #6b665c)" />
          {workingCount > 0 && (
            <StatusBadge
              count={workingCount}
              label="working"
              color="var(--status-working, #3b82f6)"
            />
          )}
          {doneCount > 0 && (
            <StatusBadge count={doneCount} label="done" color="var(--status-done, #22c55e)" />
          )}

          {/* Progress bar */}
          {paneCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginLeft: 4,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 4,
                  background: "var(--grid-bg, #141312)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.round((doneCount / paneCount) * 100)}%`,
                    height: "100%",
                    background: "var(--status-done, #22c55e)",
                    borderRadius: 2,
                    transition: "width 300ms ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  color:
                    doneCount === paneCount
                      ? "var(--status-done, #22c55e)"
                      : "var(--grid-fg-dim, #6b665c)",
                }}
              >
                {Math.round((doneCount / paneCount) * 100)}%
              </span>
            </div>
          )}

          <ToolbarButton label="+ Pane" onClick={onAddPane} />

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Broadcast input */}
          <div style={{ display: "flex", gap: 4, maxWidth: 400, flex: 1 }}>
            <input
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBroadcast()}
              placeholder="Broadcast to all panes..."
              style={{
                flex: 1,
                padding: "4px 10px",
                background: "var(--grid-bg, #141312)",
                border: "1px solid var(--grid-border-subtle, #232220)",
                borderRadius: 4,
                color: "var(--grid-fg, #e8e4de)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                outline: "none",
                transition: "border-color 150ms",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--grid-accent, #8b5cf6)")}
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--grid-border-subtle, #232220)")
              }
            />
            <button
              onClick={handleBroadcast}
              disabled={!broadcastText.trim()}
              style={{
                padding: "4px 12px",
                background: broadcastText.trim()
                  ? "var(--grid-accent, #8b5cf6)"
                  : "var(--grid-bg-elevated, #242320)",
                border: "none",
                borderRadius: 4,
                color: broadcastText.trim()
                  ? "var(--color-grid-fg, #f5f4f1)"
                  : "var(--grid-fg-dim, #6b665c)",
                cursor: broadcastText.trim() ? "pointer" : "default",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "var(--font-body)",
                transition: "background 150ms, color 150ms",
              }}
            >
              Send
            </button>
            <MicButton
              onTranscript={(text) => setBroadcastText((prev) => (prev ? `${prev} ${text}` : text))}
            />
          </div>

          <ToolbarButton label="Save" onClick={handleSave} />
        </>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  active = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px",
        background: active ? "var(--grid-accent-muted, rgba(139, 92, 246, 0.15))" : "transparent",
        border: "none",
        borderRadius: 4,
        color: active ? "var(--grid-accent, #8b5cf6)" : "var(--grid-fg-muted, #9c9689)",
        fontSize: 11,
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 100ms",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--grid-bg-elevated, #242320)";
          e.currentTarget.style.color = "var(--grid-fg, #e8e4de)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--grid-fg-muted, #9c9689)";
        }
      }}
    >
      {label}
    </button>
  );
}

function StatusBadge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        color,
        padding: "2px 6px",
        background: `${color}15`,
        borderRadius: 3,
      }}
    >
      {count} {label}
    </span>
  );
}
