# Collab AI Terminal Grid UI — Research Summary

## Overview

Collaborator is an Electron app with an **infinite canvas** terminal UI. It uses:

- **Electron 40** (multi-webview architecture)
- **React 19** for UI components
- **xterm.js** for terminal emulation
- **Plain JavaScript** (not TypeScript) for shell window logic
- **Canvas API** for the grid background

## Key Insight: Multi-Window Architecture (Not A Monolithic Grid)

Unlike AgentGrid's single-window tmux-based approach, Collab uses a **multi-webview pattern**:

1. **Shell window** — Electron main renderer, hosts the infinite canvas
2. **Terminal tiles** — Each terminal is a separate **webview** embedded on the canvas
3. **File/editor/browser tiles** — Also separate webviews
4. **Grid canvas layer** — Canvas element behind tiles for dot-grid background

This means **each pane is a fully isolated Electron webview**, not a tmux split.

---

## Layout Architecture (Avoids "Box Within Box" Problem)

### HTML Structure (index.html)

```html
<div id="panels">
  <div id="panel-nav"><!-- File tree navigator --></div>
  <div id="panel-viewer">
    <canvas id="grid-canvas"></canvas>
    <div id="tile-layer"></div>
    <div id="edge-indicators"></div>
  </div>
</div>
```

**Key layers:**

- **Canvas (z-index: 0)** — Dot grid background (pan/zoom aware)
- **Tile layer (z-index: 1+)** — Container for all tiles
- **Each tile (position: absolute)** — Rendered at canvas coordinates

### CSS Strategy: Flexbox + Absolute Positioning

**Panel layout (flexbox):**

```css
#panels {
  display: flex;
  flex: 1;
}

#panel-nav {
  flex: 1 1 0;
  min-width: 100px;
  max-width: 1000px;
}

#panel-viewer {
  flex: 3 1 0; /* Gives viewer 3x width of nav */
  position: relative; /* Anchor for absolute-positioned tiles */
}
```

**Tile positioning:**

```css
.canvas-tile {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border: 1px solid rgba(128, 128, 128, 0.2);
}

.tile-title-bar {
  display: flex;
  height: auto;
  padding: 6px 8px;
  background: var(--bg);
  cursor: grab;
}

.tile-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tile-content webview {
  width: 100%;
  height: 100%;
}
```

**No "box within box" problem** because:

1. Tile container has `position: absolute` (removed from document flow)
2. Webview is `100%` width/height of tile-content (fills available space)
3. Flexbox column layout (title bar + content) inside the tile
4. Each webview is a separate Electron process (not rendering nested DOM)

---

## Transform/Scale System (Infinite Canvas)

### Pan & Zoom Implementation

**Canvas viewport (canvas-viewport.js):**

```javascript
const ZOOM_MIN = 0.33;
const ZOOM_MAX = 1;
const CELL = 20; // Minor grid cell size
const MAJOR = 80; // Major grid cell size (4x CELL)

function drawGrid() {
  const step = CELL * state.zoom;
  const majorStep = MAJOR * state.zoom;
  const offX = ((state.panX % majorStep) + majorStep) % majorStep;
  // Draw dots at animated positions based on pan/zoom state
  // Grid rescales as zoom changes
}
```

**Tile positioning (tile-renderer.js):**

```javascript
export function positionTile(container, tile, panX, panY, zoom) {
  const sx = tile.x * zoom + panX; // Canvas -> screen coords
  const sy = tile.y * zoom + panY;

  container.style.left = `${sx}px`;
  container.style.top = `${sy}px`;
  container.style.width = `${tile.width}px`;
  container.style.height = `${tile.height}px`;
  container.style.transform = `scale(${zoom})`;
  container.style.transformOrigin = "top left";
}
```

**How it works:**

1. Tiles store canonical position/size in **canvas coordinates** (tile.x, tile.y, tile.width, tile.height)
2. Tiles are rendered as **absolute positioned elements** in **screen coordinates**
3. On pan/zoom, all tiles reposition via `transform: scale(zoom)` + translate
4. Canvas is redrawn with zoom-aware grid spacing
5. Zoom limits: 33% → 100%, with "rubber band" effect at extremes

---

## Data Model (canvas-state.js)

```javascript
/**
 * @typedef {Object} Tile
 * @property {string} id
 * @property {TileType} type  // 'term' | 'note' | 'code' | 'image' | 'graph' | 'browser'
 * @property {number} x       // Canvas X coordinate
 * @property {number} y       // Canvas Y coordinate
 * @property {number} width
 * @property {number} height
 * @property {number} zIndex  // Stacking order
 * @property {string} [filePath]
 * @property {string} [url]
 * @property {string} [ptySessionId]
 */

const DEFAULT_TILE_SIZES = {
  term: { width: 400, height: 500 },
  note: { width: 440, height: 540 },
  code: { width: 440, height: 540 },
  image: { width: 280, height: 280 },
  graph: { width: 600, height: 500 },
  browser: { width: 480, height: 640 },
};

export function snapToGrid(tile) {
  const GRID_CELL = 20;
  tile.x = Math.round(tile.x / GRID_CELL) * GRID_CELL;
  tile.y = Math.round(tile.y / GRID_CELL) * GRID_CELL;
  // Snapping prevents floating-point artifacts
}
```

---

## Terminal Rendering (xterm.js + WebGL)

**Terminal tile (TerminalTab.tsx):**

```javascript
const term = new Terminal({
  theme: getTheme(),
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  fontSize: 12,
  fontWeight: "300",
  fontWeightBold: "500",
  cursorBlink: true,
  scrollback: 200000,
});

const fit = new FitAddon();
term.loadAddon(fit);
term.open(containerRef.current);

// WebGL renderer: avoids partial-paint artifacts during rapid writes
try {
  const webgl = new WebglAddon();
  term.loadAddon(webgl);
} catch {
  // DOM renderer fallback
}

// Data buffering: coalesce rapid PTY writes into single term.write()
const DATA_BUFFER_FLUSH_MS = 5; // Matches VS Code's throttle
```

**Key details:**

- `FitAddon()` auto-resizes terminal to container
- WebGL renderer for smooth multi-pane rendering
- Data buffering with 5ms flush interval (prevents render thrashing)
- ResizeObserver triggers fit on container resize
- Dynamic terminal size calculation: `width / CHAR_WIDTH = cols`

---

## File Structure (3,664 LOC total)

```
collab-electron/src/windows/shell/src/
├── renderer.js              (1,148 LOC)  Main orchestrator
├── tile-manager.js          (695 LOC)    Tile lifecycle, persistence
├── tile-renderer.js         (248 LOC)    DOM creation, positioning
├── tile-interactions.js     (337 LOC)    Drag, resize, focus
├── canvas-viewport.js       (191 LOC)    Pan, zoom, grid rendering
├── canvas-state.js          (125 LOC)    Tile data model
├── canvas-rpc.js            (168 LOC)    IPC with main process
├── panel-manager.js         (180 LOC)    Nav panel resize
├── workspace-manager.js     (219 LOC)    Workspace switching
├── edge-indicators.js       (240 LOC)    Visual pan guides
├── dark-mode.js             (26 LOC)     Dark mode toggle
├── webview-factory.js       (87 LOC)     Create webview for each tile
└── shell.css                (1000+ LOC)  All styling

collab-electron/packages/components/src/
├── Terminal/TerminalTab.tsx             React wrapper for xterm
└── [other editors, viewers, etc.]
```

---

## Design Patterns (Why Their UI Is "Amazing")

### 1. **Clean Tile Styling**

- Subtle shadow: `0 2px 8px rgba(0, 0, 0, 0.5)`
- Minimal border: `1px solid rgba(128, 128, 128, 0.2)`
- Rounded corners: `border-radius: 8px`
- Type-specific colors (terminals have different background than editors)

```css
.canvas-tile[data-tile-type="term"] {
  background: rgb(248, 248, 248); /* Light for terminals */
}

.dark .canvas-tile[data-tile-type="term"] {
  background: rgb(8, 8, 8); /* Very dark for contrast */
}
```

### 2. **Smooth Canvas Interactions**

- Zoom rubber-banding at extremes (feels tactile)
- Grid rescales as you zoom (visual coherence)
- Smooth pan with momentum decay
- Focus ring on active tile (not a harsh border)

### 3. **Terminal Typography**

- IBM Plex Mono (different from Menlo in xterm)
- `fontWeight: 300/500` for visual hierarchy
- Proper line height and scrollback buffer (200K lines)

### 4. **Isolation: Webviews**

- Each tile is a **separate Electron webview** (not iframe)
- Independent process: crash in one pane ≠ crash the grid
- Can embed arbitrary HTML/React into each tile
- Terminal tiles get their own xterm instance

---

## Comparison: Collab vs AgentGrid

| Aspect               | Collab                                | AgentGrid                   |
| -------------------- | ------------------------------------- | --------------------------- |
| **Architecture**     | Multi-webview (Electron)              | Single tmux window          |
| **Layout**           | Infinite canvas with pan/zoom         | Fixed grid (2x3, 3x2, etc.) |
| **Tile isolation**   | Separate webviews (crash-safe)        | tmux panes (shared process) |
| **Terminal backend** | xterm.js + PTY                        | tmux session                |
| **Interaction**      | Drag-drop, free positioning           | Broadcast, terminal input   |
| **Grid styling**     | Dot grid background                   | Pane borders                |
| **Focus model**      | Click to focus, Shift+click for multi | Auto-approval, broadcast    |

---

## What Makes It Work

1. **Absolute positioning** — Tiles removed from document flow, canvas is parent
2. **Transform over position** — Scale transform for zoom avoids reflow thrashing
3. **Grid snapping** — 20px grid cell prevents floating-point bugs
4. **Webview isolation** — Each pane is independent, can't crash others
5. **Canvas layer separation** — Grid drawn separately, no "box within box" rendering
6. **Type-specific styling** — Different visuals for terminal vs editor vs browser
7. **Data model clarity** — Tile = {x, y, width, height, zIndex}, everything else derives

---

## Relevant Code Paths

- **Pan/zoom:** `canvas-viewport.js:applyZoom()`, `:snapBackZoom()`
- **Tile creation:** `tile-renderer.js:createTileDOM()`
- **Tile positioning:** `tile-renderer.js:positionTile()` (key transform calculation)
- **Terminal embedding:** `packages/components/src/Terminal/TerminalTab.tsx`
- **Styling:** `shell.css` (search `.canvas-tile` and `.tile-content`)

---

## Key Takeaway for AgentGrid

Collab's UI works beautifully because it separates concerns:

- **Canvas state** (tile positions) lives in JavaScript
- **Visual rendering** happens in CSS (flexbox + absolute positioning)
- **Interaction** (drag, resize, pan) is isolated from terminal rendering
- **Each tile is truly independent** — a separate webview, not a nested DOM structure

This is fundamentally different from AgentGrid's tmux-based model, but the design patterns around clean styling, type-specific coloring, and visual hierarchy are directly applicable.
