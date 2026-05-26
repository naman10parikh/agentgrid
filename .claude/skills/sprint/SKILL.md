---
name: sprint
description: Plan a focused development sprint. Breaks large goals into 2-hour chunks with dependencies and parallelization opportunities.
---

## Process

1. **Clarify the goal** — restate it in one sentence. If ambiguous, ask.
2. **Decompose** — break into subtasks, each completable in ≤2 hours.
3. **Map dependencies** — what blocks what? Draw the DAG.
4. **Prioritize** by:
   - Unblocks the most downstream work
   - Highest user-facing value
   - Lowest technical risk
5. **Identify parallelism** — which tasks can subagents handle simultaneously?
6. **Estimate** — realistic time per task (include testing).
7. **Output** — numbered checklist with `[ ]` checkboxes.

## Output Format

```markdown
## Sprint: {goal}

**Estimated total:** {hours}h | **Parallelizable:** {count} tasks

### Critical Path (sequential)

- [ ] Task 1 — {description} (~{time}) [blocks: 2, 3]
- [ ] Task 2 — {description} (~{time}) [blocks: 4]

### Parallel Work (can run alongside critical path)

- [ ] Task A — {description} (~{time}) [independent]
- [ ] Task B — {description} (~{time}) [independent]

### Integration & Polish

- [ ] Task X — {description} (~{time}) [depends: all above]
```

## Rules

- Never exceed 12 tasks per sprint (cognitive overload)
- Every task must have a testable definition of done
- Include "visual test with browser" as a task when UI is involved
- Include "update CONTEXT.md" as the final task always
