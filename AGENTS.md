# AGENTS.md — agentgrid Agent-Orchestration Conventions

> How AI coding agents (and the humans steering them) should work inside **this** repo.
> This is the agent-native operating contract for agentgrid itself. Co-evolve it over time.

agentgrid is two products in one repo plus a self-improving harness:

- a **TypeScript CLI** (`src/` → `dist/index.js`) that spawns a grid of AI coding agents, one per tmux pane;
- a **desktop app** (`app/`, Electron + electron-vite + React) — a visual mission-control for those grids;
- a **harness** (`.claude/`, `identity/`, `memory/`, `brain/`) so a coding agent can improve agentgrid using agentgrid's own conventions.

## Directory map (what lives where)

```
src/                  # The CLI — TypeScript, compiled by tsc to dist/
  index.ts            #   commander entry point (the `agentgrid` binary)
  commands/           #   one file per command group: grid, panes, send, broadcast,
                      #     status, dashboard, monitor, presets, sessions, sound,
                      #     harness, harness-gen, agents, init, misc
  lib/                #   shared helpers: tmux.ts, config.ts, constants.ts,
                      #     agents.ts (agent detection), sound.ts
  mcp-server.ts       #   exposes agentgrid as an MCP tool for external orchestration
  __tests__/          #   vitest unit tests (build-gating)
agentgrid             # bash launcher / bin shim invoked by `npx agentgrid`
pane-status.sh        # the hook callback agents invoke to set @pane_status
install.sh            # one-command installer (tmux + hooks + sounds)
app/                  # Electron desktop app — SEPARATE pnpm workspace
  src/main/           #   Electron main process: grid-manager, terminal-manager,
                      #     tmux-helper, signal-watcher, council, task-router, …
  src/renderer/       #   React UI (xterm.js terminals, GridView, DashboardView, …)
  src/preload/        #   contextBridge IPC bridge
  src/shared/         #   types + pricing shared main↔renderer
  packages/shared/    #   IPCChannels contract (src/types.ts) — IPC source of truth
  harnesses/          #   app-bundled harness YAMLs
  tests/unit/         #   vitest unit tests
  tests/e2e/          #   Playwright end-to-end tests against the packaged app
harnesses/            # CLI-bundled harness definitions (YAML: roles, grid, skills, eval)
presets/              # built-in grid presets (JSON)
examples/             # runnable example scripts (dev-sprint.sh, earning-fleet.sh)
eval/                 # smoke.sh — CLI regression eval (the immune system)
docs/                 # all reference + architecture + launch docs (see brain MOC)
Formula/, homebrew/   # Homebrew tap formula
identity/             # harness identity: SOUL / MEMORY / BRAND / HEARTBEAT
memory/               # harness long-term memory (MEMORY, LEARNINGS, daily, topics)
brain/                # the company-brain knowledge graph (MOC + ORG_CONTEXT/MEMORY)
.claude/              # inherited harness: rules/, skills/, hooks/, agents/ (subagents)
```

## Sub-agents available in this repo (`.claude/agents/`)

Use the right one; sub-agents research and review, the parent implements.

| Sub-agent              | Use it for                                              |
| ---------------------- | ------------------------------------------------------- |
| `architect`            | grid/IPC/topology design trade-offs before coding       |
| `code-reviewer`        | reviewing a diff before commit                          |
| `test-writer`          | generating vitest/Playwright cases for a new command     |
| `security-reviewer`    | auditing tmux command construction / IPC / hook scripts |
| `performance-analyzer` | terminal-throughput / render perf in the app            |
| `research-agent`       | scouting prior art (e.g. the collaborator analysis)     |
| `loop-auditor`         | auditing long-running monitor/dashboard loops           |

## Build, test, run (must stay green)

CLI (the published package):

```bash
pnpm install
pnpm build          # tsc → dist/index.js
pnpm test           # vitest, scoped to src/
node dist/index.js --version && node dist/index.js --help   # smoke
bash eval/smoke.sh  # regression eval
```

Desktop app (separate workspace, native node-pty):

```bash
pnpm --dir app install   # builds node-pty via its own postinstall
pnpm --dir app test      # vitest unit tests
pnpm --dir app dev       # run the app locally (electron-vite)
# Playwright e2e: cd app && pnpm exec playwright test
```

## Working conventions

- **Spotify-queue rule:** a follow-up bug discovered while editing a surface goes back to the worker that owns that surface (CLI command files vs app main/renderer modules), not a cold broadcast.
- **Test before signal:** `pnpm build` + `pnpm test` must pass before a change is "done". The app has its own gate (`pnpm --dir app test`).
- **One source of truth:** IPC channels are defined once in `app/packages/shared/src/types.ts` (`IPCChannels`) — never redeclare them. Agent list lives in `src/lib/agents.ts` + `src/lib/constants.ts`.
- **No bespoke focus-stealing:** never `tmux select-pane` in code or scripts — it steals the user's focus.
- **Cross-repo hygiene (public repo):** no `/Users/...` paths, no internal project names, no personal data in committed docs.

## Commit grammar

Conventional commits, scoped to the surface touched:

- `feat(cli): …` · `fix(cli): …` — the `agentgrid` command (`src/`)
- `feat(app): …` · `fix(app): …` — the Electron desktop app (`app/`)
- `feat(harness): …` — a bundled harness YAML (`harnesses/` or `app/harnesses/`)
- `feat(preset): …` — a built-in preset (`presets/`)
- `docs: …` — documentation / brain graph
- `test: …` · `chore: …` · `refactor: …`

This keeps history snap-back-able at three granularities: a single skill/preset, a feature, or the whole repo.

## Quality bar

- Strict TypeScript (no `any`, named exports, files < 400 lines).
- Every command has a `--help`; every command group has at least one test.
- Status colors are part of the UX contract: ⚡ WORKING (blue) · ⏳ WAITING (yellow) · ✅ DONE (green).
- Test as a user before claiming done — for the app, that means launching it, not just compiling.
