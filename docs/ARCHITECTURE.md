# AgentGrid App — Architecture Document

**Author:** VP-ARCHITECT
**Date:** March 23, 2026
**Version:** 1.0
**Status:** Active — Foundation for all build work

---

## 1. Product Architecture

### 1.1 Overview

AgentGrid App transforms the existing 1,387-line bash CLI (`tools/agentgrid/agentgrid`) into a native desktop application. The core value proposition: **visual multi-agent orchestration** — spawn, monitor, and coordinate AI coding agents (Claude Code, Codex, Gemini, etc.) from a single GUI.

The app is an Electron application with three process layers:

```
┌─────────────────────────────────────────────────────┐
│                    RENDERER (React 19)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Grid View│ │ Sidebar  │ │ Controls │ │CEO Log │ │
│  │(terminals│ │(workspace│ │(broadcast│ │(stream) │ │
│  │ + status)│ │ presets) │ │ + input) │ │        │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│                   PRELOAD (Bridge)                   │
│         contextBridge.exposeInMainWorld('api', ...)  │
├─────────────────────────────────────────────────────┤
│                 MAIN PROCESS (Node.js)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │TerminalMgr   │ │ GridManager  │ │ ToolManager  ││
│  │(node-pty)     │ │(layout,state)│ │(MCP,skills,  ││
│  │               │ │              │ │ hooks,plugins)││
│  └──────────────┘ └──────────────┘ └──────────────┘│
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │PresetManager  │ │SessionManager│ │SignalWatcher ││
│  │(save/restore) │ │(persistence) │ │(fs watcher)  ││
│  └──────────────┘ └──────────────┘ └──────────────┘│
│  ┌──────────────┐ ┌──────────────┐                  │
│  │WindowManager  │ │CEOLogManager │                  │
│  │(multi-window) │ │(log capture) │                  │
│  └──────────────┘ └──────────────┘                  │
└─────────────────────────────────────────────────────┘
```

### 1.2 Electron 33+ Structure

We use **Electron 33** (latest stable as of build) with `electron-vite` for dev/build:

| Process  | Entry Point               | Role                                          |
| -------- | ------------------------- | --------------------------------------------- |
| Main     | `src/main/index.ts`       | Window management, PTY spawning, IPC handlers |
| Preload  | `src/preload/index.ts`    | Secure bridge via contextBridge               |
| Renderer | `src/renderer/index.html` | React 19 UI with xterm.js terminals           |

**Security model:**

- `contextIsolation: true` — renderer cannot access Node.js
- `nodeIntegration: false` — all Node access via preload bridge
- `sandbox: true` for renderer (except terminal panes need PTY data relay)

### 1.3 Monorepo Layout

```
tools/agentgrid/
├── agentgrid              # Existing bash CLI (1,387 LOC)
├── package.json           # CLI npm package (@namanparikh/agentgrid)
├── app/                   # Electron desktop app
│   ├── package.json       # App deps (electron, xterm.js, node-pty, react)
│   ├── electron-vite.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main/          # Main process
│   │   │   ├── index.ts           # App entry, window creation, IPC registration
│   │   │   ├── terminal-manager.ts # PTY lifecycle (spawn, write, resize, kill)
│   │   │   ├── grid-manager.ts     # Grid layout, pane CRUD, presets
│   │   │   ├── tool-manager.ts     # MCP/skill/hook/plugin management
│   │   │   ├── session-manager.ts  # Persistence, save/restore, handoff
│   │   │   ├── signal-watcher.ts   # fs.watch on .claude/vp-signals/
│   │   │   ├── ceo-log-manager.ts  # CEO log capture and streaming
│   │   │   ├── window-manager.ts   # Multi-window, detach/merge panes
│   │   │   └── ipc-handlers.ts     # All ipcMain.handle registrations
│   │   ├── preload/
│   │   │   └── index.ts           # contextBridge API surface
│   │   ├── renderer/
│   │   │   ├── index.html
│   │   │   ├── src/
│   │   │   │   ├── App.tsx
│   │   │   │   ├── main.tsx        # React entry point
│   │   │   │   ├── components/
│   │   │   │   │   ├── GridView.tsx         # CSS Grid layout of terminal panes
│   │   │   │   │   ├── TerminalPane.tsx     # xterm.js + status + label
│   │   │   │   │   ├── ControlBar.tsx       # Broadcast input, grid controls
│   │   │   │   │   ├── Sidebar.tsx          # Workspace/preset/tools navigation
│   │   │   │   │   ├── CEOLogPanel.tsx      # Real-time log viewer
│   │   │   │   │   ├── StatusBar.tsx        # Bottom bar: session, cost, pane count
│   │   │   │   │   ├── CommandPalette.tsx   # Cmd+K command palette
│   │   │   │   │   ├── PresetBrowser.tsx    # Browse/load/save presets
│   │   │   │   │   ├── ToolSettings.tsx     # MCP/skill/hook management UI
│   │   │   │   │   └── RecursiveGridViz.tsx # Nested grid visualization
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useGrid.ts
│   │   │   │   │   ├── useTerminal.ts
│   │   │   │   │   └── useIPC.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── grid-store.ts        # Zustand grid state
│   │   │   │   │   ├── session-store.ts
│   │   │   │   │   └── settings-store.ts
│   │   │   │   └── styles/
│   │   │   │       └── globals.css          # Tailwind 4 imports
│   │   │   └── tailwind.config.ts
│   │   └── shared/
│   │       └── types.ts           # Shared TypeScript interfaces (all processes)
│   ├── packages/
│   │   └── shared/
│   │       └── src/
│   │           └── types.ts       # Canonical type definitions
│   └── tests/
│       ├── playwright.config.ts
│       ├── e2e/
│       └── unit/
├── docs/
│   ├── ARCHITECTURE.md    # This file
│   ├── guide.md
│   ├── presets.md
│   └── tips.md
├── presets/                # Built-in preset JSON files
├── MASTER-TODOS.md
└── CHANGELOG.md
```

### 1.4 Build System

| Tool          | Purpose                                 |
| ------------- | --------------------------------------- |
| electron-vite | Builds main/preload/renderer separately |
| Vite 6        | Renderer bundling with React plugin     |
| TypeScript 5  | Strict mode, bundler resolution         |
| Tailwind 4    | Utility-first CSS in renderer           |
| node-pty      | Native PTY spawning (requires node-gyp) |
| xterm.js      | Terminal rendering with WebGL addon     |

### 1.5 Process Communication Flow

```
User action in UI (click "Broadcast")
        │
        ▼
Renderer ──ipcRenderer.invoke('pane:broadcast')──► Preload
        │
        ▼
Preload ──contextBridge──► Main process
        │
        ▼
Main: GridManager.getAll() → TerminalManager.write(paneId, data) for each
        │
        ▼
node-pty writes to each PTY process
        │
        ▼
PTY output ──TerminalManager.emit('data')──► ipcMain ──► Renderer
        │
        ▼
xterm.js terminal.write(data) — user sees output
```

---

## 2. Data Model

All interfaces live in `app/packages/shared/src/types.ts` (canonical) with a convenience copy at `app/src/shared/types.ts`.

### 2.1 Core Entities

See `packages/shared/src/types.ts` for the full type definitions. Summary of key entities:

| Entity           | Purpose                                       | Key Fields                                     |
| ---------------- | --------------------------------------------- | ---------------------------------------------- |
| `Workspace`      | Top-level container (maps to a directory)     | id, name, path, grids, presets, config, tools  |
| `Grid`           | NxM layout of panes                           | id, rows, cols, panes, recursive, depth        |
| `Pane`           | Single terminal slot with agent               | id, cliTool, model, effort, status, label      |
| `AgentConfig`    | How to launch a CLI tool                      | cliTool, model, effort, flags, env, mcps       |
| `Preset`         | Reusable grid template with roles             | id, name, category, grids, roles, evalCriteria |
| `RoleDefinition` | Named agent role within a preset              | name, cliTool, model, systemPrompt, phase      |
| `Session`        | A run of a grid (from start to end/handoff)   | id, state, memory, compactionCount             |
| `CEOLog`         | Structured log of orchestration events        | entries with level, message, paneId, action    |
| `ToolConfig`     | MCPs + skills + hooks + plugins configuration | mcpServers, skills, hooks, plugins             |
| `Signal`         | Inter-pane communication (done/needs-qa/etc.) | type, role, companyId, timestamp               |

### 2.2 Branded IDs

All entity IDs use TypeScript branded types for compile-time safety:

```typescript
export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type GridId = string & { readonly __brand: "GridId" };
export type PaneId = string & { readonly __brand: "PaneId" };
export type PresetId = string & { readonly __brand: "PresetId" };
export type SessionId = string & { readonly __brand: "SessionId" };
export type PluginId = string & { readonly __brand: "PluginId" };
```

This prevents accidentally passing a `PaneId` where a `GridId` is expected.

### 2.3 Persistence Strategy

| Data          | Storage                          | Format     |
| ------------- | -------------------------------- | ---------- |
| Global config | `~/.agentgrid/config.json`       | JSON       |
| Presets       | `~/.agentgrid/presets/*.json`    | JSON       |
| Last session  | `~/.agentgrid/last-session.json` | JSON       |
| Workspace cfg | `{workspace}/.agentgrid.json`    | JSON       |
| CEO logs      | `~/.agentgrid/logs/*.jsonl`      | JSONL      |
| Signals       | `.claude/vp-signals/`            | Text files |

**Why JSON files over SQLite:** For v1, JSON files match the existing CLI pattern, require no native deps beyond node-pty, and are human-readable/debuggable. SQLite can be added in Phase 7 if query complexity demands it.

---

## 3. IPC Protocol

All IPC channels are typed via the `IPCChannels` interface in `types.ts`. The preload bridge exposes typed invoke/on methods.

### 3.1 Channel Catalog

#### Grid Lifecycle

| Channel        | Direction       | Payload                     | Returns |
| -------------- | --------------- | --------------------------- | ------- |
| `grid:create`  | renderer → main | `{ rows, cols, defaults? }` | `Grid`  |
| `grid:destroy` | renderer → main | `{ gridId }`                | `void`  |
| `grid:resize`  | renderer → main | `{ gridId, rows, cols }`    | `Grid`  |

#### Pane Management

| Channel          | Direction       | Payload                                       | Returns |
| ---------------- | --------------- | --------------------------------------------- | ------- |
| `pane:spawn`     | renderer → main | `{ gridId, config, position, label?, role? }` | `Pane`  |
| `pane:kill`      | renderer → main | `{ paneId }`                                  | `void`  |
| `pane:restart`   | renderer → main | `{ paneId }`                                  | `void`  |
| `pane:send`      | renderer → main | `{ paneId, data }`                            | `void`  |
| `pane:broadcast` | renderer → main | `{ gridId, data }`                            | `void`  |
| `pane:resize`    | renderer → main | `{ paneId, cols, rows }`                      | `void`  |
| `pane:rename`    | renderer → main | `{ paneId, label }`                           | `void`  |

#### PTY Data Streaming (High Frequency)

| Channel    | Direction       | Payload                | Notes           |
| ---------- | --------------- | ---------------------- | --------------- |
| `pty:data` | main → renderer | `{ paneId, data }`     | Batched, 16ms   |
| `pty:exit` | main → renderer | `{ paneId, exitCode }` | Terminal exited |

**Performance note:** PTY data is the hottest path. Main process batches output per 16ms frame using `setInterval` to avoid flooding the renderer IPC channel. The renderer uses `requestAnimationFrame` for xterm.js writes.

#### Status Updates

| Channel              | Direction       | Payload                             |
| -------------------- | --------------- | ----------------------------------- |
| `pane:status-update` | main → renderer | `{ paneId, status, metrics? }`      |
| `grid:status-update` | main → renderer | `{ gridId, panes: [{id, status}] }` |

#### Workspace

| Channel          | Direction       | Payload           | Returns       |
| ---------------- | --------------- | ----------------- | ------------- |
| `workspace:load` | renderer → main | `{ workspaceId }` | `Workspace`   |
| `workspace:save` | renderer → main | `{ workspace }`   | `void`        |
| `workspace:list` | renderer → main | `void`            | `Workspace[]` |

#### Presets

| Channel       | Direction       | Payload        | Returns    |
| ------------- | --------------- | -------------- | ---------- |
| `preset:load` | renderer → main | `{ presetId }` | `Preset`   |
| `preset:save` | renderer → main | `{ preset }`   | `void`     |
| `preset:list` | renderer → main | `void`         | `Preset[]` |

#### Sessions

| Channel           | Direction       | Payload                   | Returns   |
| ----------------- | --------------- | ------------------------- | --------- |
| `session:start`   | renderer → main | `{ workspaceId, gridId }` | `Session` |
| `session:end`     | renderer → main | `{ sessionId }`           | `void`    |
| `session:handoff` | renderer → main | `{ sessionId }`           | `string`  |

#### CEO Log

| Channel          | Direction       | Payload         | Notes             |
| ---------------- | --------------- | --------------- | ----------------- |
| `ceo:log`        | main → renderer | `CEOLogEntry`   | New log entry     |
| `ceo:log-stream` | renderer → main | `{ sessionId }` | Subscribe to logs |

#### Signals

| Channel           | Direction       | Payload         | Notes              |
| ----------------- | --------------- | --------------- | ------------------ |
| `signal:emit`     | renderer → main | `Signal`        | Write signal file  |
| `signal:watch`    | renderer → main | `{ companyId }` | Start watching dir |
| `signal:received` | main → renderer | `Signal`        | File system event  |

#### Tool Management

| Channel                   | Direction       | Payload                            |
| ------------------------- | --------------- | ---------------------------------- |
| `tools:add-mcp`           | renderer → main | `{ server: MCPServer, scope }`     |
| `tools:remove-mcp`        | renderer → main | `{ name, scope }`                  |
| `tools:add-skill`         | renderer → main | `{ skill: Skill, scope }`          |
| `tools:remove-skill`      | renderer → main | `{ name, scope }`                  |
| `tools:add-hook`          | renderer → main | `{ hook: Hook, scope }`            |
| `tools:remove-hook`       | renderer → main | `{ event, scope }`                 |
| `tools:list`              | renderer → main | `{ scope? }`                       |
| `tools:scope`             | renderer → main | `{ name, from: scope, to: scope }` |
| `app:get-installed-tools` | renderer → main | `void`                             |
| `app:get-config`          | renderer → main | `void`                             |
| `app:set-config`          | renderer → main | `Partial<WorkspaceConfig>`         |

#### Window Management

| Channel              | Direction       | Payload                    |
| -------------------- | --------------- | -------------------------- |
| `window:detach-pane` | renderer → main | `{ paneId }`               |
| `window:merge-pane`  | renderer → main | `{ paneId, targetGridId }` |

### 3.2 Preload API Surface

The preload script exposes a typed API to the renderer via `contextBridge`:

```typescript
// preload/index.ts
contextBridge.exposeInMainWorld("api", {
  // Request-response (invoke)
  grid: {
    create: (rows: number, cols: number, defaults?: Partial<AgentConfig>) =>
      ipcRenderer.invoke("grid:create", { rows, cols, defaults }),
    destroy: (gridId: GridId) => ipcRenderer.invoke("grid:destroy", { gridId }),
    resize: (gridId: GridId, rows: number, cols: number) =>
      ipcRenderer.invoke("grid:resize", { gridId, rows, cols }),
  },
  pane: {
    spawn: (config: PaneSpawnArgs) => ipcRenderer.invoke("pane:spawn", config),
    kill: (paneId: PaneId) => ipcRenderer.invoke("pane:kill", { paneId }),
    send: (paneId: PaneId, data: string) =>
      ipcRenderer.invoke("pane:send", { paneId, data }),
    broadcast: (gridId: GridId, data: string) =>
      ipcRenderer.invoke("pane:broadcast", { gridId, data }),
    rename: (paneId: PaneId, label: string) =>
      ipcRenderer.invoke("pane:rename", { paneId, label }),
  },
  terminal: {
    write: (paneId: PaneId, data: string) =>
      ipcRenderer.invoke("terminal:input", { paneId, data }),
    resize: (paneId: PaneId, cols: number, rows: number) =>
      ipcRenderer.invoke("terminal:resize", { paneId, cols, rows }),
  },
  // Event streams (on/off)
  on: {
    ptyData: (cb: (data: { paneId: PaneId; data: string }) => void) =>
      ipcRenderer.on("pty:data", (_, data) => cb(data)),
    ptyExit: (cb: (data: { paneId: PaneId; exitCode: number }) => void) =>
      ipcRenderer.on("pty:exit", (_, data) => cb(data)),
    statusUpdate: (cb: (data: PaneStatusUpdate) => void) =>
      ipcRenderer.on("pane:status-update", (_, data) => cb(data)),
    ceoLog: (cb: (entry: CEOLogEntry) => void) =>
      ipcRenderer.on("ceo:log", (_, entry) => cb(entry)),
    signalReceived: (cb: (signal: Signal) => void) =>
      ipcRenderer.on("signal:received", (_, signal) => cb(signal)),
  },
  // Cleanup
  removeAllListeners: (channel: string) =>
    ipcRenderer.removeAllListeners(channel),
});
```

---

## 4. Feature Spec

### P0 — Must Ship (MVP)

These features define the minimum viable product. Without them, the app is not usable.

| #   | Feature                    | Description                                                                                                                                                                |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Grid View**              | CSS Grid layout showing NxM terminal panes. Drag-to-resize borders. Each pane is a live xterm.js terminal.                                                                 |
| 2   | **Terminal Spawning**      | Click "New Grid" → select rows/cols/CLI tool → terminals spawn with PTY. Support Claude, Codex, Gemini, Aider, etc.                                                        |
| 3   | **Pane Status Indicators** | Real-time colored borders (blue=working, yellow=waiting, green=done, red=error, gray=idle). Parsed from terminal output heuristics + hook signals.                         |
| 4   | **Broadcast**              | Text input bar at top. Type message → send to ALL panes simultaneously. Also per-pane send via right-click context menu.                                                   |
| 5   | **Pane Labels**            | Editable labels on each pane border. Double-click to rename. Persisted across sessions.                                                                                    |
| 6   | **Save/Restore Session**   | Save current grid layout, pane configs, and labels. Restore on app relaunch. Auto-save on exit.                                                                            |
| 7   | **Preset System**          | Save grids as named presets. Load presets to instantly spawn configured grids. Ship 5 built-in presets (dev-sprint, research-swarm, mixed-agents, solo, pair-programming). |
| 8   | **Pane Zoom**              | Double-click pane to maximize. Click again to restore grid. Keyboard shortcut: Cmd+Enter.                                                                                  |
| 9   | **Copy/Paste**             | Standard Cmd+C/V in terminals. Click-to-select text.                                                                                                                       |
| 10  | **Keyboard Shortcuts**     | Cmd+K (command palette), Cmd+N (new grid), Cmd+W (close pane), Cmd+1-9 (focus pane), Cmd+Shift+B (broadcast).                                                              |
| 11  | **Window Chrome**          | Native title bar with menu (File, Edit, View, Grid, Help). System tray icon for background monitoring.                                                                     |
| 12  | **Model/Effort Selection** | Per-pane dropdowns: CLI tool, model (Opus/Sonnet/Haiku/GPT-4/Gemini), effort level (low→max).                                                                              |

### P1 — Should Ship (v1.1)

Important features that elevate beyond a basic terminal grid.

| #   | Feature                   | Description                                                                                                                                                                   |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | **Canvas View**           | Infinite-canvas alternative to grid view. Freely position terminal tiles, note tiles, image tiles. Pan/zoom with trackpad. Inspired by Collaborator.                          |
| 14  | **CEO Log Panel**         | Real-time structured log viewer. Filter by level (info/warning/error/decision). Search. Export as markdown. Auto-populated from orchestration events and signal file changes. |
| 15  | **Tool Management UI**    | Settings panel with tabs: MCP Servers, Skills, Hooks, Plugins. Add/remove/search. Scope selector (global/workspace/pane). One-click install from awesome-claude-code.         |
| 16  | **Preset Browser**        | Visual preset browser with categories (engineering, design, research, content, earning). Preview grid layout before loading. Community presets (future).                      |
| 17  | **Signal Visualization**  | Real-time overlay showing .done, .needs-qa, .migrating signals. Visual arrows between panes showing communication flow.                                                       |
| 18  | **Auto-Approve Mode**     | Toggle to automatically approve all permission prompts across all panes. Sends Enter/Escape as appropriate. Equivalent of `defaultMode: "bypassPermissions"`.                 |
| 19  | **Drag-to-Reorder Panes** | Drag pane borders to resize. Drag pane headers to reorder positions within the grid.                                                                                          |
| 20  | **Pane Detach/Merge**     | Right-click pane → "Detach to Window" opens it in its own window. Drag back to merge into grid.                                                                               |
| 21  | **File Injection**        | Drag a file onto a pane → its contents are pasted into the terminal as input.                                                                                                 |
| 22  | **Token/Cost Tracking**   | Per-pane token usage and estimated cost. Aggregate cost in status bar. Based on model pricing tables.                                                                         |

### P2 — Nice to Have (v2.0+)

Features that differentiate but aren't blocking launch.

| #   | Feature                          | Description                                                                                                      |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 23  | **Voice Input**                  | Mic button → speech-to-text → broadcast to panes. Uses Whisper or native speech API.                             |
| 24  | **Recursive Grid Visualization** | Tree view showing nested grids. CEO → sub-CEO → workers. Collapse/expand sub-grids. Depth indicators.            |
| 25  | **Harness Marketplace**          | Browse, rate, and publish community harnesses. Local-first with optional cloud sync. Revenue sharing.            |
| 26  | **Cross-Platform**               | Linux (AppImage, .deb) and Windows (MSI, conpty) builds. macOS is P0.                                            |
| 27  | **CLI ↔ App Bridge**             | CLI connects to running app instance via Unix socket. `agentgrid app connect`. Shared state between CLI and GUI. |
| 28  | **Smart Task Routing**           | Auto-assign work to agents based on their capabilities, current load, and model strengths.                       |
| 29  | **Agent Activity Graph**         | D3 visualization: nodes = agents, edges = messages. Real-time animation of communication flow.                   |
| 30  | **Git Graph**                    | Visualize all branches/commits created by agents during a session. Timeline of file changes.                     |
| 31  | **Deterministic Replay**         | Record a session → replay with same inputs. For debugging and demo creation.                                     |
| 32  | **Team Workspaces**              | Multiple users view the same grid via WebSocket sync. Collaborative agent orchestration.                         |
| 33  | **Memory Integration**           | Connect to SuperMemory, Mem0, or built-in memory. Cross-session context injection.                               |
| 34  | **Extension API**                | Plugin system: contribute commands, views, menus, keybindings. TypeScript SDK for extensions.                    |

---

## 5. Tool Management Architecture

### 5.1 Three-Scope Model

Tools (MCPs, skills, hooks, plugins) exist at three levels:

```
┌────────────────────────────────────────────────┐
│ GLOBAL (~/.agentgrid/tools.json)               │
│ Applies to ALL panes in ALL workspaces         │
│ Example: memory MCP, GitHub MCP               │
├────────────────────────────────────────────────┤
│ WORKSPACE ({project}/.agentgrid.json)          │
│ Applies to all panes in THIS workspace         │
│ Example: project-specific skills, test hooks   │
├────────────────────────────────────────────────┤
│ PANE (in-memory, per-pane config)              │
│ Applies to only THIS terminal pane             │
│ Example: specialized MCP for one agent role    │
└────────────────────────────────────────────────┘
```

**Resolution order:** Pane > Workspace > Global (most specific wins).

### 5.2 Storage

```
~/.agentgrid/
├── tools.json           # Global tools config
│   {
│     "mcpServers": [...],
│     "skills": [...],
│     "hooks": [...],
│     "plugins": [...]
│   }
├── plugins/             # Downloaded plugin packages
│   ├── plugin-a/
│   └── plugin-b/
└── catalog-cache.json   # Cached awesome-claude-code index

{workspace}/.agentgrid.json
│   {
│     "tools": { "mcpServers": [...], "skills": [...], "hooks": [...] },
│     "defaults": { "cliTool": "claude", "model": "opus", "effort": "max" }
│   }
```

### 5.3 Injection at Spawn Time

When a pane spawns, ToolManager merges all three scopes and constructs the CLI command:

```typescript
class ToolManager {
  resolveForPane(paneId: PaneId, workspaceId: WorkspaceId): ResolvedTools {
    const global = this.loadGlobalTools();
    const workspace = this.loadWorkspaceTools(workspaceId);
    const pane = this.getPaneTools(paneId);

    // Merge: pane overrides workspace overrides global
    return {
      mcpServers: [
        ...global.mcpServers,
        ...workspace.mcpServers,
        ...pane.mcpServers,
      ],
      skills: [...global.skills, ...workspace.skills, ...pane.skills],
      hooks: [...global.hooks, ...workspace.hooks, ...pane.hooks],
      plugins: [...global.plugins, ...workspace.plugins, ...pane.plugins],
    };
  }

  buildSpawnCommand(config: AgentConfig, tools: ResolvedTools): string[] {
    const args: string[] = [config.cliTool];

    // Model and effort
    if (config.model) args.push("--model", config.model);
    if (config.effort) args.push("--effort", config.effort);

    // MCP servers
    for (const mcp of tools.mcpServers.filter((m) => m.enabled)) {
      args.push(
        "--add-mcp",
        JSON.stringify({
          name: mcp.name,
          command: mcp.command,
          args: mcp.args,
          env: mcp.env,
        }),
      );
    }

    // Skills
    for (const skill of tools.skills) {
      args.push("--add-skill", skill.path);
    }

    // Custom flags
    args.push(...config.flags);

    return args;
  }
}
```

### 5.4 UI: Tool Settings Panel

```
┌─────────────────────────────────────────────────┐
│ Tool Settings                      [Scope: ▼ Global]
├─────────────────────────────────────────────────┤
│ [MCP Servers] [Skills] [Hooks] [Plugins]        │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────┐           │
│ │ + Add MCP Server    🔍 Search     │           │
│ │                                   │           │
│ │ ✅ github           scope: global │ [Remove]  │
│ │    npx -y @modelcontextprotocol.. │           │
│ │                                   │           │
│ │ ✅ context7          scope: global │ [Remove]  │
│ │    npx -y @upstash/context7-mcp  │           │
│ │                                   │           │
│ │ ☐  memory            scope: wksp  │ [Remove]  │
│ │    npx -y server-memory          │           │
│ └───────────────────────────────────┘           │
│                                                 │
│ [Install from awesome-claude-code →]            │
└─────────────────────────────────────────────────┘
```

**One-click install flow:**

1. User clicks "Install from awesome-claude-code"
2. App fetches catalog (cached, refreshed daily)
3. User browses/searches MCPs, skills, hooks
4. Click "Install" → writes to tools.json at selected scope
5. Next pane spawn picks up the new tool automatically

### 5.5 Hook Injection

Hooks are injected via the CLI tool's native hook system. For Claude Code:

```bash
claude --add-hook "SessionStart:bash:./scripts/context-load.sh" \
       --add-hook "PreCompact:bash:./scripts/memory-flush.sh"
```

For tools without hook support, AgentGrid implements hooks at the app level by:

1. Watching PTY output for trigger patterns (e.g., tool use events)
2. Executing hook commands in a child process
3. Injecting results back into the PTY

---

## 6. Speed Architecture

### 6.1 Terminal Rendering: xterm.js + WebGL

**Decision: xterm.js with `@xterm/addon-webgl`** — not Ghostty's GPU renderer.

Rationale:

- xterm.js is a proven web-based terminal (VS Code, Warp, Collaborator all use it)
- `@xterm/addon-webgl` provides GPU-accelerated rendering via WebGL2
- Already in our dependency tree (`"@xterm/addon-webgl": "^0.18.0"`)
- Ghostty is a standalone terminal, not an embeddable library
- Cross-platform consistency (WebGL works on all Electron targets)

### 6.2 PTY Output Batching

PTY processes can produce thousands of bytes per millisecond. Naive forwarding floods IPC:

```typescript
// terminal-manager.ts — batch PTY output per 16ms frame
class TerminalManager {
  private outputBuffers = new Map<string, string[]>();
  private flushTimer: NodeJS.Timeout | null = null;

  private startFlushLoop(): void {
    this.flushTimer = setInterval(() => {
      for (const [paneId, chunks] of this.outputBuffers) {
        if (chunks.length > 0) {
          const combined = chunks.join("");
          this.mainWindow.webContents.send("pty:data", {
            paneId,
            data: combined,
          });
          chunks.length = 0;
        }
      }
    }, 16); // ~60fps
  }
}
```

### 6.3 Lazy Window Creation

Don't create BrowserWindows until needed:

```typescript
// Defer settings window creation until user opens settings
let settingsWindow: BrowserWindow | null = null;

function openSettings() {
  if (!settingsWindow) {
    settingsWindow = new BrowserWindow({
      /* ... */
    });
    settingsWindow.loadFile("settings.html");
    settingsWindow.on("closed", () => {
      settingsWindow = null;
    });
  }
  settingsWindow.show();
}
```

### 6.4 Module Loading

- Use dynamic `import()` for non-critical modules (preset browser, CEO log, tool settings)
- Main window loads: GridView + TerminalPane + ControlBar (critical path)
- Sidebar, CEOLog, ToolSettings lazy-loaded on first open

### 6.5 Bundle Size Targets

| Component   | Target | Strategy                      |
| ----------- | ------ | ----------------------------- |
| Electron    | ~50MB  | Trim unused locales, use asar |
| Renderer JS | <2MB   | Tree-shaking, code splitting  |
| node-pty    | ~500KB | Native addon, no alternatives |
| xterm.js    | ~800KB | WebGL addon adds ~200KB       |
| Total app   | <55MB  | vs typical Electron ~80MB     |

Strategies:

- `electron-builder` `asar: true` for faster file reads
- Remove unused Electron locales: keep `en-US` only
- Vite code splitting: `React.lazy()` for non-critical views
- No Monaco editor in v1 (saves ~5MB) — terminals only
- No D3 in v1 — add for canvas view in P1

### 6.6 Startup Performance

Target: **<2 seconds** from click to first terminal visible.

| Phase              | Budget    | How                                      |
| ------------------ | --------- | ---------------------------------------- |
| Electron cold boot | ~800ms    | Unavoidable, but prebuilt native modules |
| Window create      | ~100ms    | Single window, no webPreferences bloat   |
| Renderer load      | ~300ms    | Vite-built, code-split, no heavy deps    |
| First terminal     | ~200ms    | PTY spawn is fast, xterm.js init is fast |
| Restore session    | ~100ms    | JSON.parse of last-session.json          |
| **Total**          | **~1.5s** |                                          |

### 6.7 Memory Management

- Each xterm.js terminal: ~2-5MB (scrollback buffer)
- Default scrollback: 5,000 lines (configurable)
- For 20-pane grids: ~60-100MB terminal memory
- Electron overhead: ~100MB baseline
- Total for 20 panes: ~200MB — acceptable for development workstation

---

## Appendix A: Key Architectural Decisions

### A1: Electron over Tauri/Electrobun

| Factor      | Electron 33        | Tauri 2           | Electrobun         |
| ----------- | ------------------ | ----------------- | ------------------ |
| Ecosystem   | Massive            | Growing           | Tiny (pre-1.0)     |
| node-pty    | Native support     | Needs Rust bridge | Untested           |
| xterm.js    | Native (web)       | Native (web)      | Bun runtime issues |
| Binary size | ~50MB (optimized)  | ~3-10MB           | ~14MB              |
| Stability   | Proven             | Good              | Early stage        |
| Our team    | React/TS expertise | Needs Rust        | Needs Bun/Zig      |

**Decision:** Electron. Matched by Collaborator (our primary reference), proven ecosystem, no Rust/Zig skills needed. Size penalty is acceptable for dev tools.

### A2: xterm.js over Native Terminal

Using xterm.js + node-pty rather than embedding a native terminal (Ghostty, Alacritty):

- **Embeddability:** xterm.js renders in a DOM element, native terminals need separate windows
- **Customization:** Full control over rendering, theming, overlays, status indicators
- **Cross-platform:** Same code on macOS, Linux, Windows
- **Precedent:** VS Code, Warp, Collaborator, Hyper all use xterm.js

### A3: JSON Files over SQLite (v1)

- Simpler: no native compilation needed for better-sqlite3
- Human-debuggable: `cat ~/.agentgrid/config.json`
- Sufficient for v1 data volume (tens of presets, not thousands)
- Migration path clear: SQLite in Phase 7 if needed

### A4: No tmux Dependency for App

The CLI (`agentgrid` bash script) is 100% tmux-dependent. The app uses native node-pty, eliminating the tmux requirement. This is a key differentiator:

- No tmux install needed
- Better cross-platform (Windows has no tmux)
- Direct PTY control (resize, signal handling)
- The CLI continues to use tmux — both interfaces coexist

---

## Appendix B: Comparison with Collaborator

| Feature           | Collaborator            | AgentGrid App              |
| ----------------- | ----------------------- | -------------------------- |
| Canvas            | Infinite, D3-based      | Grid-first, canvas P1      |
| Terminal          | xterm.js, tmux-backed   | xterm.js, native node-pty  |
| Code editing      | Monaco tiles            | Not in v1 (terminals only) |
| Note tiles        | BlockNote/TipTap        | Not in v1                  |
| Multi-agent       | Basic terminal spawning | Full orchestration + CEO   |
| Recursive grids   | No                      | Yes (core feature)         |
| Presets/Harnesses | Basic workspace save    | Rich preset + harness sys  |
| MCP/Skills/Hooks  | No management UI        | Full tool management       |
| Signal protocol   | No                      | Yes (inter-pane comms)     |
| CEO mode          | No                      | Yes (orchestrator pane)    |
| Cross-model       | No (terminal-agnostic)  | Yes (Claude+Codex+Gemini)  |
| File tree         | Yes (navigator)         | Not in v1                  |
| Platform          | macOS ARM only          | macOS (P0), Linux/Win (P2) |

Our differentiators: **recursive grids, signal protocol, harness system, CEO orchestration, cross-model support, tool management UI.**
