---
name: architect
description: Use when making architectural decisions for the Energy/NRG platform. Loads architecture from VISION.md and debates trade-offs using Socratic thinking.
---

## Context Loading

Read these files for architectural grounding:

1. `docs/vision/VISION.md` lines 1-60 (Super TLDR)
2. `docs/vision/VISION.md` lines 203-1000 (How It Actually Works)

## Decision Protocol

1. **State the question clearly** — one sentence.
2. **List 3+ approaches** — each with:
   - Pros (why this works)
   - Cons (what breaks at scale)
   - Precedent (who does this already?)
3. **Second-order thinking** — what happens when this scales 100x? What about 1000x?
4. **Third-order thinking** — how does this affect the AutoLab loop? The GEA mesh?
5. **Recommend one approach** with clear justification.
6. **Name what you're sacrificing** — every choice has a cost. State it.

## Reference Patterns

- Harness > model (same model, different scaffold → 42% vs 78%)
- Bootstrap memory ≤ 2,000 tokens (Level 1 always loaded)
- Progressive disclosure (load skills on demand, not upfront)
- Model routing by step complexity (Haiku for parsing, Sonnet for reasoning, Opus for architecture)
