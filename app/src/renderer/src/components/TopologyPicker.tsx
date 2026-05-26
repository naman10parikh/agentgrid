import { useState, useCallback } from "react";
import { Check } from "lucide-react";
import type { SwarmTopology, ConsensusMode } from "../types";

interface TopologyPickerProps {
  selected: SwarmTopology;
  onSelect: (topology: SwarmTopology) => void;
  consensus?: ConsensusMode;
  onConsensusChange?: (mode: ConsensusMode) => void;
  compact?: boolean;
}

interface TopologyOption {
  id: SwarmTopology;
  name: string;
  description: string;
  defaultConsensus: ConsensusMode;
  ascii: string;
  maxWorkers: number;
}

const TOPOLOGIES: TopologyOption[] = [
  {
    id: "hierarchical",
    name: "Hierarchical",
    description: "Queen → Workers (CEO model)",
    defaultConsensus: "queen-decides",
    maxWorkers: 12,
    ascii: ["      [CEO]      ", "     ╱  │  ╲     ", "   [W1][W2][W3]  "].join("\n"),
  },
  {
    id: "mesh",
    name: "Full Mesh",
    description: "All-to-all messaging",
    defaultConsensus: "majority",
    maxWorkers: 8,
    ascii: [
      "  [A]───[B]  ",
      "   │╲  ╱│    ",
      "   │ ╳  │    ",
      "   │╱  ╲│    ",
      "  [D]───[C]  ",
    ].join("\n"),
  },
  {
    id: "ring",
    name: "Pipeline Ring",
    description: "Sequential A→B→C→D→A",
    defaultConsensus: "majority",
    maxWorkers: 8,
    ascii: ["    [A]→[B]  ", "     ↑   ↓   ", "    [D]←[C]  "].join("\n"),
  },
  {
    id: "star",
    name: "Hub & Spoke",
    description: "Hub coordinates spokes",
    defaultConsensus: "queen-decides",
    maxWorkers: 10,
    ascii: [
      "    [S1]     ",
      "     │       ",
      " [S3]─[HUB]─[S2]",
      "       │     ",
      "     [S4]    ",
    ].join("\n"),
  },
];

const CONSENSUS_MODES: { id: ConsensusMode; label: string; desc: string }[] = [
  { id: "queen-decides", label: "Queen Decides", desc: "Leader has final say" },
  { id: "majority", label: "Majority Vote", desc: "51%+ to approve" },
  { id: "unanimous", label: "Unanimous", desc: "All must agree" },
  { id: "none", label: "No Consensus", desc: "Independent action" },
];

export function TopologyPicker({
  selected,
  onSelect,
  consensus,
  onConsensusChange,
  compact = false,
}: TopologyPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConsensus, setShowConsensus] = useState(false);

  const currentTopo = TOPOLOGIES.find((t) => t.id === selected) ?? TOPOLOGIES[0];

  const handleSelect = useCallback(
    (topo: TopologyOption) => {
      onSelect(topo.id);
      onConsensusChange?.(topo.defaultConsensus);
      setIsOpen(false);
    },
    [onSelect, onConsensusChange],
  );

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex cursor-pointer items-center gap-1.5 rounded border border-grid-border px-2.5 py-1.5 font-mono text-[10px] text-grid-fg-muted transition-colors hover:text-grid-fg-secondary focus:ring-2 focus:ring-grid-accent/50 focus:outline-none"
          title="Swarm topology"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="5" r="2" />
            <circle cx="5" cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
            <line x1="12" y1="7" x2="5" y2="17" />
            <line x1="12" y1="7" x2="19" y2="17" />
            <line x1="5" y1="19" x2="19" y2="19" />
          </svg>
          {currentTopo.name}
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-grid-border bg-grid-bg-elevated shadow-xl"
              style={{ minWidth: 280 }}
            >
              {TOPOLOGIES.map((topo) => (
                <button
                  key={topo.id}
                  onClick={() => handleSelect(topo)}
                  className={`flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-grid-bg-raised ${
                    selected === topo.id ? "bg-grid-accent/10" : ""
                  }`}
                >
                  <pre
                    className="shrink-0 font-mono text-[10px] leading-[1.2] text-grid-accent"
                    style={{ minWidth: 100 }}
                  >
                    {topo.ascii}
                  </pre>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] font-semibold text-grid-fg-primary">
                      {topo.name}
                    </div>
                    <div className="font-mono text-[10px] text-grid-fg-muted">
                      {topo.description}
                    </div>
                    <div className="font-mono text-[10px] text-grid-fg-dim">
                      max {topo.maxWorkers} · {topo.defaultConsensus}
                    </div>
                  </div>
                  {selected === topo.id && <Check size={14} className="text-grid-accent" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full expanded picker (for WelcomeScreen)
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-grid-fg-dim"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <line x1="12" y1="7" x2="5" y2="17" />
          <line x1="12" y1="7" x2="19" y2="17" />
          <line x1="5" y1="19" x2="19" y2="19" />
        </svg>
        <span className="font-mono text-xs uppercase tracking-wider text-grid-fg-dim">
          Swarm Topology
        </span>
      </div>

      <div className="flex gap-3">
        {TOPOLOGIES.map((topo) => (
          <button
            key={topo.id}
            onClick={() => handleSelect(topo)}
            className={`group flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-4 py-3.5 transition-all hover:-translate-y-0.5 focus:ring-2 focus:ring-grid-accent/50 focus:outline-none ${
              selected === topo.id
                ? "border-grid-accent/60 bg-grid-accent/10"
                : "border-grid-border bg-grid-surface hover:border-grid-accent/30"
            }`}
            style={{ minWidth: 140 }}
          >
            <pre
              className={`font-mono text-[10px] leading-[1.2] ${
                selected === topo.id
                  ? "text-grid-accent"
                  : "text-grid-fg-dim group-hover:text-grid-accent/70"
              }`}
            >
              {topo.ascii}
            </pre>
            <div className="text-center">
              <div
                className={`font-mono text-[11px] font-semibold ${
                  selected === topo.id ? "text-grid-accent" : "text-grid-fg-primary"
                }`}
              >
                {topo.name}
              </div>
              <div className="font-mono text-[10px] text-grid-fg-muted">{topo.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Consensus mode selector */}
      {onConsensusChange && (
        <div className="mt-3">
          <button
            onClick={() => setShowConsensus(!showConsensus)}
            className="cursor-pointer font-mono text-[10px] text-grid-fg-dim transition-colors hover:text-grid-fg-muted"
          >
            Consensus:{" "}
            {CONSENSUS_MODES.find((c) => c.id === (consensus ?? currentTopo.defaultConsensus))
              ?.label ?? "None"}{" "}
            {showConsensus ? "▲" : "▼"}
          </button>
          {showConsensus && (
            <div className="mt-1 flex gap-2">
              {CONSENSUS_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onConsensusChange(mode.id)}
                  className={`cursor-pointer rounded border px-2.5 py-1.5 font-mono text-[10px] transition-colors ${
                    consensus === mode.id
                      ? "border-grid-accent/50 bg-grid-accent/10 text-grid-accent"
                      : "border-grid-border text-grid-fg-muted hover:text-grid-fg-secondary"
                  }`}
                  title={mode.desc}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
