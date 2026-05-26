/**
 * Grid Manager — Layout, pane tracking, save/restore
 */

import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type {
  CliTool,
  EffortLevel,
  GridLayout,
  LegacyPreset,
  PaneConfig,
  PaneStatus,
  Preset,
} from "../shared/types";

const DATA_DIR = join(homedir(), ".agentgrid");
const PRESETS_DIR = join(DATA_DIR, "presets");
const SESSION_FILE = join(DATA_DIR, "last-session.json");

/** Resolve built-in presets directory — works in both dev and packaged mode */
function resolveBuiltInPresetsDir(): string {
  // Try multiple possible locations
  const candidates = [
    join(__dirname, "../../presets"), // dev mode: out/main/index.js → presets/
    join(__dirname, "../../../presets"), // packaged: Resources/app.asar/out/main → presets/
    join(process.cwd(), "presets"), // CWD fallback
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0]; // fallback even if doesn't exist
}

const BUILT_IN_PRESETS_DIR = resolveBuiltInPresetsDir();

function ensureDirs(): void {
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(PRESETS_DIR, { recursive: true });
}

export class GridManager {
  private grid: GridLayout | null = null;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private readonly MAX_HISTORY = 50;

  constructor() {
    ensureDirs();
  }

  private pushHistory(): void {
    if (!this.grid) return;
    this.undoStack.push(JSON.stringify(this.grid));
    if (this.undoStack.length > this.MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(): GridLayout | null {
    if (this.undoStack.length === 0) return null;
    if (this.grid) {
      this.redoStack.push(JSON.stringify(this.grid));
    }
    const prev = this.undoStack.pop()!;
    this.grid = JSON.parse(prev) as GridLayout;
    return this.grid;
  }

  redo(): GridLayout | null {
    if (this.redoStack.length === 0) return null;
    if (this.grid) {
      this.undoStack.push(JSON.stringify(this.grid));
    }
    const next = this.redoStack.pop()!;
    this.grid = JSON.parse(next) as GridLayout;
    return this.grid;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  create(rows: number, cols: number, agent: CliTool, cwd: string): GridLayout {
    const panes: PaneConfig[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        panes.push({
          id: randomUUID().slice(0, 8),
          label: `Agent ${r * cols + c + 1}`,
          status: "idle",
          agent,
          cwd,
          row: r,
          col: c,
          rowSpan: 1,
          colSpan: 1,
        });
      }
    }
    this.grid = { rows, cols, panes };
    return this.grid;
  }

  get(): GridLayout | null {
    return this.grid;
  }

  addPane(agent: CliTool, cwd: string): PaneConfig | null {
    if (!this.grid) return null;
    this.pushHistory();
    const col = this.grid.panes.length % this.grid.cols;
    const row = Math.floor(this.grid.panes.length / this.grid.cols);
    const pane: PaneConfig = {
      id: randomUUID().slice(0, 8),
      label: `Agent ${this.grid.panes.length + 1}`,
      status: "idle",
      agent,
      cwd,
      row,
      col,
      rowSpan: 1,
      colSpan: 1,
    };
    this.grid.panes.push(pane);
    // Adjust rows if needed
    if (row >= this.grid.rows) {
      this.grid.rows = row + 1;
    }
    return pane;
  }

  removePane(paneId: string): boolean {
    if (!this.grid) return false;
    const idx = this.grid.panes.findIndex((p) => p.id === paneId);
    if (idx === -1) return false;
    this.pushHistory();
    this.grid.panes.splice(idx, 1);
    return true;
  }

  renamePane(paneId: string, label: string): boolean {
    const pane = this.findPane(paneId);
    if (!pane) return false;
    pane.label = label;
    return true;
  }

  setPaneStatus(paneId: string, status: PaneStatus): boolean {
    const pane = this.findPane(paneId);
    if (!pane) return false;
    pane.status = status;
    return true;
  }

  setPaneModel(paneId: string, model: string): boolean {
    const pane = this.findPane(paneId);
    if (!pane) return false;
    pane.model = model;
    return true;
  }

  setPaneEffort(paneId: string, effort: EffortLevel): boolean {
    const pane = this.findPane(paneId);
    if (!pane) return false;
    pane.effort = effort;
    return true;
  }

  swapPanes(paneIdA: string, paneIdB: string): boolean {
    const a = this.findPane(paneIdA);
    const b = this.findPane(paneIdB);
    if (!a || !b) return false;
    [a.row, b.row] = [b.row, a.row];
    [a.col, b.col] = [b.col, a.col];
    return true;
  }

  findPane(paneId: string): PaneConfig | undefined {
    return this.grid?.panes.find((p) => p.id === paneId);
  }

  getAllPanes(): PaneConfig[] {
    return this.grid?.panes ?? [];
  }

  equalize(): GridLayout | null {
    if (!this.grid) return null;
    const total = this.grid.panes.length;
    const cols = this.grid.cols;
    for (let i = 0; i < total; i++) {
      this.grid.panes[i].row = Math.floor(i / cols);
      this.grid.panes[i].col = i % cols;
      this.grid.panes[i].rowSpan = 1;
      this.grid.panes[i].colSpan = 1;
    }
    this.grid.rows = Math.ceil(total / cols);
    return this.grid;
  }

  // ─── Recursive Sub-Grids ───

  createSubGrid(
    parentPaneId: string,
    rows: number,
    cols: number,
    agent: CliTool,
    cwd: string,
  ): GridLayout | null {
    if (!this.grid) return null;
    const maxDepth = this.grid.maxDepth ?? 3;
    const currentDepth = this.grid.depth ?? 0;
    if (currentDepth >= maxDepth) return null;

    const subGrid: GridLayout = {
      rows,
      cols,
      panes: [],
      depth: currentDepth + 1,
      maxDepth,
      parentGridId: parentPaneId,
      companyId: `${this.grid.companyId ?? "root"}-${parentPaneId}`,
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        subGrid.panes.push({
          id: randomUUID().slice(0, 8),
          label: `Sub-Agent ${r * cols + c + 1}`,
          status: "idle",
          agent,
          cwd,
          row: r,
          col: c,
          rowSpan: 1,
          colSpan: 1,
        });
      }
    }

    if (!this.grid.subGrids) this.grid.subGrids = [];
    this.grid.subGrids.push(subGrid);
    return subGrid;
  }

  getSubGrids(): GridLayout[] {
    return this.grid?.subGrids ?? [];
  }

  getDepth(): number {
    return this.grid?.depth ?? 0;
  }

  getMaxDepth(): number {
    return this.grid?.maxDepth ?? 3;
  }

  // ─── Presets ───

  savePreset(name: string, description?: string): Preset {
    if (!this.grid) throw new Error("No active grid to save");
    const preset: Preset = {
      name,
      description,
      grid: structuredClone(this.grid),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeFileSync(join(PRESETS_DIR, `${name}.json`), JSON.stringify(preset, null, 2));
    return preset;
  }

  /** Resolve preset file path — checks user presets first, then built-in */
  private resolvePresetPath(name: string): string | null {
    const userFile = join(PRESETS_DIR, `${name}.json`);
    if (existsSync(userFile)) return userFile;
    const builtInFile = join(BUILT_IN_PRESETS_DIR, `${name}.json`);
    if (existsSync(builtInFile)) return builtInFile;
    return null;
  }

  /** Convert legacy preset format to proper GridLayout */
  private convertLegacyPreset(data: LegacyPreset, cwd?: string): GridLayout {
    const paneCount = data.panes.length;
    const cols = paneCount <= 2 ? paneCount : paneCount <= 4 ? 2 : 3;
    const rows = Math.ceil(paneCount / cols);
    const panes: PaneConfig[] = data.panes.map((p, i) => ({
      id: randomUUID().slice(0, 8),
      label: p.name,
      status: "idle" as PaneStatus,
      agent: (p.agent === "claude" ? "claude" : p.agent) as CliTool,
      cwd: cwd ?? process.cwd(),
      row: Math.floor(i / cols),
      col: i % cols,
      rowSpan: 1,
      colSpan: 1,
    }));
    return { rows, cols, panes };
  }

  /** Load preset with metadata (for missions, category, etc.) */
  loadPresetFull(name: string): { grid: GridLayout; preset: Preset | LegacyPreset } | null {
    const file = this.resolvePresetPath(name);
    if (!file) return null;
    const raw = JSON.parse(readFileSync(file, "utf-8"));
    // Detect format: proper Preset has `grid` property, legacy has top-level `panes` array
    if (raw.grid && raw.grid.panes) {
      const preset = raw as Preset;
      this.grid = preset.grid;
      return { grid: this.grid, preset };
    }
    // Legacy format: top-level panes array
    if (raw.panes && Array.isArray(raw.panes)) {
      const legacy = raw as LegacyPreset;
      this.grid = this.convertLegacyPreset(legacy);
      return { grid: this.grid, preset: legacy };
    }
    return null;
  }

  loadPreset(name: string): GridLayout | null {
    const result = this.loadPresetFull(name);
    return result?.grid ?? null;
  }

  /** Read raw preset data without activating it */
  readPresetRaw(name: string): Record<string, unknown> | null {
    const file = this.resolvePresetPath(name);
    if (!file) return null;
    return JSON.parse(readFileSync(file, "utf-8"));
  }

  listPresets(): string[] {
    const names = new Set<string>();
    // User presets
    if (existsSync(PRESETS_DIR)) {
      for (const f of readdirSync(PRESETS_DIR)) {
        if (f.endsWith(".json")) names.add(f.replace(".json", ""));
      }
    }
    // Built-in presets
    if (existsSync(BUILT_IN_PRESETS_DIR)) {
      for (const f of readdirSync(BUILT_IN_PRESETS_DIR)) {
        if (f.endsWith(".json")) names.add(f.replace(".json", ""));
      }
    }
    return Array.from(names).sort();
  }

  deletePreset(name: string): boolean {
    const file = join(PRESETS_DIR, `${name}.json`);
    if (!existsSync(file)) return false;
    unlinkSync(file);
    return true;
  }

  // ─── Session persistence ───

  saveSession(): void {
    if (!this.grid) return;
    writeFileSync(
      SESSION_FILE,
      JSON.stringify(
        {
          grid: this.grid,
          savedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  }

  restoreSession(): GridLayout | null {
    if (!existsSync(SESSION_FILE)) return null;
    const data = JSON.parse(readFileSync(SESSION_FILE, "utf-8"));
    this.grid = data.grid;
    return this.grid;
  }

  // ─── Session History ───

  private get historyFile(): string {
    return join(DATA_DIR, "session-history.json");
  }

  /**
   * Record a completed session in history.
   */
  recordSession(summary?: string): void {
    if (!this.grid) return;

    const entry = {
      id: randomUUID().slice(0, 8),
      timestamp: new Date().toISOString(),
      grid: { rows: this.grid.rows, cols: this.grid.cols },
      paneCount: this.grid.panes.length,
      doneCount: this.grid.panes.filter((p) => p.status === "done").length,
      errorCount: this.grid.panes.filter((p) => p.status === "error").length,
      agents: [...new Set(this.grid.panes.map((p) => p.agent))],
      labels: this.grid.panes.map((p) => p.label),
      summary,
    };

    const history = this.getSessionHistory();
    history.unshift(entry); // newest first
    // Keep last 100 sessions
    if (history.length > 100) history.length = 100;

    writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
  }

  /**
   * Get session history (most recent first).
   */
  getSessionHistory(): Array<{
    id: string;
    timestamp: string;
    grid: { rows: number; cols: number };
    paneCount: number;
    doneCount: number;
    errorCount: number;
    agents: string[];
    labels: string[];
    summary?: string;
  }> {
    if (!existsSync(this.historyFile)) return [];
    try {
      return JSON.parse(readFileSync(this.historyFile, "utf-8"));
    } catch {
      return [];
    }
  }
}
