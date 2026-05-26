/**
 * PresetPreview — Miniature grid layout + role names for preset cards (Feature #20)
 */

interface PresetPreviewProps {
  panes: Array<{ name: string; role?: string }>;
  cols?: number;
}

export function PresetPreview({ panes, cols: overrideCols }: PresetPreviewProps) {
  const count = panes.length;
  const cols = overrideCols ?? (count <= 2 ? count : count <= 4 ? 2 : 3);
  const rows = Math.ceil(count / cols);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 2,
        width: "100%",
        aspectRatio: `${cols} / ${rows}`,
        maxHeight: 80,
      }}
    >
      {panes.map((pane, i) => (
        <div
          key={i}
          style={{
            background: "var(--grid-bg-elevated)",
            border: "1px solid var(--grid-border-subtle)",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px 3px",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontFamily: "var(--font-mono)",
              color: "var(--grid-fg-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {pane.name}
          </span>
        </div>
      ))}
    </div>
  );
}
