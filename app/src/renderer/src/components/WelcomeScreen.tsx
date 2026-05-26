import { useState, useEffect } from "react";
import { LayoutGrid, Play, Zap, FolderOpen, Loader2 } from "lucide-react";
import type { SwarmTopology, ConsensusMode } from "../types";

interface WelcomeScreenProps {
  onCreateGrid: (
    rows: number,
    cols: number,
    topology?: SwarmTopology,
    consensus?: ConsensusMode,
  ) => void;
  onLoadPreset?: (presetName: string) => void;
  isCreating: boolean;
}

const GRID_SIZES = [
  { label: "1x1", rows: 1, cols: 1, desc: "Single agent" },
  { label: "1x2", rows: 1, cols: 2, desc: "Side by side" },
  { label: "2x2", rows: 2, cols: 2, desc: "Quad grid" },
  { label: "2x3", rows: 2, cols: 3, desc: "Full team" },
  { label: "3x3", rows: 3, cols: 3, desc: "Max grid" },
] as const;

interface QuickPreset {
  name: string;
  displayName: string;
  desc: string;
  paneCount: number;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    name: "anti-drift-squad",
    displayName: "Anti-Drift Squad",
    desc: "8 agents with hierarchical coordination",
    paneCount: 8,
  },
  {
    name: "sparc-pipeline",
    displayName: "SPARC Pipeline",
    desc: "5-phase TDD: Spec → Code → QA",
    paneCount: 6,
  },
  {
    name: "earning-factory",
    displayName: "Earning Factory",
    desc: "7 earning agents + dashboard + QA",
    paneCount: 9,
  },
];

export function WelcomeScreen({ onCreateGrid, onLoadPreset, isCreating }: WelcomeScreenProps) {
  const [recentPresets, setRecentPresets] = useState<string[]>([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState<
    Array<{ id: string; name: string; updatedAt: string }>
  >([]);
  const [clickedSize, setClickedSize] = useState<string | null>(null);
  const [clickedPreset, setClickedPreset] = useState<string | null>(null);

  useEffect(() => {
    window.api?.preset
      ?.history()
      .then(setRecentPresets)
      .catch(() => {});
    window.api?.workspace
      ?.getRecent()
      .then((ws: Array<{ id: string; name: string; updatedAt: string }>) => {
        if (ws) setRecentWorkspaces(ws.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-grid-bg">
      <h1 className="mb-2 font-display text-4xl text-grid-fg-primary">AgentGrid</h1>
      <p className="mb-8 font-body text-sm text-grid-fg-muted">
        Visual multi-agent orchestration for AI coding tools
      </p>

      {/* Grid size buttons */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-center gap-2">
          <LayoutGrid size={14} className="text-grid-fg-dim" />
          <span className="font-mono text-xs uppercase tracking-wider text-grid-fg-dim">
            New Grid
          </span>
        </div>
        <div className="flex gap-3">
          {GRID_SIZES.map((size) => {
            const isThis = clickedSize === size.label && isCreating;
            return (
              <button
                key={size.label}
                onClick={() => {
                  setClickedSize(size.label);
                  onCreateGrid(size.rows, size.cols, "hierarchical", "queen-decides");
                }}
                disabled={isCreating}
                className="group flex flex-col items-center gap-1 rounded-lg border border-grid-border bg-grid-surface px-5 py-4 transition-all hover:border-grid-accent/50 hover:-translate-y-0.5 disabled:opacity-50"
                aria-label={`Create ${size.label} grid — ${size.desc}`}
              >
                {isThis ? (
                  <Loader2 size={20} className="animate-spin text-grid-accent" />
                ) : (
                  <span className="font-mono text-lg font-semibold text-grid-fg-primary group-hover:text-grid-accent">
                    {size.label}
                  </span>
                )}
                <span className="font-mono text-[11px] text-grid-fg-muted">
                  {isThis ? "Spawning..." : size.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick preset buttons */}
      {onLoadPreset && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Zap size={14} className="text-grid-fg-dim" />
            <span className="font-mono text-xs uppercase tracking-wider text-grid-fg-dim">
              Quick Start Presets
            </span>
          </div>
          <div className="flex gap-3">
            {QUICK_PRESETS.map((preset) => {
              const isThis = clickedPreset === preset.name && isCreating;
              return (
                <button
                  key={preset.name}
                  onClick={() => {
                    setClickedPreset(preset.name);
                    window.api?.preset
                      ?.list()
                      .then((names: string[]) => {
                        if (names?.includes(preset.name)) {
                          onLoadPreset(preset.name);
                        } else {
                          console.warn(
                            `Preset "${preset.name}" not found. Available: ${names?.join(", ") ?? "none"}`,
                          );
                          setClickedPreset(null);
                        }
                      })
                      .catch(() => {
                        onLoadPreset(preset.name);
                      });
                  }}
                  disabled={isCreating}
                  className="group flex flex-col items-center gap-1.5 rounded-lg border border-grid-border bg-grid-surface px-5 py-4 hover:border-grid-accent/50 hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ minWidth: 160 }}
                >
                  <div className="flex items-center gap-1.5">
                    {isThis ? (
                      <Loader2 size={12} className="animate-spin text-grid-accent" />
                    ) : (
                      <Play size={12} className="text-grid-accent" />
                    )}
                    <span className="font-body text-sm font-semibold text-grid-fg-primary group-hover:text-grid-accent">
                      {preset.displayName}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-grid-fg-muted">{preset.desc}</span>
                  <span className="font-mono text-[11px] text-grid-fg-dim">
                    {preset.paneCount} agents
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent workspaces */}
      {recentWorkspaces.length > 0 && (
        <div className="flex items-center gap-2">
          <FolderOpen size={12} className="text-grid-fg-dim" />
          <span className="font-mono text-[10px] text-grid-fg-dim">Workspaces:</span>
          {recentWorkspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={async () => {
                await window.api?.workspace?.switch(ws.id);
              }}
              disabled={isCreating}
              className="rounded border border-grid-border bg-grid-surface px-3 py-1 font-mono text-[10px] text-grid-fg-muted hover:border-grid-accent/50 hover:text-grid-accent disabled:opacity-50"
              title={`Switch to ${ws.name}`}
            >
              {ws.name}
            </button>
          ))}
        </div>
      )}

      {/* Recent presets */}
      {onLoadPreset && recentPresets.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-grid-fg-dim">Recent:</span>
          {recentPresets.slice(0, 3).map((name) => (
            <button
              key={name}
              onClick={() => onLoadPreset(name)}
              disabled={isCreating}
              className="rounded border border-grid-border bg-grid-surface px-3 py-1 font-mono text-[10px] text-grid-fg-muted hover:border-grid-accent/50 hover:text-grid-accent disabled:opacity-50"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
