# AGENTS.md — agentgrid

> The one set of instructions for every coding agent (Codex, Cursor, OpenCode, Copilot, Gemini CLI, Claude Code) and
> for the people steering them. `CLAUDE.md` and `GEMINI.md` import this file.

## What it does

agentgrid spawns a visible grid of AI coding agents in one command, one agent per tmux pane, and tracks each one:
working, waiting, done or idle. Its agent employee is **Lattice** ([identity/SOUL.md](identity/SOUL.md)), whose job is
**dispatch**: splitting work across agents, handing out missions and following them to done. Use it when one task
splits into parts that several agents can do side by side.

## Tools and how to call them

**Command line** (`agentgrid`, a bash CLI; the per-pane and harness commands run the TypeScript CLI in `dist/`):

| Command | What it does |
| --- | --- |
| `agentgrid ROWSxCOLS [agent]` | create a grid, e.g. `agentgrid 2x3 claude` (up to 10x10) |
| `agentgrid status --json` | every pane with its status, label and command, as JSON |
| `agentgrid send <pane> "<text>"` | send a prompt to one pane (`%42` or `session:1.3`) |
| `agentgrid inject <pane> --file <f>` | inject a long mission file into one pane |
| `agentgrid read <pane> -n 40` | read a pane's last lines |
| `agentgrid broadcast "<text>"` | send the same line to every pane in the window |
| `agentgrid monitor` · `agentgrid dashboard` | live status of every pane |
| `agentgrid save <name>` · `agentgrid restore <name>` | save and restore a grid, with conversation ids |
| `agentgrid launch <preset>` · `agentgrid preset list` | start a built-in team layout |
| `agentgrid kill` | clear the grid back to one pane |
| `agentgrid memory-search "<query>"` | BM25 search over this repository's memory and docs |
| `agentgrid sandbox-run "<command>"` | run a command in an isolated E2B microVM (needs `E2B_API_KEY`) |
| `agentgrid runs` | the append-only run log of state-changing actions |
| `agentgrid --help` · `agentgrid --version` | help and version |

**MCP server** (`agentgrid-mcp`, stdio, 15 tools): `grid_create`, `grid_status`, `grid_broadcast`, `grid_kill`,
`grid_equalize`, `grid_dashboard`, `pane_send`, `pane_read`, `pane_rename`, `pane_add`, `pane_inject`, `preset_list`,
`preset_load`, `session_save`, `session_restore`. Start it with
`npx -y -p github:naman10parikh/agentgrid agentgrid-mcp`, or `agentgrid mcp-serve` from an installed CLI.

**Skills** ([skills/](skills/)): `agentgrid` (spawn a grid), `agentgrid-orchestrate` (hand out and track work),
`agentgrid-sessions` (save, restore, presets).

**Sub-agents** ([.claude/agents/](.claude/agents/)): `grid-operator` runs a grid for a plan; `pane-doctor` diagnoses a
stuck pane, read-only.

## What not to do

- Never `tmux select-pane` in code or scripts: it steals the person's focus. Read with `capture-pane`, drive with
  `send-keys`.
- Never spawn a grid in a hidden or detached session the person cannot see.
- Never pass text from a tool call or a user to a shell string: use argument arrays (`execFileSync`).
- Never count with `((x++))` under `set -e`: bash 4.1 and newer exit when `x` is 0. Use `x=$((x+1))`.
- Never add an agent install command without checking the registry (`npm view`, `brew info`) and adding it, with its
  source, to `install-allowlist.json`; a test fails otherwise.
- Never commit a key, a home path or a run log (`logs/`, `.claude/audit.jsonl`).
- Never merge a change that fails `pnpm test` or `pnpm eval`.

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
eval/                 # run.sh: smoke.sh + surfaces.py (L1) and golden.sh (L2, private tmux, pass^3)
skills/               # the three agentgrid skills (SKILL.md each), shipped in the plugin
hooks/hooks.json      # the plugin's hooks: color each pane by its agent's status
scripts/improve.mjs   # one turn of the nightly self-improvement loop (writes a proposal)
docs/                 # all reference + architecture + launch docs (see brain MOC)
Formula/, homebrew/   # Homebrew tap formula
identity/             # harness identity: SOUL / MEMORY / BRAND / HEARTBEAT
memory/               # harness long-term memory (MEMORY, LEARNINGS, daily, topics)
brain/                # the company-brain knowledge graph (MOC + ORG_CONTEXT/MEMORY)
.claude/              # settings.json (hooks), agents/ (sub-agents), plus inherited rules/ and skills/
```

## Sub-agents available in this repo (`.claude/agents/`)

Use the right one; sub-agents research and review, the parent implements.

| Sub-agent              | Use it for                                              |
| ---------------------- | ------------------------------------------------------- |
| `grid-operator`        | running a live grid for a plan: spawn, name, send, track |
| `pane-doctor`          | diagnosing a stuck, waiting or crashed pane (read-only)  |
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
pnpm eval           # smoke + surfaces + golden tasks (needs tmux)
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
- **Test before signal:** `pnpm build`, `pnpm test` and `pnpm eval` must pass before a change is "done". The app has its own gate (`pnpm --dir app test`).
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
