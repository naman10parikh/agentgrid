---
type: company-brain
status: active
created: 2026-05-25
updated: 2026-05-25
tags: [agentgrid, company-brain]
source: ../memory/LEARNINGS.md
related: ["[[MOC - agentgrid]]", "[[ORG_CONTEXT]]"]
---

# agentgrid — ORG_MEMORY (the company brain's memory)

Every agent writes back here after acting. The fleet inherits every workflow's learnings.
Detailed, append-only learnings live in `../memory/LEARNINGS.md`; this is the brain-graph
view of the most load-bearing ones.

## Durable learnings

- **Two independent test gates.** The CLI (`pnpm test`, 37 tests) and the desktop app
  (`pnpm --dir app test`, 475 tests) are separate workspaces with separate dependency trees.
  A change is only "done" when the gate for the surface it touched is green — don't assume
  building one builds the other. The app needs the native `node-pty` module from its own
  postinstall.
- **One IPC source of truth.** All Electron main↔renderer channels are declared once in
  `app/packages/shared/src/types.ts` (`IPCChannels`). Redeclaring them anywhere drifts the
  contract — extend that interface, then `docs/IPC-PROTOCOL.md` documents it.
- **Never steal the user's focus.** `tmux select-pane` moves the user's cursor between
  panes; it is banned in agentgrid code and scripts. Read panes with `capture-pane` and
  drive them with `send-keys` instead.
- **Status colors are a UX contract.** ⚡ WORKING (blue) · ⏳ WAITING (yellow) · ✅ DONE
  (green). Agents with hooks (Claude/Codex/OpenCode) set status via `pane-status.sh`; others
  fall back to exit-code detection. Don't repaint these meanings.
- **Bash 3.2 is the floor for shell pieces.** Stock macOS ships bash 3.2 (no associative
  arrays); installer and hook scripts must stay compatible (lesson carried from the
  pre-TypeScript era, still true for `install.sh` / `pane-status.sh`).

## Origin note

agentgrid began as a ~1,400-line bash script and was rewritten to TypeScript + Electron at
v2.0.0 (see [[Changelog]]). The CLI command surface stayed backward-compatible through the
rewrite — that compatibility promise is itself a durable constraint.

---

Back to [[MOC - agentgrid]].
