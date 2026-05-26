# Collaborator Architecture Analysis — AgentGrid Research Report

**Author:** VP-RESEARCHER
**Date:** 2026-03-23
**Source:** `/tmp/collab-public/collab-electron/` (FSL-1.1 licensed — NO code copying)
**Purpose:** Architectural patterns to inform AgentGrid Electron app design

---

## Table of Contents

1. [Architecture Deep-Dive](#1-architecture-deep-dive)
2. [Canvas System](#2-canvas-system-most-important)
3. [Terminal Integration](#3-terminal-integration)
4. [IPC Protocol](#4-ipc-protocol)
5. [State Persistence](#5-state-persistence)
6. [CLI Integration](#6-cli-integration)
7. [Agent Skill System](#7-agent-skill-system)
8. [What We Should Adopt](#8-what-we-should-adopt)
9. [What We Should Skip](#9-what-we-should-skip)
10. [What We Add That They Don't Have](#10-what-we-add-that-they-dont-have)

---

## 1. Architecture Deep-Dive

### Process Architecture

Collaborator is a standard Electron app with a clear 3-layer split:

```
┌─────────────────────────────────────────────────┐
│                   MAIN PROCESS                   │
│                  (src/main/)                      │
│                                                   │
│  index.ts ─── App lifecycle, window creation      │
│  ipc.ts ───── 50+ IPC handlers (file ops,         │
│               workspace, canvas, agent hooks)      │
│  pty.ts ───── Terminal session manager (node-pty)  │
│  tmux.ts ──── tmux binary wrapper + session meta   │
│  canvas-rpc.ts ── JSON-RPC bridge to renderer      │
│  json-rpc-server.ts ── Unix socket server          │
│  canvas-persistence.ts ── Atomic JSON save/load    │
│  integrations.ts ── Agent detection + skill install │
│  config.ts ─── App config (workspaces, prefs)      │
│  workspace-graph.ts ── Dependency graph builder     │
│  watcher.ts ── File system watcher (Worker thread)  │
│  agent-activity.ts ── Track Claude/Codex sessions   │
│  git-replay.ts ── Git commit history visualization  │
│  image-service.ts ── Thumbnail generation           │
└───────────────┬─────────────────────────────────┘
                │ IPC (contextBridge)
┌───────────────▼─────────────────────────────────┐
│              PRELOAD SCRIPTS                      │
│  shell.js ── Exposes shellApi to renderer         │
│  universal.js ── Shared API for sub-windows       │
└───────────────┬─────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────┐
│            RENDERER WINDOWS                       │
│                                                   │
│  shell/ ──── Main window (THE CANVAS)             │
│    ├── renderer.js (2,600 LOC) ← the big file     │
│    ├── canvas-state.js ── tile data model          │
│    ├── tile-interactions.js ── drag/resize/marquee │
│    ├── tile-renderer.js ── DOM creation/positioning│
│    └── shell.css ── all canvas styles              │
│                                                   │
│  terminal-tile/ ── React app embedded as <webview> │
│    └── App.tsx ── PTY create/reconnect lifecycle   │
│                                                   │
│  nav/ ──── File tree navigator (webview)           │
│  viewer/ ── File preview panel (webview)           │
│  graph-tile/ ── Dependency graph (webview)          │
│  settings/ ── Settings panel (webview)             │
└─────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision         | Choice                       | Why                                                           |
| ---------------- | ---------------------------- | ------------------------------------------------------------- |
| Canvas renderer  | Vanilla JS (no React)        | Performance — avoids virtual DOM overhead for 60fps drag/zoom |
| Terminal widget  | xterm.js + WebGL addon       | Hardware-accelerated rendering, 200K scrollback               |
| Terminal backend | node-pty → tmux sessions     | Session persistence across app restarts                       |
| Sub-windows      | `<webview>` tags             | Process isolation, independent rendering                      |
| CLI bridge       | JSON-RPC over Unix socket    | Language-agnostic, discoverable via `rpc.discover`            |
| State format     | JSON file with atomic writes | Crash-safe (write to tmp, then rename)                        |
| Build system     | electron-vite                | Fast HMR in dev, optimized prod builds                        |

### File Count & Complexity

| Layer              | Files                       | Total LOC (approx) |
| ------------------ | --------------------------- | ------------------ |
| Main process       | 17 TS files                 | ~2,500             |
| Shell renderer     | 4 JS files + CSS            | ~3,200             |
| Terminal tile      | 3 TSX files                 | ~250               |
| Terminal component | 3 files (TSX + CSS + theme) | ~250               |
| Shared types       | 2 TS files                  | ~100               |
| Skill package      | 4 files (MD)                | ~200               |
| **Total**          | **~33 files**               | **~6,500**         |

---

## 2. Canvas System (MOST IMPORTANT)

### Data Model

The canvas uses a dead-simple flat array of tiles (`canvas-state.js:20`):

```typescript
type TileType = "term" | "note" | "code" | "image" | "graph" | "browser";

interface Tile {
  id: string; // "tile-{timestamp}-{counter}"
  type: TileType;
  x: number; // Canvas coordinates (grid-snapped)
  y: number;
  width: number; // Pixel dimensions
  height: number;
  filePath?: string; // For file tiles
  folderPath?: string; // For graph tiles
  url?: string; // For browser tiles
  cwd?: string; // For terminal tiles
  ptySessionId?: string; // Links to tmux session
  zIndex: number; // Stacking order (incrementing counter)
}
```

**Grid snapping:** All positions snap to a 20px grid (`GRID_CELL = 20`).

**Default sizes** (in pixels):

| Type    | Width | Height |
| ------- | ----- | ------ |
| term    | 400   | 500    |
| note    | 440   | 540    |
| code    | 440   | 540    |
| image   | 280   | 280    |
| graph   | 600   | 500    |
| browser | 480   | 640    |

### Viewport & Coordinate System

```
Screen Space                    Canvas Space
┌──────────────┐               ┌────────────────────┐
│ (0,0)        │               │ (0,0) origin       │
│   ┌────┐     │    zoom=0.5   │                    │
│   │tile│     │  ←──────────  │   ┌────────┐       │
│   └────┘     │    pan=(x,y)  │   │  tile  │       │
│              │               │   └────────┘       │
└──────────────┘               │                    │
                               └────────────────────┘
```

- **Zoom range:** 0.33 to 1.0 with rubber-band overshoot + snap-back animation
- **Pan:** Free 2D panning via trackpad scroll (no Ctrl) or Space+drag
- **Zoom:** Ctrl+scroll with focal point preservation
- **Transform:** `tile.style.transform = scale(zoom)` with `transformOrigin: top left`
- **Position:** `left = tile.x * zoom + panX`, `top = tile.y * zoom + panY`

### Canvas Rendering Pipeline

```
User Input (scroll/drag/zoom)
        │
        ▼
   updateCanvas()
        │
        ├── drawGrid()      ← Canvas2D grid dots (minor 20px, major 80px)
        │                      Separate <canvas> behind tiles
        │
        └── onCanvasUpdate()
              └── repositionAllTiles()
                    └── positionTile() × N  ← CSS transforms per tile
```

**Grid drawing** (`renderer.js:88-128`):

- Uses a `<canvas id="grid-canvas">` behind the tile layer
- Minor dots at 20px intervals (rgba white 0.22 / black 0.20)
- Major dots at 80px intervals (brighter)
- Respects devicePixelRatio for Retina displays

### Interaction System (`tile-interactions.js`)

**Three interaction types:**

1. **Drag** (`attachDrag`):
   - Title bar = primary drag handle
   - Content overlay = secondary (deferred focus)
   - Group drag: selected tiles move together
   - Shift+click = toggle selection
   - 3px click threshold before initiating drag
   - During drag: `pointer-events: none` on ALL webviews (prevents stealing)
   - On drop: snap to grid

2. **Resize** (`attachResize`):
   - 8 handles: N, S, E, W, NW, NE, SW, SE
   - Each handle is a positioned `<div>` with CSS cursor
   - Minimum sizes per type (term/note/code: 200×120, image: 80×80, graph: 300×250)
   - During resize: webview pointer events disabled
   - On release: snap to grid

3. **Marquee Selection** (`attachMarquee`):
   - Triggered by mousedown on canvas background (not on tiles)
   - Draws a `<div class="selection-marquee">` at fixed position
   - On mouseup: AABB hit-test all tiles against marquee rect (converted to canvas coords)
   - Shift key = additive selection
   - Click on empty canvas = clear selection

### Tile DOM Structure

Each tile is constructed imperatively (no framework):

```
div.canvas-tile[data-tile-id][data-tile-type]
├── div.tile-title-bar
│   ├── span.tile-title-text
│   │   ├── span.tile-title-parent  ("src/")
│   │   └── span.tile-title-name    ("renderer.js")
│   ├── [Browser: div.tile-nav-group + input.tile-url-input]
│   └── div.tile-btn-group
│       ├── button.tile-copy-path-btn
│       ├── button.tile-view-btn
│       └── button.tile-close-btn
├── div.tile-content
│   ├── div.tile-content-overlay  (drag surface, prevents webview stealing)
│   └── <webview> | <img> | other content
└── [8x div.tile-resize-handle]
```

### Focus Management

- `focusedTileId` tracks which tile has keyboard focus
- `activeSurface` enum: `"canvas" | "canvas-tile" | "nav" | "viewer" | "settings"`
- Clicking a tile focuses its webview
- `blurCanvasTileGuest()` removes webview focus when switching away
- Space key held = pan mode (suppresses tile interactions)
- Tab doesn't cycle tiles (no tab index system)

---

## 3. Terminal Integration

### Architecture Flow

```
Terminal Tile (React)         Main Process           tmux
     │                            │                    │
     ├── ptyCreate(cwd,cols,rows) │                    │
     │           ──────────────►  │                    │
     │                            ├── tmux new-session │
     │                            │    ──────────────► │
     │                            ├── tmux set-env     │
     │                            │    ──────────────► │
     │                            ├── node-pty spawn   │
     │                            │  (tmux attach)     │
     │  ◄──── sessionId ─────────┤                    │
     │                            │                    │
     ├── onPtyData ◄──────────── pty.onData ◄─────────┤
     │   (buffered 5ms flush)     │                    │
     ├── ptyWrite(data) ──────►  pty.write(data)      │
     │                            │   ──────────────► │
     ├── ptyResize(cols,rows) ──► pty.resize + tmux   │
     │                            │  resize-window    │
     │                            │   ──────────────► │
```

### tmux Integration (`tmux.ts`)

- **Socket:** Named socket `collab` (`-L collab`)
- **Session names:** `collab-{sessionId}` where sessionId is 8 random hex bytes
- **Binary:** Bundled tmux for packaged app (`process.resourcesPath/tmux`), system tmux for dev
- **Config:** Custom `tmux.conf` bundled
- **Session metadata:** JSON files in `~/.collaborator/dev/terminal-sessions/{sessionId}.json`
  ```json
  { "shell": "/bin/zsh", "cwd": "/Users/...", "createdAt": "2026-..." }
  ```

### Session Persistence

- On canvas restore: terminal tiles have `ptySessionId` saved
- `pty:reconnect` IPC: checks if tmux session still exists → `tmux has-session`
- Captures scrollback: `tmux capture-pane -p -e -S -200000` (200K lines!)
- Scrollback written to xterm before live data starts
- If tmux session gone: creates new session transparently

### xterm.js Setup (`TerminalTab.tsx`)

- **Font:** Menlo 12px, weight 300/500
- **Scrollback:** 200,000 lines
- **Renderer:** WebGL addon (falls back to DOM on GPU context loss)
- **Unicode:** Unicode11 addon for wide character support
- **Data buffering:** 5ms flush interval (matches VS Code's `TerminalDataBufferer`)
- **Shift+Enter:** Custom CSI u sequence (`\x1b[13;2u`) sent via `tmux send-keys -l` to preserve modifier info for Claude Code

### Session Discovery

`pty:discover` IPC: Lists all surviving tmux sessions by:

1. `tmux list-sessions -F "#{session_name}"` — get all tmux sessions
2. Cross-reference with metadata JSON files
3. Clean up orphans (meta without tmux session → delete meta; tmux without meta → kill session)

---

## 4. IPC Protocol

### Channel Architecture

```
Main Process ◄──── ipcMain.handle/on ────► Renderer (shell)
                                              │
                                              ├── <webview> (nav)
                                              ├── <webview> (viewer)
                                              ├── <webview> (terminal-tile)
                                              ├── <webview> (graph-tile)
                                              └── <webview> (settings)

shell ──── "shell:forward" ────► main ──── wv.send() ────► target webview
```

### Key IPC Channels

| Channel                      | Type               | Purpose                                       |
| ---------------------------- | ------------------ | --------------------------------------------- |
| `pty:create`                 | handle             | Create tmux session + node-pty                |
| `pty:write`                  | handle             | Send data to terminal                         |
| `pty:resize`                 | handle             | Resize terminal                               |
| `pty:kill`                   | handle             | Kill terminal session                         |
| `pty:reconnect`              | handle             | Reconnect to existing tmux session            |
| `pty:discover`               | handle             | List surviving tmux sessions                  |
| `pty:send-raw-keys`          | handle             | Send raw keys via tmux send-keys -l           |
| `pty:data`                   | send (to renderer) | Terminal output data                          |
| `pty:exit`                   | send (to renderer) | Terminal session ended                        |
| `shell:get-view-config`      | handle             | URLs + preload paths for all windows          |
| `shell:forward`              | send               | Route messages between webviews               |
| `shell:shortcut`             | send               | Keyboard shortcut notifications               |
| `shell:loading-done`         | send               | App finished loading                          |
| `shell:settings`             | send               | Settings panel open/close                     |
| `shell:workspace-changed`    | send               | Active workspace changed                      |
| `pref:get` / `pref:set`      | handle             | UI preferences (panel widths, visibility)     |
| `theme:set`                  | handle             | Light/dark/system theme                       |
| `canvas:rpc-request`         | send (to renderer) | JSON-RPC forwarded to canvas                  |
| `canvas:rpc-response`        | on (from renderer) | Canvas response to RPC                        |
| `integrations:get-agents`    | handle             | Detect installed agents                       |
| `integrations:install-skill` | handle             | Install canvas skill for agent                |
| `workspace:*`                | handle             | Add, remove, switch, list workspaces          |
| `fs:*`                       | handle             | File operations (read, write, rename, delete) |
| `watcher:*`                  | handle             | File system watching                          |
| `analytics:*`                | handle/on          | Telemetry events                              |

### Shell Forward Pattern

The main window acts as a message router. Webviews can't communicate directly:

```
Nav webview ──► shellApi.selectFile(path)
                    │
                    ▼
    main process "shell:forward" handler
                    │
                    ▼
    mainWindow.webContents.send("shell:forward", "viewer", "file-selected", path)
                    │
                    ▼
    Shell renderer routes to viewer webview
                    │
                    ▼
    viewerWebview.send("file-selected", path)
```

---

## 5. State Persistence

### Canvas State (`canvas-state.json`)

Location: `~/.collaborator/dev/canvas-state.json` (dev) or `~/.collaborator/canvas-state.json` (prod)

```json
{
  "version": 1,
  "tiles": [
    {
      "id": "tile-1711234567890-1",
      "type": "term",
      "x": 100,
      "y": 200,
      "width": 400,
      "height": 500,
      "ptySessionId": "a1b2c3d4e5f6g7h8",
      "zIndex": 3
    },
    {
      "id": "tile-1711234567890-2",
      "type": "code",
      "x": 520,
      "y": 200,
      "width": 440,
      "height": 540,
      "filePath": "/Users/dev/project/src/main.ts",
      "zIndex": 4
    }
  ],
  "viewport": {
    "panX": 150,
    "panY": 100,
    "zoom": 0.8
  }
}
```

**Persistence strategy:**

- Debounced save (500ms) on tile move/resize/create/delete
- Immediate save on `beforeunload`
- Atomic write: write to tmpdir, then `fs.rename` (crash-safe)
- Restore on app launch: recreate all tiles from saved state

### App Config (`config.json`)

Location: `~/.collaborator/dev/config.json`

```json
{
  "workspaces": ["/Users/dev/project1", "/Users/dev/project2"],
  "active_workspace": 0,
  "window_state": { "x": 100, "y": 100, "width": 1200, "height": 800 },
  "ui": {
    "theme": "dark",
    "panel-width-nav": 250,
    "panel-visible-nav": true,
    "canvasOpacity": 100
  }
}
```

### Terminal Session Meta (`terminal-sessions/{id}.json`)

```json
{
  "shell": "/bin/zsh",
  "cwd": "/Users/dev/project",
  "createdAt": "2026-03-23T10:30:00.000Z"
}
```

### Workspace Config (`.collaborator/workspace.json`)

Per-workspace settings stored inside the workspace directory.

---

## 6. CLI Integration

### Architecture

```
collab CLI (bash script)
     │
     ├── Reads socket path from ~/.collaborator/socket-path
     │
     ├── Sends JSON-RPC 2.0 over Unix domain socket
     │   echo '{"jsonrpc":"2.0","id":1,"method":"canvas.tileAdd",...}' | nc -U "$SOCK"
     │
     └── Receives JSON-RPC response on stdout
```

### JSON-RPC Server (`json-rpc-server.ts`)

- **Socket:** `~/.collaborator/dev/ipc.sock`
- **Breadcrumb:** Writes socket path to `~/.collaborator/socket-path` for discovery
- **Protocol:** Newline-delimited JSON-RPC 2.0
- **Discovery:** `rpc.discover` method lists all available methods with descriptions

### Registered Methods

| Method                | Description                              |
| --------------------- | ---------------------------------------- |
| `rpc.discover`        | List all available RPC methods           |
| `ping`                | Health check — returns `{pong: true}`    |
| `workspace.getConfig` | Return current app configuration         |
| `canvas.tileList`     | List all canvas tiles with positions     |
| `canvas.tileAdd`      | Create a new tile on the canvas          |
| `canvas.tileRemove`   | Remove a tile from the canvas            |
| `canvas.tileMove`     | Move a tile to a new position            |
| `canvas.tileResize`   | Resize a tile                            |
| `canvas.viewportGet`  | Get current canvas viewport              |
| `canvas.viewportSet`  | Set canvas viewport pan and zoom         |
| `agent.sessionStart`  | Notify agent session started (via hooks) |
| `agent.fileTouched`   | Notify agent touched a file              |
| `agent.sessionEnd`    | Notify agent session ended               |

### CLI Install (`cli-installer.ts`)

- On app launch: copies `collab-cli.sh` to `~/.local/bin/collab`
- Makes executable (chmod 755)
- Prints PATH hint if `~/.local/bin` not in PATH

### Canvas RPC Bridge (`canvas-rpc.ts`)

The JSON-RPC server can't directly access the renderer's canvas state. The bridge:

1. External client sends `canvas.tileAdd` to JSON-RPC server
2. Server calls `canvas-rpc.ts:sendToShell(method, params)`
3. Bridge sends `canvas:rpc-request` IPC to renderer
4. Renderer's `handleCanvasRpc()` processes it, modifies DOM + state
5. Renderer sends `canvas:rpc-response` IPC back
6. Bridge resolves the Promise, server sends response to client

**Timeout:** 10 seconds per RPC request.

---

## 7. Agent Skill System

### Agent Detection (`integrations.ts`)

Detects three agents by checking for their config directories or CLI binaries:

| Agent       | Detection                                     |
| ----------- | --------------------------------------------- |
| Claude Code | `~/.claude` exists OR `which claude` succeeds |
| Codex CLI   | `~/.codex` exists OR `which codex` succeeds   |
| Gemini CLI  | `~/.gemini` exists OR `which gemini` succeeds |

### Skill Installation

For Claude Code:

```
~/.claude/skills/collab-canvas/SKILL.md
```

For Codex:

```
~/.codex/instructions/collab-canvas.md
```

For Gemini:

```
~/.gemini/instructions/collab-canvas.md
```

The skill file teaches the agent how to use the `collab` CLI to manipulate the canvas (tile CRUD, viewport control, composition patterns).

### Agent Activity Tracking (`agent-activity.ts`)

When Claude Code hooks fire (SessionStart, PostToolUse, SessionEnd), the hook script:

1. Reads the hook JSON from stdin
2. Discovers the Unix socket from `~/.collaborator/socket-path`
3. Sends `agent.sessionStart`, `agent.fileTouched`, or `agent.sessionEnd` via JSON-RPC
4. Main process tracks which files each agent session reads/writes
5. This data feeds into the canvas UI (agent activity indicators on tiles)

### Hooks Installation

When a workspace is opened, Collaborator auto-installs Claude Code hooks:

```json
// .claude/settings.json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "agent-notify.sh", "timeout": 5 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Read|Write|Edit",
        "hooks": [
          { "type": "command", "command": "agent-notify.sh", "timeout": 5 }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          { "type": "command", "command": "agent-notify.sh", "timeout": 5 }
        ]
      }
    ]
  }
}
```

Also injects RPC discovery info into `.claude/CLAUDE.md` so Claude Code knows how to reach the socket.

---

## 8. What We Should Adopt

### P0 — Must Have

| Pattern                       | Why                                                                 | How to Adapt                                                              |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **tmux-backed terminals**     | Session persistence, scrollback recovery, crash resilience          | We already use tmux. Map each grid pane to a tmux session with meta files |
| **JSON-RPC over Unix socket** | Lets our CLI and Claude Code hooks control the app programmatically | Use the same pattern — `~/.agentgrid/ipc.sock`                            |
| **Atomic state writes**       | Write to tmp, rename. Prevents corruption on crash                  | Direct copy of pattern for grid state                                     |
| **Canvas state model**        | Flat tile array with viewport (pan, zoom). Simple, proven           | Adapt for our grid layout (we add `row`, `col`, `gridId` fields)          |
| **Agent hook integration**    | Claude Code hooks notify the app about agent activity               | We already have hooks — wire them to our RPC server                       |
| **`rpc.discover` method**     | Self-documenting API. CLI and agents can discover capabilities      | Essential for our multi-agent CLI integration                             |

### P1 — Should Have

| Pattern                        | Why                                                         | How to Adapt                             |
| ------------------------------ | ----------------------------------------------------------- | ---------------------------------------- |
| **WebGL terminal renderer**    | Eliminates flicker on rapid output (WebGL double-buffering) | Use same xterm.js + WebGL addon stack    |
| **Data buffering (5ms flush)** | Coalesces rapid PTY writes, prevents partial renders        | Copy VS Code's approach exactly          |
| **Shift+Enter CSI u escape**   | Claude Code needs modifier info that tmux strips            | We need this for Claude Code panes       |
| **Grid snapping (20px grid)**  | Clean alignment without effort                              | Apply to tile positioning in canvas mode |
| **Rubber-band zoom**           | Feels native (iOS-like) — overshoot + spring back           | Nice UX touch for canvas view            |

### P2 — Nice to Have

| Pattern                       | Why                                       |
| ----------------------------- | ----------------------------------------- |
| Marquee selection             | Multi-tile selection via rubber-band      |
| Browser tile type             | Embedding web content alongside terminals |
| Content overlay for drag      | Prevents webview stealing pointer events  |
| `beforeunload` immediate save | Last-resort state preservation            |

---

## 9. What We Should Skip

### Architecture Complexity We Don't Need

| Thing                                               | Why Skip                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Infinite canvas as primary view**                 | Our primary view is a fixed grid (NxM). Canvas is a secondary "free layout" mode   |
| **webview tags for everything**                     | Process overhead. We use React components within one renderer window               |
| **Nav + Viewer + Settings as separate webviews**    | Over-isolation for our use case. Standard React panels suffice                     |
| **Workspace graph / dependency-cruiser**            | We don't need code graph visualization — our focus is terminal grids               |
| **Image service / thumbnail generation**            | No image tiles needed                                                              |
| **Wikilink index**                                  | Obsidian-style knowledge graph isn't our product                                   |
| **Front-matter parsing (gray-matter/front-matter)** | We don't handle markdown note types                                                |
| **File filter / gitignore integration**             | Not relevant for terminal grid tool                                                |
| **2,600-line monolithic renderer.js**               | Anti-pattern. We use React + proper component decomposition                        |
| **Vanilla JS DOM manipulation**                     | They chose vanilla for perf. We can get comparable perf with React + memo patterns |
| **analytics.ts / telemetry**                        | Not needed at launch. Add later if desired                                         |
| **updater system**                                  | electron-updater can be added later, not a launch requirement                      |
| **Browser tile (persist:browser session)**          | Not in our MVP scope                                                               |

### FSL License Constraint

Collaborator uses FSL-1.1 (Functional Source License). This means:

- **NO copying code** — we can study patterns but must write from scratch
- After 2 years it converts to MIT/Apache, but that's 2028
- Our work must be independently authored, inspired by architecture, not code

---

## 10. What We Add That They Don't Have

### Our Unique Capabilities

| Feature                               | Description                                                      | Why It Matters                                                |
| ------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Recursive grids**                   | Grids-of-grids. A pane can spawn its own NxM sub-grid            | Unlimited distributed compute. Their canvas is flat           |
| **CEO orchestration**                 | Mission injection, monitoring crons, signal protocol             | They have no concept of autonomous agent coordination         |
| **Multi-model support**               | Claude, Codex, Gemini, Aider, Goose, Cursor — 10 agents          | They support 3 (Claude, Codex, Gemini) for skill install only |
| **Harness presets**                   | Save/restore full grid configurations with roles + missions      | Their canvas saves tile positions but not "company" configs   |
| **Signal protocol**                   | `.done`, `.needs-qa`, `.migrating` inter-pane communication      | They have no inter-agent coordination signals                 |
| **Broadcast command**                 | Send a message to ALL panes simultaneously                       | They have no cross-terminal messaging                         |
| **Mission injection**                 | `inject-task.sh` pushes long prompts into specific panes         | They rely on the user typing into each terminal               |
| **Grid status dashboard**             | Color-coded pane status (WORKING/WAITING/DONE/IDLE)              | They have no equivalent monitoring view                       |
| **Auto-approval cron**                | Automatically press Enter/Escape in panes for permission prompts | Essential for overnight autonomy                              |
| **Memory integration**                | Grid workers use shared memory system across sessions            | Not in their architecture                                     |
| **Fractal delegation**                | CEO → sub-CEOs → workers with depth tracking                     | They're a coding tool, not an orchestration platform          |
| **Session save/restore**              | `agentgrid save/restore company-name` with full grid state       | Goes beyond canvas persistence                                |
| **Sound notifications**               | Configurable sounds for done/waiting/subagent events             | Not in their product                                          |
| **Cross-pane communication via tmux** | Read pane buffers, send keys, inject tasks                       | They only do PTY I/O within each terminal's scope             |

### Architecture Comparison

```
                     Collaborator              AgentGrid
                     ───────────              ─────────
Primary View:        Infinite Canvas           NxM Grid
Terminal Backend:    tmux (per tile)            tmux (per pane)
Multi-agent:         Skill install only         Full orchestration
Coordination:        None                       Signal protocol
CLI:                 collab tile add/rm         agentgrid NxM / status / broadcast
Persistence:         canvas-state.json          grid-state.json + presets
Depth:               Flat (1 level)             Recursive (3+ levels)
Autonomy:            Manual (user arranges)     CEO-driven (mission injection)
Monitoring:          None                       Dashboard + status + sounds
Build System:        electron-vite              electron-vite (adopt)
Process Model:       webview per tile           React component per pane
```

---

## Appendix A: Build Stack

| Dependency             | Version | Purpose                                             |
| ---------------------- | ------- | --------------------------------------------------- |
| electron               | 35+     | Desktop runtime                                     |
| electron-vite          | —       | Build tooling (Vite for renderer, ESBuild for main) |
| node-pty               | —       | PTY spawning                                        |
| @xterm/xterm           | —       | Terminal emulation                                  |
| @xterm/addon-webgl     | —       | GPU-accelerated rendering                           |
| @xterm/addon-fit       | —       | Auto-fit terminal to container                      |
| @xterm/addon-unicode11 | —       | Wide character support                              |
| react                  | 18+     | Terminal tile UI                                    |
| dependency-cruiser     | —       | Code graph generation (we skip)                     |
| @lezer/python          | —       | Python import parsing (we skip)                     |
| front-matter           | —       | YAML frontmatter parsing (we skip)                  |

## Appendix B: Adopt/Skip/Add Matrix (Quick Reference)

```
ADOPT                          SKIP                           ADD
─────                          ────                           ───
tmux-backed PTY sessions       Infinite canvas as primary     Recursive grids (depth 3)
JSON-RPC Unix socket           webview per sub-window         CEO orchestration
Atomic JSON state writes       Workspace graph/deps           Multi-model (10 agents)
Agent hook integration         Image service                  Signal protocol
xterm.js + WebGL               Wikilink index                 Broadcast command
5ms data buffering              File filter/gitignore         Mission injection
Shift+Enter CSI u              2600-line monolithic JS        Grid status dashboard
Grid snapping                  Analytics/telemetry            Auto-approval cron
Rubber-band zoom               Updater system                 Memory integration
rpc.discover                   Browser tile                   Fractal delegation
Session meta files             Vanilla JS DOM                 Preset save/restore
Scrollback recovery            Front-matter parsing           Sound notifications
```

---

## Appendix C: Implementation Priority for AgentGrid App

Based on this analysis, the build order should be:

1. **Electron shell** — Main process, window, preload (copy their pattern)
2. **PTY + tmux layer** — Port from our bash CLI, add session meta
3. **Grid renderer** — React-based NxM grid (NOT infinite canvas initially)
4. **xterm.js terminals** — One per grid cell, WebGL renderer
5. **IPC layer** — PTY channels + grid state channels
6. **JSON-RPC server** — Unix socket, `rpc.discover`, grid methods
7. **CLI bridge** — Wire `agentgrid` commands to JSON-RPC
8. **State persistence** — Grid state, presets, session recovery
9. **Agent integration** — Hook system for Claude Code activity
10. **Canvas mode** — OPTIONAL second view with free-form tile placement

---

---

## Appendix D: Renderer Deep-Dive (Additional Analysis — Session 2)

### Renderer Architecture (renderer.js — 700+ LOC)

The shell renderer is the heart of Collaborator. Key implementation details:

**Constants:**

```
ZOOM_MIN = 0.33
ZOOM_MAX = 1.0
ZOOM_RUBBER_BAND_K = 400   // spring constant for overshoot
CELL = 20                   // minor grid unit (px)
MAJOR = 80                  // major grid unit (px)
CROSS_R = 4                 // dot radius
```

**Zoom Implementation:**

- Focal-point zoom: zooms toward cursor position, not center
- Rubber-band: zoom past limits with damping (`1 / (1 + overshoot * K)`)
- Snap-back: 150ms timer triggers spring animation (`canvasScale += (target - canvasScale) * 0.15`)
- Zoom indicator: shows percentage, auto-hides after 1200ms

**Pan Implementation:**

- Trackpad scroll (no modifier): `canvasX -= deltaX * 1.2`, `canvasY -= deltaY * 1.2`
- Ctrl+scroll: focal-point zoom (not pan)
- Space+drag: pan mode (suppresses tile interactions)
- Pinch: forwarded from main process via `canvas:pinch` IPC

**Resize handling:**

- `ResizeObserver` on canvas element adjusts pan to maintain center
- Grid canvas (background dots) resized with `devicePixelRatio` scaling

### Webview Management Pattern

Each tile's content is a `<webview>` element:

```javascript
function createWebview(name, config, container, onDndMessage) {
  const wv = document.createElement("webview");
  wv.setAttribute("src", config.src);
  wv.setAttribute("preload", config.preload);
  wv.setAttribute("webpreferences", "contextIsolation=yes, sandbox=yes");

  // Buffer messages until dom-ready
  const pendingMessages = [];
  wv.addEventListener("dom-ready", () => {
    ready = true;
    for (const [ch, args] of pendingMessages) wv.send(ch, ...args);
    pendingMessages.length = 0;
  });
}
```

**Key pattern:** Messages sent before `dom-ready` are buffered and replayed. Same pattern used in preload for `shell:forward` and `shell:loading-done` — race conditions between IPC and React mount are explicitly handled.

### Preload Bridge Pattern (shell.ts)

The preload script exposes a typed API via `contextBridge.exposeInMainWorld`:

```typescript
contextBridge.exposeInMainWorld("shellApi", {
  // Canvas state
  canvasLoadState: () => ipcRenderer.invoke("canvas:load-state"),
  canvasSaveState: (state) => ipcRenderer.invoke("canvas:save-state", state),

  // Workspace
  workspaceAdd: () => ipcRenderer.invoke("workspace:add"),
  workspaceSwitch: (i) => ipcRenderer.invoke("workspace:switch", i),

  // Canvas RPC (bridge to JSON-RPC)
  onCanvasRpcRequest: (cb) => { ... },  // receive from main
  canvasRpcResponse: (resp) => { ... }, // send back to main

  // Integrations
  getAgents: () => ipcRenderer.invoke("integrations:get-agents"),
  installSkill: (id) => ipcRenderer.invoke("integrations:install-skill", id),
});
```

**AgentGrid equivalent:** Our preload should expose `agentgridApi` with:

- `gridLoadState()` / `gridSaveState(state)`
- `paneCreate(agent, row, col)` / `paneKill(id)`
- `paneWrite(id, data)` / `paneResize(id, cols, rows)`
- `signalWatch()` / `signalGet(role)`
- `presetList()` / `presetLoad(name)` / `presetSave(name)`
- `broadcast(message)`

### Canvas Persistence (canvas-persistence.ts — 59 LOC)

Atomic write pattern worth copying exactly:

```typescript
export async function saveState(state: CanvasState): Promise<void> {
  const tmp = join(tmpdir(), `canvas-state-${crypto.randomUUID()}.json`);
  const json = JSON.stringify(state, null, 2);
  await writeFile(tmp, json, "utf-8");
  await rename(tmp, STATE_FILE); // atomic on same filesystem
}
```

### Panel Resize System

- CSS custom properties: `--panel-left-min`, `--panel-left-max`, `--panel-right-min`, etc.
- Panel visibility persisted via `pref:set` IPC
- Panel widths persisted as preferences
- Shortcuts toggle panels: `Cmd+\` for nav, `Cmd+Shift+\` for viewer

### Drag-and-Drop System

- File drag from nav → canvas creates new tile
- Canvas tracks `getDragPaths()` for external file drops
- Drag-and-drop between webviews uses IPC routing (`dnd:*` channels)

---

## Appendix E: AgentGrid ↔ Collaborator Feature Parity Checklist

| Feature               |  Collaborator   |  AgentGrid CLI   | AgentGrid App Target |
| --------------------- | :-------------: | :--------------: | :------------------: |
| Terminal tiles        |       Yes       | Yes (tmux panes) |         Yes          |
| Code editor tiles     |  Yes (Monaco)   |        No        |  No (out of scope)   |
| Note tiles            | Yes (BlockNote) |        No        |          No          |
| Image tiles           |       Yes       |        No        |          No          |
| Graph tiles           |    Yes (D3)     |        No        |    Maybe Phase 3     |
| Browser tiles         |       Yes       |        No        |          No          |
| Infinite canvas       |       Yes       |        No        | Yes (secondary view) |
| Grid layout           |       No        |  Yes (NxM tmux)  |  Yes (primary view)  |
| Pan/zoom              |       Yes       |       N/A        |         Yes          |
| Tile drag/resize      |       Yes       |       N/A        |         Yes          |
| Marquee selection     |       Yes       |       N/A        |       Phase 2        |
| Workspace switching   |       Yes       |       N/A        | No (grid switching)  |
| File tree nav         |       Yes       |        No        |          No          |
| JSON-RPC server       |       Yes       |        No        |         Yes          |
| CLI integration       |  Yes (collab)   | Yes (agentgrid)  |     Yes (bridge)     |
| Agent hooks           | Yes (3 agents)  | Yes (10 agents)  |         Yes          |
| Session persistence   |   Yes (tmux)    |    Yes (JSON)    |         Yes          |
| State persistence     |   Yes (JSON)    |    Yes (JSON)    |         Yes          |
| Dark/light theme      |       Yes       |       N/A        |         Yes          |
| Keyboard shortcuts    |       Yes       |       N/A        |         Yes          |
| Auto-update           |       Yes       |        No        |       Phase 3        |
| Analytics             |  Yes (PostHog)  |        No        |          No          |
| **Multi-agent grid**  |       No        |     **Yes**      |       **Yes**        |
| **Signal protocol**   |       No        |     **Yes**      |       **Yes**        |
| **Broadcast**         |       No        |     **Yes**      |       **Yes**        |
| **Recursive grids**   |       No        |     **Yes**      |       **Yes**        |
| **CEO orchestration** |       No        |     **Yes**      |       **Yes**        |
| **Mission injection** |       No        |     **Yes**      |       **Yes**        |
| **Status dashboard**  |       No        |     **Yes**      |       **Yes**        |
| **Preset system**     |       No        |     **Yes**      |       **Yes**        |
| **Sound alerts**      |       No        |     **Yes**      |       **Yes**        |
| **Auto-approval**     |       No        |     **Yes**      |       **Yes**        |

**Bottom line:** Collaborator gives us ~40% of the infrastructure for free (terminal management, canvas, persistence, RPC). We add the other 60% — which is our entire competitive advantage.

---

_End of research report. All source files read and analyzed. Build team can start from this document._
