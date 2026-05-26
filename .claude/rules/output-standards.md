# Output Standards — Maintainer Updates + VP Output Hygiene (Maintainer Prompt #53)

## Part 1: Maintainer Output Format

Every status update to the maintainer MUST follow this format. Simple language. No jargon. Lead with what matters. The maintainer should understand the entire state in 60 seconds.

### Standard Status Update Format

```markdown
# Status Update — {date}

## Where We Are

{1-3 sentences: what exists, what works, current state}

## What Just Happened

{Bullet list: completed items with evidence (screenshots, test results)}

## Blockers (Maintainer Action Needed)

{Numbered list with EXACT action steps — URL, button to click, amount to add}
{If no blockers: "None — all systems operational"}

## What's Next

{Bullet list: immediate priorities in execution order}

## Trust Signals

{List of rules being followed, tools being used, tests passing}
{Example: "31 rules loaded, SuperMemory MCP active, 475 tests passing, vault 92% connected"}
```

### When to Use

- At session start (after deep ingest)
- At session end (before handoff)
- When presenting company results to maintainer
- When requested via /status
- In .claude/vp-outputs/ceo-log.md (abbreviated version)

### Blockers File

MAINTAINER-CHECKLIST.md is the ONE file for all blockers. Do NOT scatter blockers across:

- VP output files
- CEO logs
- Daily memory files
- Handoff documents

All these may MENTION blockers, but MAINTAINER-CHECKLIST.md is the canonical source.

### Anti-Patterns (Maintainer Output)

- Using technical jargon the maintainer wouldn't understand
- Burying blockers in long paragraphs
- Reporting "338 tasks complete" without evidence of working features
- Status updates longer than 1 page
- Creating new blocker files instead of updating MAINTAINER-CHECKLIST.md

---

## Part 2: VP Output Hygiene — Archive Strategy

`.claude/vp-outputs/` accumulates files from every company run. Previous sessions left 100+ files. Stale outputs from old companies confuse new workers and waste context window when globbed.

### Before Every New Company Spawn

Archive existing VP outputs:

```bash
# Create dated archive
ARCHIVE_DIR=".claude/vp-outputs/archive-$(date +%Y%m%d)"
mkdir -p "$ARCHIVE_DIR"
mv .claude/vp-outputs/*.md "$ARCHIVE_DIR/" 2>/dev/null
```

This is part of pre-spawn cleanup (alongside signal file cleanup).

### During a Company Run

- Workers write progress to `.claude/vp-outputs/{role}-report.md`
- QA writes per-project reports to `.claude/vp-outputs/anvil-qa-{project}.md`
- SMITH writes improvements to `.claude/vp-outputs/smith-improvements.md`
- CEO/MONITOR writes status to `.claude/vp-outputs/company-status.md`

### After Company Shutdown

1. CEO creates final archive: `archive-YYYYMMDD-{company-name}/`
2. Move all current outputs to archive
3. Keep the archive directory but remove individual files from root

### Naming Convention

- Reports: `{role}-report.md`
- QA: `anvil-qa-{project}.md`
- Logs: `watchdog.log`, `watchdog.log.jsonl`
- Summaries: `anvil-summary.md`, `smith-improvements.md`

### Never Delete

- Archive directories (they're the historical record)
- Log files (needed for SMITH pattern extraction)
