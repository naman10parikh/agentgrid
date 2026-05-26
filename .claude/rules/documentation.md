# Documentation Standards

## Naming Conventions

- Architecture docs: Title Case with dashes (`META-ARCHITECTURE.md`, `SWARM-ARCHITECTURE.md`)
- Vault notes: `Type - Name.md` (`Agent - Mercury.md`, `Research - ADAS.md`)
- No v2/v3 suffixes. Update in place. One source of truth per topic.
- No `Untitled` files. Name everything.

## Vault Note Requirements

Every vault note MUST have YAML frontmatter:

```yaml
---
type: architecture | research | agent | moc | operations | harness | maintainer-prompt
status: active | archived | superseded
created: YYYY-MM-DD
tags: [tag1, tag2]
source: path/to/source/file
---
```

## Wikilink Standards

- Use `[[Note Name]]` format (Obsidian standard)
- Every note should link back to its MOC
- Every note should have a Related Notes section
- Every note should have a Source section with repo file path

## Update Protocol

When the maintainer says "change X", update ALL of these:

1. CLAUDE.md (if permanent rule)
2. .claude/rules/{topic}.md (if domain-specific)
3. memory/LEARNINGS.md (append)
4. Relevant skill/template
5. vault/ corresponding note (if topic has a vault note)

## Content Rules

- Never remove content from vision docs — only enhance
- Never create v2/v3 — update existing in place
- Files under 400 lines. Split if longer.
- Comments only for non-obvious intent.
