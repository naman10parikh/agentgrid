---
name: self-improve
description: Analyze past session logs to find repeated patterns, forgotten rules, and backtracking moments. Auto-update CLAUDE.md, skills, and rules to address gaps. "Correct once, never again."
---

## When to Use

- After several sessions of active development
- When you notice Claude making the same mistakes repeatedly
- Periodically (weekly) as a maintenance task

## Process

### 1. Session Log Analysis

Read session files from `~/.claude/projects/` (JSONL format).
Look for:

- Questions Claude asks repeatedly (→ add answer to CLAUDE.md)
- Rules Claude forgets (→ add to .claude/rules/)
- Information Claude keeps re-discovering (→ promote to bootstrap memory)
- Patterns of backtracking (→ create a skill that prevents it)
- Tool call failures (→ improve error handling in hooks)

### 2. Signal Classification

- **High confidence:** Explicit corrections from user → immediately persist
- **Medium confidence:** Patterns that worked well → persist after confirming
- **Low confidence:** Observations → queue for review

### 3. Output

For each finding:

1. Identify which file to update (CLAUDE.md, a rule, a skill, settings)
2. Make the minimal change needed
3. Log the improvement to CONTEXT.md

### 4. Verification

- Confirm CLAUDE.md is still under 80 lines / 2K tokens
- Confirm no conflicting rules exist
- Confirm skills are still discoverable (short descriptions)

## Known Error Pattern Categories (Auto-Updated)

### Category 1: Vercel Serverless State Loss

- **Pattern:** In-memory Maps/globals lost between Lambda invocations
- **Files at risk:** Any `const map = new Map()` at module scope in API routes
- **Fix:** Client-side state (Zustand/localStorage) + reconnect via SDK on every request
- **Examples:** ptyRegistry (terminal), desktopSessions (e2b-desktop)

### Category 2: Race Conditions in E2B Sandbox Boot

- **Pattern:** Operation attempted before dependency is ready (Chrome, agent, PTY)
- **Fix:** Retry loop with backoff, never assume ready after fixed sleep
- **Examples:** Chrome window streaming, agent-runner readiness, CDP port binding

### Category 3: SSE/Stream Timeout During Long Operations

- **Pattern:** Browser/proxy drops connection when no data flows for 10-15s
- **Fix:** Keepalive pings on all SSE streams
- **Examples:** Chat route during tool execution, terminal PTY during inactivity

### Category 4: Silent Catch Blocks

- **Pattern:** `catch { }` or `catch { /* comment */ }` with no logging
- **Fix:** Always `console.warn` with context prefix and error message
- **RULE:** Every catch block must either log or have `// Intentionally silent: [reason]`

### Category 5: Missing Circuit Breakers

- **Pattern:** Unlimited retries or cascading failures from flaky dependencies
- **Fix:** Track failure count, open circuit after N failures, log transitions
- **Examples:** Anthropic API rate limits, Supabase connectivity, E2B sandbox creation

## The Compound Effect

Each improvement makes the next session slightly better. Over weeks, this compounds into a dramatically better development experience. This IS AutoLab applied to our own tooling.
