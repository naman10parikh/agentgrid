/**
 * AgentGrid App — Main Process
 * Window management, IPC handlers, menu, keyboard shortcuts.
 */

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  Notification,
  Tray,
  nativeImage,
  type MenuItemConstructorOptions,
} from "electron";
import { join } from "path";
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from "fs";
import { homedir } from "os";
import { execSync, execFileSync } from "child_process";

// ─── Crash reporting ───
process.on("uncaughtException", (err) => {
  const logDir = join(homedir(), ".agentgrid", "crash-reports");
  mkdirSync(logDir, { recursive: true });
  const report = `[${new Date().toISOString()}] ${err.stack ?? err.message}\n`;
  writeFileSync(join(logDir, `crash-${Date.now()}.log`), report);
  console.error("AgentGrid crash:", err.message);
});

import { TerminalManager } from "./terminal-manager";
import { GridManager } from "./grid-manager";
import { ToolInjector } from "./tool-injector";
import { SignalWatcher } from "./signal-watcher";
import { HarnessLoader } from "./harness-loader";
import { RpcServer } from "./rpc-server";
import { WebhookManager } from "./webhook-manager";
import { PersonaRegistry } from "./persona-registry";
import { SecurityScanner } from "./security";
import { GitHubIntegration } from "./github-integration";
import {
  routeMessage,
  getValidTargets,
  startConsensus as topoStartConsensus,
  castVote as topoCastVote,
  getConsensusSession as topoGetConsensusSession,
  recordFileAccess,
  getActiveConflicts,
  resolveConflict,
  createTopologyConfig,
} from "./swarm-topology";
import type { TopologyConfig, SwarmTopology, ConsensusMode } from "../shared/types";
import { TeamWorkspaceManager } from "./team-workspace";
import {
  getPreference,
  setPreference,
  getRecentWorkspaceIds,
  addRecentWorkspace,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  getWorkspaceSettings,
  setWorkspaceSettings,
  getCostBudget,
  setCostBudget,
  addPresetCostEntry,
  setPaneMemory,
  getPaneMemory,
} from "./store";
import { IPC } from "../shared/types";
import type { CliTool, PaneStatus } from "../shared/types";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const terminalManager = new TerminalManager();
const gridManager = new GridManager();
const toolInjector = new ToolInjector();
const signalWatcher = new SignalWatcher();
const harnessLoader = new HarnessLoader();
const rpcServer = new RpcServer();
const webhookManager = new WebhookManager();
const personaRegistry = new PersonaRegistry();
const securityScanner = new SecurityScanner();
const githubIntegration = new GitHubIntegration();

// ─── CEO Log (in-memory) ───
interface CEOLogEntry {
  timestamp: number;
  level: "info" | "warning" | "error" | "decision" | "experiment";
  message: string;
  paneId?: string;
  agentAction?: string;
}
const ceoLog: CEOLogEntry[] = [];

function logCEO(entry: Omit<CEOLogEntry, "timestamp">): void {
  const full = { ...entry, timestamp: Date.now() };
  ceoLog.push(full);
  if (mainWindow) {
    mainWindow.webContents.send(IPC.CEO_LOG_ENTRY, full);
  }
}

// ─── Shared Task List ───
interface SharedTask {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "done";
  assignee?: string;
  createdAt: number;
}
let taskIdCounter = 1;
const sharedTasks: SharedTask[] = [];

// ─── Window ───

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#141312",
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // needed for node-pty via preload
    },
  });

  // Dev or production
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.show();

  mainWindow.on("closed", () => {
    mainWindow = null;
    terminalManager.killAll();
  });
}

// ─── IPC Handlers ───

function registerIpcHandlers(): void {
  // Guard: remove all existing handlers first (prevents duplicate registration on hot-reload)
  const channels = Object.values(IPC);
  for (const ch of channels) {
    try {
      ipcMain.removeHandler(ch);
    } catch {
      /* not registered yet */
    }
  }
  // Also remove string-based handlers
  for (const ch of [
    "harness:templates",
    "harness:fromGrid",
    "harness:list",
    "harness:load",
    "harness:save",
    "harness:delete",
    "tools:detect",
    "signals:start",
    "signals:stop",
    "signals:get",
    "ceo:monitor",
    "webhook:remove",
    "webhook:list",
    "webhook:test",
  ]) {
    try {
      ipcMain.removeHandler(ch);
    } catch {
      /* ok */
    }
  }

  // Grid
  ipcMain.handle(
    IPC.GRID_CREATE,
    (
      _e,
      args: {
        rows: number;
        cols: number;
        agent: CliTool;
        cwd: string;
        model?: string;
        effort?: string;
      },
    ) => {
      const grid = gridManager.create(args.rows, args.cols, args.agent, args.cwd);
      logCEO({
        level: "info",
        message: `Grid ${args.rows}×${args.cols} created with ${grid.panes.length} ${args.agent} agents`,
      });
      // Stagger tmux session creation (500ms apart) — gives tmux server time to stabilize
      // Even though tmux is sequential, the PTY attach is async and needs breathing room
      for (let i = 0; i < grid.panes.length; i++) {
        const pane = grid.panes[i];
        pane.model = args.model || "claude-opus-4-6";
        pane.effort = (args.effort || "max") as import("../shared/types").EffortLevel;
        setTimeout(() => {
          spawnTerminalForPane(pane.id, args.cwd, args.agent);
        }, i * 500);
      }
      return grid;
    },
  );

  ipcMain.handle(IPC.GRID_GET, () => gridManager.get());

  ipcMain.handle(IPC.GRID_SAVE, (_e, args: { name: string }) => {
    gridManager.savePreset(args.name);
    gridManager.saveSession();
    return true;
  });

  ipcMain.handle(
    IPC.GRID_SUB_CREATE,
    (
      _e,
      args: { parentPaneId: string; rows: number; cols: number; agent: CliTool; cwd: string },
    ) => {
      const subGrid = gridManager.createSubGrid(
        args.parentPaneId,
        args.rows,
        args.cols,
        args.agent,
        args.cwd,
      );
      if (subGrid) {
        for (const pane of subGrid.panes) {
          spawnTerminalForPane(pane.id, args.cwd, args.agent);
        }
        logCEO({
          level: "decision",
          message: `Sub-grid ${args.rows}×${args.cols} spawned from pane ${args.parentPaneId} (depth ${subGrid.depth})`,
          paneId: args.parentPaneId,
        });
      }
      return subGrid;
    },
  );

  ipcMain.handle(IPC.GRID_SUB_LIST, () => gridManager.getSubGrids());

  ipcMain.handle(IPC.GRID_RESTORE, () => {
    const grid = gridManager.restoreSession();
    return grid;
  });

  ipcMain.handle(IPC.GRID_EQUALIZE, () => {
    return gridManager.equalize();
  });

  ipcMain.handle(IPC.GRID_UNDO, () => gridManager.undo());
  ipcMain.handle(IPC.GRID_REDO, () => gridManager.redo());

  // Pane
  ipcMain.handle(IPC.PANE_ADD, (_e, args: { agent: CliTool; cwd: string }) => {
    const pane = gridManager.addPane(args.agent, args.cwd);
    if (pane) {
      spawnTerminalForPane(pane.id, args.cwd, args.agent);
      logCEO({
        level: "info",
        message: `Pane added: ${pane.label} (${args.agent})`,
        paneId: pane.id,
      });
    }
    return pane;
  });

  ipcMain.handle(IPC.PANE_REMOVE, (_e, args: { paneId: string }) => {
    const pane = gridManager.findPane(args.paneId);
    logCEO({
      level: "info",
      message: `Pane removed: ${pane?.label ?? args.paneId}`,
      paneId: args.paneId,
    });
    terminalManager.kill(args.paneId);
    return gridManager.removePane(args.paneId);
  });

  ipcMain.handle(IPC.PANE_RENAME, (_e, args: { paneId: string; label: string }) =>
    gridManager.renamePane(args.paneId, args.label),
  );

  ipcMain.handle(IPC.PANE_STATUS, (_e, args: { paneId: string; status: PaneStatus }) =>
    gridManager.setPaneStatus(args.paneId, args.status),
  );

  ipcMain.handle(IPC.PANE_SWAP, (_e, args: { paneIdA: string; paneIdB: string }) =>
    gridManager.swapPanes(args.paneIdA, args.paneIdB),
  );

  ipcMain.handle(IPC.PANE_FOCUS, (_e, _args: { paneId: string }) => {
    // Focus is renderer-side; this is a no-op on main but can trigger events
    return true;
  });

  ipcMain.handle(IPC.PANE_BROADCAST, (_e, args: { text: string }) => {
    for (const pane of gridManager.getAllPanes()) {
      terminalManager.write(pane.id, args.text + "\n");
    }
    return true;
  });

  ipcMain.handle(IPC.PANE_BROADCAST_SUBSET, (_e, args: { paneIds: string[]; text: string }) => {
    for (const id of args.paneIds) {
      terminalManager.write(id, args.text + "\n");
    }
    return true;
  });

  ipcMain.handle(IPC.PANE_SET_MODEL, (_e, args: { paneId: string; model: string }) =>
    gridManager.setPaneModel(args.paneId, args.model),
  );

  ipcMain.handle(IPC.PANE_SET_EFFORT, (_e, args: { paneId: string; effort: string }) =>
    gridManager.setPaneEffort(args.paneId, args.effort as import("../shared/types").EffortLevel),
  );

  ipcMain.handle(IPC.PANE_SET_CWD, (_e, args: { paneId: string; cwd: string }) => {
    const pane = gridManager.findPane(args.paneId);
    if (!pane) return false;
    pane.cwd = args.cwd;
    // Restart terminal with new CWD
    terminalManager.kill(args.paneId);
    gridManager.setPaneStatus(args.paneId, "idle");
    spawnTerminalForPane(args.paneId, args.cwd, pane.agent);
    logCEO({
      level: "info",
      message: `Pane ${pane.label} CWD changed to ${args.cwd}`,
      paneId: args.paneId,
    });
    return true;
  });

  ipcMain.handle(IPC.PANE_PICK_CWD, async () => {
    if (!mainWindow) return null;
    const { dialog } = await import("electron");
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Working Directory",
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC.PANE_RESTART, (_e, args: { paneId: string }) => {
    const pane = gridManager.findPane(args.paneId);
    if (!pane) return false;
    terminalManager.kill(args.paneId);
    gridManager.setPaneStatus(args.paneId, "idle");
    spawnTerminalForPane(args.paneId, pane.cwd, pane.agent);
    return true;
  });

  // Terminal
  ipcMain.handle(
    IPC.TERMINAL_SPAWN,
    (_e, args: { paneId: string; cwd: string; agent: CliTool }) => {
      spawnTerminalForPane(args.paneId, args.cwd, args.agent);
      return true;
    },
  );

  ipcMain.on(IPC.TERMINAL_INPUT, (_e, args: { paneId: string; data: string }) => {
    terminalManager.write(args.paneId, args.data);
  });

  ipcMain.on(IPC.TERMINAL_RESIZE, (_e, args: { paneId: string; cols: number; rows: number }) => {
    terminalManager.resize(args.paneId, args.cols, args.rows);
  });

  ipcMain.handle(IPC.TERMINAL_KILL, (_e, args: { paneId: string }) => {
    terminalManager.kill(args.paneId);
    return true;
  });

  ipcMain.handle(IPC.TERMINAL_INJECT_FILE, (_e, args: { paneId: string; filePath: string }) => {
    try {
      const content = readFileSync(args.filePath, "utf-8");
      terminalManager.write(args.paneId, content);
      return true;
    } catch {
      return false;
    }
  });

  // Auto-approve: send Escape then Enter to all panes to dismiss permission prompts
  ipcMain.handle(IPC.TERMINAL_AUTO_APPROVE, () => {
    for (const pane of gridManager.getAllPanes()) {
      if (terminalManager.has(pane.id)) {
        terminalManager.write(pane.id, "\x1b"); // Escape first
        setTimeout(() => {
          terminalManager.write(pane.id, "\r"); // Then Enter
        }, 100);
      }
    }
    logCEO({
      level: "info",
      message: `Auto-approved permissions on ${gridManager.getAllPanes().length} panes`,
    });
    return true;
  });

  // Terminal stats (latency, health, bytes)
  ipcMain.handle(IPC.TERMINAL_STATS, (_e, args: { paneId: string }) =>
    terminalManager.getStats(args.paneId),
  );
  ipcMain.handle(IPC.TERMINAL_STATS_ALL, () => {
    const result: Record<string, ReturnType<typeof terminalManager.getStats>> = {};
    for (const paneId of terminalManager.getAll()) {
      result[paneId] = terminalManager.getStats(paneId);
    }
    return result;
  });

  // ─── Workspaces (Features 148-153) ───
  const workspaceManager = new TeamWorkspaceManager();

  ipcMain.handle(
    IPC.WORKSPACE_CREATE,
    (_e, args: { name: string; description?: string; defaultPreset?: string }) => {
      const ws = workspaceManager.create(args.name, "local-user", args.description);
      setActiveWorkspaceId(ws.id);
      if (args.defaultPreset) {
        setWorkspaceSettings(ws.id, {
          model: "claude-opus-4-6",
          effort: "max",
          theme: "dark",
          defaultPreset: args.defaultPreset,
        });
      }
      return ws;
    },
  );
  ipcMain.handle(IPC.WORKSPACE_LIST, () => workspaceManager.list());
  ipcMain.handle(IPC.WORKSPACE_GET, (_e, args: { id: string }) => workspaceManager.get(args.id));
  ipcMain.handle(IPC.WORKSPACE_DELETE, (_e, args: { id: string }) => {
    if (getActiveWorkspaceId() === args.id) setActiveWorkspaceId(null);
    return workspaceManager.delete(args.id);
  });
  ipcMain.handle(IPC.WORKSPACE_SWITCH, (_e, args: { id: string }) => {
    const ws = workspaceManager.get(args.id);
    if (!ws) return null;
    setActiveWorkspaceId(ws.id);
    return { workspace: ws, settings: getWorkspaceSettings(ws.id) };
  });
  ipcMain.handle(IPC.WORKSPACE_EXPORT, (_e, args: { id: string }) => {
    const ws = workspaceManager.get(args.id);
    if (!ws) return null;
    return JSON.stringify({ workspace: ws, settings: getWorkspaceSettings(ws.id) }, null, 2);
  });
  ipcMain.handle(IPC.WORKSPACE_IMPORT, (_e, args: { json: string }) => {
    try {
      const data = JSON.parse(args.json);
      const ws = workspaceManager.create(
        data.workspace?.name ?? "Imported",
        "local-user",
        data.workspace?.description,
      );
      if (data.settings) {
        setWorkspaceSettings(ws.id, data.settings);
      }
      return ws;
    } catch {
      return null;
    }
  });
  ipcMain.handle(IPC.WORKSPACE_GET_ACTIVE, () => {
    const activeId = getActiveWorkspaceId();
    if (!activeId) return null;
    const ws = workspaceManager.get(activeId);
    if (!ws) return null;
    return { workspace: ws, settings: getWorkspaceSettings(activeId) };
  });
  ipcMain.handle(IPC.WORKSPACE_GET_RECENT, () => {
    return getRecentWorkspaceIds()
      .map((id) => workspaceManager.get(id))
      .filter((ws): ws is NonNullable<typeof ws> => ws !== null)
      .slice(0, 5);
  });

  // ─── Cost Tracking (Features 114-121) ───
  ipcMain.handle(IPC.COST_GET_TOTAL, () => terminalManager.getTotalCost());
  ipcMain.handle(IPC.COST_GET_PANE, (_e, args: { paneId: string }) =>
    terminalManager.getCostInfo(args.paneId),
  );
  ipcMain.handle(IPC.COST_GET_TIMELINE, (_e, args: { paneId: string }) =>
    terminalManager.getCostTimeline(args.paneId),
  );
  ipcMain.handle(IPC.COST_GET_COMPARISON, () => terminalManager.getCostComparison());
  ipcMain.handle(IPC.COST_EXPORT_CSV, () => terminalManager.exportCostCsv());
  ipcMain.handle(IPC.COST_GET_BUDGET, () => {
    return getCostBudget();
  });
  ipcMain.handle(IPC.COST_SET_BUDGET, (_e, args: { usd: number }) => {
    setCostBudget(args.usd);
  });

  // ─── Session Persistence (Feature 50) ───
  ipcMain.handle(IPC.TERMINAL_SAVE_SCROLLBACK, (_e, args: { paneId: string; content: string }) => {
    try {
      const sessDir = join(homedir(), ".agentgrid", "sessions");
      mkdirSync(sessDir, { recursive: true });
      writeFileSync(
        join(sessDir, `scrollback-${args.paneId}.json`),
        JSON.stringify({ paneId: args.paneId, content: args.content, savedAt: Date.now() }),
      );
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IPC.TERMINAL_RESTORE_SCROLLBACK, (_e, args: { paneId: string }) => {
    try {
      const filePath = join(homedir(), ".agentgrid", "sessions", `scrollback-${args.paneId}.json`);
      if (!existsSync(filePath)) return null;
      const raw = readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  // ─── Compaction restart (Feature 43) ───
  ipcMain.handle(
    IPC.TERMINAL_RESTART_WITH_CONTEXT,
    (_e, args: { paneId: string; context?: string }) => {
      const pane = gridManager.findPane(args.paneId);
      if (!pane) return false;
      terminalManager.kill(args.paneId);
      gridManager.setPaneStatus(args.paneId, "idle");
      spawnTerminalForPane(args.paneId, pane.cwd, pane.agent);
      // Inject context after a brief delay for terminal to initialize
      if (args.context) {
        setTimeout(() => {
          terminalManager.write(args.paneId, args.context!);
        }, 2000);
      }
      logCEO({
        level: "info",
        message: `Restarted pane ${args.paneId} with context injection after compaction`,
        paneId: args.paneId,
      });
      return true;
    },
  );

  // ─── Pane migration (Feature 44) ───
  ipcMain.handle(
    IPC.TERMINAL_MIGRATE_PANE,
    (_e, args: { oldPaneId: string; newPaneId?: string }) => {
      const oldPane = gridManager.findPane(args.oldPaneId);
      if (!oldPane) return null;
      // Get last 100 lines from old pane for handoff
      const recentLines = terminalManager.getRecentLines(args.oldPaneId, 100);
      const handoff = recentLines.join("\n");
      // Write handoff file
      try {
        const outDir = join(process.cwd(), ".claude", "vp-outputs");
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, `pane-${args.oldPaneId}-handoff.txt`), handoff);
      } catch {
        // Non-fatal
      }
      logCEO({
        level: "info",
        message: `Migrated pane ${args.oldPaneId} — handoff written`,
        paneId: args.oldPaneId,
      });
      return { handoff };
    },
  );

  // ─── Per-pane session memory (Feature 48) ───
  ipcMain.handle("pane:memory:set", (_e, args: { paneId: string; key: string; value: string }) => {
    setPaneMemory(args.paneId, args.key, args.value);
    return true;
  });

  ipcMain.handle("pane:memory:get", (_e, args: { paneId: string }) => {
    return getPaneMemory(args.paneId);
  });

  // ─── Persona Registry ───
  ipcMain.handle(IPC.PERSONA_LIST, () => personaRegistry.getAll());
  ipcMain.handle(IPC.PERSONA_GET, (_e, args: { id: string }) => personaRegistry.get(args.id));
  ipcMain.handle(IPC.PERSONA_GROUPED, () => personaRegistry.getGrouped());
  ipcMain.handle(IPC.PERSONA_REGISTER, (_e, args: { persona: unknown }) => {
    return personaRegistry.register(args.persona as Parameters<typeof personaRegistry.register>[0]);
  });
  ipcMain.handle(IPC.PERSONA_DELETE, (_e, args: { id: string }) => personaRegistry.delete(args.id));
  ipcMain.handle(IPC.PERSONA_EXPORT, () => personaRegistry.exportCustom());
  ipcMain.handle(IPC.PERSONA_IMPORT, (_e, args: { json: string }) =>
    personaRegistry.importFromJson(args.json),
  );
  ipcMain.handle(IPC.PERSONA_SET_PANE, (_e, args: { paneId: string; personaId: string }) => {
    const persona = personaRegistry.get(args.personaId);
    if (!persona) return false;
    const pane = gridManager.findPane(args.paneId);
    if (!pane) return false;
    // Update pane config with persona
    pane.persona = {
      name: persona.name,
      systemPrompt: persona.systemPrompt,
      traits: persona.traits,
      color: persona.color,
      icon: persona.icon,
    };
    // Inject system prompt into terminal via Claude's /system command if running
    if (terminalManager.has(args.paneId)) {
      // Send the persona's system prompt as an append instruction
      const promptText = `You are now operating as: ${persona.name}. ${persona.systemPrompt}`;
      terminalManager.write(args.paneId, `/system ${promptText}\n`);
    }
    logCEO({
      level: "info",
      message: `Set persona "${persona.name}" on pane ${pane.label}`,
      paneId: args.paneId,
    });
    return true;
  });

  // ─── Security ───
  ipcMain.handle(IPC.SECURITY_SCAN, (_e, args: { input: string; paneId?: string }) => {
    return securityScanner.scan(args.input, args.paneId);
  });
  ipcMain.handle(IPC.SECURITY_GET_CONFIG, () => securityScanner.getConfig());
  ipcMain.handle(IPC.SECURITY_SET_CONFIG, (_e, args: Record<string, boolean>) =>
    securityScanner.setConfig(args),
  );
  ipcMain.handle(IPC.SECURITY_GET_STATS, () => securityScanner.getStats());
  ipcMain.handle(IPC.SECURITY_GET_LOG, (_e, args?: { limit?: number }) =>
    securityScanner.getLog(args?.limit),
  );
  ipcMain.handle(IPC.SECURITY_REDACT, (_e, args: { input: string }) =>
    securityScanner.redact(args.input),
  );
  ipcMain.handle(IPC.SECURITY_CLEAR, () => {
    securityScanner.clearSession();
    return true;
  });

  // Presets
  ipcMain.handle(IPC.PRESET_LIST, () => gridManager.listPresets());
  ipcMain.handle(IPC.PRESET_SAVE, (_e, args: { name: string }) => {
    gridManager.savePreset(args.name);
    return true;
  });
  ipcMain.handle(IPC.PRESET_LOAD, (_e, args: { name: string }) => {
    // Kill existing terminals before loading preset
    terminalManager.killAll();
    const result = gridManager.loadPresetFull(args.name);
    if (!result) return null;
    const { grid, preset } = result;
    // Spawn terminal PTYs for each pane in the loaded preset
    for (const pane of grid.panes) {
      spawnTerminalForPane(pane.id, pane.cwd, pane.agent);
    }
    // Auto-inject missions after spawn delay (Feature #18/#26)
    const missions = (preset as unknown as Record<string, unknown>).missions as
      | Record<string, string>
      | undefined;
    if (missions) {
      setTimeout(() => {
        for (const pane of grid.panes) {
          const mission = missions[pane.label];
          if (mission && terminalManager.has(pane.id)) {
            terminalManager.write(pane.id, mission + "\n");
            logCEO({
              level: "info",
              message: `Mission injected into ${pane.label}`,
              paneId: pane.id,
            });
          }
        }
      }, 2000);
    }
    // Track in preset history (Feature #25)
    const history = getPreference("presetHistory") ?? [];
    const updated = [args.name, ...history.filter((h) => h !== args.name)].slice(0, 5);
    setPreference("presetHistory", updated);

    logCEO({
      level: "info",
      message: `Preset "${args.name}" loaded: ${grid.panes.length} panes with terminals`,
    });
    return grid;
  });
  ipcMain.handle(IPC.PRESET_DELETE, (_e, args: { name: string }) =>
    gridManager.deletePreset(args.name),
  );

  ipcMain.handle(IPC.PRESET_EXPORT, (_e, args: { name: string }) => {
    const raw = gridManager.readPresetRaw(args.name);
    return raw ? JSON.stringify({ name: args.name, ...raw }, null, 2) : null;
  });

  ipcMain.handle(IPC.PRESET_IMPORT, (_e, args: { json: string }) => {
    try {
      const data = JSON.parse(args.json) as {
        name: string;
        grid?: import("../shared/types").GridLayout;
        panes?: Array<{ name: string; agent: string }>;
      };
      if (!data.name) return false;
      if (data.grid) {
        gridManager.create(data.grid.rows, data.grid.cols, "claude", "/tmp");
        gridManager.savePreset(data.name);
      } else if (data.panes) {
        // Import legacy format — save as-is to user presets dir
        const presetFile = join(homedir(), ".agentgrid", "presets", `${data.name}.json`);
        writeFileSync(presetFile, JSON.stringify(data, null, 2));
      } else {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  // Preset info — read raw data for preview without activating (Feature #20)
  ipcMain.handle(IPC.PRESET_INFO, (_e, args: { name: string }) => {
    return gridManager.readPresetRaw(args.name);
  });

  // Preset history — last 5 loaded presets (Feature #25)
  ipcMain.handle(IPC.PRESET_HISTORY, () => {
    return getPreference("presetHistory") ?? [];
  });

  // Preset validation — check preset is loadable (Feature #24)
  ipcMain.handle(IPC.PRESET_VALIDATE, (_e, args: { name: string }) => {
    const raw = gridManager.readPresetRaw(args.name);
    if (!raw) return { valid: false, error: "Preset not found" };
    const panes =
      (raw.panes as Array<Record<string, unknown>>) ??
      ((raw.grid as Record<string, unknown>)?.panes as Array<Record<string, unknown>>);
    if (!panes || !Array.isArray(panes) || panes.length === 0) {
      return { valid: false, error: "No panes defined in preset" };
    }
    const warnings: string[] = [];
    for (const pane of panes) {
      const agent = (pane.agent as string) ?? "claude";
      if (agent !== "claude" && agent !== "custom") {
        warnings.push(`Agent "${agent}" may not be installed`);
      }
    }
    return { valid: true, paneCount: panes.length, warnings };
  });

  // Harness → Preset bridge — generate preset from harness (Feature #23)
  ipcMain.handle(IPC.PRESET_FROM_HARNESS, (_e, args: { harnessName: string }) => {
    try {
      const harnessFile = join(process.cwd(), ".claude", "harnesses", `${args.harnessName}.yaml`);
      if (!existsSync(harnessFile)) return null;
      const yaml = readFileSync(harnessFile, "utf-8");
      // Simple YAML parsing for roles section
      const roleMatches = yaml.match(/roles:\s*\n([\s\S]*?)(?:\n[a-z]|\n$|$)/);
      if (!roleMatches) return null;
      const roleLines = roleMatches[1].split("\n").filter((l: string) => l.match(/^\s+-\s+name:/));
      const panes = roleLines.map((line: string) => {
        const nameMatch = line.match(/name:\s*(.+)/);
        return {
          name: nameMatch?.[1]?.trim() ?? "Agent",
          agent: "claude",
          role: "worker",
        };
      });
      if (panes.length === 0) return null;
      return {
        description: `Generated from harness: ${args.harnessName}`,
        panes,
        category: "engineering",
      };
    } catch {
      return null;
    }
  });

  // Harness templates
  ipcMain.handle("harness:templates", () => harnessLoader.getTemplates());
  ipcMain.handle("harness:fromGrid", (_e, args: { name: string; description?: string }) => {
    const grid = gridManager.get();
    if (!grid) return null;
    const harness = harnessLoader.fromGrid(args.name, grid, args.description);
    harnessLoader.save(harness);
    return harness;
  });

  // Session
  ipcMain.handle(IPC.SESSION_SAVE, () => {
    gridManager.saveSession();
    return true;
  });
  ipcMain.handle(IPC.SESSION_RESTORE, () => {
    const grid = gridManager.restoreSession();
    if (grid) {
      // tmux-backed — no stagger needed
      for (const pane of grid.panes) {
        spawnTerminalForPane(pane.id, pane.cwd, pane.agent);
      }
    }
    return grid;
  });
  ipcMain.handle("session:record", (_e, args: { summary?: string }) => {
    gridManager.recordSession(args.summary);
    return true;
  });
  ipcMain.handle("session:history", () => gridManager.getSessionHistory());

  // Tools
  ipcMain.handle(IPC.TOOLS_GET_CONFIG, (_e, args: { cwd: string }) =>
    toolInjector.getConfig(args.cwd),
  );
  ipcMain.handle(IPC.TOOLS_SET_CONFIG, () => {
    // Future: persist per-pane tool overrides
    return true;
  });

  // Tool management
  ipcMain.handle("tools:detect", () => toolInjector.detectInstalledTools());
  ipcMain.handle("tools:suggestModel", (_e, args: { role: string }) =>
    toolInjector.suggestModel(args.role),
  );
  ipcMain.handle("tools:routeTask", (_e, args: { task: string }) => {
    const installed = toolInjector.detectInstalledTools();
    return toolInjector.routeTask(args.task, installed);
  });
  ipcMain.handle(IPC.TOOLS_LIST, (_e, args: { cwd: string }) => ({
    mcps: toolInjector.getConfig(args.cwd).mcps,
    skills: toolInjector.getConfig(args.cwd).skills,
  }));
  ipcMain.handle(IPC.TOOLS_ADD_MCP, (_e, args: { cwd: string; name: string; config: unknown }) => {
    try {
      const mcpPath = join(args.cwd, ".mcp.json");
      const existing = (() => {
        try {
          return JSON.parse(readFileSync(mcpPath, "utf-8"));
        } catch {
          return { mcpServers: {} };
        }
      })();
      existing.mcpServers[args.name] = args.config;
      writeFileSync(mcpPath, JSON.stringify(existing, null, 2));
      return true;
    } catch {
      return false;
    }
  });
  ipcMain.handle(IPC.TOOLS_REMOVE_MCP, (_e, args: { cwd: string; name: string }) => {
    try {
      const mcpPath = join(args.cwd, ".mcp.json");
      const existing = JSON.parse(readFileSync(mcpPath, "utf-8"));
      delete existing.mcpServers[args.name];
      writeFileSync(mcpPath, JSON.stringify(existing, null, 2));
      return true;
    } catch {
      return false;
    }
  });

  // Harness management
  ipcMain.handle("harness:list", () => harnessLoader.list());
  ipcMain.handle("harness:load", (_e, args: { name: string }) => harnessLoader.load(args.name));
  ipcMain.handle("harness:save", (_e, args: { harness: unknown }) => {
    harnessLoader.save(args.harness as Parameters<typeof harnessLoader.save>[0]);
    return true;
  });
  ipcMain.handle("harness:delete", (_e, args: { name: string }) => harnessLoader.delete(args.name));

  ipcMain.handle(IPC.HARNESS_GENERATE, (_e, args: { description: string }) => {
    const harness = harnessLoader.generateFromDescription(args.description);
    logCEO({
      level: "decision",
      message: `Harness generated: ${harness.name} (${harness.roles.length} roles, ${harness.grid.rows}x${harness.grid.cols})`,
    });
    return harness;
  });

  // Signals
  ipcMain.handle("signals:start", (_e, args: { cwd: string }) => {
    signalWatcher.stop();
    signalWatcher.removeAllListeners("signal");
    signalWatcher.start(args.cwd);
    signalWatcher.on("signal", (event) => {
      if (mainWindow) {
        mainWindow.webContents.send("signals:event", event);
      }
      logCEO({
        level: event.type === "migrating" ? "warning" : "info",
        message: `Signal: ${event.role}.${event.type}${event.content ? ` — ${event.content.slice(0, 100)}` : ""}`,
        agentAction: "signal-received",
      });
      // Fire webhooks
      webhookManager.fire(event.type, {
        event: `signal.${event.type}`,
        label: event.role,
        status: event.type,
        timestamp: new Date().toISOString(),
        detail: event.content,
      });
      // Native OS notification for key events
      if (event.type === "done" || event.type === "needs-qa" || event.type === "migrating") {
        const titles: Record<string, string> = {
          done: "Agent Complete",
          "needs-qa": "QA Requested",
          migrating: "Agent Migrating",
        };
        new Notification({
          title: titles[event.type] ?? "AgentGrid Signal",
          body: `${event.role} signaled ${event.type}`,
          silent: event.type === "migrating",
        }).show();
      }
    });
    return true;
  });

  ipcMain.handle("signals:stop", () => {
    signalWatcher.stop();
    return true;
  });

  ipcMain.handle("signals:get", () => {
    return signalWatcher.scan();
  });

  // Agent Messages
  const agentMessages: Array<{
    id: string;
    from: string;
    to: string;
    type: string;
    content: string;
    timestamp: number;
  }> = [];
  let msgIdCounter = 1;

  ipcMain.handle(
    IPC.MSG_SEND,
    (_e, args: { from: string; to: string; type: string; content: string }) => {
      const msg = { id: String(msgIdCounter++), ...args, timestamp: Date.now() };
      agentMessages.push(msg);
      // If targeting a specific pane, write content to its PTY
      if (args.to !== "all" && terminalManager.has(args.to)) {
        terminalManager.write(args.to, args.content + "\n");
      } else if (args.to === "all") {
        for (const pane of gridManager.getAllPanes()) {
          if (pane.id !== args.from) {
            terminalManager.write(pane.id, args.content + "\n");
          }
        }
      }
      return msg;
    },
  );

  ipcMain.handle(IPC.MSG_LIST, () => agentMessages);

  // Shared Tasks
  ipcMain.handle(IPC.TASK_LIST, () => sharedTasks);
  ipcMain.handle(IPC.TASK_CREATE, (_e, args: { title: string; assignee?: string }) => {
    const task: SharedTask = {
      id: String(taskIdCounter++),
      title: args.title,
      status: "pending",
      assignee: args.assignee,
      createdAt: Date.now(),
    };
    sharedTasks.push(task);
    logCEO({ level: "info", message: `Task created: ${args.title}`, paneId: args.assignee });
    return task;
  });
  ipcMain.handle(
    IPC.TASK_UPDATE,
    (_e, args: { id: string; status?: string; assignee?: string }) => {
      const task = sharedTasks.find((t) => t.id === args.id);
      if (!task) return false;
      if (args.status) task.status = args.status as SharedTask["status"];
      if (args.assignee !== undefined) task.assignee = args.assignee;
      return true;
    },
  );
  ipcMain.handle(IPC.TASK_DELETE, (_e, args: { id: string }) => {
    const idx = sharedTasks.findIndex((t) => t.id === args.id);
    if (idx === -1) return false;
    sharedTasks.splice(idx, 1);
    return true;
  });

  // CEO Log
  ipcMain.handle(IPC.CEO_LOG_GET, () => ceoLog);

  // GitHub integration
  ipcMain.handle(
    IPC.GITHUB_CREATE_PR,
    async (_e, args: { title: string; body: string; branch?: string; cwd: string }) => {
      try {
        // Create branch if specified — use execFileSync to prevent shell injection
        if (args.branch) {
          execFileSync("git", ["checkout", "-b", args.branch], { cwd: args.cwd, stdio: "pipe" });
          execFileSync("git", ["add", "-A"], { cwd: args.cwd, stdio: "pipe" });
          execFileSync("git", ["commit", "-m", args.title], { cwd: args.cwd, stdio: "pipe" });
          execFileSync("git", ["push", "-u", "origin", args.branch], {
            cwd: args.cwd,
            stdio: "pipe",
          });
        }
        const result = execFileSync(
          "gh",
          ["pr", "create", "--title", args.title, "--body", args.body],
          { cwd: args.cwd, encoding: "utf-8" },
        );
        logCEO({ level: "decision", message: `PR created: ${result.trim()}` });
        return { success: true, url: result.trim() };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logCEO({ level: "error", message: `PR creation failed: ${msg}` });
        return { success: false, error: msg };
      }
    },
  );

  ipcMain.handle(IPC.GITHUB_STATUS, async (_e, args: { cwd: string }) => {
    try {
      const status = execSync("git status --porcelain", { cwd: args.cwd, encoding: "utf-8" });
      const branch = execSync("git branch --show-current", {
        cwd: args.cwd,
        encoding: "utf-8",
      }).trim();
      const lastCommit = execSync("git log --oneline -1", {
        cwd: args.cwd,
        encoding: "utf-8",
      }).trim();
      return { branch, lastCommit, changedFiles: status.split("\n").filter(Boolean).length };
    } catch {
      return { branch: "unknown", lastCommit: "", changedFiles: 0 };
    }
  });

  // Feature 145: PR status for current branch
  ipcMain.handle(IPC.GITHUB_PR_STATUS, (_e, args: { cwd: string }) => {
    return githubIntegration.getPRStatus(args.cwd);
  });

  // Feature 146: Latest GitHub Actions run
  ipcMain.handle(IPC.GITHUB_ACTIONS_STATUS, (_e, args: { cwd: string }) => {
    return githubIntegration.getActionsStatus(args.cwd);
  });

  // Feature 147: Git info (branch, commit, dirty state)
  ipcMain.handle(IPC.GITHUB_GIT_INFO, (_e, args: { cwd: string }) => {
    return githubIntegration.getGitInfo(args.cwd);
  });

  // ─── LLM Council (Features 94-103) ───
  type CouncilVoteRecord = {
    paneId: string;
    label: string;
    position: string;
    reasoning: string;
    isDevilsAdvocate?: boolean;
    timestamp: number;
  };
  type CouncilRecord = {
    id: string;
    topic: string;
    participants: string[];
    votes: CouncilVoteRecord[];
    status: string;
    decision?: string;
    summary?: string;
    devilsAdvocateId?: string;
    mode: "parallel" | "debate";
    startedAt: number;
    decidedAt?: number;
  };
  const councilSessions = new Map<string, CouncilRecord>();

  // Feature 94: Create council + Feature 95: Propose question + Feature 101: Command palette trigger
  ipcMain.handle(
    IPC.COUNCIL_START,
    (_e, args: { topic: string; paneIds: string[]; mode?: "parallel" | "debate" }) => {
      const id = `council-${Date.now().toString(36)}`;
      const mode = args.mode ?? "parallel";
      const session: CouncilRecord = {
        id,
        topic: args.topic,
        participants: args.paneIds,
        votes: [],
        status: mode === "debate" ? "debating" : "deliberating",
        mode,
        startedAt: Date.now(),
      };
      councilSessions.set(id, session);

      const prompt = `COUNCIL DELIBERATION: "${args.topic}"\nRespond with your position (approve/reject/modify) and reasoning (2-3 sentences).`;
      if (mode === "parallel") {
        for (const paneId of args.paneIds) {
          terminalManager.write(paneId, prompt + "\n");
        }
      } else {
        // Debate: first speaker only
        const first = args.paneIds[0];
        if (first) terminalManager.write(first, prompt + "\n");
      }
      logCEO({
        level: "decision",
        message: `Council (${mode}): "${args.topic}" — ${args.paneIds.length} members`,
      });
      return session;
    },
  );

  // Feature 96: Each member responds + Feature 97: Voting UI + Feature 98: Majority decision
  ipcMain.handle(
    IPC.COUNCIL_VOTE,
    (_e, args: { councilId: string; paneId: string; position: string; reasoning: string }) => {
      const session = councilSessions.get(args.councilId);
      if (!session) return null;
      const pane = gridManager.findPane(args.paneId);
      const vote: CouncilVoteRecord = {
        paneId: args.paneId,
        label: pane?.label ?? args.paneId,
        position: args.position,
        reasoning: args.reasoning,
        isDevilsAdvocate: session.devilsAdvocateId === args.paneId,
        timestamp: Date.now(),
      };
      const idx = session.votes.findIndex((v) => v.paneId === args.paneId);
      if (idx !== -1) session.votes[idx] = vote;
      else session.votes.push(vote);

      // Feature 102: Debate mode — next speaker sees prior responses
      if (session.mode === "debate" && session.votes.length < session.participants.length) {
        const nextPaneId = session.participants[session.votes.length];
        if (nextPaneId) {
          const ctx = session.votes
            .map((v) => `[${v.label}] ${v.position.toUpperCase()}: ${v.reasoning}`)
            .join("\n");
          terminalManager.write(
            nextPaneId,
            `COUNCIL DELIBERATION: "${session.topic}"\n\nPrior positions:\n${ctx}\n\nYour turn. State position + reasoning.\n`,
          );
        }
      }

      // Tally when all voted
      if (session.votes.length >= session.participants.length) {
        const approves = session.votes.filter((v) => v.position === "approve").length;
        const rejects = session.votes.filter((v) => v.position === "reject").length;
        const total = session.votes.length;
        session.decision =
          approves > total / 2
            ? `APPROVED (${approves}/${total})`
            : rejects > total / 2
              ? `REJECTED (${rejects}/${total})`
              : `SPLIT (${approves} approve, ${rejects} reject, ${total - approves - rejects} modify/abstain)`;
        session.status = "decided";
        session.decidedAt = Date.now();
        logCEO({ level: "decision", message: `Council: ${session.decision} — "${session.topic}"` });
        // Feature 100: Persist to history
        const history = getPreference("councilHistory") ?? [];
        history.push(session as never);
        if (history.length > 50) history.splice(0, history.length - 50);
        setPreference("councilHistory", history as never);
      }
      for (const w of BrowserWindow.getAllWindows()) w.webContents.send("council:updated", session);
      return session;
    },
  );

  ipcMain.handle(
    IPC.COUNCIL_RESULT,
    (_e, args: { councilId: string }) => councilSessions.get(args.councilId) ?? null,
  );
  ipcMain.handle(IPC.COUNCIL_LIST, () => Array.from(councilSessions.values()));

  // Feature 99: Devil's advocate — one member MUST argue against majority
  ipcMain.handle(IPC.COUNCIL_DEVILS_ADVOCATE, (_e, args: { councilId: string }) => {
    const session = councilSessions.get(args.councilId);
    if (!session || session.votes.length < 2) return null;
    const counts: Record<string, number> = {};
    for (const v of session.votes) counts[v.position] = (counts[v.position] ?? 0) + 1;
    const majority = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "approve";
    const opposite = majority === "approve" ? "reject" : "approve";
    const candidates = session.votes.filter((v) => v.position === majority);
    const advocate = candidates[Math.floor(Math.random() * candidates.length)];
    if (!advocate) return null;
    session.devilsAdvocateId = advocate.paneId;
    terminalManager.write(
      advocate.paneId,
      `DEVIL'S ADVOCATE: The majority voted "${majority}" on "${session.topic}".\nYou MUST argue "${opposite}". Find the strongest counter-arguments.\nPOSITION: ${opposite}\nREASONING: [your counter-argument]\n`,
    );
    logCEO({ level: "decision", message: `Devil's advocate: ${advocate.label} (${opposite})` });
    return { paneId: advocate.paneId, label: advocate.label, position: opposite };
  });

  // Feature 103: Council summary
  ipcMain.handle(IPC.COUNCIL_SUMMARY, (_e, args: { councilId: string }) => {
    const s = councilSessions.get(args.councilId);
    if (!s) return null;
    const lines = [
      `# Council: ${s.topic}`,
      `Status: ${s.status} | Mode: ${s.mode} | Decision: ${s.decision ?? "pending"}`,
      "",
    ];
    for (const v of s.votes) {
      const da = v.isDevilsAdvocate ? " [Devil's Advocate]" : "";
      lines.push(`**${v.label}${da}** — ${v.position.toUpperCase()}: ${v.reasoning}`);
    }
    s.summary = lines.join("\n");
    return s.summary;
  });

  // Feature 100: Council history
  ipcMain.handle(IPC.COUNCIL_HISTORY, () => getPreference("councilHistory") ?? []);

  // CEO Monitor — real-time grid health snapshot
  ipcMain.handle("ceo:monitor", () => {
    const grid = gridManager.get();
    if (!grid) return null;
    const panes = grid.panes.map((p) => ({
      id: p.id,
      label: p.label,
      status: p.status,
      agent: p.agent,
      model: p.model,
      effort: p.effort,
      pid: terminalManager.getPid(p.id),
      alive: terminalManager.has(p.id),
    }));
    const signals = signalWatcher.scan();
    return {
      grid: { rows: grid.rows, cols: grid.cols },
      panes,
      signals,
      totalPanes: panes.length,
      working: panes.filter((p) => p.status === "working").length,
      done: panes.filter((p) => p.status === "done").length,
      idle: panes.filter((p) => p.status === "idle").length,
      error: panes.filter((p) => p.status === "error").length,
      logEntries: ceoLog.length,
    };
  });

  // Webhooks
  ipcMain.handle(
    "webhook:add",
    (_e, args: { config: import("./webhook-manager").WebhookConfig }) => {
      webhookManager.addWebhook(args.config);
      return true;
    },
  );
  ipcMain.handle("webhook:remove", (_e, args: { id: string }) =>
    webhookManager.removeWebhook(args.id),
  );
  ipcMain.handle("webhook:list", () => webhookManager.listWebhooks());
  ipcMain.handle("webhook:test", async (_e, args: { id: string }) => {
    const webhooks = webhookManager.listWebhooks();
    const webhook = webhooks.find((w) => w.id === args.id);
    if (!webhook) return false;
    await webhookManager.fire("test", {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      detail: "Test webhook from AgentGrid",
    });
    return true;
  });

  // App info
  ipcMain.handle(IPC.APP_GET_INFO, () => ({
    version: app.getVersion(),
    platform: process.platform,
    homeDir: homedir(),
    cwd: process.cwd(),
  }));

  // Signal watcher (handlers registered above in Signals section)

  // Health monitoring
  ipcMain.handle(IPC.HEALTH_GET, (_e, args: { paneId: string }) =>
    terminalManager.getHealth(args.paneId),
  );
  ipcMain.handle(IPC.HEALTH_GET_ALL, () => terminalManager.getAllHealth());

  // ─── Swarm Topology (Features 122-139) ───
  let activeTopologyConfig: TopologyConfig | null = null;

  ipcMain.handle(
    IPC.TOPOLOGY_SET,
    (_e, args: { topology: SwarmTopology; consensus?: ConsensusMode; queenPaneId?: string }) => {
      activeTopologyConfig = createTopologyConfig(args.topology, args.queenPaneId);
      if (args.consensus) {
        activeTopologyConfig.consensus = args.consensus;
      }
      mainWindow?.webContents.send("topology:changed", activeTopologyConfig);
      logCEO({ level: "info", message: `Topology set to ${args.topology}` });
      return activeTopologyConfig;
    },
  );

  ipcMain.handle(IPC.TOPOLOGY_GET, () => activeTopologyConfig);

  ipcMain.handle(IPC.TOPOLOGY_ROUTE_MESSAGE, (_e, args: { from: string; to: string }) => {
    if (!activeTopologyConfig) {
      return { allowed: true, path: [args.from, args.to], reason: "No topology configured" };
    }
    const grid = gridManager.get();
    const panes = grid?.panes ?? [];
    return routeMessage(activeTopologyConfig, panes, args.from, args.to);
  });

  ipcMain.handle(
    IPC.TOPOLOGY_CONSENSUS_START,
    (_e, args: { topic: string; mode: ConsensusMode; participants: string[] }) => {
      const id = `topo-consensus-${Date.now().toString(36)}`;
      return topoStartConsensus(id, args.topic, args.mode, args.participants);
    },
  );

  ipcMain.handle(
    IPC.TOPOLOGY_CONSENSUS_VOTE,
    (_e, args: { sessionId: string; paneId: string; vote: "approve" | "reject" | "abstain" }) => {
      const result = topoCastVote(args.sessionId, args.paneId, args.vote);
      if (result) {
        mainWindow?.webContents.send("topology:consensus:updated", result);
      }
      return result;
    },
  );

  ipcMain.handle(IPC.TOPOLOGY_CONSENSUS_RESULT, (_e, args: { sessionId: string }) => {
    return topoGetConsensusSession(args.sessionId) ?? null;
  });

  ipcMain.handle(IPC.TOPOLOGY_CONFLICT_CHECK, (_e, args: { paneId: string; filePath: string }) => {
    return recordFileAccess(args.paneId, args.filePath);
  });

  ipcMain.handle(IPC.TOPOLOGY_CONFLICT_LIST, () => {
    return getActiveConflicts();
  });

  // ─── Settings ───
  ipcMain.handle(IPC.SETTINGS_GET, (_e, args: { key: string }) => {
    return getPreference(args.key as Parameters<typeof getPreference>[0]);
  });
  ipcMain.handle(IPC.SETTINGS_SET, (_e, args: { key: string; value: unknown }) => {
    setPreference(args.key as Parameters<typeof setPreference>[0], args.value as never);
    // Broadcast to renderer so terminals can update live
    mainWindow?.webContents.send("settings:changed", { key: args.key, value: args.value });
  });
  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => ({
    defaultAgent: getPreference("defaultAgent"),
    defaultModel: getPreference("defaultModel"),
    defaultEffort: getPreference("defaultEffort"),
    theme: getPreference("theme"),
    terminalFontSize: getPreference("terminalFontSize"),
    terminalFontFamily: getPreference("terminalFontFamily"),
    terminalCursorStyle: getPreference("terminalCursorStyle"),
    terminalCursorBlink: getPreference("terminalCursorBlink"),
    terminalScrollback: getPreference("terminalScrollback"),
    showStatusBar: getPreference("showStatusBar"),
    soundEnabled: getPreference("soundEnabled"),
    costBudgetUsd: getPreference("costBudgetUsd"),
  }));

  // ─── Onboarding & License ───
  ipcMain.handle(IPC.ONBOARDING_GET_STATE, () => ({
    complete: getPreference("onboardingComplete"),
    licenseKey: getPreference("licenseKey"),
  }));

  ipcMain.handle(IPC.ONBOARDING_COMPLETE, () => {
    setPreference("onboardingComplete", true);
    return { success: true };
  });

  ipcMain.handle(IPC.LICENSE_GET, () => getPreference("licenseKey"));

  ipcMain.handle(IPC.LICENSE_SET, (_e, args: { key: string }) => {
    setPreference("licenseKey", args.key);
    return { success: true };
  });

  ipcMain.handle(IPC.LICENSE_VALIDATE, (_e, args: { key: string }) => {
    // Stub — always accepts non-empty keys. Replace with real validation later.
    const valid = typeof args.key === "string" && args.key.trim().length >= 8;
    if (valid) {
      setPreference("licenseKey", args.key.trim());
    }
    return { valid, message: valid ? "License activated" : "Key must be at least 8 characters" };
  });
}

// ─── Agent health monitoring ───

const paneActivityTimers = new Map<string, ReturnType<typeof setTimeout>>();
const IDLE_TIMEOUT_MS = 30_000;

function markPaneActive(paneId: string): void {
  gridManager.setPaneStatus(paneId, "working");

  // Clear existing idle timer
  const existing = paneActivityTimers.get(paneId);
  if (existing) clearTimeout(existing);

  // Set new idle timer
  paneActivityTimers.set(
    paneId,
    setTimeout(() => {
      const pane = gridManager.findPane(paneId);
      if (pane && pane.status === "working") {
        gridManager.setPaneStatus(paneId, "idle");
      }
    }, IDLE_TIMEOUT_MS),
  );
}

function trackPaneBytes(paneId: string, bytes: number): void {
  const pane = gridManager.findPane(paneId);
  if (!pane) return;
  if (!pane.metrics) {
    pane.metrics = {
      bytesReceived: 0,
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      estimatedTokens: 0,
      estimatedCostUsd: 0,
    };
  }
  pane.metrics.bytesReceived += bytes;
  pane.metrics.lastActivityAt = Date.now();
  // Rough estimate: ~4 chars per token, $15/MTok for Opus output
  pane.metrics.estimatedTokens = Math.floor(pane.metrics.bytesReceived / 4);
  pane.metrics.estimatedCostUsd = (pane.metrics.estimatedTokens / 1_000_000) * 15;
}

function clearPaneTimer(paneId: string): void {
  const timer = paneActivityTimers.get(paneId);
  if (timer) {
    clearTimeout(timer);
    paneActivityTimers.delete(paneId);
  }
}

// ─── Terminal spawning helper ───

function spawnTerminalForPane(paneId: string, cwd: string, agent: CliTool): void {
  const paneConfig = gridManager.findPane(paneId);
  terminalManager.spawn(paneId, cwd, 80, 24, paneConfig?.env);

  // Forward PTY data directly to renderer — TerminalManager already batches at 5ms
  // (Previous double-buffer added another 16ms on top — removed per architect review)
  const dataHandler: any = (payload: { paneId: string; data: string }) => {
    if (payload.paneId === paneId) {
      if (mainWindow) {
        mainWindow.webContents.send(IPC.TERMINAL_DATA, { paneId, data: payload.data });
        // DEBUG: Log first IPC send per pane
        if (!dataHandler._logged) {
          console.error(
            `[DEBUG] IPC TERMINAL_DATA sent for pane ${paneId}: ${payload.data.length} bytes`,
          );
          dataHandler._logged = true;
        }
      }
      trackPaneBytes(paneId, payload.data.length);
      markPaneActive(paneId);
    }
  };
  terminalManager.on("data", dataHandler);

  // On exit, update status
  const exitHandler = (payload: { paneId: string; exitCode: number }) => {
    if (payload.paneId === paneId) {
      clearPaneTimer(paneId);
      const pane = gridManager.findPane(paneId);
      const status = payload.exitCode === 0 ? "done" : "error";
      gridManager.setPaneStatus(paneId, status);
      logCEO({
        level: payload.exitCode === 0 ? "info" : "error",
        message: `Agent exited: ${pane?.label ?? paneId} (code ${payload.exitCode})`,
        paneId,
      });
      terminalManager.removeListener("data", dataHandler);
      terminalManager.removeListener("exit", exitHandler);
      terminalManager.removeListener("compaction", compactionHandler);
    }
  };
  terminalManager.on("exit", exitHandler);

  // ─── Compaction detection (Feature 41) — forward to renderer ───
  const compactionHandler = (payload: { paneId: string; count: number; timestamp: number }) => {
    if (payload.paneId === paneId && mainWindow) {
      // Set pane status to warning
      gridManager.setPaneStatus(paneId, "waiting");
      mainWindow.webContents.send(IPC.TERMINAL_COMPACTION_DETECTED, payload);
      logCEO({
        level: "warning",
        message: `Compaction #${payload.count} detected in pane ${paneId}`,
        paneId,
      });

      // Auto-save scrollback on compaction (Feature 42)
      const recentLines = terminalManager.getRecentLines(paneId);
      try {
        const sessDir = join(homedir(), ".agentgrid", "sessions");
        mkdirSync(sessDir, { recursive: true });
        writeFileSync(
          join(sessDir, `compaction-${paneId}-${payload.timestamp}.txt`),
          recentLines.join("\n"),
        );
      } catch {
        // Non-fatal
      }

      // Auto-handoff on compaction (Feature 47)
      try {
        const outDir = join(process.cwd(), ".claude", "vp-outputs");
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, `pane-${paneId}-handoff.txt`), recentLines.join("\n"));
      } catch {
        // Non-fatal
      }

      // Memory warning at high usage (Feature 46)
      const memPct = terminalManager.getMemoryEstimate(paneId);
      if (memPct >= 60) {
        mainWindow.webContents.send(IPC.TERMINAL_MEMORY_WARNING, {
          paneId,
          percentage: memPct,
          level: memPct >= 80 ? "error" : "warning",
        });
      }
    }
  };
  terminalManager.on("compaction", compactionHandler);

  // Launch the agent CLI after a brief delay for shell init
  if (agent !== "custom") {
    const paneConfig = gridManager.findPane(paneId);
    const overrides: Partial<{
      model: string;
      effort: string;
      mcps: string[];
    }> = {};
    if (paneConfig?.model) overrides.model = paneConfig.model;
    if (paneConfig?.effort) overrides.effort = paneConfig.effort;
    const { command, args } = toolInjector.buildCommand(agent, cwd, overrides);
    // Append any custom flags from pane config
    const allArgs = [...args, ...(paneConfig?.customFlags ?? [])];
    const launchCmd = [command, ...allArgs].join(" ");
    setTimeout(() => {
      // Verify PTY is still alive before writing
      if (terminalManager.isAlive(paneId)) {
        terminalManager.write(paneId, `${launchCmd}\n`);
      } else {
        logCEO({
          level: "error",
          message: `PTY dead before agent launch: ${paneId}`,
          paneId,
        });
      }
    }, 800);
  }
}

// ─── Menu ───

function buildMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "AgentGrid",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "File",
      submenu: [
        {
          label: "New Grid",
          accelerator: "CmdOrCtrl+N",
          click: () => mainWindow?.webContents.send("menu:new-grid"),
        },
        {
          label: "New Pane",
          accelerator: "CmdOrCtrl+T",
          click: () => mainWindow?.webContents.send("menu:new-pane"),
        },
        { type: "separator" },
        {
          label: "Save Grid",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            gridManager.saveSession();
          },
        },
        { type: "separator" },
        { role: "close" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Command Palette",
          accelerator: "CmdOrCtrl+K",
          click: () => mainWindow?.webContents.send("menu:command-palette"),
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Grid",
      submenu: [
        {
          label: "Equalize Panes",
          accelerator: "CmdOrCtrl+Shift+E",
          click: () => mainWindow?.webContents.send("menu:equalize"),
        },
        {
          label: "Broadcast to All",
          accelerator: "CmdOrCtrl+Shift+B",
          click: () => mainWindow?.webContents.send("menu:broadcast"),
        },
        { type: "separator" },
        {
          label: "Next Pane",
          accelerator: "CmdOrCtrl+]",
          click: () => mainWindow?.webContents.send("menu:next-pane"),
        },
        {
          label: "Previous Pane",
          accelerator: "CmdOrCtrl+[",
          click: () => mainWindow?.webContents.send("menu:prev-pane"),
        },
        { type: "separator" },
        ...Array.from({ length: 9 }, (_, i) => ({
          label: `Focus Pane ${i + 1}`,
          accelerator: `CmdOrCtrl+${i + 1}`,
          click: () => mainWindow?.webContents.send("menu:focus-pane", i),
        })),
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "zoom" }],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── App lifecycle ───

function createTray(): void {
  // Create a small 16x16 tray icon (template image for macOS)
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4T2NkoBAwUqifAa8BjP8ZGP4TYwgjMwMDw39ChoC0MzIwMDASYQgDA9YwGDUAe0gMxAlCQ5QYQ4gKB6INITfxAgBK5hERu5dKGQAAAABJRU5ErkJggg==",
  );
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip("AgentGrid");
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show AgentGrid",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: `${gridManager.getAllPanes().length} agents running`,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        gridManager.saveSession();
        terminalManager.killAll();
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function setupRpcServer(): void {
  rpcServer.register("grid.get", "Get current grid state", () => gridManager.get());
  rpcServer.register("grid.create", "Create a new grid", (p) =>
    gridManager.create(
      (p.rows as number) ?? 2,
      (p.cols as number) ?? 3,
      (p.agent as CliTool) ?? "claude",
      (p.cwd as string) ?? process.cwd(),
    ),
  );
  rpcServer.register("pane.list", "List all panes", () => gridManager.getAllPanes());
  rpcServer.register("pane.rename", "Rename a pane", (p) =>
    gridManager.renamePane(p.paneId as string, p.label as string),
  );
  rpcServer.register("pane.status", "Set pane status", (p) =>
    gridManager.setPaneStatus(p.paneId as string, p.status as PaneStatus),
  );
  rpcServer.register("pane.broadcast", "Send text to all panes", (p) => {
    for (const pane of gridManager.getAllPanes()) {
      terminalManager.write(pane.id, (p.text as string) + "\n");
    }
    return true;
  });
  rpcServer.register("preset.list", "List saved presets", () => gridManager.listPresets());
  rpcServer.register("preset.load", "Load a preset", (p) =>
    gridManager.loadPreset(p.name as string),
  );
  rpcServer.register("terminal.write", "Write data to a terminal pane", (p) => {
    terminalManager.write(p.paneId as string, p.data as string);
    return true;
  });
  rpcServer.register("terminal.read", "Read last N lines from a pane (via stats)", (p) => {
    const stats = terminalManager.getStats(p.paneId as string);
    return stats
      ? { byteCount: stats.byteCount, uptime: stats.uptime, latency: stats.latency }
      : null;
  });
  rpcServer.register("health.getAll", "Get health status of all terminals", () =>
    terminalManager.getAllHealth(),
  );
  rpcServer.register("harness.list", "List harnesses", () => harnessLoader.list());
  rpcServer.register("harness.templates", "Get built-in templates", () =>
    harnessLoader.getTemplates(),
  );
  rpcServer.register("signals.scan", "Scan signal directory", () => signalWatcher.scan());
  rpcServer.register("tools.detect", "Detect installed CLI tools", () =>
    toolInjector.detectInstalledTools(),
  );
  rpcServer.start();
}

// ─── Auto-updater ───

function setupAutoUpdater(): void {
  try {
    const { autoUpdater } = require("electron-updater") as typeof import("electron-updater");
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("update-available", (info: { version: string }) => {
      logCEO({
        level: "info",
        message: `Update available: v${info.version}`,
        agentAction: "auto-updater",
      });
      if (mainWindow) {
        mainWindow.webContents.send("app:update-available", info);
      }
    });

    autoUpdater.on("update-downloaded", () => {
      new Notification({
        title: "AgentGrid Update Ready",
        body: "Restart to apply the update.",
      }).show();
    });

    autoUpdater.checkForUpdates().catch(() => {
      // No internet or no releases yet
    });
  } catch {
    // electron-updater not available in dev
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  buildMenu();
  createTray();
  createWindow();
  setupRpcServer();
  setupAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Save session before quitting
  gridManager.saveSession();
  terminalManager.killAll();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // Feature 50: Save scrollback for each pane before quit
  try {
    const sessDir = join(homedir(), ".agentgrid", "sessions");
    mkdirSync(sessDir, { recursive: true });
    for (const paneId of terminalManager.getAll()) {
      const lines = terminalManager.getRecentLines(paneId, 5000);
      if (lines.length > 0) {
        writeFileSync(
          join(sessDir, `scrollback-${paneId}.json`),
          JSON.stringify({
            paneId,
            content: lines.join("\n"),
            savedAt: Date.now(),
            lineCount: lines.length,
          }),
        );
      }
    }
  } catch {
    // Non-fatal — don't block app quit
  }

  gridManager.saveSession();
  terminalManager.killAll();
  rpcServer.stop();
});
