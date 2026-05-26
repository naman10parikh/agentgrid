# Contributing to agentgrid

Thanks for wanting to help! Here's how.

## Quick Start

```bash
git clone https://github.com/naman10parikh/agentgrid.git
cd agentgrid
pnpm install
pnpm build
pnpm test
```

For the desktop app:

```bash
cd app
pnpm install
pnpm dev     # launches Electron in dev mode
```

## How to Contribute

1. **Fork** the repo
2. **Create a branch** (`git checkout -b feat/my-feature`)
3. **Make changes** — keep it simple, test it
4. **Test** — `pnpm test` for unit tests, `pnpm build` for type checking
5. **Commit** — use conventional commits (`feat:`, `fix:`, `docs:`)
6. **Push** and open a **Pull Request**

## What We Need Help With

- **New agent integrations** — Cursor, Windsurf, Continue, etc.
- **Linux testing** — we develop on macOS, need Linux testers
- **Windows/WSL** — make it work on Windows Terminal + WSL
- **Custom themes** — more terminal color schemes
- **Persona definitions** — specialized agent types for new domains
- **Documentation** — examples, guides, screenshots, GIFs

## Project Structure

```
tools/agentgrid/
├── src/              # CLI source (TypeScript)
├── dist/             # Compiled CLI output
├── presets/          # Built-in grid presets
├── app/              # Electron desktop app
│   ├── src/main/     # Main process (terminal manager, IPC)
│   ├── src/renderer/ # React UI (xterm.js, components)
│   └── src/shared/   # Types shared between processes
└── tests/            # Vitest test suite
```

## Code Style

- TypeScript strict mode — no `any`, no default exports
- `const` over `let`, no `var`
- Files under 400 lines — split if longer
- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`)
- Use `pnpm` (not npm or yarn)

## Testing

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

For the desktop app:

```bash
cd app
pnpm typecheck         # TypeScript check
pnpm build             # Full Vite build
pnpm test:e2e          # Playwright E2E tests
```

## Issues

- Use GitHub Issues for bugs and feature requests
- Include: OS, tmux version, terminal emulator, steps to reproduce
- Check existing issues before creating a new one
