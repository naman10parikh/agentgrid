---
name: memory
description: Search, store, compress, and recall memories across the Energy platform. Semantic search over LEARNINGS.md, daily logs, vault notes, and rules.
trigger: memory, search memory, recall, remember, find in learnings, compress learnings
---

# /memory — Energy Memory System

Unified memory interface for the Energy platform. Search across all memory surfaces, store persistent facts, compress old entries, and recall context.

## Commands

### `/memory search "query"`

Search across all memory surfaces with relevance scoring.

**Steps:**

1. Run `bash scripts/memory-search.sh "query" --limit 5`
2. Parse results: file path + line number + surrounding context
3. Present top 5 results ranked by: term frequency x recency x source weight
4. If no results, try broader search terms

**Sources searched:** memory/LEARNINGS.md, memory/daily/_.md, memory/topics/_.md, vault/_.md, .claude/rules/_.md

### `/memory store "key" "value"`

Store a persistent fact via MCP memory server.

**Steps:**

1. Use the `memory` MCP tool: `create_entities` with entity type based on content
2. For maintainer directives: entity type = "directive"
3. For technical patterns: entity type = "pattern"
4. For project state: entity type = "project"
5. Confirm storage with entity name

### `/memory compress`

Compress LEARNINGS.md by archiving old entries.

**Steps:**

1. Run `bash scripts/memory-compress.sh` (if exists)
2. Or manually: read LEARNINGS.md, identify entries older than 30 days
3. Move old entries to `memory/archive/learnings-YYYY-MM.md`
4. Keep recent 30 days in LEARNINGS.md
5. Add compressed index header with category counts
6. Report: lines before, lines after, entries archived

### `/memory recall "topic"`

Recall everything known about a topic across all surfaces.

**Steps:**

1. Search memory surfaces (same as `/memory search`)
2. Also search: .claude/auto-memory files, vault notes, maintainer prompts
3. Check MCP memory server for stored entities matching topic
4. Combine and deduplicate results
5. Present as structured brief: what we know, when we learned it, confidence level

## Architecture (4 Layers)

```
Layer 0: MARKDOWN FILES (source of truth — always works)
  memory/LEARNINGS.md, memory/daily/, memory/topics/, vault/

Layer 1: SEARCH INDEX (scripts/memory-search.sh)
  BM25-style term frequency search with recency weighting
  Searches: LEARNINGS, daily, topics, vault, rules

Layer 2: MCP MEMORY SERVERS (persistent K-V + knowledge graph)
  @modelcontextprotocol/server-memory — entity-relation graph
  mixgram — document semantic search over memory/ directory

Layer 3: FLEET MEMORY (future — Mem0/Graphiti when agent fleet grows)
  Agent-to-agent knowledge propagation
  Temporal validity tracking
```

## Key Principle

Layer 0 is ALWAYS the source of truth. Upper layers are indexes and caches that can be rebuilt from Layer 0 at any time. If any MCP server fails, grep still works.

## When to Use This Skill

- "What do we know about X?" → `/memory recall "X"`
- "Find that learning about compaction" → `/memory search "compaction"`
- "Remember this pattern for future sessions" → `/memory store`
- "LEARNINGS.md is too long" → `/memory compress`
- At session start: search for context relevant to current task
- Before compaction: store critical facts via MCP for cross-session persistence
