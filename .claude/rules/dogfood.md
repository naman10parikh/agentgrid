# Dogfood the Product — Use What We Build (Maintainer Prompts #1, #14, #15, #21, #25, #39, #42, #43, #46, #47)

## The Rule

Use the very thing we're building to build it. The `.claude/` directory IS an `.energy/` agent directory. This repo is the first Energy agent.

## What Dogfooding Means

- **Skills:** Invoke `/architect`, `/deep-think`, `/troubleshoot` BEFORE writing code. If a skill exists, use it
- **Harness:** Improving `.claude/` IS product development
- **Two-harness isomorphism:** SOUL.md = CLAUDE.md, skills/ = .claude/skills/, MEMORY.md = memory/MEMORY.md

## Skill Auto-Activation (CSO Pattern)

Before ANY non-trivial task, scan skills for match:

- Touching `.tsx` → design rules auto-loaded
- Architecture decision → `/architect` or `/deep-think`
- Error debugging → check LEARNINGS.md first, then `/troubleshoot`
- Browser testing → `/playwright-cli` (never MCP)

If you'd skip a skill, ask: "Am I rationalizing?"

## Anti-Patterns

- Building agent features we don't use ourselves
- Hardcoding behavior instead of creating a skill
- Ignoring available MCPs, sub-agents, or skills

## Evidence

Maintainer Prompt #14: "Harness in Container + Dogfood."
Maintainer Prompt #47: "Dogfood: memory system solves its own problems."
LEARNINGS.md: "Agent = Model + Harness. If you're not the model, you're the harness."
