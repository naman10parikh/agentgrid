# agentgrid — LEARNINGS (append-only)

Every error → root cause → rule. Auto-compressed when >500 lines (memory-compress.sh).

## 2026-05-25 — Two workspaces, two test gates

**What:** The CLI (`src/`, `pnpm test`) and the desktop app (`app/`, `pnpm --dir app test`)
are separate pnpm workspaces with separate dependency trees.
**Root cause:** v2.0.0 split a single bash script into a TS CLI plus an Electron app; the app
depends on the native `node-pty` module built by its own postinstall.
**Rule:** A change is only "done" when the gate for the surface it touched is green. Verify
the CLI with `pnpm build && pnpm test` (37 tests) and the app with `pnpm --dir app test`
(475 tests) — don't assume one covers the other.

## 2026-05-25 — IPC channels have one source of truth

**What:** Electron main↔renderer channels could drift if redeclared in multiple files.
**Root cause:** Typed IPC needs the renderer and main to agree on channel names/shapes.
**Rule:** Declare every channel once in `app/packages/shared/src/types.ts` (`IPCChannels`),
extend that interface to add channels, and let `docs/IPC-PROTOCOL.md` document it. Never
hand-write a channel string elsewhere.

## 2026-05-25 — `tmux select-pane` steals the user's focus

**What:** Selecting a pane programmatically yanks the user's cursor mid-task.
**Root cause:** `select-pane` is a focus-changing operation, not a read.
**Rule:** Banned in agentgrid code and scripts. Read panes with `tmux capture-pane`; drive
them with `tmux send-keys`.

> Inherited cross-cutting rules live in `.claude/rules/` and are glob-loaded every session.
> Append new entries above this line as they are discovered.
