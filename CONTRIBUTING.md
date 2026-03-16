# Contributing to agentgrid

Thanks for wanting to help! Here's how.

## Quick Start

```bash
git clone https://github.com/naman10parikh/agentgrid.git
cd agentgrid
chmod +x agentgrid install.sh pane-status.sh
./install.sh  # installs locally
```

## How to Contribute

1. **Fork** the repo
2. **Create a branch** (`git checkout -b feat/my-feature`)
3. **Make changes** — keep it simple, test it
4. **Test** — run `./agentgrid help`, create a grid, verify sounds
5. **Commit** — use conventional commits (`feat:`, `fix:`, `docs:`)
6. **Push** and open a **Pull Request**

## What We Need Help With

- **New agent integrations** — Cursor, Gemini CLI, Windsurf, etc.
- **Linux testing** — we develop on macOS, need Linux testers
- **Windows/WSL** — make it work on Windows Terminal + WSL
- **Custom themes** — more color schemes beyond the default purple
- **Sound packs** — fun sound collections people can install
- **Documentation** — examples, guides, screenshots, GIFs

## Guidelines

- Keep it shell-only (no Node.js, Python, Go dependencies for the core tool)
- tmux is the only required dependency
- Test on macOS and Linux before submitting
- Keep README.md in sync with any new features

## Code Style

- `#!/bin/bash` with `set -euo pipefail`
- Functions prefixed with `cmd_` for commands
- Use the logging helpers: `log()`, `err()`
- Quote all variables: `"$var"` not `$var`

## Issues

- Use GitHub Issues for bugs and feature requests
- Include: OS, tmux version, terminal emulator, steps to reproduce
