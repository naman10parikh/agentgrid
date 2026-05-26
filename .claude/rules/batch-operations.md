# Batch Operations — 1 MESSAGE = ALL OPERATIONS (Ruflo Pattern)

## The Rule

Every worker MUST batch all related operations into a SINGLE message. Each message round-trip costs the full system prompt + context in tokens. Batching N operations into 1 message instead of N messages eliminates N-1 redundant context loads.

**Estimated savings: 50-75% reduction in token usage.**

## What to Batch

### 1. TodoWrite / TaskCreate

BAD: 5 separate TaskCreate calls in 5 messages
GOOD: All 5 in ONE message (parallel tool calls)

### 2. Agent Spawning

BAD: Spawn agents one at a time, waiting for each
GOOD: Spawn ALL agents in ONE message using parallel Agent tool calls

### 3. File Operations

BAD: Read file A, then read file B, then read file C
GOOD: Read A, B, and C in ONE message (parallel Read calls)

### 4. Bash Commands

BAD: Run `pnpm build`, wait, then run `pnpm test`
GOOD: Independent commands → parallel Bash calls. Dependent → chain with `&&`

### 5. Memory Operations

BAD: Store key1, then key2, then search
GOOD: All stores in ONE message, search in next

## When NOT to Batch

- When operation B depends on the RESULT of operation A (sequential dependency)
- When you need to read a file path returned by a previous search
- When error handling requires checking each result before continuing

## The Pattern

```
Message 1: [Agent spawn A] + [Agent spawn B] + [Agent spawn C] + [TaskCreate x5] + [Read file1] + [Read file2]
Message 2: [Process results from Message 1] + [Write outputs] + [TaskUpdate]
```

Two messages instead of twelve. Same work done.

## Enforcement

- CEO monitoring loop should check worker message efficiency
- Workers sending >3 messages for parallelizable operations are wasting tokens
- Pre-task hook should remind workers of batch pattern

## Evidence

Ruflo research (March 23, 2026): Their CLAUDE.md enforces "1 MESSAGE = ALL RELATED OPERATIONS" as a core behavioral rule. Claims 75% token reduction through batching. The math checks out: with 10K token system prompt and 10 operations, batching saves ~90K tokens per cycle.
