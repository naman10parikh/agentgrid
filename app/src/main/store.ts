/**
 * Persistent Store — electron-store backed local state
 * Stores workspace config, session history, agent memory, and preferences.
 */

import Store from "electron-store";
import type { GridLayout, TerminalThemeName, CouncilSession } from "../shared/types";

interface StoreSchema {
  // Workspace
  lastWorkingDirectory: string;
  defaultAgent: string;
  defaultModel: string;
  defaultEffort: string;
  autoApprovePermissions: boolean;
  maxRecursionDepth: number;

  // Session history
  sessions: SessionRecord[];
  currentSessionId: string | null;

  // Grid state
  lastGrid: GridLayout | null;

  // Agent memory (persists across sessions)
  agentMemory: Record<string, AgentMemoryEntry[]>;

  // Per-pane memory (key-value pairs scoped to pane ID)
  paneMemory: Record<string, Record<string, string>>;

  // Preset history (last 5 loaded)
  presetHistory: string[];

  // Preferences
  theme: "dark" | "light";
  terminalFontSize: number;
  terminalFontFamily: string;
  terminalCursorStyle: "block" | "underline" | "bar";
  terminalCursorBlink: boolean;
  terminalScrollback: number;
  terminalTheme: TerminalThemeName;
  copyOnSelect: boolean;
  councilHistory: CouncilSession[];
  showStatusBar: boolean;
  showControlBar: boolean;
  soundEnabled: boolean;

  // Cost tracking
  costBudgetUsd: number;
  presetCostHistory: Record<string, PresetCostEntry[]>;

  // Onboarding & License
  onboardingComplete: boolean;
  licenseKey: string;

  // Workspaces
  activeWorkspaceId: string | null;
  recentWorkspaceIds: string[];
  workspaceSettings: Record<string, WorkspaceSettings>;
}

interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  gridConfig: string; // JSON of GridLayout
  totalPanes: number;
  filesModified: number;
  estimatedCostUsd: number;
}

export interface WorkspaceSettings {
  model: string;
  effort: string;
  theme: "dark" | "light";
  defaultPreset?: string;
}

export interface PresetCostEntry {
  presetName: string;
  totalCostUsd: number;
  totalTokens: number;
  duration: number; // ms
  paneCount: number;
  timestamp: number;
}

interface AgentMemoryEntry {
  key: string;
  value: string;
  createdAt: number;
  source: string; // which pane/session created this
}

const store = new Store<StoreSchema>({
  name: "agentgrid-state",
  defaults: {
    lastWorkingDirectory: process.cwd(),
    defaultAgent: "claude",
    defaultModel: "claude-opus-4-6",
    defaultEffort: "max",
    autoApprovePermissions: true,
    maxRecursionDepth: 3,
    sessions: [],
    currentSessionId: null,
    lastGrid: null,
    agentMemory: {},
    paneMemory: {},
    presetHistory: [],
    theme: "dark",
    terminalFontSize: 13,
    terminalFontFamily: "'JetBrains Mono', monospace",
    terminalCursorStyle: "bar",
    terminalCursorBlink: true,
    terminalScrollback: 50000,
    terminalTheme: "dark",
    copyOnSelect: true,
    councilHistory: [],
    showStatusBar: true,
    showControlBar: true,
    soundEnabled: true,
    costBudgetUsd: 5,
    presetCostHistory: {},
    onboardingComplete: false,
    licenseKey: "",
    activeWorkspaceId: null,
    recentWorkspaceIds: [],
    workspaceSettings: {},
  },
});

export function getStore(): Store<StoreSchema> {
  return store;
}

export function saveGridState(grid: GridLayout): void {
  store.set("lastGrid", grid);
}

export function loadGridState(): GridLayout | null {
  return store.get("lastGrid");
}

export function addSessionRecord(record: SessionRecord): void {
  const sessions = store.get("sessions");
  sessions.push(record);
  // Keep last 100 sessions
  if (sessions.length > 100) {
    sessions.splice(0, sessions.length - 100);
  }
  store.set("sessions", sessions);
}

export function getSessionHistory(): SessionRecord[] {
  return store.get("sessions");
}

export function setAgentMemory(
  paneLabel: string,
  key: string,
  value: string,
  source: string,
): void {
  const memory = store.get("agentMemory");
  if (!memory[paneLabel]) {
    memory[paneLabel] = [];
  }
  // Update existing or add new
  const existing = memory[paneLabel].find((m) => m.key === key);
  if (existing) {
    existing.value = value;
    existing.createdAt = Date.now();
    existing.source = source;
  } else {
    memory[paneLabel].push({ key, value, createdAt: Date.now(), source });
  }
  store.set("agentMemory", memory);
}

export function getAgentMemory(paneLabel: string): AgentMemoryEntry[] {
  return store.get("agentMemory")[paneLabel] ?? [];
}

export function getPreference<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
  return store.get(key);
}

export function setPreference<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
  store.set(key, value);
}

// ─── Per-pane memory (Feature 48) ───

export function setPaneMemory(paneId: string, key: string, value: string): void {
  const all = store.get("paneMemory");
  if (!all[paneId]) all[paneId] = {};
  all[paneId][key] = value;
  store.set("paneMemory", all);
}

export function getPaneMemory(paneId: string): Record<string, string> {
  return store.get("paneMemory")[paneId] ?? {};
}

export function clearPaneMemory(paneId: string): void {
  const all = store.get("paneMemory");
  delete all[paneId];
  store.set("paneMemory", all);
}

// ─── Cost tracking (Features 114-121) ───

export function getCostBudget(): number {
  return store.get("costBudgetUsd");
}

export function setCostBudget(usd: number): void {
  store.set("costBudgetUsd", usd);
}

export function addPresetCostEntry(entry: PresetCostEntry): void {
  const history = store.get("presetCostHistory");
  const key = entry.presetName;
  if (!history[key]) history[key] = [];
  history[key].push(entry);
  // Keep last 50 entries per preset
  if (history[key].length > 50) {
    history[key] = history[key].slice(-50);
  }
  store.set("presetCostHistory", history);
}

export function getPresetCostHistory(presetName: string): PresetCostEntry[] {
  return store.get("presetCostHistory")[presetName] ?? [];
}

export function getAveragePresetCost(presetName: string): number {
  const entries = getPresetCostHistory(presetName);
  if (entries.length === 0) return 0;
  return entries.reduce((sum, e) => sum + e.totalCostUsd, 0) / entries.length;
}

// ─── Workspace management (Features 148-153) ───

export function getActiveWorkspaceId(): string | null {
  return store.get("activeWorkspaceId");
}

export function setActiveWorkspaceId(id: string | null): void {
  store.set("activeWorkspaceId", id);
  if (id) addRecentWorkspace(id);
}

export function getRecentWorkspaceIds(): string[] {
  return store.get("recentWorkspaceIds");
}

export function addRecentWorkspace(id: string): void {
  const recent = store.get("recentWorkspaceIds").filter((r) => r !== id);
  recent.unshift(id);
  store.set("recentWorkspaceIds", recent.slice(0, 10));
}

export function getWorkspaceSettings(workspaceId: string): WorkspaceSettings {
  const all = store.get("workspaceSettings");
  return all[workspaceId] ?? { model: "claude-opus-4-6", effort: "max", theme: "dark" };
}

export function setWorkspaceSettings(workspaceId: string, settings: WorkspaceSettings): void {
  const all = store.get("workspaceSettings");
  all[workspaceId] = settings;
  store.set("workspaceSettings", all);
}
