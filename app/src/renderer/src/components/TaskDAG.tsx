import { useMemo } from "react";
import type { PaneConfig } from "../types";
import { STATUS_COLORS } from "../types";

interface TaskNode {
  id: string;
  label: string;
  status: string;
  dependsOn: string[];
}

interface TaskDAGProps {
  panes: PaneConfig[];
  tasks?: Array<{
    id: string;
    name: string;
    status: string;
    deps: string[];
  }>;
}

export function TaskDAG({ panes, tasks }: TaskDAGProps) {
  const nodes: TaskNode[] = useMemo(() => {
    if (tasks && tasks.length > 0) {
      return tasks.map((t) => ({
        id: t.id,
        label: t.name,
        status: t.status,
        dependsOn: t.deps,
      }));
    }
    return panes.map((p) => ({
      id: p.id,
      label: p.label,
      status: p.status,
      dependsOn: [],
    }));
  }, [panes, tasks]);

  const nodeWidth = 120;
  const nodeHeight = 36;
  const gapX = 40;
  const gapY = 20;
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const svgWidth = cols * (nodeWidth + gapX) + gapX;
  const rows = Math.ceil(nodes.length / cols);
  const svgHeight = rows * (nodeHeight + gapY) + gapY;

  // Build position map for edge drawing
  const posMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gapX + col * (nodeWidth + gapX) + nodeWidth / 2;
      const y = gapY + row * (nodeHeight + gapY) + nodeHeight / 2;
      map.set(node.id, { x, y });
    });
    return map;
  }, [nodes, cols, gapX, gapY, nodeWidth, nodeHeight]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-grid-border px-3 py-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-grid-fg-muted">
          Task Graph
        </span>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          {/* Dependency edges */}
          {nodes.map((node) =>
            node.dependsOn.map((depId) => {
              const from = posMap.get(depId);
              const to = posMap.get(node.id);
              if (!from || !to) return null;
              return (
                <g key={`edge-${depId}-${node.id}`}>
                  <defs>
                    <marker
                      id={`arrow-${depId}-${node.id}`}
                      viewBox="0 0 10 10"
                      refX="10"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
                    </marker>
                  </defs>
                  <line
                    x1={from.x}
                    y1={from.y + nodeHeight / 2}
                    x2={to.x}
                    y2={to.y - nodeHeight / 2}
                    stroke="#6b7280"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    markerEnd={`url(#arrow-${depId}-${node.id})`}
                    opacity={0.5}
                  />
                </g>
              );
            }),
          )}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = gapX + col * (nodeWidth + gapX);
            const y = gapY + row * (nodeHeight + gapY);
            const statusColor =
              STATUS_COLORS[node.status as keyof typeof STATUS_COLORS] ?? "#6b7280";

            return (
              <g key={node.id}>
                <rect
                  x={x}
                  y={y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={6}
                  fill="#1c1b19"
                  stroke={statusColor}
                  strokeWidth={1.5}
                />
                <circle cx={x + 12} cy={y + nodeHeight / 2} r={4} fill={statusColor} />
                <text
                  x={x + 22}
                  y={y + nodeHeight / 2 + 4}
                  fill="#a8a5a0"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.label.slice(0, 12)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
