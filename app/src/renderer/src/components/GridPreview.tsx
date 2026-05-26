/**
 * GridPreview — Small visual preview of a grid layout.
 * Shows NxM colored rectangles representing panes.
 */

interface GridPreviewProps {
  rows: number;
  cols: number;
  size?: number; // total width in px
  roles?: string[];
}

const ROLE_COLORS = [
  "#8b5cf6", // purple
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ef4444", // red
  "#a78bfa", // light purple
  "#60a5fa", // light blue
];

export function GridPreview({ rows, cols, size = 64, roles = [] }: GridPreviewProps) {
  const gap = 2;
  const cellW = (size - gap * (cols - 1)) / cols;
  const cellH = (size * 0.7 - gap * (rows - 1)) / rows;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: `repeat(${rows}, ${cellH}px)`,
        gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
        gap,
        width: size,
        flexShrink: 0,
      }}
      title={`${rows}×${cols} grid${roles.length ? ` — ${roles.join(", ")}` : ""}`}
    >
      {Array.from({ length: rows * cols }, (_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 2,
            background: ROLE_COLORS[i % ROLE_COLORS.length],
            opacity: i < (roles.length || rows * cols) ? 0.7 : 0.15,
          }}
        />
      ))}
    </div>
  );
}
