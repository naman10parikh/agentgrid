# Skill Routing — Progressive Disclosure for Large Skill Libraries

## How Skills Scale Without Bloating Context

Claude Code's architecture already solves the "50,000 skills" problem:

### Three-Level Loading

1. **Level 1 (startup):** Only YAML frontmatter loaded (~70-100 tokens per skill). Claude sees name + description.
2. **Level 2 (on-demand):** Full SKILL.md content loaded when Claude determines the skill is relevant.
3. **Level 3 (supporting files):** Additional files loaded only when the skill explicitly references them.

### Rules for Progressive Disclosure

- `.claude/rules/` files use **glob patterns** — loaded ONLY when matching files are touched.
- Example: `typescript.md` with `paths: ["*.ts", "*.tsx"]` only loads when editing TypeScript.
- This means you can have 100 rules and Claude only sees the 2-3 relevant ones.

### MCP Tool Search

When MCP servers exceed ~10% of context:

- Enable: `ENABLE_TOOL_SEARCH=auto:5` (5% threshold)
- Effect: Tool schemas loaded on demand instead of upfront
- Supported on Sonnet 4+, Opus 4+

### Skill Organization Pattern

```
.claude/skills/
├── architect/SKILL.md       ← System design (loaded when planning)
├── loop-create/SKILL.md     ← Agent scaffolding (loaded when creating .loop)
├── sprint/SKILL.md          ← Sprint planning (loaded when planning work)
├── test-visual/SKILL.md     ← Browser testing (loaded when testing UI)
├── harness-review/SKILL.md  ← Harness audit (loaded when reviewing quality)
├── deep-think/SKILL.md      ← Reasoning (loaded for complex problems)
├── self-improve/SKILL.md    ← Meta-improvement (loaded for optimization)
├── integrate-resources/SKILL.md ← Knowledge processing (loaded for resources)
└── skill-routing/SKILL.md   ← THIS FILE (loaded when discussing skill management)
```

### Key Principle

CLAUDE.md stays under 2K tokens. Skills are the overflow valve — anything too detailed for CLAUDE.md becomes a skill. Claude discovers skills by name/description and loads them when needed. This means CLAUDE.md can reference 50 skills at ~70 tokens each (3,500 tokens of metadata) while actual skill content (potentially 100K+ tokens total) loads only on demand.

### When to Create a New Skill vs. a New Rule

- **Skill:** Reusable workflow invoked by name. Example: `/architect` for system design.
- **Rule:** Context-specific instructions activated by file pattern. Example: "When editing \*.test.ts, always use Vitest."
- **Command:** User-facing shortcut. Example: `/start` loads context.
- **Hook:** Automated action on lifecycle event. Example: format code after write.
