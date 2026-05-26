---
type: architecture
status: active
created: 2026-05-25
updated: 2026-05-25
tags: [agentgrid, architecture, ipc]
source: ../docs/IPC-PROTOCOL.md
related: ["[[MOC - agentgrid]]", "[[Architecture Overview]]", "[[Extension Guide]]"]
---

# IPC Protocol

Navigation note. The Electron IPC reference — every main↔renderer channel, request/response
vs event streaming, and the preload bridge. The source of truth for the channels is
`../app/packages/shared/src/types.ts` (`IPCChannels`); this doc documents it.

**Read the source:** `../docs/IPC-PROTOCOL.md`.

## Related Notes

- [[Architecture Overview]] — where these channels fit in the app
- [[Extension Guide]] — the external (Unix-socket) control surface
- Back to [[MOC - agentgrid]]
