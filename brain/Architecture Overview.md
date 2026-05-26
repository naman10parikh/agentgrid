---
type: architecture
status: active
created: 2026-05-25
updated: 2026-05-25
tags: [agentgrid, architecture, app]
source: ../docs/ARCHITECTURE.md
related: ["[[MOC - agentgrid]]", "[[IPC Protocol]]", "[[App User Guide]]"]
---

# Architecture Overview

Navigation note. The architecture document for the Electron desktop app — the foundation
for all app build work. Covers the main/renderer/preload split, the grid and terminal
managers, signal watching, and how the app drives tmux. The app code lives under `../app/`;
the CLI's lighter architecture (tmux + bash launcher + TypeScript commands) is described in
the root `README.md` ("Architecture" / "How It Works").

**Read the source:** `../docs/ARCHITECTURE.md`.

## Related Notes

- [[IPC Protocol]] — the channel contract between main and renderer
- [[Extension Guide]] — the external JSON-RPC control surface
- [[App User Guide]] — the user-facing side of this architecture
- Back to [[MOC - agentgrid]]
