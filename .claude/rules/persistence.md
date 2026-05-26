- When the maintainer says "change X" or corrects behavior, IMMEDIATELY update ALL of these:
  1. **CLAUDE.md** — if it changes operating procedure or is a permanent rule
  2. **`.claude/rules/{topic}.md`** — if it's a domain-specific rule (create new file if needed)
  3. **`memory/LEARNINGS.md`** — append with date, one-line summary
  4. **Relevant skill/template** — if it affects how VPs or skills work (e.g., vp-mission-template.md)
  5. **`vault/` corresponding note** — if the topic has a vault note, update it too (vault is the Obsidian navigation layer)
- This is NON-NEGOTIABLE. If you skip any of these places, the rule will be lost on next compaction.
- NEVER create v2/v3 of a document. Update the existing one in place. One source of truth per topic.
- Before compaction: verify all maintainer corrections from this session are persisted in ALL 4 places.
- After compaction: read `.claude/rules/` directory FIRST — these are the hard rules that survive.
- The `.claude/rules/` directory is the MOST RELIABLE persistence mechanism — it's loaded on every session start via glob pattern matching. Use it.
