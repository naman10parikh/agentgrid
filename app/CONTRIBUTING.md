# Contributing to AgentGrid App

## Development Setup

### Prerequisites

- Node.js >= 18
- npm (comes with Node.js)
- macOS (primary), Linux, or Windows

### Quick Start

```bash
cd tools/agentgrid/app
npm install --legacy-peer-deps
npm run dev
```

This starts the Electron app with hot-reload. The renderer runs on `localhost:5173`.

### Build

```bash
npm run build          # Build all 3 targets (main, preload, renderer)
npm run typecheck      # TypeScript type checking
npm run lint           # ESLint
npm run format         # Prettier formatting
```

### Test

```bash
npm test               # Run unit tests (Vitest)
npm run test:watch     # Watch mode
npm run test:e2e       # Playwright E2E tests
```

### Project Structure

```
src/
├── main/              # Electron main process
│   ├── index.ts       # Window, IPC, menu, lifecycle
│   ├── grid-manager.ts
│   ├── terminal-manager.ts
│   ├── tool-injector.ts
│   ├── harness-loader.ts
│   ├── signal-watcher.ts
│   ├── workspace-config.ts
│   ├── file-tracker.ts
│   └── mcp-server.ts
├── preload/           # Electron preload (contextBridge)
│   └── index.ts
├── renderer/          # React UI
│   ├── src/
│   │   ├── App.tsx
│   │   ├── types.ts   # Re-exports from shared
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   └── styles/
│       └── globals.css
└── shared/            # Types shared across all processes
    └── types.ts
```

### Key Patterns

- **IPC**: All main↔renderer communication goes through typed IPC channels defined in `shared/types.ts`
- **Design**: Warm black (#141312) backgrounds, JetBrains Mono for terminals, Instrument Serif for headings
- **Terminal**: xterm.js with WebGL addon, FitAddon, SearchAddon, WebLinksAddon
- **State**: React useState in App.tsx, grid state polled every 2s from main process
- **Mock mode**: When `window.api` is undefined (browser), creates mock grid locally for testing

### Adding a Component

1. Create `src/renderer/src/components/MyComponent.tsx`
2. Import types from `../types` (NOT from `../../shared/types`)
3. Use CSS variables from `globals.css` for theming
4. Build: `npm run build` to verify

### Adding an IPC Channel

1. Add channel name to `IPC` const in `src/shared/types.ts`
2. Add handler in `src/main/index.ts` via `ipcMain.handle()`
3. Add client method in `src/preload/index.ts`
4. Use in renderer via `window.api.yourMethod()`
