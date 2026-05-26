---
name: deep-think
description: Activate multi-modal thinking for complex decisions. Combines Socratic thinking, self-critique, second/third-order effects, and adversarial debate.
---

## When to Use

- Architectural decisions with long-term consequences
- Feature design where multiple valid approaches exist
- Debugging when the root cause is unclear
- Any moment where the first answer is probably wrong

## Thinking Protocol

### Phase 1: Socratic Questioning

Ask yourself:

- What am I actually trying to solve? (not the symptom, the root cause)
- What assumptions am I making?
- What would happen if my assumption is wrong?
- Who has solved something similar before?

### Phase 2: Self-Critique

For every proposed solution:

- What's the weakest part of this approach?
- What would a skeptic say?
- What breaks first at 10x scale? 100x? 1000x?
- Am I solving the right problem or building what's easy?

### Phase 3: Second-Order Effects

- If we do X, what does that force us to also do?
- What doors does this close?
- What technical debt does this create?
- How does this affect the AutoLab improvement loop?

### Phase 4: Third-Order Effects

- How does this affect the agent ecosystem 6 months from now?
- What will users build on top of this that we didn't intend?
- What competitive response does this invite?

### Phase 5: Adversarial Red Team

Argue AGAINST your own recommendation:

- Build the strongest case for a different approach
- Find the scenario where your recommendation fails
- Only proceed if you can counter the adversarial argument

## Output Format

```
QUESTION: {one sentence}
APPROACH A: {description} — STRENGTH: {x} — WEAKNESS: {y}
APPROACH B: {description} — STRENGTH: {x} — WEAKNESS: {y}
SECOND-ORDER: {what happens next}
RED TEAM: {strongest argument against recommendation}
DECISION: {chosen approach} because {reason}
SACRIFICE: {what we're giving up}
```
