---
name: llm-council-critique
description: Run a 6-hat brutal LLM Council self-critique on any deliverable, session output, or status update. Surfaces what's actually missing, where the work is shallow, and what was tabled-for-later. Use BEFORE re-attacking a problem the maintainer has flagged twice. Encodes the Karpathy LLM Council pattern from CP82 ralph loop iterations 2 and 3 — applying the council BEFORE the next attack saves three iterations.
trigger: llm council | brutal critique | self-critique | what did i miss | be honest with myself | ralph loop reflection
---

# LLM Council Critique — Brutal Self-Reflection Skill

Permanent harness asset for the 6-hat brutal self-critique pattern Karpathy popularized and maintainer invoked in CP82 ralph loop iterations 2 and 3.

## When to invoke

- Maintainer says "be very blunt with yourself, I'm not seeing it"
- Maintainer re-invokes the same prompt for a 2nd or 3rd time (proves prior iteration was insufficient)
- Before any "I think we're done" claim on a complex deliverable
- After spawning sub-agents and getting output back — BEFORE applying their proposals
- Anytime you catch yourself listing "follow-ups" or "still ungated" items at the end of a deliverable

## The 6 hats (always run in this order)

### Hat 1: Senior FDE / Architect

Lens: did you ship a SYSTEM or just words? What's the gap between "I added prose" and "the platform is buildable from this"? Are there scenes/sections/files you avoided?

### Hat 2: Boris Cherny / Harness Engineer

Lens: did you DOGFOOD the framework you described? If you added a "5-axis Observer" claim to the doc, does Energy's actual harness implement it? Where's the test that proves the prose isn't aspirational?

### Hat 3: Karpathy / Open-Endedness

Lens: did you USE the framework as a generative lens or just CITE it? Open-endedness means: when you ask "what's genuinely different from anything we already do?" — what does the answer surface? Did you generate any genuinely new ideas, or just stitch existing material?

### Hat 4: Auditor / Coverage

Lens: count what was asked vs done. If maintainer said "every bookmark" and you processed 30 of 117 (25%), that's a 75% miss. If maintainer said "create tools out of every single thing I've told you" and you created ZERO, that's a hard miss. Be quantitative.

### Hat 5: Process Skeptic

Lens: is iteration N shaped the SAME as iteration N-1? If yes, you're loop-aware but loop-trapped. To make progress, attack a NEW SURFACE (different sections, different files, different artifact types). Same-shape iteration with fancier prose isn't progress.

### Hat 6: Maintainer's voice

Lens: read the literal words of the maintainer's prompt. What did they ask for that you SKIPPED? Words like "every", "all", "create tools out of every single thing", "boil the ocean", "don't stop until done" are LITERAL — not aspirational. Where did you treat a literal directive as aspirational?

## Output format

```
## LLM Council Critique — Iteration N

**Hat 1 (FDE):** "<one-sentence brutal observation>"
**Hat 2 (Boris Cherny):** "<one-sentence brutal observation>"
**Hat 3 (Karpathy):** "<one-sentence brutal observation>"
**Hat 4 (Auditor):** "<one-sentence brutal observation with quantification>"
**Hat 5 (Process Skeptic):** "<one-sentence brutal observation>"
**Hat 6 (Maintainer):** "<one-sentence brutal observation>"

## What's actually left (the new attack surface)

1. <specific deliverable, not category>
2. <specific deliverable>
3. ...

## Iteration N+1 plan (DIFFERENT shape from N)

<2-3 sentences on what makes this iteration structurally different>
```

## Anti-patterns (banned)

- ❌ "Soft" critiques ("this is good but could be better") — must be brutal, must name specific gaps
- ❌ "Things to consider" or "follow-ups" — the WHOLE POINT is to surface what's left and DO it, not list it
- ❌ Repeating an iteration N-1 critique in iteration N (means you didn't actually fix the prior issues)
- ❌ Running the council AFTER claiming completion (run it BEFORE — saves 3 iterations)
- ❌ Skipping any of the 6 hats (each surfaces a different blind spot; missing hats = missed gaps)

## When NOT to invoke

- Routine bug fixes with no maintainer directive
- Single-file edits where the scope is unambiguous
- Tasks the maintainer explicitly closed ("ship it", "good enough", "stop here")

## Why this skill exists (provenance)

Maintainer invoked the same Ralph Loop prompt twice in CP82 (iterations 2 and 3) because each time the prior iteration's "follow-up list" at the end was a tell that the work was incomplete. Iteration 3's attack surface (Scenes/Mechanics + new skills + Appendix + vault MOC) was structurally different from iter 1+2 (which both attacked TLDR sections). The skill codifies: when maintainer re-invokes, run the council BEFORE the next attack — surface what was missed, then attack a NEW surface.
