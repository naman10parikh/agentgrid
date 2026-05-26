import { useState, useEffect, useCallback, useMemo } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GridView } from "./components/GridView";
import { ControlBar } from "./components/ControlBar";
import { StatusBar } from "./components/StatusBar";
import { TabBar } from "./components/TabBar";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { CommandPalette } from "./components/CommandPalette";
import { Sidebar } from "./components/Sidebar";
import { Settings, loadSettings } from "./components/Settings";
import { AgentGraph } from "./components/AgentGraph";
import { AgentTimeline } from "./components/AgentTimeline";
import { GraphExport } from "./components/GraphExport";
import { DashboardView } from "./components/DashboardView";
import type { Topology } from "./components/AgentGraph";
import { CouncilPanel } from "./components/CouncilPanel";
import { Onboarding } from "./components/Onboarding";
import type {
  GridLayout,
  CliTool,
  EffortLevel,
  SwarmTopology,
  ConsensusMode,
  TopologyConfig,
} from "./types";
import { TOPOLOGY_DEFAULTS } from "./types";

export function App() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null); // null = loading
  const [grid, setGrid] = useState<GridLayout | null>(null);
  const [focusedPaneId, setFocusedPaneId] = useState<string | null>(null);
  const [zoomedPaneId, setZoomedPaneId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [councilOpen, setCouncilOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "dashboard" | "graph">("grid");
  const [graphTopology, setGraphTopology] = useState<Topology>("force");

  // Check onboarding state on mount
  useEffect(() => {
    window.api?.onboarding
      ?.getState()
      .then((state) => setOnboardingDone(state.complete))
      .catch(() => setOnboardingDone(true)); // IPC unavailable = skip onboarding
  }, []);

  // Sync graph topology with grid's topology config
  useEffect(() => {
    if (!grid?.topologyConfig) return;
    const swarmToGraph: Record<string, Topology> = {
      hierarchical: "hierarchical",
      mesh: "force",
      ring: "ring",
      star: "star",
    };
    const mapped = swarmToGraph[grid.topologyConfig.topology];
    if (mapped) setGraphTopology(mapped);
  }, [grid?.topologyConfig?.topology]);

  // Don't auto-restore — always show WelcomeScreen first (intentional UX default)
  // User can restore via Command Palette → "Restore Last Session"

  const handleCreateGrid = useCallback(
    async (rows: number, cols: number, topology?: SwarmTopology, consensus?: ConsensusMode) => {
      setIsCreating(true);
      try {
        // Get home dir from main process (process.cwd unavailable in packaged renderer)
        let cwd = "/tmp";
        try {
          const info = await window.api?.app?.getInfo();
          if (info?.homeDir) cwd = info.homeDir;
        } catch {
          /* fallback */
        }

        // Read global settings from electron-store for defaults
        const appSettings = await loadSettings();
        const agent = (appSettings.defaultAgent || "claude") as CliTool;
        const model = appSettings.defaultModel || "claude-opus-4-6";
        const effort = appSettings.defaultEffort || "max";

        // Create grid via IPC — no timeout, let it complete
        let newGrid;
        let ipcError: string | null = null;
        try {
          if (window.api?.grid?.create) {
            newGrid = await window.api.grid.create(rows, cols, agent, cwd, model, effort);
          }
        } catch (e) {
          ipcError = e instanceof Error ? e.message : String(e);
          console.error("[AgentGrid] IPC grid.create failed:", ipcError);
        }

        // Fallback: create mock grid locally
        if (!newGrid || !newGrid.panes) {
          const panes = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              panes.push({
                id: (typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : Math.random().toString(36)
                ).slice(0, 8),
                label: `Agent ${r * cols + c + 1}`,
                status: "idle" as const,
                agent: agent as CliTool,
                cwd,
                row: r,
                col: c,
                rowSpan: 1,
                colSpan: 1,
                model,
                effort: effort as EffortLevel,
              });
            }
          }
          newGrid = { rows, cols, panes };
        }

        // Attach topology config if specified
        if (topology) {
          const defaults = TOPOLOGY_DEFAULTS[topology];
          newGrid.topologyConfig = {
            ...defaults,
            consensus: consensus ?? defaults.consensus,
            queenPaneId: newGrid.panes[0]?.id,
          };
        }

        console.log(
          "[AgentGrid] Grid created:",
          newGrid.rows,
          "x",
          newGrid.cols,
          newGrid.panes.length,
          "panes",
          topology ? `topology=${topology}` : "",
        );
        setGrid(newGrid);
        setIsCreating(false); // Clear loading BEFORE next render
        console.log("GRID SET", newGrid.panes.length, "panes — view should switch now");
        if (newGrid.panes.length > 0) {
          setFocusedPaneId(newGrid.panes[0].id);
        }
      } catch (err) {
        console.error("[AgentGrid] handleCreateGrid failed:", err);
        // Last resort fallback — create minimal grid
        const fallback = {
          rows,
          cols,
          panes: Array.from({ length: rows * cols }, (_, i) => ({
            id: `fb-${i}-${Date.now()}`,
            label: `Agent ${i + 1}`,
            status: "idle" as const,
            agent: "claude" as const,
            cwd: "/tmp",
            row: Math.floor(i / cols),
            col: i % cols,
            rowSpan: 1,
            colSpan: 1,
          })),
        };
        setGrid(fallback);
        setFocusedPaneId(fallback.panes[0].id);
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  const handleLoadPreset = useCallback(async (name: string) => {
    if (!window.api?.preset) return;
    setIsCreating(true);
    try {
      const loaded = await window.api.preset.load(name);
      if (loaded) {
        setGrid(loaded);
        if (loaded.panes?.length > 0) {
          setFocusedPaneId(loaded.panes[0].id);
        }
      }
    } catch (err) {
      console.error("[AgentGrid] handleLoadPreset failed:", err);
    } finally {
      setIsCreating(false);
    }
  }, []);

  const handleBroadcast = useCallback(
    (message: string) => {
      if (!grid) return;
      // Use atomic IPC broadcast if available, fallback to per-pane loop
      if (window.api?.pane?.broadcast) {
        window.api.pane.broadcast(message + "\n");
      } else {
        for (const pane of grid.panes) {
          window.api?.terminal?.write(pane.id, message + "\n");
        }
      }
    },
    [grid],
  );

  const handleAddPane = useCallback(async () => {
    if (!grid) return;
    let cwd = "/tmp";
    try {
      const info = await window.api?.app?.getInfo();
      if (info && "homeDir" in info) cwd = (info as { homeDir: string }).homeDir;
    } catch {
      /* fallback */
    }

    let newPane;
    try {
      newPane = await window.api?.pane?.add("claude", cwd);
    } catch {
      /* fallback below */
    }

    if (!newPane) {
      const col = grid.panes.length % grid.cols;
      const row = Math.floor(grid.panes.length / grid.cols);
      newPane = {
        id: (crypto.randomUUID?.() ?? Math.random().toString(36)).slice(0, 8),
        label: `Agent ${grid.panes.length + 1}`,
        status: "idle" as const,
        agent: "claude" as const,
        cwd,
        row,
        col,
        rowSpan: 1,
        colSpan: 1,
      };
    }
    setGrid((prev) => {
      if (!prev) return prev;
      const newRows = Math.max(prev.rows, newPane.row + 1);
      return { ...prev, rows: newRows, panes: [...prev.panes, newPane] };
    });
    setFocusedPaneId(newPane.id);
  }, [grid]);

  const handlePaneClose = useCallback(
    async (paneId: string) => {
      await window.api?.pane?.remove(paneId);
      setGrid((prev) => {
        if (!prev) return prev;
        const remaining = prev.panes.filter((p) => p.id !== paneId);
        // If all panes closed, return to welcome screen
        if (remaining.length === 0) return null;
        return { ...prev, panes: remaining };
      });
      if (focusedPaneId === paneId) {
        const others = grid?.panes.filter((p) => p.id !== paneId) ?? [];
        setFocusedPaneId(others[0]?.id ?? null);
      }
    },
    [focusedPaneId, grid],
  );

  // Keyboard shortcuts (must be after handleAddPane/handlePaneClose definitions)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "k") {
        e.preventDefault();
        setSettingsOpen(false);
        setPaletteOpen((v) => !v);
      }
      if (mod && e.key === "\\") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
      if (mod && !e.shiftKey && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
      if (mod && e.key === ",") {
        e.preventDefault();
        setPaletteOpen(false);
        setSettingsOpen((v) => !v);
      }
      if (mod && !e.shiftKey && e.key === "n") {
        e.preventDefault();
        handleAddPane();
      }
      if (mod && !e.shiftKey && e.key === "w") {
        e.preventDefault();
        if (focusedPaneId) handlePaneClose(focusedPaneId);
      }
      if (mod && !e.shiftKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (grid && idx < grid.panes.length) {
          setFocusedPaneId(grid.panes[idx].id);
        }
      }
      if (mod && !e.shiftKey && e.key === "g") {
        e.preventDefault();
        setViewMode((v) => (v === "grid" ? "dashboard" : "grid"));
      }
      if (mod && e.shiftKey && e.key === "G") {
        e.preventDefault();
        setViewMode((v) => (v === "graph" ? "grid" : "graph"));
      }
      if (mod && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setZenMode((v) => !v);
      }
      if (mod && e.shiftKey && e.key === "c") {
        e.preventDefault();
        setCouncilOpen((v) => !v);
      }
      if (e.key === "Escape") {
        if (paletteOpen) setPaletteOpen(false);
        else if (settingsOpen) setSettingsOpen(false);
        else if (councilOpen) setCouncilOpen(false);
        else if (zenMode) setZenMode(false);
        else if (zoomedPaneId) setZoomedPaneId(null);
        else if (sidebarOpen) setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    zenMode,
    zoomedPaneId,
    focusedPaneId,
    grid,
    paletteOpen,
    settingsOpen,
    councilOpen,
    sidebarOpen,
    handleAddPane,
    handlePaneClose,
  ]);

  const handleSwapPanes = useCallback(async (paneIdA: string, paneIdB: string) => {
    await window.api?.pane?.swap(paneIdA, paneIdB);
    setGrid((prev) => {
      if (!prev) return prev;
      const panes = prev.panes.map((p) => ({ ...p }));
      const a = panes.find((p) => p.id === paneIdA);
      const b = panes.find((p) => p.id === paneIdB);
      if (a && b) {
        [a.row, b.row] = [b.row, a.row];
        [a.col, b.col] = [b.col, a.col];
      }
      return { ...prev, panes };
    });
  }, []);

  const handleSplitPane = useCallback(
    async (paneId: string, direction: "horizontal" | "vertical") => {
      if (!grid) return;
      const source = grid.panes.find((p) => p.id === paneId);
      if (!source) return;

      let cwd = source.cwd;
      let newPane;
      try {
        newPane = await window.api?.pane?.add(source.agent, cwd);
      } catch {
        /* fallback */
      }

      if (!newPane) {
        const row = direction === "vertical" ? source.row : source.row + 1;
        const col = direction === "vertical" ? source.col + 1 : source.col;
        newPane = {
          id: (crypto.randomUUID?.() ?? Math.random().toString(36)).slice(0, 8),
          label: `Agent ${grid.panes.length + 1}`,
          status: "idle" as const,
          agent: source.agent,
          cwd,
          row,
          col,
          rowSpan: 1,
          colSpan: 1,
        };
      }

      setGrid((prev) => {
        if (!prev) return prev;
        // Shift existing panes to make room
        const panes = prev.panes.map((p) => ({ ...p }));
        if (direction === "vertical") {
          // Shift panes to the right of insert point
          for (const p of panes) {
            if (p.row === newPane.row && p.col >= newPane.col && p.id !== paneId) {
              p.col += 1;
            }
          }
        } else {
          // Shift panes below insert point
          for (const p of panes) {
            if (p.col === newPane.col && p.row >= newPane.row && p.id !== paneId) {
              p.row += 1;
            }
          }
        }
        panes.push(newPane);
        const maxRow = Math.max(...panes.map((p) => p.row + p.rowSpan));
        const maxCol = Math.max(...panes.map((p) => p.col + p.colSpan));
        return { ...prev, rows: maxRow, cols: maxCol, panes };
      });
      setFocusedPaneId(newPane.id);
    },
    [grid],
  );

  const handlePaneRename = useCallback(async (paneId: string, label: string) => {
    await window.api?.pane?.rename(paneId, label);
    setGrid((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        panes: prev.panes.map((p) => (p.id === paneId ? { ...p, label } : p)),
      };
    });
  }, []);

  const handlePaneModelChange = useCallback((paneId: string, model: string) => {
    setGrid((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        panes: prev.panes.map((p) => (p.id === paneId ? { ...p, model } : p)),
      };
    });
  }, []);

  const handlePaneEffortChange = useCallback((paneId: string, effort: string) => {
    setGrid((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        panes: prev.panes.map((p) =>
          p.id === paneId ? { ...p, effort: effort as EffortLevel } : p,
        ),
      };
    });
  }, []);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    setGrid((prev) => {
      if (!prev) return prev;
      const panes = [...prev.panes];
      const [moved] = panes.splice(fromIndex, 1);
      panes.splice(toIndex, 0, moved);
      // Reassign grid positions
      const reindexed = panes.map((p, i) => ({
        ...p,
        row: Math.floor(i / prev.cols),
        col: i % prev.cols,
      }));
      return { ...prev, panes: reindexed };
    });
  }, []);

  const commands = useMemo(() => {
    const cmds: Array<{
      id: string;
      label: string;
      shortcut?: string;
      action: () => void | Promise<unknown>;
    }> = [
      {
        id: "grid-1x1",
        label: "New 1×1 Grid",
        action: () => handleCreateGrid(1, 1),
      },
      {
        id: "grid-1x2",
        label: "New 1×2 Grid",
        action: () => handleCreateGrid(1, 2),
      },
      {
        id: "grid-2x2",
        label: "New 2×2 Grid",
        action: () => handleCreateGrid(2, 2),
      },
      {
        id: "grid-2x3",
        label: "New 2×3 Grid",
        shortcut: "⌘N",
        action: () => handleCreateGrid(2, 3),
      },
      {
        id: "grid-3x3",
        label: "New 3×3 Grid",
        action: () => handleCreateGrid(3, 3),
      },
      {
        id: "save",
        label: "Save Session",
        shortcut: "⌘S",
        action: () => window.api?.session?.save(),
      },
      {
        id: "restore",
        label: "Restore Session",
        action: () => window.api?.grid?.restore(),
      },
    ];
    cmds.push({
      id: "toggle-view",
      label: "Toggle Grid/Dashboard View",
      shortcut: "⌘G",
      action: () => setViewMode((v) => (v === "grid" ? "dashboard" : "grid")),
    });
    if (grid) {
      cmds.push(
        {
          id: "broadcast",
          label: "Broadcast to All Panes",
          shortcut: "⌘⇧B",
          action: async () => {
            // Focus the broadcast input in ControlBar instead of using prompt()
            const input = document.querySelector<HTMLInputElement>("[data-broadcast-input]");
            if (input) {
              input.focus();
              input.select();
            }
          },
        },
        {
          id: "preset-save",
          label: "Save as Preset",
          action: async () => {
            // Use auto-generated name instead of prompt() (broken in Electron)
            const name = `preset-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-")}`;
            window.api?.preset?.save(name);
          },
        },
        {
          id: "council-start",
          label: "Start Council",
          shortcut: "⌘⇧C",
          action: () => setCouncilOpen(true),
        },
      );
    }
    return cmds;
  }, [grid, handleCreateGrid, handleBroadcast]);

  if (!grid) {
    return (
      <div className="flex h-screen flex-col bg-grid-bg">
        <div className="flex min-h-0 flex-1">
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((v) => !v)}
            onLoadPreset={handleLoadPreset}
          />
          <WelcomeScreen
            onCreateGrid={handleCreateGrid}
            onLoadPreset={handleLoadPreset}
            isCreating={isCreating}
          />
        </div>
        <CommandPalette
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          commands={commands}
        />
        <ErrorBoundary>
          <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </ErrorBoundary>
      </div>
    );
  }

  // Show onboarding if not complete
  if (onboardingDone === null) {
    // Still loading — show nothing (prevents flash)
    return <div className="flex h-screen items-center justify-center bg-grid-bg" />;
  }
  if (!onboardingDone) {
    return <Onboarding onComplete={() => setOnboardingDone(true)} />;
  }

  return (
    <div className="flex h-screen flex-col bg-grid-bg">
      {/* Title bar — hidden in zen mode */}
      {!zenMode && (
        <div className="titlebar-drag flex h-10 shrink-0 items-center border-b border-grid-border px-20">
          <span className="titlebar-no-drag font-mono text-xs text-grid-fg-muted">
            AgentGrid — {grid.panes.length} panes
          </span>
        </div>
      )}
      {/* Control bar — hidden in zen mode */}
      {!zenMode && (
        <ControlBar
          grid={grid}
          onBroadcast={handleBroadcast}
          onSave={() => window.api?.session?.save()}
          onAddPane={handleAddPane}
          viewMode={viewMode}
          onToggleView={() => setViewMode((v) => (v === "grid" ? "dashboard" : "grid"))}
        />
      )}
      {/* Tab bar — always visible */}
      <TabBar
        panes={grid.panes}
        focusedPaneId={focusedPaneId}
        onFocus={setFocusedPaneId}
        onClose={handlePaneClose}
        onRename={handlePaneRename}
        onReorder={handleTabReorder}
      />
      <div className="flex min-h-0 flex-1">
        {!zenMode && (
          <ErrorBoundary>
            <Sidebar
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen((v) => !v)}
              onLoadPreset={handleLoadPreset}
            />
          </ErrorBoundary>
        )}
        <div className="relative min-h-0 flex-1">
          {viewMode === "grid" ? (
            <>
              <ErrorBoundary>
                <GridView
                  grid={grid}
                  focusedPaneId={focusedPaneId}
                  zoomedPaneId={zoomedPaneId}
                  onPaneFocus={setFocusedPaneId}
                  onPaneZoom={(id) => setZoomedPaneId((prev) => (prev === id ? null : id))}
                  onPaneClose={handlePaneClose}
                  onPaneRename={handlePaneRename}
                  onPaneSwap={handleSwapPanes}
                  onPaneModelChange={handlePaneModelChange}
                  onPaneEffortChange={handlePaneEffortChange}
                  onPaneSplit={handleSplitPane}
                />
              </ErrorBoundary>
              {/* Minimap overlay — bottom-right corner */}
              <div
                className="absolute bottom-3 right-3 cursor-pointer overflow-hidden rounded-lg border border-grid-border bg-[#141312]/30 backdrop-blur-sm"
                style={{ width: 150, height: 100 }}
                title="Agent Graph (⌘⇧G to expand)"
                onClick={() => setViewMode("graph")}
              >
                <AgentGraph
                  grid={grid}
                  width={150}
                  height={100}
                  topology="force"
                  interactive={false}
                  showParticles={false}
                  showLabels={false}
                />
              </div>
            </>
          ) : viewMode === "dashboard" ? (
            <ErrorBoundary>
              <DashboardView
                grid={grid}
                focusedPaneId={focusedPaneId}
                onPaneFocus={(id) => {
                  setFocusedPaneId(id);
                  setViewMode("grid");
                }}
              />
            </ErrorBoundary>
          ) : (
            <div className="graph-view-container flex h-full flex-col">
              {/* Graph toolbar */}
              <div className="flex items-center gap-2 border-b border-grid-border bg-[#141312] px-4 py-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-grid-fg-dim">
                  Topology
                </span>
                {(["force", "hierarchical", "ring", "star"] as Topology[]).map((topo) => (
                  <button
                    key={topo}
                    onClick={() => setGraphTopology(topo)}
                    className={`rounded px-2 py-0.5 font-mono text-[10px] ${
                      graphTopology === topo
                        ? "bg-grid-accent text-grid-fg"
                        : "text-grid-fg-muted hover:text-grid-fg-secondary"
                    }`}
                  >
                    {topo}
                  </button>
                ))}
                <div className="flex-1" />
                {grid.topologyConfig && (
                  <span className="font-mono text-[10px] text-grid-fg-dim">
                    {grid.topologyConfig.topology} · {grid.topologyConfig.consensus} · max{" "}
                    {grid.topologyConfig.antiDrift.maxWorkers}
                  </span>
                )}
                <GraphExport svgSelector=".agent-graph" />
              </div>

              {/* Graph canvas */}
              <div className="flex flex-1 items-center justify-center bg-[#141312]">
                <ErrorBoundary>
                  <AgentGraph
                    grid={grid}
                    width={800}
                    height={500}
                    topology={graphTopology}
                    onNodeClick={(paneId) => {
                      setFocusedPaneId(paneId);
                      setViewMode("grid");
                    }}
                    interactive
                    showParticles
                    showLabels
                  />
                </ErrorBoundary>
              </div>

              {/* Agent timeline */}
              <ErrorBoundary>
                <AgentTimeline grid={grid} durationMinutes={30} />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
      {/* Status bar — hidden in zen mode */}
      {!zenMode && <StatusBar grid={grid} focusedPaneId={focusedPaneId} />}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
      <ErrorBoundary>
        <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </ErrorBoundary>
      <ErrorBoundary>
        <CouncilPanel isOpen={councilOpen} onClose={() => setCouncilOpen(false)} grid={grid} />
      </ErrorBoundary>
    </div>
  );
}
