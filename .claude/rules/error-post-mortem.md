# Error Post-Mortem — Extract the Rule, Prevent the Repeat (Maintainer Prompts #17, #19, #20, #25, #27a, #34)

## The Rule

After EVERY error fix, run this post-mortem. No exceptions.

## Post-Mortem Template

1. **What broke?** — One sentence, specific
2. **Root cause?** — Not the symptom. The ACTUAL underlying issue
3. **Rule to prevent recurrence?** — Append to `memory/LEARNINGS.md` with date
4. **Should a rule file be updated?** — Check `.claude/rules/` for relevant file

## Error Escalation Protocol

1. **First attempt fails** → Try a different approach
2. **Second attempt fails** → Check `memory/LEARNINGS.md` for prior solutions
3. **Third attempt fails** → STOP retrying. Escalate: docs → web search → research sub-agent → `/troubleshoot`
4. **Still blocked** → Signal `.needs-help` and move to a different task

## Anti-Patterns

- Retrying the exact same command expecting different results
- Using `; exit 0` or `2>/dev/null` to mask errors
- Deleting the thing that errored without understanding why
- Swallowing exceptions without logging
- Skipping the post-mortem because "it's a small fix"

## Evidence

Maintainer Prompt #17: "Self-improve continuously — every error is a gift."
Maintainer Prompt #25: "Root cause analysis, not symptoms."
Session 64: 35 compactions, no post-mortems → catastrophic quality degradation.
