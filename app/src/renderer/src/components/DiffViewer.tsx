/**
 * DiffViewer — Shows git diff output with syntax highlighting.
 * Displays what files changed during an agent session.
 */

import { useState } from "react";

interface DiffLine {
  type: "add" | "remove" | "context" | "header" | "hunk";
  content: string;
}

interface DiffViewerProps {
  diff: string;
  title?: string;
}

export function DiffViewer({ diff, title }: DiffViewerProps) {
  const lines = parseDiff(diff);
  const [collapsed, setCollapsed] = useState(false);

  const addCount = lines.filter((l) => l.type === "add").length;
  const removeCount = lines.filter((l) => l.type === "remove").length;

  return (
    <div
      style={{
        background: "var(--grid-bg, #141312)",
        border: "1px solid var(--grid-border, #2e2d2a)",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          background: "var(--grid-bg-raised, #1c1b19)",
          borderBottom: collapsed ? "none" : "1px solid var(--grid-border, #2e2d2a)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--grid-fg, #e8e4de)",
            fontWeight: 500,
          }}
        >
          {title ?? "Changes"}
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--status-done, #22c55e)",
          }}
        >
          +{addCount}
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--status-error, #ef4444)",
          }}
        >
          -{removeCount}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "var(--grid-fg-dim)",
          }}
        >
          {collapsed ? "▸" : "▾"}
        </span>
      </div>

      {/* Diff content */}
      {!collapsed && (
        <div
          style={{
            maxHeight: 400,
            overflowY: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                padding: "0 10px",
                background: lineBackground(line.type),
                color: lineColor(line.type),
                whiteSpace: "pre",
              }}
            >
              {line.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function parseDiff(diff: string): DiffLine[] {
  return diff.split("\n").map((line) => {
    if (line.startsWith("+++") || line.startsWith("---")) {
      return { type: "header", content: line };
    }
    if (line.startsWith("@@")) {
      return { type: "hunk", content: line };
    }
    if (line.startsWith("+")) {
      return { type: "add", content: line };
    }
    if (line.startsWith("-")) {
      return { type: "remove", content: line };
    }
    return { type: "context", content: line };
  });
}

function lineBackground(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return "rgba(34, 197, 94, 0.08)";
    case "remove":
      return "rgba(239, 68, 68, 0.08)";
    case "hunk":
      return "rgba(139, 92, 246, 0.06)";
    default:
      return "transparent";
  }
}

function lineColor(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return "var(--status-done, #22c55e)";
    case "remove":
      return "var(--status-error, #ef4444)";
    case "header":
      return "var(--grid-fg-muted, #9c9689)";
    case "hunk":
      return "var(--grid-accent, #8b5cf6)";
    default:
      return "var(--grid-fg-dim, #6b665c)";
  }
}
