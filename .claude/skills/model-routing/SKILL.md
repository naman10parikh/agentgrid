---
name: model-routing
description: Adaptive budget-aware model routing. Manages 4-tier system to maximize $200/mo Max plan usage across full weekly cycle. Run when starting sessions, hitting usage warnings, or optimizing sub-agent costs.
---

## When to Use

- Session start (automatically via hook)
- When Claude flags usage at 75%, 90%, or 95%
- Breaking large tasks into sub-tasks with different complexity levels
- When starting overnight/long-running autonomous sessions
- When you want to check or change the current budget tier

## Adaptive Budget System (Maintainer Directive — April 10, 2026)

The $200/mo Max plan has a weekly rolling limit. Opus burns ~5x faster than Sonnet. Without management, budget exhausts in 3 days.

### 4-Tier System

| Tier | Name       | Model    | Effort | Subagents | Cost vs Opus  |
| ---- | ---------- | -------- | ------ | --------- | ------------- |
| 1    | FULL POWER | opus     | max    | inherit   | 1x (baseline) |
| 2    | BALANCED   | opusplan | high   | sonnet    | ~0.3-0.4x     |
| 3    | CONSERVE   | sonnet   | high   | haiku     | ~0.15x        |
| 4    | EMERGENCY  | sonnet   | medium | haiku     | ~0.1x         |

### Quick Commands

```bash
# Check current tier
scripts/budget-manager.sh status

# Record a usage warning (when Claude flags it)
scripts/budget-manager.sh warn 75
scripts/budget-manager.sh warn 90

# Force full power for a critical session
scripts/budget-manager.sh set 1

# Return to adaptive after override
scripts/budget-manager.sh auto

# New weekly cycle started
scripts/budget-manager.sh reset

# Apply current tier to settings (auto-runs on session start)
scripts/budget-manager.sh apply
```

### How opusplan Works

The `opusplan` model alias (Tier 2) is the efficiency sweet spot:

- **Plan mode** (Shift+Tab): Uses Opus for deep reasoning, architecture, trade-offs
- **Execution mode**: Switches to Sonnet for code generation, edits, tool calls
- Result: Opus-quality planning at ~30-40% of full Opus cost

### Sub-Agent Routing

`CLAUDE_CODE_SUBAGENT_MODEL` env var controls what model sub-agents use:

- Tier 1: Subagents inherit Opus (no env var set)
- Tier 2: `CLAUDE_CODE_SUBAGENT_MODEL=sonnet`
- Tier 3-4: `CLAUDE_CODE_SUBAGENT_MODEL=haiku`

Override per-agent via frontmatter in agent `.md` files:

```yaml
---
model: opus
effort: max
---
```

### Effort Levels

| Level  | Thinking Budget | When                               |
| ------ | --------------- | ---------------------------------- |
| max    | Unconstrained   | Deep architecture, security review |
| high   | Large budget    | Standard development, debugging    |
| medium | Moderate        | Simple tasks, file edits           |
| low    | Minimal         | Quick lookups, formatting          |

Use `/effort` in-session or `CLAUDE_CODE_EFFORT_LEVEL` env var.

## Model Tier Recommendations (When Manually Routing)

### Tier 0 — No Model Needed

Pure code operations: formatting, linting, file copying, git operations, running tests.

### Tier 1 — Haiku (fast, cheapest)

- Simple text transformations and formatting
- Straightforward search and replace
- Generating boilerplate code from clear templates
- Summarizing short documents

### Tier 2 — Sonnet (default, balanced)

- Standard coding tasks (implement a function, fix a bug, write tests)
- Multi-file refactoring with clear scope
- Processing articles and extracting insights
- Most development work falls here

### Tier 3 — Opus (deep thinking, expensive)

- Architecture decisions with trade-offs
- Security reviews and vulnerability analysis
- Complex multi-system design
- Resolving contradictory requirements
- Writing or revising vision documents

## Cost Reference

| Model      | Input/MTok | Output/MTok | Relative Cost |
| ---------- | ---------- | ----------- | ------------- |
| Haiku 4.5  | $0.80      | $4.00       | 1x            |
| Sonnet 4.6 | $3.00      | $15.00      | ~4x           |
| Opus 4.6   | $15.00     | $75.00      | ~19x          |

## Additional Token Savings

1. **Use `/clear` between unrelated tasks** — stale context wastes tokens every message
2. **Delegate verbose operations to subagents** — logs, tests, docs stay in subagent context
3. **CLAUDE.md under 200 lines** — move specialized instructions to skills (on-demand loading)
4. **Use skills over MCP when possible** — skills = ~70 tokens, MCP tool definitions = ~4,200 tokens
5. **Specific prompts** — "add validation to auth.ts" not "improve the codebase"
6. **Plan mode for complex tasks** — Shift+Tab before implementation prevents expensive re-work
