# AgentGrid App — Development Setup

## Prerequisites

- Node.js 18+
- pnpm 9+
- macOS (primary), Linux (supported), Windows (planned)

## Quick Start

```bash
cd tools/agentgrid/app
pnpm install
pnpm dev          # Launch in dev mode (hot reload)
```

## Build

```bash
pnpm build        # Production build (electron-vite)
pnpm start        # Run production build
pnpm typecheck    # TypeScript type checking
```

## Test

```bash
pnpm test         # Run all unit tests (Vitest)
pnpm test:watch   # Watch mode
pnpm test:e2e     # Playwright E2E tests (requires build first)
```

## Project Structure

```
app/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts        # Window, IPC handlers, menu, lifecycle
│   │   ├── grid-manager.ts # Grid CRUD, presets, undo/redo
│   │   ├── terminal-manager.ts  # PTY spawn, write, resize, kill
│   │   ├── tool-injector.ts     # CLI tool detection, flag building
│   │   ├── signal-watcher.ts    # File watcher for .done/.needs-qa signals
│   │   ├── harness-loader.ts    # YAML harness file loading
│   │   ├── store.ts             # Persistent state (electron-store)
│   │   └── rpc-server.ts        # JSON-RPC for CLI↔App communication
│   ├── preload/
│   │   └── index.ts        # contextBridge API (type-safe IPC)
│   ├── renderer/
│   │   ├── index.html      # HTML shell
│   │   ├── styles/
│   │   │   └── index.css   # Tailwind + warm dark theme
│   │   └── src/
│   │       ├── main.tsx     # React entry
│   │       ├── App.tsx      # Root component (grid/welcome routing)
│   │       ├── types.ts     # Re-exports from shared/types
│   │       └── components/  # UI components
│   └── shared/
│       └── types.ts         # Shared types (main + preload + renderer)
├── tests/
│   ├── unit/               # Vitest unit tests
│   └── e2e/                # Playwright E2E tests
├── resources/
│   └── icon.svg            # App icon
├── electron-vite.config.ts  # Build config
├── vitest.config.ts         # Test config
└── package.json
```

## Architecture

- **Main process**: Node.js — manages windows, PTY terminals, file I/O
- **Preload**: Bridge — exposes type-safe API to renderer via contextBridge
- **Renderer**: React 19 — UI components, grid layout, terminal rendering
- **IPC**: 35+ channels for grid, pane, terminal, preset, session, tools, CEO log

## Key Patterns

1. **All IPC channels defined in `shared/types.ts`** — single source of truth
2. **Grid operations go through GridManager** — never modify grid state directly
3. **Terminal I/O batched at 16ms** — prevents IPC flooding on fast output
4. **CEO log auto-populated** — grid create, pane add/remove, broadcast, agent exit
5. **Undo/redo on grid operations** — 50-item history stack
6. **Signal watching** — file system watcher for `.done`, `.needs-qa`, `.migrating`
