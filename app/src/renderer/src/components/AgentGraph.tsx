import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as d3 from "d3";
import type { GridLayout, PaneConfig, PaneMetrics, PaneStatus } from "../types";
import { STATUS_COLORS } from "../types";

// ─── Types ───

export type Topology = "force" | "hierarchical" | "ring" | "star";

interface GraphMessage {
  from: string;
  to: string;
  count: number;
}

interface AgentGraphProps {
  /** Pass panes directly or via grid — grid.panes is used if panes is omitted */
  panes?: PaneConfig[];
  grid?: GridLayout;
  messages?: GraphMessage[];
  stats?: Map<string, PaneMetrics>;
  width?: number;
  height?: number;
  topology?: Topology;
  onNodeClick?: (paneId: string) => void;
  interactive?: boolean;
  showParticles?: boolean;
  showLabels?: boolean;
  className?: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  status: PaneStatus;
  radius: number;
  color: string;
  model?: string;
  effort?: string;
  tokens: number;
  latency: number;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  count: number;
  width: number;
  active: boolean;
}

// ─── Constants ───

const BG_COLOR = "#141312";
const GRID_LINE_COLOR = "#1a1918";
const EDGE_COLOR = "#8B5CF6";
const LABEL_COLOR = "#d4d4d8"; // zinc-200
const MIN_RADIUS = 16;
const MAX_RADIUS = 32;
const MIN_EDGE_WIDTH = 1;
const MAX_EDGE_WIDTH = 4;

// ─── Helpers ───

function computeNodeRadius(metrics: PaneMetrics | undefined, isHub: boolean): number {
  const base = isHub ? MIN_RADIUS + 6 : MIN_RADIUS;
  if (!metrics || metrics.bytesReceived === 0) return base;
  const logBytes = Math.log10(Math.max(1, metrics.bytesReceived));
  const t = Math.min(1, logBytes / 6);
  return base + t * (MAX_RADIUS - base);
}

function computeEdgeWidth(count: number, maxCount: number): number {
  if (maxCount <= 0) return MIN_EDGE_WIDTH;
  const t = count / maxCount;
  return MIN_EDGE_WIDTH + t * (MAX_EDGE_WIDTH - MIN_EDGE_WIDTH);
}

function formatLatency(ms: number): string {
  if (ms <= 0) return "now";
  if (ms < 1000) return `${ms}ms ago`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s ago`;
  return `${Math.round(ms / 60000)}m ago`;
}

// ─── Component ───

export function AgentGraph({
  panes: panesProp,
  grid,
  messages = [],
  stats: statsProp,
  width = 600,
  height = 400,
  topology = "force",
  onNodeClick,
  interactive = true,
  showParticles = true,
  showLabels = true,
  className = "",
}: AgentGraphProps) {
  // Resolve panes from either prop or grid
  const panes = panesProp ?? grid?.panes ?? [];
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const showParticlesRef = useRef(showParticles);
  const showLabelsRef = useRef(showLabels);
  const onNodeClickRef = useRef(onNodeClick);
  showParticlesRef.current = showParticles;
  showLabelsRef.current = showLabels;
  onNodeClickRef.current = onNodeClick;
  const emptyStats = useRef(new Map<string, PaneMetrics>());
  const stats = statsProp ?? emptyStats.current;
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    node: GraphNode;
  } | null>(null);

  // Build graph data
  const { nodes, edges } = useMemo(() => {
    const maxCount = Math.max(1, ...messages.map((m) => m.count));
    const paneIds = new Set(panes.map((p) => p.id));

    const graphNodes: GraphNode[] = panes.map((pane, i) => {
      const metrics = stats.get(pane.id);
      return {
        id: pane.id,
        label: pane.label,
        status: pane.status,
        radius: computeNodeRadius(metrics, i === 0),
        color: STATUS_COLORS[pane.status] || STATUS_COLORS.idle,
        model: pane.model,
        effort: pane.effort,
        tokens: metrics?.estimatedTokens ?? 0,
        latency: metrics ? Date.now() - metrics.lastActivityAt : 0,
      };
    });

    // Build edges from messages if provided, else from grid adjacency
    let graphEdges: GraphEdge[];

    if (messages.length > 0) {
      graphEdges = messages
        .filter((m) => paneIds.has(m.from) && paneIds.has(m.to))
        .map((m, i) => ({
          id: `msg-${i}`,
          source: m.from,
          target: m.to,
          count: m.count,
          width: computeEdgeWidth(m.count, maxCount),
          active: m.count > 0,
        }));
    } else {
      // Default: hub-and-spoke from first pane + ring between others
      graphEdges = [];
      const ids = panes.map((p) => p.id);
      if (ids.length > 1) {
        for (let i = 1; i < ids.length; i++) {
          graphEdges.push({
            id: `hub-${i}`,
            source: ids[0],
            target: ids[i],
            count: 1,
            width: 1.5,
            active: panes[i].status === "working",
          });
        }
        for (let i = 1; i < ids.length; i++) {
          const next = i + 1 < ids.length ? i + 1 : 1;
          graphEdges.push({
            id: `ring-${i}`,
            source: ids[i],
            target: ids[next],
            count: 1,
            width: 1,
            active: panes[i].status === "working" || panes[next]?.status === "working",
          });
        }
      }
    }

    return { nodes: graphNodes, edges: graphEdges };
  }, [panes, messages, stats]);

  // D3 force simulation + SVG rendering
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // ─── Defs ───
    const defs = svg.append("defs");

    // Arrow marker
    defs
      .append("marker")
      .attr("id", "ag-arrow")
      .attr("viewBox", "0 -4 8 8")
      .attr("refX", 14)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-3L8,0L0,3")
      .attr("fill", EDGE_COLOR)
      .attr("opacity", 0.6);

    // Glow filters per status
    const statuses: PaneStatus[] = ["working", "idle", "done", "error", "waiting"];
    for (const status of statuses) {
      const f = defs
        .append("filter")
        .attr("id", `ag-glow-${status}`)
        .attr("x", "-60%")
        .attr("y", "-60%")
        .attr("width", "220%")
        .attr("height", "220%");
      f.append("feGaussianBlur")
        .attr("stdDeviation", status === "working" ? 7 : 4)
        .attr("result", "blur");
      f.append("feFlood")
        .attr("flood-color", STATUS_COLORS[status])
        .attr("flood-opacity", status === "working" ? 0.5 : 0.2)
        .attr("result", "color");
      f.append("feComposite")
        .attr("in", "color")
        .attr("in2", "blur")
        .attr("operator", "in")
        .attr("result", "glow");
      const merge = f.append("feMerge");
      merge.append("feMergeNode").attr("in", "glow");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    }

    // Grid pattern
    defs
      .append("pattern")
      .attr("id", "ag-grid-pattern")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", GRID_LINE_COLOR)
      .attr("stroke-width", 0.5);

    // ─── Background ───
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", BG_COLOR)
      .attr("rx", 8);
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#ag-grid-pattern)")
      .attr("rx", 8);

    // ─── Edge group ───
    const edgeGroup = svg.append("g").attr("class", "ag-edges");
    const edgePaths = edgeGroup
      .selectAll<SVGPathElement, GraphEdge>("path")
      .data(edges, (d) => d.id)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", (d) => (d.active ? `${EDGE_COLOR}66` : `${EDGE_COLOR}1F`))
      .attr("stroke-width", (d) => d.width)
      .attr("marker-end", "url(#ag-arrow)")
      .attr("stroke-dasharray", (d) => (d.active ? "6 3" : "none"));

    // Animated particles along active edges
    if (showParticles) {
      const particleGroup = svg.append("g").attr("class", "ag-particles");
      edges
        .filter((e) => e.active)
        .forEach((edge) => {
          for (let pi = 0; pi < 3; pi++) {
            const particle = particleGroup
              .append("circle")
              .attr("r", 2)
              .attr("fill", EDGE_COLOR)
              .attr("opacity", 0.7);

            // We'll update position in tick
            particle
              .attr("data-edge-id", edge.id)
              .attr("data-particle-idx", pi)
              .attr("data-phase", pi * 0.33);
          }
        });
    }

    // ─── Node group ───
    const nodeGroup = svg.append("g").attr("class", "ag-nodes");
    const nodeGs = nodeGroup
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes, (d) => d.id)
      .join("g")
      .attr("cursor", interactive ? "pointer" : "default")
      .on("click", (_event, d) => onNodeClickRef.current?.(d.id))
      .on("mouseenter", (event: MouseEvent, d) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top - 10,
            node: d,
          });
        }
      })
      .on("mousemove", (event: MouseEvent, d) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top - 10,
            node: d,
          });
        }
      })
      .on("mouseleave", () => setTooltip(null));

    // Glow halo
    nodeGs
      .append("circle")
      .attr("r", (d) => d.radius + 8)
      .attr("fill", "none")
      .attr("filter", (d) => `url(#ag-glow-${d.status})`);

    // Pulse ring for working nodes
    nodeGs
      .filter((d) => d.status === "working")
      .append("circle")
      .attr("r", (d) => d.radius + 4)
      .attr("fill", "none")
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.5)
      .each(function (d) {
        const el = d3.select(this);
        el.append("animate")
          .attr("attributeName", "r")
          .attr("from", String(d.radius + 4))
          .attr("to", String(d.radius + 20))
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");
        el.append("animate")
          .attr("attributeName", "opacity")
          .attr("from", "0.5")
          .attr("to", "0")
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");
      });

    // Main circle — translucent fill + solid stroke
    nodeGs
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", 0.15)
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 2);

    // Inner bright dot
    nodeGs
      .append("circle")
      .attr("r", 3.5)
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", 0.9);

    // First letter inside node
    nodeGs
      .append("text")
      .text((d) => d.label.charAt(0).toUpperCase())
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("dy", -0.5)
      .attr("fill", "var(--color-grid-fg, #f5f4f1)")
      .attr("font-size", (d) => (d.radius > 22 ? "11" : "9"))
      .attr("font-family", "var(--font-mono, monospace)")
      .attr("font-weight", "600")
      .attr("pointer-events", "none");

    // Label below node
    if (showLabels) {
      nodeGs
        .append("text")
        .text((d) => (d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label))
        .attr("text-anchor", "middle")
        .attr("dy", (d) => d.radius + 14)
        .attr("fill", LABEL_COLOR)
        .attr("font-family", "Poppins, sans-serif")
        .attr("font-size", "11px")
        .attr("pointer-events", "none");
    }

    // Topology label
    svg
      .append("text")
      .attr("x", width - 10)
      .attr("y", height - 10)
      .attr("text-anchor", "end")
      .attr("fill", `${EDGE_COLOR}4D`)
      .attr("font-size", "9")
      .attr("font-family", "var(--font-mono, monospace)")
      .text(topology.toUpperCase());

    // ─── D3 drag ───
    if (interactive) {
      const drag = d3
        .drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulationRef.current?.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      nodeGs.call(drag);
    }

    // ─── Force simulation ───
    let initialPositions: ((n: GraphNode, i: number) => { x: number; y: number }) | null = null;

    if (topology === "ring") {
      initialPositions = (_n, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        const r = Math.min(width, height) * 0.32;
        return { x: width / 2 + Math.cos(angle) * r, y: height / 2 + Math.sin(angle) * r };
      };
    } else if (topology === "star") {
      initialPositions = (_n, i) => {
        if (i === 0) return { x: width / 2, y: height / 2 };
        const angle = (2 * Math.PI * (i - 1)) / (nodes.length - 1) - Math.PI / 2;
        const r = Math.min(width, height) * 0.32;
        return { x: width / 2 + Math.cos(angle) * r, y: height / 2 + Math.sin(angle) * r };
      };
    } else if (topology === "hierarchical") {
      initialPositions = (_n, i) => {
        if (i === 0) return { x: width / 2, y: 60 };
        const row = Math.floor((i - 1) / 4);
        const col = (i - 1) % 4;
        const itemsInRow = Math.min(4, nodes.length - 1 - row * 4);
        const colW = width / (itemsInRow + 1);
        return { x: colW * (col + 1), y: 60 + (row + 1) * 100 };
      };
    }

    if (initialPositions) {
      nodes.forEach((n, i) => {
        const pos = initialPositions!(n, i);
        n.x = pos.x;
        n.y = pos.y;
      });
    }

    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance(topology === "force" ? 120 : 80)
          .strength(topology === "force" ? 0.4 : 0.1),
      )
      .force("charge", d3.forceManyBody().strength(topology === "force" ? -300 : -100))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force(
        "collision",
        d3.forceCollide<GraphNode>().radius((d) => d.radius + 12),
      )
      .force("x", d3.forceX(width / 2).strength(topology === "force" ? 0.02 : 0.005))
      .force("y", d3.forceY(height / 2).strength(topology === "force" ? 0.02 : 0.005))
      .alphaDecay(0.03)
      .on("tick", () => {
        // Clamp nodes to bounds
        const pad = 40;
        for (const n of nodes) {
          n.x = Math.max(pad, Math.min(width - pad, n.x ?? width / 2));
          n.y = Math.max(pad, Math.min(height - pad, n.y ?? height / 2));
        }

        // Update edges as curved paths
        edgePaths.attr("d", (d) => {
          const src = d.source as GraphNode;
          const tgt = d.target as GraphNode;
          const sx = src.x ?? 0;
          const sy = src.y ?? 0;
          const tx = tgt.x ?? 0;
          const ty = tgt.y ?? 0;
          // Slight curve for visual interest
          const mx = (sx + tx) / 2;
          const my = (sy + ty) / 2;
          const dx = tx - sx;
          const dy = ty - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const offset = dist * 0.1;
          const cx = mx - (dy / dist) * offset;
          const cy = my + (dx / dist) * offset;
          return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
        });

        // Update particles along edges (use ref to avoid dependency rebuild)
        if (showParticlesRef.current) {
          const t = (Date.now() % 3000) / 3000;
          svg.selectAll(".ag-particles circle").each(function () {
            const el = d3.select(this);
            const edgeId = el.attr("data-edge-id");
            const phase = parseFloat(el.attr("data-phase") || "0");
            const edge = edges.find((e) => e.id === edgeId);
            if (!edge) return;
            const src = edge.source as GraphNode;
            const tgt = edge.target as GraphNode;
            const progress = (t + phase) % 1;
            const px = (src.x ?? 0) + ((tgt.x ?? 0) - (src.x ?? 0)) * progress;
            const py = (src.y ?? 0) + ((tgt.y ?? 0) - (src.y ?? 0)) * progress;
            el.attr("cx", px).attr("cy", py);
          });
        }

        // Update node positions
        nodeGs.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      simulationRef.current = null;
      // Clean up SVG elements to prevent DOM leaks on unmount
      const svgEl = d3.select(svgRef.current);
      svgEl.selectAll("*").remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, width, height, topology, interactive]);

  return (
    <div style={{ position: "relative", display: "inline-block" }} className={className}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: "block", borderRadius: 8 }}
      />

      {/* Hover tooltip — absolute-positioned div */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "#242320",
            border: `1px solid ${tooltip.node.color}`,
            borderRadius: 6,
            padding: "8px 12px",
            pointerEvents: "none",
            zIndex: 50,
            minWidth: 170,
            boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 10px ${tooltip.node.color}33`,
          }}
        >
          <div
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: tooltip.node.color,
              marginBottom: 4,
            }}
          >
            {tooltip.node.label}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              color: LABEL_COLOR,
              lineHeight: 1.7,
            }}
          >
            <div>
              Status: <span style={{ color: tooltip.node.color }}>{tooltip.node.status}</span>
            </div>
            {tooltip.node.model && <div>Model: {tooltip.node.model}</div>}
            {tooltip.node.effort && <div>Effort: {tooltip.node.effort}</div>}
            <div>Tokens: {tooltip.node.tokens.toLocaleString()}</div>
            <div>Last active: {formatLatency(tooltip.node.latency)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
