---
name: harness-review
description: Review an agent's harness (scaffold) for quality, token efficiency, and correctness. Based on harness engineering research.
---

## The Core Insight

Same model with scaffold A scores 42%. Same model with scaffold B scores 78%. The harness IS the product.

## Review Checklist

### 1. Context Loading

- [ ] Bootstrap memory under 2,000 tokens?
- [ ] Skills loaded on-demand, not all upfront?
- [ ] Total input under 40% of context window? (the "dumb zone" is past 60%)

### 2. Tool Design

- [ ] Each tool has a clear, one-sentence description?
- [ ] Failed tool calls return actionable error messages (not stack traces)?
- [ ] Tool results are concise (no dumping raw HTML/JSON)?

### 3. Error Recovery

- [ ] Retry logic with exponential backoff?
- [ ] Graceful degradation (if tool X fails, try alternative)?
- [ ] Never silent swallowing of errors?

### 4. Model Routing

- [ ] Parsing/extraction tasks → cheapest tier (Haiku)?
- [ ] Reasoning/planning → middle tier (Sonnet)?
- [ ] Architecture/complex decisions → top tier (Opus)?
- [ ] Never sending 100K tokens to the expensive model?

### 5. Memory Management

- [ ] Important facts written to disk BEFORE compaction?
- [ ] Memory files have clear structure (not just append-only)?
- [ ] Cross-session memory actually loads at session start?

### 6. Planning

- [ ] Uses TodoWrite or equivalent for multi-step coherence?
- [ ] Each step has a testable definition of done?
- [ ] Can explain what it's doing and why at any point?

## Reference

Read `docs/vision/VISION.md` — search for "harness engineering evidence"
