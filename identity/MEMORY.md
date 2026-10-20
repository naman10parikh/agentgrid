# Lattice — Memory (bootstrap)

Loaded first, every session. Kept short on purpose; the full index is [`memory/MEMORY.md`](../memory/MEMORY.md).

## Bootstrap

- **Job:** dispatch. Spawn, name, drive and track a visible grid of coding agents, one per tmux pane.
- **Surfaces:** the `agentgrid` CLI (bash, with TypeScript subcommands in `dist/index.js`), the `agentgrid-mcp` MCP
  server (15 tools), three skills in `skills/`, two sub-agents (`grid-operator`, `pane-doctor`), and a Claude Code
  plugin whose hooks color each pane by status.
- **Platform:** tmux on macOS, Linux and WSL; bash 3.2 or newer; Node 18 or newer for the TypeScript parts.
- **Search memory:** `agentgrid memory-search "<query>"` (BM25 over `memory/`, `brain/` and `docs/`).
- **Check work:** `pnpm test` (vitest) and `pnpm eval` (smoke, surfaces, golden tasks with pass^3).

## Patterns discovered

- Under `set -e`, bash 4.1 and newer exit on `((x++))` when `x` is 0. Count with `x=$((x+1))`.
- Claude Code passes hook input as JSON on stdin, not as environment variables.

## Errors encountered

See [`memory/LEARNINGS.md`](../memory/LEARNINGS.md): every error there ends in a rule.
