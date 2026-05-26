---
name: troubleshoot
description: Multi-layer error recovery. Uses docs, web search, context7, learnings, and browser to unblock errors instead of failing repeatedly.
trigger: When any error repeats twice, or when stuck on the same problem for >5 minutes
model: sonnet
---

# Troubleshoot — Never Fail the Same Way Twice

## Error Recovery Ladder (escalate through levels)

### Level 1: Memory Check (10 seconds)

- Search `memory/LEARNINGS.md` for the error message or pattern
- If found: apply the documented fix immediately

### Level 2: Docs Check (30 seconds)

- Use context7 MCP to query the relevant library's docs
- Example: `resolve-library-id("@e2b/desktop")` then `query-docs` for the specific API

### Level 3: Web Search (1 minute)

- Search for the exact error message + library name
- Look for GitHub issues, Stack Overflow, blog posts
- Extract the fix and apply it

### Level 4: Codebase Search (1 minute)

- Search awesome-claude-code and similar repos for patterns
- Use `Grep` and `Glob` to find how others solved the same problem
- Check if there's an MCP server that handles this

### Level 5: Alternative Approach (2 minutes)

- Step back. Is there a completely different way to achieve the same goal?
- Can you use a different library? Different API? Different pattern?
- The simplest solution that works is the best solution

### Level 6: Claude.ai Prompt (last resort)

- Write a detailed prompt with:
  - What you're trying to do
  - What you've tried
  - The exact error
  - Relevant code snippets
- Tell the user: "Paste this into Claude.ai for an answer"

## Rules

1. NEVER retry the exact same approach more than twice
2. ALWAYS check learnings first — we may have solved this before
3. After fixing: add the solution to `memory/LEARNINGS.md`
4. After fixing: check if a skill or hook should be created to prevent recurrence
5. Time-box each level. If 2 minutes pass with no progress, escalate.
6. When searching: be specific. "e2b desktop screenshot timeout" not "e2b error"
