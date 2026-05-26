# AgentGrid App — IPC Protocol Reference

**Version:** 1.0
**Date:** March 23, 2026
**Source of Truth:** `app/packages/shared/src/types.ts` → `IPCChannels` interface

All IPC communication flows through Electron's `ipcMain.handle` (request-response) and `ipcMain.on` / `webContents.send` (event streaming). The preload bridge (`contextBridge.exposeInMainWorld`) exposes typed methods to the renderer.

---

## Transport Patterns

| Pattern             | Direction       | Mechanism                               | Use Case                           |
| ------------------- | --------------- | --------------------------------------- | ---------------------------------- |
| **Invoke**          | renderer → main | `ipcRenderer.invoke` / `ipcMain.handle` | Request-response (CRUD)            |
| **Send**            | main → renderer | `webContents.send` / `ipcRenderer.on`   | Event streaming (PTY data, status) |
| **Fire-and-forget** | renderer → main | `ipcRenderer.send`                      | Write-only (terminal input)        |

---

## Channel Reference

### Grid Lifecycle

#### `grid:create`

Create a new NxM grid and spawn terminals.

| Field      | Type                   | Required | Description                        |
| ---------- | ---------------------- | -------- | ---------------------------------- |
| `rows`     | `number`               | yes      | Number of rows (1-10)              |
| `cols`     | `number`               | yes      | Number of columns (1-10)           |
| `defaults` | `Partial<AgentConfig>` | no       | Default agent config for all panes |

**Returns:** `Grid` — The created grid with all panes populated.

**Side effects:**

- Creates `rows × cols` PTY processes via TerminalManager
- Registers panes in GridManager state
- Starts session if none active

**Example:**

```typescript
const grid = await window.api.grid.create(2, 3, {
  cliTool: "claude",
  model: "opus",
  effort: "max",
});
```

---

#### `grid:destroy`

Destroy a grid and kill all its terminals.

| Field    | Type     | Required | Description     |
| -------- | -------- | -------- | --------------- |
| `gridId` | `GridId` | yes      | Grid to destroy |

**Returns:** `void`

**Side effects:**

- Kills all PTY processes in the grid
- Removes grid from state
- Emits `pty:exit` for each pane

---

#### `grid:resize`

Resize a grid (add/remove rows or columns).

| Field    | Type     | Required | Description      |
| -------- | -------- | -------- | ---------------- |
| `gridId` | `GridId` | yes      | Grid to resize   |
| `rows`   | `number` | yes      | New row count    |
| `cols`   | `number` | yes      | New column count |

**Returns:** `Grid` — Updated grid. New panes spawned, excess panes killed.

---

### Pane Management

#### `pane:spawn`

Spawn a new terminal pane in an existing grid.

| Field      | Type           | Required | Description                         |
| ---------- | -------------- | -------- | ----------------------------------- |
| `gridId`   | `GridId`       | yes      | Target grid                         |
| `config`   | `AgentConfig`  | yes      | CLI tool, model, effort, flags, env |
| `position` | `PanePosition` | yes      | Row, col, width%, height%           |
| `label`    | `string`       | no       | Display label (default: "Agent N")  |
| `role`     | `string`       | no       | Role name (e.g., "VP-ARCHITECT")    |

**Returns:** `Pane` — The created pane with PTY PID.

**Side effects:**

- Spawns shell via TerminalManager
- Launches CLI tool command (e.g., `claude --model opus --effort max`)
- Injects MCP/skill/hook configs resolved from ToolManager
- Starts streaming PTY output

**AgentConfig shape:**

```typescript
{
  cliTool: 'claude',
  model: 'opus',
  effort: 'max',
  contextWindow: 1000000,
  flags: ['--allowedTools', 'Bash(npm:*)'],
  env: { CEO_DEPTH: '0', COMPANY_ID: 'my-project' },
  skills: ['/path/to/skill.md'],
  mcps: ['github', 'context7'],
  systemPrompt: 'You are VP-ARCHITECT...',
  workingDirectory: '/path/to/project',
}
```

---

#### `pane:kill`

Kill a pane's PTY process and remove it from the grid.

| Field    | Type     | Required | Description  |
| -------- | -------- | -------- | ------------ |
| `paneId` | `PaneId` | yes      | Pane to kill |

**Returns:** `void`

---

#### `pane:restart`

Kill and respawn a pane with the same configuration.

| Field    | Type     | Required | Description     |
| -------- | -------- | -------- | --------------- |
| `paneId` | `PaneId` | yes      | Pane to restart |

**Returns:** `void`

**Use case:** Agent crashed, stuck, or context degraded. Restart fresh.

---

#### `pane:send`

Send text input to a specific pane's terminal.

| Field    | Type     | Required | Description                             |
| -------- | -------- | -------- | --------------------------------------- |
| `paneId` | `PaneId` | yes      | Target pane                             |
| `data`   | `string` | yes      | Text to send (may include \n for Enter) |

**Returns:** `void`

---

#### `pane:broadcast`

Send text input to ALL panes in a grid.

| Field    | Type     | Required | Description                |
| -------- | -------- | -------- | -------------------------- |
| `gridId` | `GridId` | yes      | Target grid                |
| `data`   | `string` | yes      | Text to send to every pane |

**Returns:** `void`

**Side effects:** Iterates all panes, calls `TerminalManager.write()` for each.

---

#### `pane:resize`

Resize a pane's terminal dimensions.

| Field    | Type     | Required | Description      |
| -------- | -------- | -------- | ---------------- |
| `paneId` | `PaneId` | yes      | Pane to resize   |
| `cols`   | `number` | yes      | New column count |
| `rows`   | `number` | yes      | New row count    |

**Returns:** `void`

**Note:** Called automatically when CSS Grid resizes a pane tile. The renderer measures the container, calculates cols/rows, and sends this.

---

#### `pane:rename`

Change a pane's display label.

| Field    | Type     | Required | Description    |
| -------- | -------- | -------- | -------------- |
| `paneId` | `PaneId` | yes      | Pane to rename |
| `label`  | `string` | yes      | New label text |

**Returns:** `void`

---

### PTY Data Streaming

These channels carry high-frequency data. Main → renderer direction.

#### `pty:data`

Raw terminal output from a PTY process.

| Field    | Type     | Description                                        |
| -------- | -------- | -------------------------------------------------- |
| `paneId` | `PaneId` | Source pane                                        |
| `data`   | `string` | Raw terminal bytes (may contain ANSI escape codes) |

**Frequency:** Up to 60 times/second per pane (16ms batching in main process).

**Renderer handling:**

```typescript
window.api.on.ptyData(({ paneId, data }) => {
  const terminal = terminals.get(paneId);
  terminal?.write(data); // xterm.js write
});
```

---

#### `pty:exit`

A PTY process has exited.

| Field      | Type     | Description                                     |
| ---------- | -------- | ----------------------------------------------- |
| `paneId`   | `PaneId` | Exited pane                                     |
| `exitCode` | `number` | Process exit code (0 = clean, non-zero = error) |

**Renderer handling:** Update pane status to "done" (exit 0) or "error" (non-zero). Show restart button.

---

### Status Updates

#### `pane:status-update`

A pane's status has changed (e.g., idle → working).

| Field     | Type                   | Description                                                        |
| --------- | ---------------------- | ------------------------------------------------------------------ |
| `paneId`  | `PaneId`               | Changed pane                                                       |
| `status`  | `PaneStatus`           | New status: spawning, working, idle, done, error, stuck, migrating |
| `metrics` | `Partial<PaneMetrics>` | Optional updated metrics (tokens, cost, files)                     |

**Status determination:** Main process parses PTY output heuristics:

- "working" — terminal showing active output
- "idle" — no output for >30 seconds
- "done" — CLI tool exited cleanly
- "error" — CLI tool exited non-zero
- "stuck" — no output for >10 minutes
- "migrating" — `.migrating` signal file detected

---

#### `grid:status-update`

Bulk status update for all panes in a grid.

| Field    | Type                    | Description       |
| -------- | ----------------------- | ----------------- |
| `gridId` | `GridId`                | Grid              |
| `panes`  | `Array<{ id, status }>` | All pane statuses |

**Frequency:** Every 3 seconds (monitoring loop).

---

### Workspace

#### `workspace:load`

| Field         | Type          | Description       |
| ------------- | ------------- | ----------------- |
| `workspaceId` | `WorkspaceId` | Workspace to load |

**Returns:** `Workspace` — Full workspace with grids, presets, config, tools.

---

#### `workspace:save`

| Field       | Type        | Description           |
| ----------- | ----------- | --------------------- |
| `workspace` | `Workspace` | Full workspace object |

**Returns:** `void`

**Side effects:** Writes `{workspace.path}/.agentgrid.json`.

---

#### `workspace:list`

No payload.

**Returns:** `Workspace[]` — All known workspaces (scanned from recent directories + saved configs).

---

### Presets

#### `preset:load`

| Field      | Type       | Description    |
| ---------- | ---------- | -------------- |
| `presetId` | `PresetId` | Preset to load |

**Returns:** `Preset` — Full preset with grid templates, roles, tools.

**Side effects:** Creates grid from preset template, spawns all panes with role configs.

---

#### `preset:save`

| Field    | Type     | Description    |
| -------- | -------- | -------------- |
| `preset` | `Preset` | Preset to save |

**Returns:** `void`

**Side effects:** Writes to `~/.agentgrid/presets/{name}.json`.

---

#### `preset:list`

No payload.

**Returns:** `Preset[]` — All presets (built-in + user-created).

---

### Sessions

#### `session:start`

| Field         | Type          | Description   |
| ------------- | ------------- | ------------- |
| `workspaceId` | `WorkspaceId` | Workspace     |
| `gridId`      | `GridId`      | Grid to track |

**Returns:** `Session` — New session with ID and start time.

---

#### `session:end`

| Field       | Type        | Description    |
| ----------- | ----------- | -------------- |
| `sessionId` | `SessionId` | Session to end |

**Returns:** `void`

**Side effects:** Writes session summary to `~/.agentgrid/logs/`, captures final metrics.

---

#### `session:handoff`

| Field       | Type        | Description         |
| ----------- | ----------- | ------------------- |
| `sessionId` | `SessionId` | Session to hand off |

**Returns:** `string` — Path to generated handoff document.

**Side effects:** Creates handoff.md with grid state, active panes, progress, memory.

---

### CEO Log

#### `ceo:log` (main → renderer)

New CEO log entry.

| Field         | Type                       | Description                                |
| ------------- | -------------------------- | ------------------------------------------ |
| `timestamp`   | `number`                   | Unix timestamp                             |
| `level`       | `LogLevel`                 | info, warning, error, decision, experiment |
| `message`     | `string`                   | Log message                                |
| `paneId`      | `PaneId?`                  | Associated pane (optional)                 |
| `agentAction` | `string?`                  | What the agent did (optional)              |
| `metadata`    | `Record<string, unknown>?` | Extra data (optional)                      |

---

#### `ceo:log-stream`

Subscribe to log stream for a session.

| Field       | Type        | Description                |
| ----------- | ----------- | -------------------------- |
| `sessionId` | `SessionId` | Session to stream logs for |

**Returns:** Starts sending `ceo:log` events to renderer.

---

#### `ceo:monitor`

Start monitoring a grid's health.

| Field    | Type     | Description     |
| -------- | -------- | --------------- |
| `gridId` | `GridId` | Grid to monitor |

**Returns:** Starts periodic `grid:status-update` events and signal file watching.

---

### Signals

#### `signal:emit`

Write a signal file to the filesystem.

| Field       | Type         | Description                                       |
| ----------- | ------------ | ------------------------------------------------- |
| `type`      | `SignalType` | done, needs-qa, needs-help, migrating, bug-report |
| `role`      | `string`     | Role name (e.g., "builder-1")                     |
| `companyId` | `string`     | Company ID for signal dir isolation               |
| `timestamp` | `number`     | When signal was created                           |
| `payload`   | `string?`    | Optional message content                          |

**Side effects:** Writes `echo "COMPLETED {date}" > .claude/vp-signals/{companyId}/{role}.{type}`

---

#### `signal:watch`

Start watching a company's signal directory.

| Field       | Type     | Description                   |
| ----------- | -------- | ----------------------------- |
| `companyId` | `string` | Company ID directory to watch |

**Returns:** Starts sending `signal:received` events when files appear/change.

---

#### `signal:received` (main → renderer)

A signal file was detected.

| Field       | Type         | Description        |
| ----------- | ------------ | ------------------ |
| `type`      | `SignalType` | Signal type        |
| `role`      | `string`     | Role that signaled |
| `companyId` | `string`     | Company            |
| `timestamp` | `number`     | When detected      |
| `payload`   | `string?`    | File content       |

---

### Tool Management

#### `tools:add-mcp`

Add an MCP server at a given scope.

| Field    | Type         | Description                              |
| -------- | ------------ | ---------------------------------------- |
| `server` | `MCPServer`  | Server config (name, command, args, env) |
| `scope`  | `ScopeLevel` | global, workspace, or pane               |

**Returns:** `void`

**Side effects:** Writes to tools.json (global), .agentgrid.json (workspace), or in-memory (pane).

---

#### `tools:remove-mcp`

| Field   | Type         | Description          |
| ------- | ------------ | -------------------- |
| `name`  | `string`     | MCP server name      |
| `scope` | `ScopeLevel` | Scope to remove from |

**Returns:** `void`

---

#### `tools:add-skill`

| Field   | Type         | Description                         |
| ------- | ------------ | ----------------------------------- |
| `skill` | `Skill`      | Skill config (name, path, triggers) |
| `scope` | `ScopeLevel` | global, workspace, or pane          |

**Returns:** `void`

---

#### `tools:remove-skill`

| Field   | Type         | Description          |
| ------- | ------------ | -------------------- |
| `name`  | `string`     | Skill name           |
| `scope` | `ScopeLevel` | Scope to remove from |

**Returns:** `void`

---

#### `tools:add-hook`

| Field   | Type         | Description                           |
| ------- | ------------ | ------------------------------------- |
| `hook`  | `Hook`       | Hook config (event, command, matcher) |
| `scope` | `ScopeLevel` | global, workspace, or pane            |

**Returns:** `void`

---

#### `tools:remove-hook`

| Field   | Type         | Description               |
| ------- | ------------ | ------------------------- |
| `event` | `HookEvent`  | Hook event type to remove |
| `scope` | `ScopeLevel` | Scope to remove from      |

**Returns:** `void`

---

#### `tools:list`

List all tools at a given scope (or all scopes).

| Field   | Type          | Description                                      |
| ------- | ------------- | ------------------------------------------------ |
| `scope` | `ScopeLevel?` | Optional filter. If omitted, returns all merged. |

**Returns:** `ToolConfig` — All MCPs, skills, hooks, plugins at that scope.

---

#### `tools:scope`

Move a tool from one scope to another.

| Field  | Type         | Description   |
| ------ | ------------ | ------------- |
| `name` | `string`     | Tool name     |
| `from` | `ScopeLevel` | Current scope |
| `to`   | `ScopeLevel` | Target scope  |

**Returns:** `void`

---

### Window Management

#### `window:detach-pane`

Detach a pane into its own BrowserWindow.

| Field    | Type     | Description    |
| -------- | -------- | -------------- |
| `paneId` | `PaneId` | Pane to detach |

**Returns:** `void`

**Side effects:** Creates new BrowserWindow with single terminal. Pane removed from grid visually but PTY keeps running.

---

#### `window:merge-pane`

Merge a detached pane back into a grid.

| Field          | Type     | Description        |
| -------------- | -------- | ------------------ |
| `paneId`       | `PaneId` | Pane to merge      |
| `targetGridId` | `GridId` | Grid to merge into |

**Returns:** `void`

---

### App Lifecycle

#### `app:get-installed-tools`

Detect CLI tools installed on the system.

**Returns:** `Array<{ tool: CliTool; version: string; path: string }>` — Detected tools.

**Detection:** Runs `which claude`, `which codex`, etc. and parses `--version` output.

---

#### `app:get-config`

Get app-wide configuration.

**Returns:** `WorkspaceConfig` — Current workspace defaults.

---

#### `app:set-config`

Update app-wide configuration.

| Field     | Type                       | Description      |
| --------- | -------------------------- | ---------------- |
| (partial) | `Partial<WorkspaceConfig>` | Fields to update |

**Returns:** `void`

---

## Performance Considerations

### PTY Data Channel

The `pty:data` channel is the highest-traffic channel. Mitigations:

1. **Main process batching:** Buffer PTY output per 16ms frame, send combined string
2. **Renderer throttling:** Use `requestAnimationFrame` for xterm.js writes
3. **Backpressure:** If renderer falls behind, drop intermediate frames (terminal will self-heal via ANSI state)

### Status Updates

Status updates are debounced to 3-second intervals to prevent UI thrashing. The `grid:status-update` channel sends bulk updates rather than individual `pane:status-update` per pane.

### IPC Serialization

All IPC payloads use structured clone (Electron's default). For high-frequency channels (`pty:data`), payloads are kept small (paneId + data string). No complex objects on the hot path.
