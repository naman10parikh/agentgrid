# From CLI to Mission Control: How We Built AgentGrid with AgentGrid

_The story of transforming a 1,387-line bash script into a full Electron app — using a 6-agent swarm._

---

## The Problem

You're running 6 AI coding agents in parallel. Claude Code is writing the auth module. Codex is scaffolding the API. Gemini is researching database options. They're all in separate tmux panes, and you're switching between them like a caffeinated air traffic controller.

That was our life for months. We had a bash script called `agentgrid` — 1,387 lines of tmux commands, Python JSON parsing, and creative ANSI coloring. It worked. Sort of.

```bash
agentgrid 2x3 claude
```

Six panes. Six agents. All working. But:

- **You can't drag-resize tmux panes smoothly** (it's a rounding nightmare)
- **Status indicators are fragile** (custom tmux hooks that break on updates)
- **No real-time signal monitoring** (polling `.done` files in a bash loop)
- **Broadcast is fire-and-forget** (no confirmation, no history)
- **Session restore is best-effort** (JSON parsing in Python, in bash, in tmux)

We needed a real app. Not another terminal wrapper — a Mission Control.

## The Decision

We studied the landscape:

| Tool            | Approach                    | Limitation                                   |
| --------------- | --------------------------- | -------------------------------------------- |
| Collaborator    | Infinite canvas + terminals | Single-developer workspace, no orchestration |
| Warp            | AI-native terminal          | Single agent, no multi-pane                  |
| Cursor Composer | Parallel worktrees          | Tied to VS Code, proprietary model           |
| Claude Swarm    | Task dependency graph       | Hackathon project, unmaintained              |

None of them solved our problem: **orchestrating a team of AI agents visually**.

So we built AgentGrid. And we built it using AgentGrid.

## The Build: 6 Agents, 3 Waves, 12 Hours

### The Grid

```
┌──────────────┬──────────────┬──────────────┐
│ VP-RESEARCHER│ VP-ARCHITECT │ VP-CLI       │
│ Collaborator │ Architecture │ TypeScript   │
│ deep-dive    │ decisions    │ CLI port     │
├──────────────┼──────────────┼──────────────┤
│ VP-FRONTEND  │ VP-ELECTRON  │ VP-QA        │
│ React comps  │ Main process │ Tests + E2E  │
│ + design     │ + IPC        │              │
└──────────────┴──────────────┴──────────────┘
```

We used `agentgrid 2x3 claude` to spawn the grid, then injected mission briefs into each pane:

- **VP-RESEARCHER**: Deep-dive Collaborator's source code, produce COLLABORATOR-ANALYSIS.md
- **VP-ARCHITECT**: Design the architecture, write ARCHITECTURE.md and IPC-PROTOCOL.md
- **VP-CLI**: Port the bash CLI to TypeScript with Commander.js
- **VP-FRONTEND**: Build React components — GridView, TerminalPane, Sidebar, PresetBrowser
- **VP-ELECTRON**: Wire the main process — PTY manager, grid manager, tool injector, signal watcher
- **VP-QA**: Write tests, run builds, verify everything works

### Wave 1: Research + Architecture (2 hours)

VP-RESEARCHER read every source file in Collaborator's repo (49 files, 8,100+ LOC). The output: a 760-line analysis document with an Adopt/Skip/Add matrix that became the blueprint for every engineering decision.

VP-ARCHITECT produced the data model, IPC protocol (71 channels!), and harness format. The key insight from Collaborator: **vanilla JS outperforms React for spatial canvas rendering, but React is fine for everything else.**

### Wave 2: Implementation (6 hours)

All four implementation agents worked in parallel:

- VP-CLI rewrote 1,387 lines of bash into 2,132 lines of TypeScript
- VP-ELECTRON built the main process: terminal-manager.ts, grid-manager.ts, tool-injector.ts, signal-watcher.ts, harness-loader.ts, rpc-server.ts, webhook-manager.ts
- VP-FRONTEND built 25 React components including GridView with drag-to-resize pane borders
- Every `npx electron-vite build` had to pass clean before moving to the next feature

### Wave 3: Polish + Testing (4 hours)

VP-QA wrote 272+ tests across 19 test files. Every module has dedicated tests:

```
grid-manager:     46 tests
tool-injector:    36 tests
terminal-manager: 28 tests
harness-loader:   26 tests
task-router:      22 tests
signal-watcher:   13 tests
rpc-server:       11 tests
webhook-manager:  10 tests
...and 14 more test files
```

## What We Built

### The Numbers

| Metric               | Value         |
| -------------------- | ------------- |
| MASTER-TODO items    | 320/345 (92%) |
| Tests                | 272+ passing  |
| Test files           | 19            |
| Main process modules | 15            |
| React components     | 25            |
| IPC handlers         | 71            |
| CLI commands         | 30+           |
| Supported agents     | 10            |
| Build time           | <30s          |
| Grid spawn time      | <10ms         |

### The Architecture

```
┌─────────────────────────────────────────────┐
│                MAIN PROCESS                  │
│  terminal-manager  grid-manager              │
│  tool-injector     signal-watcher            │
│  harness-loader    rpc-server                │
│  webhook-manager   task-router               │
│  store            workspace-config           │
│  mcp-server       file-tracker               │
│  github-integration                          │
├─────────────────────────────────────────────┤
│  PRELOAD (contextBridge → 71 IPC channels)   │
├─────────────────────────────────────────────┤
│              RENDERER (React 19)             │
│  GridView  TerminalPane  Sidebar             │
│  Toolbar   CEOLogPanel   PresetBrowser       │
│  ToolManager  CommandPalette  StatusBar      │
│  ActivityTimeline  WorkspaceList  CostChart  │
└─────────────────────────────────────────────┘
```

### Key Features

1. **Visual Grid** — NxM layout with drag-to-resize borders, double-click to zoom
2. **10 AI Agents** — Claude, Codex, Gemini, Aider, Goose, Hermes, Cline, Copilot, Cursor, any CLI
3. **Signal Protocol** — Real-time `.done`/`.needs-qa`/`.migrating` file monitoring
4. **Harness System** — YAML templates with roles, models, effort levels
5. **CEO Dashboard** — Log viewer, progress bar, activity timeline, cost tracking
6. **JSON-RPC Bridge** — CLI and app share state via Unix socket
7. **Webhook System** — Fire HTTP webhooks on agent completion
8. **Smart Task Router** — Auto-picks model based on task complexity (Haiku/Sonnet/Opus)
9. **Command Palette** — Cmd+K for quick actions
10. **Mock API** — Full UI testable in browser without Electron

## The Meta: Building It with Itself

The most satisfying moment: we used `agentgrid 2x3 claude` to spawn the team that built the AgentGrid app. The CLI created the grid. The grid built the app. The app will replace the grid.

This is the recursive dream: **the tool that builds itself**.

## What's Next

- **npm publish**: `npm install -g agentgrid` for the CLI
- **Homebrew**: `brew install agentgrid` for macOS
- **DMG release**: Downloadable app from GitHub Releases
- **Community**: Discord for multi-agent orchestration enthusiasts

## Try It

```bash
# CLI (works now)
npx agentgrid 2x3 claude

# App (build from source)
cd tools/agentgrid/app && npm install && npm run build && npm start
```

---

_Built with AgentGrid. Powered by Claude Opus 4.6. Written by agents, for agents._

_[AgentGrid on GitHub](https://github.com/naman10parikh/agentgrid) · [npm](https://www.npmjs.com/package/agentgrid)_
