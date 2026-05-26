# AGENTS.md — Wiki Schema & Conventions

> This file tells the LLM how your wiki is structured.
> You and the LLM co-evolve this over time.

## Domain: personal

## Created: 2026-04-07

## Directory Structure

```
raw/              # Immutable source documents (never modified by LLM)
wiki/             # LLM-generated markdown (the knowledge base)
  index.md        # Content catalog — every page listed with summary
  log.md          # Chronological record of operations
  sources/        # One summary page per ingested source
  entities/       # Pages for people, organizations, tools, etc.
  concepts/       # Pages for ideas, frameworks, patterns, etc.
  syntheses/      # Cross-cutting analyses, comparisons, explorations
AGENTS.md         # This file — wiki schema and conventions
config.yaml       # Configuration (LLM provider, sources, schedules)
```

## Page Conventions

Every wiki page has YAML frontmatter:

```yaml
---
title: "Page Title"
type: source | entity | concept | synthesis | index | log
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
tags: [tag1, tag2]
sources: ["raw/filename.md"] # Which raw sources inform this page
related: ["[[Other Page]]"] # Explicit cross-references
summary: "One-line summary" # Used in index.md
---
```

## Wikilinks

Use `[[Page Title]]` to link between pages. The LLM maintains these links.
Orphan pages (no inbound links) are flagged by `wikimem lint`.

## Operations

### Ingest

When a new source is added to raw/:

1. Read the source completely
2. Create/update a source summary page in wiki/sources/
3. Identify entities mentioned → create/update entity pages
4. Identify concepts discussed → create/update concept pages
5. Update index.md with new/modified pages
6. Append to log.md

### Query

When answering a question:

1. Read index.md to find relevant pages
2. Read the relevant pages
3. Synthesize an answer with [[wikilink]] citations
4. Optionally file the answer as a synthesis page

### Lint

Periodically check for:

- Contradictions between pages
- Stale claims superseded by newer sources
- Orphan pages with no inbound links
- Missing cross-references
- Important concepts mentioned but lacking their own page
- Data gaps that could be filled

## Quality Standards

- Every claim should cite its source via wikilink
- Summaries should be concise (1-3 sentences in frontmatter)
- Pages should be interconnected (no isolated islands)
- Prefer updating existing pages over creating new ones
- Flag contradictions explicitly rather than silently overwriting
