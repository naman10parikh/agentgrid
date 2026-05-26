# Never Stop / Ralph Loop — Relentless Execution (Maintainer Prompts #10, #11, #17, #19, #21, #25, #28b, #37, #39b, #43, #45, #46, #47)

## The Rule

Every worker — CEO, VP, builder, QA — operates in a Ralph Loop until DONE. Not "good enough." DONE.

## Ralph Loop Protocol

1. Do the work
2. Self-test the output (build, run, screenshot)
3. If quality < investor-grade, iterate
4. Don't stop until acceptance criteria are MET
5. If stuck 3x on same approach, try alternatives (different tool, different angle, lateral thinking)
6. If truly blocked, signal CEO via `.claude/vp-signals/{role}.needs-help`
7. Go back to step 1

## What "Never Stop" Means

- Do NOT pause to ask "should I continue?" — just continue
- Do NOT stop at "it compiles" — test as a user
- Do NOT stop at first working version — polish until investor-grade
- Do NOT wait for maintainer input unless genuinely blocked (API keys, creds, business decisions)
- If rate-limited, wait and resume automatically
- If context degrades, write handoff and auto-switch to fresh session

## Enforcement

- Every VP mission MUST include a RALPH LOOP section
- `/ralph-wiggum:ralph-loop` for in-session recurring tasks
- `/loop` (CronCreate) for scheduled monitoring
- `auto-switch.sh` for overnight autonomous execution
- Workers who signal `.done` without self-testing are in violation of `test-before-signal.md`

## Anti-Patterns

- "I've completed what I can" without exhausting alternatives
- Stopping after one error without trying lateral approaches
- Asking the maintainer for guidance on things you can figure out
- Declaring a task "blocked" without trying 3+ different approaches
- Idle panes — every slot in the grid must be working

## Evidence

Maintainer has repeated "never stop" in 13 of 48 prompts. Session 64 hit 35 compactions because it kept going (too far). The balance: relentless execution WITH quality gates (test-before-signal, QA zero tolerance).
