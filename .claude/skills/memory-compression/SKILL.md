# Skill: Memory Compression & Management

Production memory management for Energy agents. Prevents context loss, enables compound memory.

## Three-Layer Memory Architecture

```
agent/
├── SOUL.md          # Static identity — NEVER modified by agent. Human-authored.
├── MEMORY.md        # Curated long-term — capped at ~500 lines. Agent-maintained.
├── LEARNINGS.md     # Append-only patterns and mistakes.
└── memory/
    ├── daily/
    │   ├── 2026-03-01.md  # Structured daily journals
    │   └── 2026-03-03.md  # Last 7 days active, older archived
    └── backups/
        └── pre-compact-*.md  # Auto-generated before compaction
```

Plain Markdown beats vector databases: 74% accuracy (ClaWHow) vs 68.5% (vector DBs). Structure IS the retrieval mechanism.

## Pre-Compaction Flush (The Critical Hook)

### When It Triggers

OpenClaw's formula: `threshold = contextWindow - reserveFloor - softThreshold`

- On 200K window: 200K - 20K - 4K = 176K tokens
- One flush per compaction cycle (prevents double-flush)

### What Gets Saved (Anchor State Pattern)

```markdown
## Anchor State

### Intent

[What we're building right now, one sentence]

### Changes Made

- [file]: [what changed and why]

### Decisions Taken

- [decision]: [rationale] — alternatives: [X, Y]

### Next Steps (ordered)

1. [Most important next action]
2. [Second priority]
```

Each compaction MERGES into this anchor rather than starting fresh. Factory tested this on 36,000 sessions: 4.04 accuracy vs 3.74 for alternatives.

### What to KEEP (Always Survives)

- Architecture decisions with rationale
- User preferences and constraints
- Error patterns and their fixes
- File paths and their purposes
- Key function signatures, API endpoints
- The current anchor state

### What to SUMMARIZE (Compress)

- Multi-turn debugging → "Fixed X by changing Y in file Z"
- Research exploration → "Compared A vs B vs C; chose B because [reason]"
- Tool output → strip to relevant lines only
- Code review conversations → keep only final decision

### What to DISCARD

- Confirmations ("sounds good", "yes", "ok")
- Repeated failed attempts (keep only the fix)
- Full file contents that were read (keep path + line refs)
- Verbose tool output (keep summary)

## SimpleMem Compression (30x, Production-Proven)

Three-stage pipeline from arXiv 2601.02553:

### Stage 1: Entropy-Aware Filtering

- Divide conversation into overlapping windows (10 turns, stride 5)
- Score: `entropy = entity_novelty * new_entities + semantic_divergence * cosine_distance`
- Windows below 0.35 threshold discarded (chit-chat, confirmations)
- Coreference resolution: pronouns → names
- Temporal normalization: "next Friday" → "2026-03-07"

### Stage 2: Recursive Consolidation

- Cluster related memories: `affinity = semantic_sim * 0.6 + temporal_proximity * 0.4`
- Clusters above 0.85 → synthesize into abstract representations
- Fine-grained entries archived (retrievable, not in default retrieval)

### Stage 3: Intent-Aware Retrieval

- Simple queries → retrieve 3 entries
- Multi-hop queries → expand to 20 entries
- Hybrid scoring: `score = 0.5 * semantic + 0.3 * BM25 + 0.2 * symbolic`

Results: ~17K → ~550 tokens per query (97% compression). F1: 43.24%.

## Hybrid Search (BM25 + Vectors)

From OpenClaw's production implementation:

```typescript
function mergeHybridResults(params: {
  vector: VectorResult[];
  keyword: KeywordResult[];
  vectorWeight: number; // 0.7
  textWeight: number; // 0.3
}): ScoredResult[] {
  const byId = new Map();
  for (const r of params.vector)
    byId.set(r.id, { ...r, vectorScore: r.vectorScore, textScore: 0 });
  for (const r of params.keyword) {
    const existing = byId.get(r.id);
    if (existing) existing.textScore = r.textScore;
    else byId.set(r.id, { ...r, vectorScore: 0, textScore: r.textScore });
  }
  return Array.from(byId.values())
    .map((e) => ({
      ...e,
      score:
        params.vectorWeight * e.vectorScore + params.textWeight * e.textScore,
    }))
    .sort((a, b) => b.score - a.score);
}
```

Chunking: 400 tokens/chunk, 80 tokens overlap. Over-fetch 4x before merging.
Embedding fallback: local ggml → OpenAI text-embedding-3-small → Gemini → BM25-only.

## Session Handoff Protocol

At session end, write to daily log:

```markdown
# Session Handoff — {date} {time}

## Anchor State

### Intent

[one sentence]

### Changes Made

- [file]: [change]

### Decisions Made

- [decision]: [rationale]

### Next Steps

1. [next action]

## Context Recovery

- Daily log: memory/daily/{date}.md
- Backup: .claude/backups/pre-compact-{timestamp}.md
- Git diff: `git diff HEAD~{n}`

## Active Problems

- [unresolved bug, last known state]
```

## Prompt Caching (Anthropic — maximize cache hits)

Cache hierarchy: **Tools → System → Messages**. Content is cached as a byte-identical prefix.

| Operation   | Multiplier | Break-even             |
| ----------- | ---------- | ---------------------- |
| Cache write | 1.25x      | Pays off after 1 read  |
| Cache READ  | 0.1x       | 90% savings per read   |
| 1-hour TTL  | 2x write   | Pays off after 2 reads |

- Max 4 breakpoints per request
- Minimum: 1024 tokens (Sonnet/Opus), 2048 tokens (Haiku)
- **Cached tokens DON'T count toward ITPM rate limits** — critical for Tier 1
- TTL is sliding: refreshed on every hit (5min default)

### Implementation

```typescript
// Cache tools + system prompt (static content)
const systemWithCache = [
  {
    type: "text",
    text: systemPrompt,
    cache_control: { type: "ephemeral" },
  },
];
// Tools are cached automatically when system prompt is cached (same prefix)
// For conversation history: mark last message in history with cache_control
```

## Post-Compaction Recovery (Energy Hook System)

### Hook Chain

1. **PreCompact** (`pre-compact-memory-flush.sh`): Write anchor-state.md + backup + daily log + compaction count + auto-compress LEARNINGS if > 500 lines
2. **PostCompact** (`post-compact-restore.sh` via SessionStart `compact` matcher): Re-inject anchor state + active task + recent logs + compaction warning

### New Tools (MNEMOSYNE — March 2026)

- `/memory search "query"` — Searches LEARNINGS, daily, topics, vault, rules via `scripts/memory-search.sh`
- `/memory compress` — Archives old entries via `scripts/memory-compress.sh`
- `/memory store "key" "value"` — Stores in MCP server-memory entity graph
- MCP `mixgram` — SQLite FTS5 full-text search over markdown (14 tools)

### Compact Instructions (in CLAUDE.md)

Always preserve: maintainer's recent messages, active task, file paths, decisions, errors, API status, sprint progress.
Always drop: tool outputs, search results, debugging steps, file contents (keep path+line only).

### Compaction Trigger

- Auto-compaction at ~64-75% context usage (128K-150K tokens on 200K window)
- Leaves ~25% as working memory
- CLAUDE.md is automatically re-read
- Daily logs + anchor state provide continuity

## Production Memory Solutions

| Solution     | Compression   | Key Pattern                              | Best For                      |
| ------------ | ------------- | ---------------------------------------- | ----------------------------- |
| SimpleMem    | 30x (97%)     | 3-stage: filter → consolidate → retrieve | Long-running agents           |
| MemGPT/Letta | Agent-managed | 3-tier: Core/Recall/Archival             | Agents that manage own memory |
| Mem0         | 90% tokens    | Extract → CRUD (ADD/UPDATE/DELETE)       | Personal AI assistants        |
| Zep/Graphiti | N/A           | Temporal knowledge graph                 | Time-aware reasoning          |
| Memoria      | 99.6%         | Weighted KG + recency retrieval          | Conversational AI             |

## Implementation Libraries

| Need                   | Library                          | Notes                                    |
| ---------------------- | -------------------------------- | ---------------------------------------- |
| BM25/FTS               | SQLite FTS5 (via better-sqlite3) | Zero dependencies, built into SQLite     |
| Vector search          | LanceDB or OpenMem               | LanceDB: hybrid mode built-in            |
| Embeddings             | text-embedding-3-small           | Fallback: local ggml                     |
| Observation/Reflection | Mastra Memory                    | Observer at 30K tokens, Reflector at 40K |
| Fact extraction        | Mem0 (pip/npm)                   | CRUD memory ops, dedup, atomic facts     |
| MCP memory server      | SimpleMem-MCP                    | LanceDB backend, 30x compression         |
