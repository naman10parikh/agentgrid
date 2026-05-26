---
description: Full context load + auto-maintenance. The one command to rule them all.
---

## Phase 1: Core Context (always loaded)

Read these files in order:

1. `CLAUDE.md` (already loaded — project brain, operating principles, permissions)
2. `CONTEXT.md` (current state — phase, what was last built, what's next)
3. `memory/MEMORY.md` (long-term decisions and patterns)
4. `memory/LEARNINGS.md` (mistakes and rules — don't repeat them)
5. `.claude/handoff.md` (session continuity — CRITICAL: this tells you exactly what was last done and what to do next. Read it, understand it, resume from it.)
6. `MAINTAINER-CHECKLIST.md` (what the maintainer needs to do — surface any blocking items)

## Phase 2: Full Repo Ingestion (CRITICAL — maintainer mandate)

The maintainer requires FULL context on every session start. Not just current work — EVERYTHING. Even if it takes minutes, this is non-negotiable. Use sub-agents in parallel to ingest:

**Sub-agent 1 — Vision & Architecture (the biblical source of truth):**

- `docs/vision/VISION.md` — Read lines 1-60 (TLDR), 203-400 (architecture), 400-600 (agent runtime), summarize the rest
- `docs/guides/SDL-PIPELINE.md` — 8-phase factory pipeline
- `docs/vision/agent-capability-map.md` — 101 capabilities, completion %
- `docs/vision/progress-tracker.md` — implementation status

**Sub-agent 2 — Maintainer Prompts & Directives (SACRED — every word matters):**

- Read ALL files in `resources/maintainer-prompts/` (raw voice dumps)
- Read `MAINTAINER-CHECKLIST.md` — blocking action items for the maintainer
- Report: which directives are done, which are pending, any new themes

**Sub-agent 3 — Research & Competitors:**

- Scan ALL files in `resources/read/` — summarize each with 1-2 lines
- Read competitor analyses in `resources/read/`
- Read `resources/awesome-repos.md` — catalog of reference repos

**Sub-agent 4 — Skills, MCPs & Tools Inventory:**

- List ALL skills in `.claude/skills/` — name, trigger, what each does
- Read `.mcp.json` — which MCPs are active
- Read `packages/web/src/lib/spark-tools.ts` — all custom tools defined
- Read `.claude/rules/` — all active rules
- Read `.claude/agents/` — all sub-agent definitions
- Report: total skills count, active MCPs, tool count, rule count

**Sub-agent 5 — Agent Identity & Web UI State:**

- Read `agents/spark/SOUL.md`, `agents/spark/BRAND.md`
- Read `packages/web/src/lib/agent-identity.ts`
- Read `packages/web/src/app/spark/chat/page.tsx` — current chat UI
- Read `packages/web/src/components/sandbox-viewer.tsx` — sandbox UI
- Read `packages/web/src/components/sandbox-panel.tsx` — sandbox panel

**Sub-agent 6 — Workflow History & Daily Logs:**

- Read ALL files in `memory/daily/` — full session history
- Summarize: key milestones, recurring themes, what the maintainer cares about most
- Report: total sessions, last 3 sessions summary, any unfinished work

Wait for ALL sub-agents to complete. Synthesize their findings into a single comprehensive status report.

## Phase 3: Today's Memory

- Read `memory/daily/` — today's entry if it exists, yesterday's if not
- Check `resources/unread/` — if any files exist, process them NOW (move to read/ after)

## Phase 4: Environment Verification

1. Run `scripts/verify.sh` — check Node, pnpm, .env, TypeScript, build, git status
2. Read `packages/web/features.json` — understand what's passing
3. Check `git log --oneline -10` — recent momentum
4. Check `git diff --stat` — uncommitted work from previous session
5. Check `git stash list` — any stashed work

## Phase 5: Report

Report to the maintainer:

- Last session summary (from handoff doc — what was built, what's next)
- Maintainer blocking items (from MAINTAINER-CHECKLIST.md — what does the user need to do?)
- Environment health (TS errors, features passing, build status)
- Inventory counts (skills, MCPs, tools, rules, features)
- Any uncommitted changes
- Any resources that were auto-processed
- Recommended next action (based on handoff + maintainer directives)

## Behavior Rules

If user says "continue" or "pick up where we left off":

- Read handoff doc -> resume the active task immediately
- Don't ask what to do — just do it

If user gives a voice dump or long context:

- Extract EVERY requirement without missing details
- Break into individual tasks
- Launch parallel sub-agents for research threads
- Route tasks by complexity (simple -> direct, complex -> sub-agents, architecture -> deep-think)
- Start executing immediately — maintainer prompts are HIGHEST PRIORITY

Maintainer prompts = IMMEDIATE PIVOT. Drop current work. Extract, plan, execute.

Remember: You are a co-founder, not an assistant. Act with full autonomy.
