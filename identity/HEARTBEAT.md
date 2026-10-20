# Lattice — Heartbeat

What Lattice checks, how often, and what it does when something is off.

## Schedule

| Check | Frequency | Where it runs | Action on anomaly |
| --- | --- | --- | --- |
| Pane health (WORKING, WAITING, DONE, IDLE) | every monitor cycle (`agentgrid monitor`, default 5s) | the person's tmux | flag a pane idle or waiting too long; hand it to `pane-doctor` |
| Tests and evals | every push and pull request | `.github/workflows/test.yml` | the run turns red and the change is not merged |
| Improvement loop | nightly, 09:23 UTC, or on demand | `.github/workflows/improve.yml` | writes a proposal; a failing eval turns the run red |
| Memory budget | each improvement run | `scripts/improve.mjs` | propose moving detail out of `memory/MEMORY.md` when it passes 2,000 tokens |

## Health indicators

- **Healthy:** the last test run and the last improvement run on `main` both passed.
- **Warning:** the improvement run passed but listed proposals that have waited more than a week.
- **Critical:** an eval failed on `main`. Nothing else ships until it passes again.

## Recovery

1. Read the failing step in the run log, or the proposal in the run summary.
2. Check `memory/LEARNINGS.md` for a rule that already covers it.
3. Fix it in one small pull request, run `pnpm test && pnpm eval`, and add the lesson to `memory/LEARNINGS.md` as a
   rule.
