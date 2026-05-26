/**
 * Mock API — simulates window.api when running outside Electron (e.g., browser dev)
 * Enables full UI testing without IPC.
 */

import type { GridLayout, PaneConfig, PaneStatus, CliTool } from "../types";

let mockGrid: GridLayout | null = null;
let paneIdCounter = 1;
const mockPresets: string[] = ["dev-sprint", "research-swarm", "mixed-agents"];
const dataListeners: Array<(data: { paneId: string; data: string }) => void> = [];

function createMockPane(row: number, col: number, agent: CliTool, cwd: string): PaneConfig {
  const id = `mock-${paneIdCounter++}`;
  return {
    id,
    label: `Agent ${paneIdCounter - 1}`,
    status: "idle" as PaneStatus,
    agent,
    cwd,
    row,
    col,
    rowSpan: 1,
    colSpan: 1,
  };
}

function simulateTerminalOutput(paneId: string): void {
  const messages = [
    `\x1b[32m❯\x1b[0m Welcome to AgentGrid mock terminal (${paneId})\r\n`,
    `\x1b[90m$ \x1b[0mReady for commands...\r\n`,
  ];
  let i = 0;
  const interval = setInterval(() => {
    if (i >= messages.length) {
      clearInterval(interval);
      return;
    }
    for (const cb of dataListeners) {
      cb({ paneId, data: messages[i] });
    }
    i++;
  }, 300);
}

export const mockApi = {
  grid: {
    create: async (rows: number, cols: number, agent: CliTool, cwd: string) => {
      const panes: PaneConfig[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          panes.push(createMockPane(r, c, agent, cwd));
        }
      }
      mockGrid = { rows, cols, panes };
      // Simulate terminal output for each pane
      for (const p of panes) {
        setTimeout(() => simulateTerminalOutput(p.id), 500);
      }
      return mockGrid;
    },
    get: async () => mockGrid,
    save: async (_name: string) => true,
    restore: async () => mockGrid,
    equalize: async () => mockGrid,
    undo: async () => mockGrid,
    redo: async () => mockGrid,
  },
  pane: {
    add: async (agent: CliTool, cwd: string) => {
      if (!mockGrid) return null;
      const col = mockGrid.panes.length % mockGrid.cols;
      const row = Math.floor(mockGrid.panes.length / mockGrid.cols);
      const pane = createMockPane(row, col, agent, cwd);
      mockGrid.panes.push(pane);
      setTimeout(() => simulateTerminalOutput(pane.id), 300);
      return pane;
    },
    remove: async (paneId: string) => {
      if (!mockGrid) return false;
      mockGrid.panes = mockGrid.panes.filter((p: PaneConfig) => p.id !== paneId);
      return true;
    },
    rename: async (paneId: string, label: string) => {
      const pane = mockGrid?.panes.find((p: PaneConfig) => p.id === paneId);
      if (pane) pane.label = label;
      return !!pane;
    },
    setStatus: async (paneId: string, status: PaneStatus) => {
      const pane = mockGrid?.panes.find((p: PaneConfig) => p.id === paneId);
      if (pane) pane.status = status;
      return !!pane;
    },
    swap: async () => true,
    focus: async () => true,
    broadcast: async (text: string) => {
      for (const cb of dataListeners) {
        for (const p of mockGrid?.panes ?? []) {
          cb({ paneId: p.id, data: `\r\n\x1b[33m[broadcast]\x1b[0m ${text}\r\n` });
        }
      }
      return true;
    },
    broadcastSubset: async (paneIds: string[], text: string) => {
      for (const cb of dataListeners) {
        for (const id of paneIds) {
          cb({ paneId: id, data: `\r\n\x1b[33m[broadcast]\x1b[0m ${text}\r\n` });
        }
      }
      return true;
    },
    restart: async () => true,
    setModel: async () => true,
    setEffort: async () => true,
  },
  terminal: {
    spawn: async () => true,
    write: (paneId: string, data: string) => {
      // Echo back to simulate terminal
      setTimeout(() => {
        for (const cb of dataListeners) {
          cb({ paneId, data });
        }
      }, 50);
    },
    resize: () => {},
    kill: async () => true,
    injectFile: async () => true,
    autoApprove: async () => true,
    onData: (callback: (data: { paneId: string; data: string }) => void) => {
      dataListeners.push(callback);
      return () => {
        const idx = dataListeners.indexOf(callback);
        if (idx >= 0) dataListeners.splice(idx, 1);
      };
    },
  },
  preset: {
    list: async () => mockPresets,
    save: async () => true,
    load: async () => mockGrid,
    delete: async () => true,
    export: async () => JSON.stringify(mockGrid),
    import: async () => true,
  },
  session: {
    save: async () => true,
    restore: async () => null as GridLayout | null,
  },
  tools: {
    getConfig: async () => ({
      agent: "claude",
      flags: [],
      mcps: [],
      skills: [],
      model: "claude-opus-4-6",
      effort: "max",
    }),
    setConfig: async () => true,
    detect: async () => [{ tool: "claude", path: "/usr/local/bin/claude" }],
  },
  signals: {
    start: async () => true,
    stop: async () => true,
    get: async () => [],
    onSignal: () => () => {},
  },
  restart: {
    pane: async () => true,
  },
  app: {
    getInfo: async () => ({
      version: "0.1.0-mock",
      platform: "darwin",
      homeDir: "/Users/mock",
      cwd: "/tmp",
    }),
  },
};
