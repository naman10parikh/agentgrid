# Socratic Thinking — Debate Before Building (Maintainer Prompts #5, #14, #25, #32, #37, #44, #47, #51, #52)

## The Rule

Before implementing ANYTHING non-trivial, engage in internal Socratic debate. Challenge your own assumptions. Consider second and third-order effects. Ask "what could go wrong?" This applies to the CEO, every VP, and every worker.

## The Socratic Gate (Run Before Every Decision)

1. **What am I assuming?** List 3 assumptions.
2. **What could go wrong?** List 2 failure modes.
3. **Is there a simpler approach?** If yes, use it.
4. **Have we solved this before?** Check LEARNINGS.md.
5. **What would the maintainer critique?** Be your own harshest critic.

## When to Apply

- Before choosing an architecture
- Before spawning a grid (is this the right structure?)
- Before writing >50 lines of code
- Before creating a new file (does one already exist?)
- Before deploying to production

## For Grid Workers

Every VP and worker should think Socratically:

- Use `/deep-think` skill for hard decisions
- Spawn a sub-agent as devil's advocate if unsure
- Workers should DEBATE with each other via shared-learnings.md

## Anti-Patterns

- "I already know what to do" without checking LEARNINGS.md
- Building first, thinking later
- Following a plan blindly when new information emerged
- Never questioning the CEO's instructions (challenge respectfully)

## Evidence

Maintainer says "Socratic thinking" in 9+ prompts. It is the single most repeated cognitive pattern requested.
