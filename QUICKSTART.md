# agentgrid — Quickstart

Spawn a grid of AI coding agents in one command. agentgrid is a TypeScript CLI plus an
optional Electron desktop app for orchestrating them.

## Install + run the CLI (60 seconds)

```bash
# Option A — npm (recommended)
npm install -g agentgrid
agentgrid 2x3 claude        # 6 Claude Code panes, evenly tiled

# Option B — one-line installer (also installs tmux + hooks + sounds)
curl -fsSL https://raw.githubusercontent.com/naman10parikh/agentgrid/main/install.sh | bash

# Option C — run without installing
npx agentgrid 2x3 claude
```

Then try the interactive wizard and a saved preset:

```bash
agentgrid setup             # pick agents per pane, save as a preset
agentgrid launch dev-sprint # launch a saved configuration
agentgrid status            # see who is working / waiting / done
```

**Requirements:** bash, tmux, python3 · **Supports:** macOS · Linux · Windows (WSL).

## Build from source (CLI)

```bash
git clone https://github.com/naman10parikh/agentgrid && cd agentgrid
pnpm install
pnpm build                  # tsc → dist/index.js
pnpm test                   # vitest (src/)
node dist/index.js --help   # smoke-test the local build
bash eval/smoke.sh          # regression eval
```

## Run the desktop app (optional)

The app is a separate pnpm workspace under `app/`:

```bash
pnpm --dir app install      # builds the native node-pty module
pnpm --dir app dev          # launch the Electron app (electron-vite)
pnpm --dir app test         # vitest unit tests
```

## Where everything lives

- Full command list, features, and FAQ: [README.md](README.md)
- Documentation index (CLI reference, architecture, harness guide, IPC, comparison):
  [docs/README.md](docs/README.md) and the knowledge graph at [brain/MOC - agentgrid.md](brain/MOC%20-%20agentgrid.md)
- Harness components (rules / skills / hooks / sub-agents / memory): [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md)
- Current build/ship status: [CONTEXT.md](CONTEXT.md)
