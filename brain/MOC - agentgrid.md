---
type: moc
status: active
created: 2026-05-25
updated: 2026-05-25
tags: [moc, agentgrid]
---

# MOC — agentgrid

The master hub for the agentgrid brain. agentgrid is a TypeScript **CLI** (`src/`) plus an
optional Electron **desktop app** (`app/`) that spawns a grid of AI coding agents — one per
tmux pane — with color-coded status and sound alerts. It is also a self-improving
agent-native harness. This note wikilinks every doc and names every top-level folder.

## Company Brain

- [[ORG_CONTEXT]] — what this company/repo is and its operating context
- [[ORG_MEMORY]] — what the fleet has learned building agentgrid

## Reference

- [[CLI Reference]] — every `agentgrid` command and flag → `docs/CLI-REFERENCE.md`
- [[User Guide]] — every command explained with examples → `docs/guide.md`
- [[Presets Guide]] — built-in + custom grid presets → `docs/presets.md`
- [[Tips and Tricks]] — power-user shortcuts and patterns → `docs/tips.md`
- [[FAQ]] — common questions about the CLI and app → `docs/FAQ.md`
- [[App User Guide]] — using the Electron desktop app → `docs/APP-USER-GUIDE.md`
- [[Docs Home]] — the docs site front door + sidebar → `docs/README.md`, `docs/_sidebar.md`

## Architecture

- [[Architecture Overview]] — the desktop app's architecture → `docs/ARCHITECTURE.md`
- [[IPC Protocol]] — Electron main↔renderer channel contract → `docs/IPC-PROTOCOL.md`
- [[Harness Guide]] — authoring harness YAMLs (roles, grid, eval) → `docs/HARNESS-GUIDE.md`
- [[Extension Guide]] — JSON-RPC API over a Unix socket → `docs/EXTENSION-GUIDE.md`
- [[Extension Development]] — building app plugins (commands/views/menus) → `docs/extensions.md`

## Research

- [[Comparison]] — agentgrid vs other multi-agent tools → `docs/COMPARISON.md`
- [[Collaborator Architecture Analysis]] — prior-art research that informed the app → `docs/COLLABORATOR-ANALYSIS.md`
- [[Collab UI Research]] — infinite-canvas terminal UI research → `COLLAB-UI-RESEARCH.md`

## Operations

- [[Test Checklist]] — manual test pass before shipping → `TEST-CHECKLIST.md`
- [[Contributing]] — how to contribute → `CONTRIBUTING.md`
- [[Security Policy]] — vulnerability reporting → `SECURITY.md`
- [[Privacy Policy]] — what agentgrid does and does not collect → `PRIVACY.md`
- [[Code of Conduct]] — community standards → `CODE_OF_CONDUCT.md`
- [[Changelog]] — release history (v0.1 → v2.0) → `CHANGELOG.md`

## Launch / Content

- [[Launch Materials]] — Show HN post, launch blog, and X thread → `docs/HN-POST.md`, `docs/LAUNCH-BLOG.md`, `docs/X-THREAD.md`
- Screenshot assets for docs + launch live in `docs/screenshots/` (see `docs/screenshots/README.md`)

## Spine docs (canonical, not navigation notes)

These live at the repo root and are the operating contract — read them directly:

- `README.md` — human/OSS front door (install + full command list + FAQ)
- `QUICKSTART.md` — build + run commands inline
- `CLAUDE.md` — agent operating brief + harness-component map
- `AGENTS.md` — this repo's agent-orchestration conventions and directory map
- `CONTEXT.md` — current build/ship status

## Top-level folders (the repo at a glance)

| Folder       | What it holds                                                                 |
| ------------ | ----------------------------------------------------------------------------- |
| `src/`       | the TypeScript CLI (commands/, lib/, mcp-server.ts, __tests__/)               |
| `app/`       | the Electron desktop app (separate pnpm workspace: main/renderer/preload)     |
| `docs/`      | all reference, architecture, research, and launch docs                        |
| `harnesses/` | CLI-bundled harness YAML definitions (roles, grid, skills, eval)              |
| `presets/`   | built-in grid presets (JSON)                                                  |
| `examples/`  | runnable example scripts (dev-sprint, earning-fleet)                          |
| `eval/`      | `smoke.sh` — CLI regression eval                                              |
| `Formula/`   | Homebrew tap formula (CLI)                                                     |
| `identity/`  | harness identity files (SOUL, MEMORY, BRAND, HEARTBEAT)                       |
| `memory/`    | harness long-term memory (MEMORY, LEARNINGS, daily/, topics/, archive/)       |
| `brain/`     | this knowledge graph (MOC + ORG_CONTEXT + ORG_MEMORY)                         |
| `shared/`    | reserved for code shared across CLI surfaces (see its README)                 |
| `.claude/`   | inherited harness: rules/, skills/, hooks/, agents/ (sub-agents), commands/   |
| `.github/`   | issue templates + CI workflow                                                 |
