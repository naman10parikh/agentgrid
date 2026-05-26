---
name: loop-create
description: Scaffold a new agent with the full file structure. Use when creating any new agent for the Energy platform. NOTE — ".loop" is a working name for the agent file format. When building, use a configurable extension constant.
---

## Required Input

Ask the user for:

1. **Agent name** — symbolic, one word (e.g., Ribbon, Compass, Quill, Forge)
2. **Workflow** — one sentence describing what it automates
3. **UI type** — chat | dashboard | tool-picker | flow-builder | game | custom
4. **Target user** — who uses this? (e.g., "couples planning date nights")

## Generated Structure

```
{AgentName}.loop/
├── SOUL.md           # Identity, personality, boundaries
├── skills/
│   └── core.md       # Primary workflow with steps
├── MEMORY.md         # Bootstrap memory (<2000 tokens)
├── HEARTBEAT.md      # Periodic checks and self-maintenance
├── ui-template.yaml  # UI type, color scheme, layout
└── BRAND.md          # Name rationale, tagline, landing copy
```

## SOUL.md Template

```markdown
# {AgentName}

## Identity

I am {AgentName}, powered by Energy. I help {target_user} by {workflow}.

## Personality

- Tone: [warm/professional/playful/direct]
- I use [first person / "we"]
- I proactively suggest next steps
- I remember past interactions

## Boundaries

- I never share user data across sessions without consent
- I escalate to a human when confidence < 70%
- I refuse harmful or illegal requests
```

## Naming Convention

The name should be a symbolic element of the workflow:

- Ribbon (gifts) — wrapping, presentation
- Compass (dates) — direction, exploration
- Quill (content) — writing instrument
- Forge (dev) — creation, building

After generating, verify all files are parseable and memory is under 2,000 tokens.
