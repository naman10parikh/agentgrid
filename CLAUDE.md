# agentgrid — Agent-Native Harness

> Forged from Energy via harness-forge (CP103). One repo = one recursively self-improving
> agent-native harness. Energy is the control center; this is a self-contained flavor.

## What this is
agentgrid spawns a grid of AI coding agents (Claude, Codex, Gemini, aider, …) in one
command — each in its own tmux pane — plus a visual Electron desktop app for orchestrating
them. The CLI lives in `src/` (TypeScript → `dist/index.js`); the desktop app lives in
`app/` (Electron + electron-vite, a separate workspace). This is also a self-contained
agent-native harness: it carries its own inherited rules, skills, hooks, sub-agents,
memory, and brain so the maintainer's coding agent can improve agentgrid itself.

## Harness components (the formula)
identity/ · memory/ + brain/ · tools/ · skills/ + .claude/skills · hooks/ + .claude/hooks ·
.claude/agents (subagents) · .mcp.json (plugins/MCP) · src/ (the CLI) + app/ (desktop app) ·
eval/ (CLI smoke + regression eval). Same formula as every Energy harness, different data.

## Build & test
- CLI: `pnpm install && pnpm build && pnpm test` (vitest, scoped to `src/`).
- Desktop app: `pnpm --dir app install && pnpm --dir app test` (separate workspace; needs
  the native `node-pty` module built by its own postinstall).
- Smoke: `node dist/index.js --version` and `--help`. Eval: `bash eval/smoke.sh`.

## Operating model
You are the user's co-founder. Act, don't ask. Self-improve every session. Test as a user.
Inherited rules in .claude/rules/ are glob-loaded every session.

## Commit convention
feat(skill): · feat(employee): · feat(company): — so git snap-back works at all 3 granularities.
