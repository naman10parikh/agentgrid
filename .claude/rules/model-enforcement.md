# Adaptive Budget System — Maintainer Directive (April 10, 2026)

**Supersedes:** Opus-everywhere mandate (March 20, 2026)
**Reason:** $200/mo Max plan exhausted in 3 days. Opus burns 5x faster than Sonnet. New system rations compute to last the full 7-day cycle while maximizing quality.

## The 4-Tier System

| Tier | Name       | Model    | Effort | Subagents      | When                   |
| ---- | ---------- | -------- | ------ | -------------- | ---------------------- |
| 1    | FULL POWER | opus     | max    | inherit (opus) | Days 0-1, surplus burn |
| 2    | BALANCED   | opusplan | high   | sonnet         | Days 2-5 (default)     |
| 3    | CONSERVE   | sonnet   | high   | haiku          | After 75% warning      |
| 4    | EMERGENCY  | sonnet   | medium | haiku          | After 90% warning      |

## How It Works

1. **SessionStart hook** runs `scripts/budget-manager.sh apply` which:
   - Reads `.claude/budget-state.json` for warnings and manual overrides
   - Calculates day-in-week position (Monday = day 0)
   - Determines optimal tier based on: time position x warning level
   - Writes `ANTHROPIC_MODEL`, `CLAUDE_CODE_EFFORT_LEVEL`, `CLAUDE_CODE_SUBAGENT_MODEL` to `settings.local.json`

2. **`opusplan` mode** (Tier 2) is the sweet spot:
   - Uses Opus ONLY during plan mode (architecture, reasoning)
   - Uses Sonnet for execution (code generation, file edits)
   - Saves ~60-70% vs full Opus while keeping planning quality high

3. **Warning-reactive downshift**: When Claude flags usage at 75%/90%/95%, run:

   ```bash
   scripts/budget-manager.sh warn 75   # or 90, 95
   ```

4. **Surplus burn**: If day 6+ with no warnings, Tier 1 activates to use remaining budget.

## Day-Based Schedule (No Warnings Active)

Weekly reset: **Friday 1am PST**.

- **Days 0-1 (Fri-Sat)**: Tier 1 — FULL POWER. Fresh weekly budget, go hard.
- **Days 2-5 (Sun-Wed)**: Tier 2 — BALANCED. opusplan + Sonnet subagents.
- **Day 6 (Thu)**: Tier 1 — SURPLUS BURN. Last day before reset, use remaining budget.

## Commands

```bash
scripts/budget-manager.sh status      # Show current tier and reasoning
scripts/budget-manager.sh env         # Output env var exports
scripts/budget-manager.sh warn <lvl>  # Record usage warning (75, 90, 95)
scripts/budget-manager.sh set <1-4>   # Manual tier override
scripts/budget-manager.sh auto        # Return to adaptive mode
scripts/budget-manager.sh reset       # New weekly cycle (clear all warnings)
scripts/budget-manager.sh apply       # Write tier env vars to settings.local.json
```

## Grid Workers

Grid workers launched via `agentgrid NxM` inherit the session's model via env vars. The `CLAUDE_CODE_SUBAGENT_MODEL` setting routes sub-agents to the tier-appropriate model automatically.

For grid CLI flags, the mandatory set remains:

```
claude --dangerously-skip-permissions --chrome --effort <tier-effort>
```

## Maintainer Override

At any time, force a specific tier:

```bash
scripts/budget-manager.sh set 1   # Force Opus full power
scripts/budget-manager.sh set 3   # Force conservation
scripts/budget-manager.sh auto    # Return to adaptive
```

## Goal

Consume **100%** of the weekly budget by reset day. Never be too conservative (leaving budget unspent) or too aggressive (exhausting budget in 3 days). The system adapts automatically.

## Permissions

All tools, skills, MCPs remain pre-approved. `defaultMode: "bypassPermissions"` unchanged. Workers never see permission prompts.

## Auto-Handoff (Unchanged)

When compaction hits (1x): write handoff, auto-switch to fresh session. Budget tier persists across sessions via `.claude/budget-state.json`.
