/**
 * Preload — Expose type-safe IPC API to renderer via contextBridge
 */

import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/types";
import type { CliTool, GridLayout, PaneStatus, ToolConfig } from "../shared/types";

const api = {
  // ─── Grid ───
  grid: {
    create: (
      rows: number,
      cols: number,
      agent: CliTool,
      cwd: string,
      model?: string,
      effort?: string,
    ) => ipcRenderer.invoke(IPC.GRID_CREATE, { rows, cols, agent, cwd, model, effort }),
    get: () => ipcRenderer.invoke(IPC.GRID_GET) as Promise<GridLayout | null>,
    save: (name: string) => ipcRenderer.invoke(IPC.GRID_SAVE, { name }),
    restore: () => ipcRenderer.invoke(IPC.GRID_RESTORE),
    equalize: () => ipcRenderer.invoke(IPC.GRID_EQUALIZE) as Promise<GridLayout | null>,
    undo: () => ipcRenderer.invoke(IPC.GRID_UNDO) as Promise<GridLayout | null>,
    redo: () => ipcRenderer.invoke(IPC.GRID_REDO) as Promise<GridLayout | null>,
  },

  // ─── Pane ───
  pane: {
    add: (agent: CliTool, cwd: string) => ipcRenderer.invoke(IPC.PANE_ADD, { agent, cwd }),
    remove: (paneId: string) => ipcRenderer.invoke(IPC.PANE_REMOVE, { paneId }),
    rename: (paneId: string, label: string) =>
      ipcRenderer.invoke(IPC.PANE_RENAME, { paneId, label }),
    setStatus: (paneId: string, status: PaneStatus) =>
      ipcRenderer.invoke(IPC.PANE_STATUS, { paneId, status }),
    swap: (paneIdA: string, paneIdB: string) =>
      ipcRenderer.invoke(IPC.PANE_SWAP, { paneIdA, paneIdB }),
    focus: (paneId: string) => ipcRenderer.invoke(IPC.PANE_FOCUS, { paneId }),
    broadcast: (text: string) => ipcRenderer.invoke(IPC.PANE_BROADCAST, { text }),
    broadcastSubset: (paneIds: string[], text: string) =>
      ipcRenderer.invoke(IPC.PANE_BROADCAST_SUBSET, { paneIds, text }),
    restart: (paneId: string) => ipcRenderer.invoke(IPC.PANE_RESTART, { paneId }),
    setModel: (paneId: string, model: string) =>
      ipcRenderer.invoke(IPC.PANE_SET_MODEL, { paneId, model }),
    setEffort: (paneId: string, effort: string) =>
      ipcRenderer.invoke(IPC.PANE_SET_EFFORT, { paneId, effort }),
    setCwd: (paneId: string, cwd: string) => ipcRenderer.invoke(IPC.PANE_SET_CWD, { paneId, cwd }),
    pickCwd: () => ipcRenderer.invoke(IPC.PANE_PICK_CWD) as Promise<string | null>,
  },

  // ─── Terminal ───
  // Buffer terminal data PER-PANE before renderer subscribes.
  // Each pane gets its own buffer so panes 2-4 don't miss startup output (B04 fix).
  terminal: (() => {
    const paneBuffers = new Map<string, Array<{ paneId: string; data: string }>>();
    const subscribedPanes = new Set<string>();
    const subscribers: Set<(data: { paneId: string; data: string }) => void> = new Set();

    // Start listening immediately — buffer per-pane until that pane subscribes
    ipcRenderer.on(
      IPC.TERMINAL_DATA,
      (_event: Electron.IpcRendererEvent, payload: { paneId: string; data: string }) => {
        if (subscribers.size > 0) {
          for (const sub of subscribers) sub(payload);
        }
        // Also buffer for panes that haven't subscribed yet
        if (!subscribedPanes.has(payload.paneId)) {
          let buf = paneBuffers.get(payload.paneId);
          if (!buf) {
            buf = [];
            paneBuffers.set(payload.paneId, buf);
          }
          buf.push(payload);
        }
      },
    );

    return {
      spawn: (paneId: string, cwd: string, agent: CliTool) =>
        ipcRenderer.invoke(IPC.TERMINAL_SPAWN, { paneId, cwd, agent }),
      write: (paneId: string, data: string) =>
        ipcRenderer.send(IPC.TERMINAL_INPUT, { paneId, data }),
      resize: (paneId: string, cols: number, rows: number) =>
        ipcRenderer.send(IPC.TERMINAL_RESIZE, { paneId, cols, rows }),
      kill: (paneId: string) => ipcRenderer.invoke(IPC.TERMINAL_KILL, { paneId }),
      injectFile: (paneId: string, filePath: string) =>
        ipcRenderer.invoke(IPC.TERMINAL_INJECT_FILE, { paneId, filePath }),
      autoApprove: () => ipcRenderer.invoke(IPC.TERMINAL_AUTO_APPROVE),
      getStats: (paneId: string) => ipcRenderer.invoke(IPC.TERMINAL_STATS, { paneId }),
      getAllStats: () => ipcRenderer.invoke(IPC.TERMINAL_STATS_ALL),
      saveScrollback: (paneId: string, content: string) =>
        ipcRenderer.invoke(IPC.TERMINAL_SAVE_SCROLLBACK, { paneId, content }),
      restoreScrollback: (paneId: string) =>
        ipcRenderer.invoke(IPC.TERMINAL_RESTORE_SCROLLBACK, { paneId }) as Promise<{
          paneId: string;
          content: string;
          savedAt: number;
        } | null>,
      restartWithContext: (paneId: string, context?: string) =>
        ipcRenderer.invoke(IPC.TERMINAL_RESTART_WITH_CONTEXT, { paneId, context }),
      migratePane: (oldPaneId: string) =>
        ipcRenderer.invoke(IPC.TERMINAL_MIGRATE_PANE, { oldPaneId }),
      onCompaction: (
        callback: (data: { paneId: string; count: number; timestamp: number }) => void,
      ) => {
        const handler = (_e: Electron.IpcRendererEvent, data: Parameters<typeof callback>[0]) =>
          callback(data);
        ipcRenderer.on(IPC.TERMINAL_COMPACTION_DETECTED, handler);
        return () => ipcRenderer.removeListener(IPC.TERMINAL_COMPACTION_DETECTED, handler);
      },
      onMemoryWarning: (
        callback: (data: { paneId: string; percentage: number; level: string }) => void,
      ) => {
        const handler = (_e: Electron.IpcRendererEvent, data: Parameters<typeof callback>[0]) =>
          callback(data);
        ipcRenderer.on(IPC.TERMINAL_MEMORY_WARNING, handler);
        return () => ipcRenderer.removeListener(IPC.TERMINAL_MEMORY_WARNING, handler);
      },
      onData: (callback: (data: { paneId: string; data: string }) => void) => {
        subscribers.add(callback);
        return () => {
          subscribers.delete(callback);
        };
      },
      // Per-pane replay: call when a TerminalPane mounts to get its buffered startup data
      replayBuffer: (
        paneId: string,
        callback: (data: { paneId: string; data: string }) => void,
      ) => {
        subscribedPanes.add(paneId);
        const buf = paneBuffers.get(paneId);
        if (buf && buf.length > 0) {
          for (const item of buf) callback(item);
          paneBuffers.delete(paneId);
        }
      },
    };
  })(),

  // ─── Presets ───
  preset: {
    list: () => ipcRenderer.invoke(IPC.PRESET_LIST) as Promise<string[]>,
    save: (name: string) => ipcRenderer.invoke(IPC.PRESET_SAVE, { name }),
    load: (name: string) => ipcRenderer.invoke(IPC.PRESET_LOAD, { name }),
    delete: (name: string) => ipcRenderer.invoke(IPC.PRESET_DELETE, { name }),
    export: (name: string) =>
      ipcRenderer.invoke(IPC.PRESET_EXPORT, { name }) as Promise<string | null>,
    import: (json: string) => ipcRenderer.invoke(IPC.PRESET_IMPORT, { json }) as Promise<boolean>,
    info: (name: string) =>
      ipcRenderer.invoke(IPC.PRESET_INFO, { name }) as Promise<Record<string, unknown> | null>,
    history: () => ipcRenderer.invoke(IPC.PRESET_HISTORY) as Promise<string[]>,
    validate: (name: string) =>
      ipcRenderer.invoke(IPC.PRESET_VALIDATE, { name }) as Promise<{
        valid: boolean;
        error?: string;
        paneCount?: number;
        warnings?: string[];
      }>,
    fromHarness: (harnessName: string) =>
      ipcRenderer.invoke(IPC.PRESET_FROM_HARNESS, { harnessName }) as Promise<Record<
        string,
        unknown
      > | null>,
  },

  // ─── Persona Registry ───
  persona: {
    list: () => ipcRenderer.invoke(IPC.PERSONA_LIST) as Promise<unknown[]>,
    get: (id: string) => ipcRenderer.invoke(IPC.PERSONA_GET, { id }),
    grouped: () => ipcRenderer.invoke(IPC.PERSONA_GROUPED) as Promise<Record<string, unknown[]>>,
    register: (persona: unknown) => ipcRenderer.invoke(IPC.PERSONA_REGISTER, { persona }),
    delete: (id: string) => ipcRenderer.invoke(IPC.PERSONA_DELETE, { id }),
    exportCustom: () => ipcRenderer.invoke(IPC.PERSONA_EXPORT) as Promise<string>,
    importJson: (json: string) =>
      ipcRenderer.invoke(IPC.PERSONA_IMPORT, { json }) as Promise<number>,
    setPane: (paneId: string, personaId: string) =>
      ipcRenderer.invoke(IPC.PERSONA_SET_PANE, { paneId, personaId }),
  },

  // ─── Session ───
  session: {
    save: () => ipcRenderer.invoke(IPC.SESSION_SAVE),
    restore: () => ipcRenderer.invoke(IPC.SESSION_RESTORE),
  },

  // ─── Tools ───
  tools: {
    getConfig: (cwd: string) =>
      ipcRenderer.invoke(IPC.TOOLS_GET_CONFIG, {
        cwd,
      }) as Promise<ToolConfig>,
    setConfig: (config: Partial<ToolConfig>) => ipcRenderer.invoke(IPC.TOOLS_SET_CONFIG, config),
    detect: () =>
      ipcRenderer.invoke("tools:detect") as Promise<Array<{ tool: string; path: string }>>,
  },

  // ─── Pane restart ───
  restart: {
    pane: (paneId: string) => ipcRenderer.invoke("pane:restart", { paneId }),
  },

  // ─── Pane Memory (Feature 48) ───
  paneMemory: {
    set: (paneId: string, key: string, value: string) =>
      ipcRenderer.invoke("pane:memory:set", { paneId, key, value }),
    get: (paneId: string) =>
      ipcRenderer.invoke("pane:memory:get", { paneId }) as Promise<Record<string, string>>,
  },

  // ─── CEO Log ───
  ceoLog: {
    getAll: () => ipcRenderer.invoke(IPC.CEO_LOG_GET),
    onEntry: (
      callback: (entry: {
        timestamp: number;
        level: string;
        message: string;
        paneId?: string;
        agentAction?: string;
      }) => void,
    ) => {
      const handler = (_e: Electron.IpcRendererEvent, entry: Parameters<typeof callback>[0]) =>
        callback(entry);
      ipcRenderer.on(IPC.CEO_LOG_ENTRY, handler);
      return () => ipcRenderer.removeListener(IPC.CEO_LOG_ENTRY, handler);
    },
  },

  // ─── Council ───
  council: {
    start: (topic: string, paneIds: string[], mode?: "parallel" | "debate") =>
      ipcRenderer.invoke(IPC.COUNCIL_START, { topic, paneIds, mode }),
    vote: (councilId: string, paneId: string, position: string, reasoning: string) =>
      ipcRenderer.invoke(IPC.COUNCIL_VOTE, { councilId, paneId, position, reasoning }),
    result: (councilId: string) => ipcRenderer.invoke(IPC.COUNCIL_RESULT, { councilId }),
    list: () => ipcRenderer.invoke(IPC.COUNCIL_LIST),
    devilsAdvocate: (councilId: string) =>
      ipcRenderer.invoke(IPC.COUNCIL_DEVILS_ADVOCATE, { councilId }),
    summary: (councilId: string) => ipcRenderer.invoke(IPC.COUNCIL_SUMMARY, { councilId }),
    history: () => ipcRenderer.invoke(IPC.COUNCIL_HISTORY),
    onUpdated: (callback: (session: unknown) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, session: unknown) => callback(session);
      ipcRenderer.on("council:updated", handler);
      return () => ipcRenderer.removeListener("council:updated", handler);
    },
  },

  // ─── Topology (Features 122-139) ───
  topology: {
    set: (topology: string, consensus?: string, queenPaneId?: string) =>
      ipcRenderer.invoke(IPC.TOPOLOGY_SET, { topology, consensus, queenPaneId }),
    get: () => ipcRenderer.invoke(IPC.TOPOLOGY_GET),
    routeMessage: (from: string, to: string) =>
      ipcRenderer.invoke(IPC.TOPOLOGY_ROUTE_MESSAGE, { from, to }),
    consensusStart: (topic: string, mode: string, participants: string[]) =>
      ipcRenderer.invoke(IPC.TOPOLOGY_CONSENSUS_START, { topic, mode, participants }),
    consensusVote: (sessionId: string, paneId: string, vote: string) =>
      ipcRenderer.invoke(IPC.TOPOLOGY_CONSENSUS_VOTE, { sessionId, paneId, vote }),
    consensusResult: (sessionId: string) =>
      ipcRenderer.invoke(IPC.TOPOLOGY_CONSENSUS_RESULT, { sessionId }),
    conflictCheck: (paneId: string, filePath: string) =>
      ipcRenderer.invoke(IPC.TOPOLOGY_CONFLICT_CHECK, { paneId, filePath }),
    conflictList: () => ipcRenderer.invoke(IPC.TOPOLOGY_CONFLICT_LIST),
    onChange: (callback: (config: unknown) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, config: unknown) => callback(config);
      ipcRenderer.on("topology:changed", handler);
      return () => ipcRenderer.removeListener("topology:changed", handler);
    },
  },

  // ─── Settings ───
  settings: {
    get: (key: string) => ipcRenderer.invoke(IPC.SETTINGS_GET, { key }),
    set: (key: string, value: unknown) => ipcRenderer.invoke(IPC.SETTINGS_SET, { key, value }),
    getAll: () => ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),
    onChange: (callback: (change: { key: string; value: unknown }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, change: { key: string; value: unknown }) =>
        callback(change);
      ipcRenderer.on("settings:changed", handler);
      return () => ipcRenderer.removeListener("settings:changed", handler);
    },
  },

  // ─── GitHub (Features 142-147) ───
  github: {
    createIssue: (cwd: string, title: string, body: string, labels?: string[]) =>
      ipcRenderer.invoke(IPC.GITHUB_CREATE_ISSUE, { cwd, title, body, labels }),
    createPR: (title: string, body: string, cwd: string, branch?: string) =>
      ipcRenderer.invoke(IPC.GITHUB_CREATE_PR, { title, body, cwd, branch }),
    status: (cwd: string) => ipcRenderer.invoke(IPC.GITHUB_STATUS, { cwd }),
    listPRs: (cwd: string) => ipcRenderer.invoke(IPC.GITHUB_LIST_PRS, { cwd }),
    repoInfo: (cwd: string) => ipcRenderer.invoke(IPC.GITHUB_REPO_INFO, { cwd }),
    prStatus: (cwd: string) => ipcRenderer.invoke(IPC.GITHUB_PR_STATUS, { cwd }),
    actionsStatus: (cwd: string) => ipcRenderer.invoke(IPC.GITHUB_ACTIONS_STATUS, { cwd }),
    gitInfo: (cwd: string) => ipcRenderer.invoke(IPC.GITHUB_GIT_INFO, { cwd }),
  },

  // ─── Signals ───
  signals: {
    start: (cwd: string) => ipcRenderer.invoke("signals:start", { cwd }),
    stop: () => ipcRenderer.invoke("signals:stop"),
    get: () => ipcRenderer.invoke("signals:get"),
    onSignal: (
      callback: (event: {
        role: string;
        type: string;
        content: string;
        path: string;
        timestamp: number;
      }) => void,
    ) => {
      const handler = (_e: Electron.IpcRendererEvent, event: Parameters<typeof callback>[0]) =>
        callback(event);
      ipcRenderer.on("signals:event", handler);
      return () => ipcRenderer.removeListener("signals:event", handler);
    },
  },

  // ─── Security ───
  security: {
    scan: (input: string, paneId?: string) =>
      ipcRenderer.invoke(IPC.SECURITY_SCAN, { input, paneId }),
    getConfig: () => ipcRenderer.invoke(IPC.SECURITY_GET_CONFIG),
    setConfig: (config: Record<string, boolean>) =>
      ipcRenderer.invoke(IPC.SECURITY_SET_CONFIG, config),
    getStats: () => ipcRenderer.invoke(IPC.SECURITY_GET_STATS),
    getLog: (limit?: number) => ipcRenderer.invoke(IPC.SECURITY_GET_LOG, { limit }),
    redact: (input: string) => ipcRenderer.invoke(IPC.SECURITY_REDACT, { input }),
    clear: () => ipcRenderer.invoke(IPC.SECURITY_CLEAR),
  },

  // ─── Cost Tracking ───
  cost: {
    getTotal: () =>
      ipcRenderer.invoke(IPC.COST_GET_TOTAL) as Promise<{ tokens: number; costUsd: number }>,
    getPane: (paneId: string) =>
      ipcRenderer.invoke(IPC.COST_GET_PANE, { paneId }) as Promise<{
        tokens: number;
        costUsd: number;
        model: string;
        wordCount: number;
      } | null>,
    getTimeline: (paneId: string) =>
      ipcRenderer.invoke(IPC.COST_GET_TIMELINE, { paneId }) as Promise<
        Array<{ timestamp: number; tokens: number; costUsd: number }>
      >,
    getComparison: () =>
      ipcRenderer.invoke(IPC.COST_GET_COMPARISON) as Promise<Record<string, number>>,
    exportCsv: () => ipcRenderer.invoke(IPC.COST_EXPORT_CSV) as Promise<string>,
    getBudget: () => ipcRenderer.invoke(IPC.COST_GET_BUDGET) as Promise<number>,
    setBudget: (usd: number) => ipcRenderer.invoke(IPC.COST_SET_BUDGET, { usd }),
  },

  // ─── Workspaces (Features 148-153) ───
  workspace: {
    create: (name: string, description?: string, defaultPreset?: string) =>
      ipcRenderer.invoke(IPC.WORKSPACE_CREATE, { name, description, defaultPreset }),
    list: () => ipcRenderer.invoke(IPC.WORKSPACE_LIST),
    get: (id: string) => ipcRenderer.invoke(IPC.WORKSPACE_GET, { id }),
    delete: (id: string) => ipcRenderer.invoke(IPC.WORKSPACE_DELETE, { id }),
    switch: (id: string) => ipcRenderer.invoke(IPC.WORKSPACE_SWITCH, { id }),
    export: (id: string) =>
      ipcRenderer.invoke(IPC.WORKSPACE_EXPORT, { id }) as Promise<string | null>,
    import: (json: string) => ipcRenderer.invoke(IPC.WORKSPACE_IMPORT, { json }),
    getActive: () => ipcRenderer.invoke(IPC.WORKSPACE_GET_ACTIVE),
    getRecent: () => ipcRenderer.invoke(IPC.WORKSPACE_GET_RECENT),
  },

  // ─── Onboarding & License ───
  onboarding: {
    getState: () =>
      ipcRenderer.invoke(IPC.ONBOARDING_GET_STATE) as Promise<{
        complete: boolean;
        licenseKey: string;
      }>,
    complete: () => ipcRenderer.invoke(IPC.ONBOARDING_COMPLETE) as Promise<{ success: boolean }>,
  },
  license: {
    get: () => ipcRenderer.invoke(IPC.LICENSE_GET) as Promise<string>,
    set: (key: string) =>
      ipcRenderer.invoke(IPC.LICENSE_SET, { key }) as Promise<{ success: boolean }>,
    validate: (key: string) =>
      ipcRenderer.invoke(IPC.LICENSE_VALIDATE, { key }) as Promise<{
        valid: boolean;
        message: string;
      }>,
  },

  // ─── App ───
  app: {
    getInfo: () =>
      ipcRenderer.invoke(IPC.APP_GET_INFO) as Promise<{
        version: string;
        platform: string;
        homeDir: string;
        cwd: string;
      }>,
  },
};

export type AgentGridAPI = typeof api;

contextBridge.exposeInMainWorld("api", api);
