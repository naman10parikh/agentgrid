# Consolidate, Never Expand — One Source of Truth (Maintainer Prompts #37, #39b, #40, #41, #42, #48)

## The Rule

WEAVE into existing documents. Never create new standalone files for daily intake. One source of truth per topic — no v2/v3, no duplicates.

## The Consolidation Principle

1. **Before creating a new file:** Search for an existing file on the topic
2. **If found:** Update the existing file in place
3. **If not found:** Create ONE file in the correct location (see `resource-integration.md`)
4. **Never:** Create `research-*.md`, `synthesis.md`, `report-*.md` for daily intake

## Document Lifecycle

- **Create** only when genuinely novel topic with no existing home
- **Update** in place — edit the existing section, don't append a new version
- **Archive** old content to `archive/` directories — never delete
- **Consolidate** when multiple files cover same topic — merge into one, archive rest

## Maintainer's Test

> "Can I find this if I leave for a week and come back?"

If the answer requires checking 5 similar docs, consolidation has failed.

## Routing Table

| Content Type         | Destination                               |
| -------------------- | ----------------------------------------- |
| Architecture insight | `docs/vision/VISION.md`       |
| Error/pattern        | `memory/LEARNINGS.md`                     |
| Operating rule       | `CLAUDE.md` + `.claude/rules/`            |
| Tool/MCP discovery   | Install immediately + update skill        |
| Content tactic       | `content/distribution/MASTER-PLAYBOOK.md` |
| Earning strategy     | `agents/earning/strategies/`              |
| Design pattern       | `.claude/rules/design.md`                 |

## Anti-Patterns

- Creating `research-memory-2026-03-21.md` instead of updating LEARNINGS.md
- Creating `architecture-v3.md` instead of updating VISION.md
- Having 3 files that all explain "how agents work"
- Duplicating content between vault notes and source files

## Evidence

Maintainer Prompt #40: "Recursive repo audit, zero detail removal, consolidate."
Maintainer Prompt #48: "Weave insights, don't create standalone."
LEARNINGS.md: "Single source of truth per topic — NO V2/V3 separate docs" (line 672).
