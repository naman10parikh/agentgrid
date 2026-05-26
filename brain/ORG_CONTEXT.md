---
type: company-brain
status: active
created: 2026-05-25
updated: 2026-05-25
tags: [agentgrid, company-brain]
source: ../CONTEXT.md
related: ["[[MOC - agentgrid]]", "[[ORG_MEMORY]]"]
---

# agentgrid — ORG_CONTEXT (the company brain's context)

Every agent reads this before acting. "If it is recorded, it happened to the AI."

## What agentgrid is

agentgrid is a developer tool that spawns a grid of AI coding agents — Claude Code, Codex,
Gemini CLI, Aider, Goose, and any other terminal command — each in its own tmux pane, from
a single command (`agentgrid 2x3 claude`). It surfaces who is working (blue), who is waiting
for input (yellow), and who is done (green), with sound alerts that punch through Do Not
Disturb. It ships in two forms from this one repo: a published **TypeScript CLI** (`src/` →
`dist/index.js`, on npm as `agentgrid`) and an optional **Electron desktop app** (`app/`)
that adds a visual mission-control over the same grids.

## Why it exists

Running several AI coding agents in parallel otherwise means juggling tmux splits,
remembering pane IDs, and manually checking which agents finished. agentgrid removes that
friction so a single human (or a CEO agent) can supervise a whole swarm at a glance.

## How it operates as a harness

agentgrid is also a self-contained agent-native harness: it carries its own inherited rules
(`.claude/rules/`), skills (`.claude/skills/`), hooks (`.claude/hooks/`), sub-agents
(`.claude/agents/`), identity (`identity/`), and memory (`memory/` + this `brain/`). That
means a coding agent can use agentgrid's own conventions to improve agentgrid — the tool
dogfoods itself. Commits are scoped (`feat(cli)`, `feat(app)`, `feat(harness)`,
`feat(preset)`) so history snaps back at the granularity of a single skill, a feature, or
the whole repo.

## Current state

The CLI is build-green with 37 passing vitest tests; the desktop app is an active workspace
(version 0.1.0) with 475 unit tests plus a Playwright e2e suite. See [[ORG_MEMORY]] for
durable learnings and `../CONTEXT.md` for the live status snapshot.

---

Back to [[MOC - agentgrid]].
