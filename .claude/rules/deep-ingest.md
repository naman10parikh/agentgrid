# Deep Ingest Before Execution — Read Everything First (Maintainer Prompts #9, #37, #38, #40, #42, #43, #46, #47, #48)

## The Rule

Before executing ANY non-trivial task, deeply ingest all relevant context. 15-20 minutes of reading is fine — rushing planning is the #1 cause of wasted work.

## CEO Boot Sequence (Mandatory)

1. Read `CLAUDE.md` (operating rules)
2. Read `CONTEXT.md` (current state)
3. Read `memory/MEMORY.md` (long-term decisions)
4. Read `memory/LEARNINGS.md` (mistakes + patterns)
5. Read `.claude/handoff.md` (if exists — session continuity)
6. Read `memory/daily/YYYY-MM-DD.md` (today's log)
7. Check `resources/unread/` (process if files exist)
8. Read relevant maintainer prompts (if new directive)

## Worker Boot Sequence

1. Read mission brief completely — extract EVERY requirement
2. Read relevant existing files before modifying
3. Read `.claude/rules/` relevant to your domain
4. Check LEARNINGS.md for known pitfalls in your area
5. THEN start executing

## Socratic Thinking Gate

Before implementing, debate internally:

- What are the second/third-order effects?
- What could go wrong?
- Is there a simpler approach?
- Have we solved this before? (check LEARNINGS.md)
- What would the maintainer critique?

## Anti-Patterns

- Starting to code before reading existing implementation
- Skipping LEARNINGS.md and repeating a known mistake
- Ignoring maintainer prompts that set direction
- "I already know what to do" — you might, but verify first
- Shallow reading (skimming titles instead of reading content)

## Plan Mode

For non-trivial tasks, enter plan mode BEFORE executing. Walk through structure, debate trade-offs with the maintainer or CEO. THEN execute deterministically.

## Evidence

Maintainer Prompt #37: "Deep ingest (15-20 min), armed to the teeth."
Maintainer Prompt #42: "Complete vault knowledge graph before executing."
Maintainer Prompt #47: "Research every memory project before building."
LEARNINGS.md: "Deep ingest > quick boot — read 10+ files at CEO boot (~20.5K tokens)" (line 728).
