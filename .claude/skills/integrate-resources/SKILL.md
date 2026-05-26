---
name: integrate-resources
description: Process new resources dropped into resources/unread/. Extracts Claude Code tips, tools, patterns and updates the setup guide, skills, hooks, and knowledge catalog.
---

## Trigger

User says something like "new resources to integrate" or "process unread resources"

## Process

1. List all files in `resources/unread/`
2. Triage: batch-read all files, assign relevance 1-5 and category (HARNESS/AGENT/PRODUCT/CONTENT/CRYPTO/TECH/DESIGN/IRRELEVANT)
3. For each file with relevance >= 3:
   a. Read the full content
   b. Check: is this insight ALREADY covered in our docs? If yes, skip or enhance existing text only.
   c. Extract actionable items:
   - Tools/packages to install (`npm install`, MCP servers, CLI tools)
   - Skills/hooks patterns to adopt
   - Strategic insights that shift our architecture or content
   - Competitor moves that require response
     d. For mentioned projects/tools: WebSearch to get current state, repo URL, install instructions
4. **WEAVE into EXISTING documents — route by CATEGORY per `.claude/rules/resource-integration.md`:**
   - **Tier 1 (ALL categories):** VISION.md, LEARNINGS.md, x-content-engine skill, vault notes
   - **Tier 2 (CONTENT):** content/distribution/ playbooks (MASTER-PLAYBOOK.md, PUBLISHING-WORKFLOW.md, PLATFORM-SPECIFIC-HOOKS.md), vault Ops - Content Engine / Distribution Playbook
   - **Tier 3 (CRYPTO/EARNING):** agents/earning/strategies/, vault Ops - Earning Strategy, MAINTAINER-CHECKLIST.md
   - **Tier 4 (HARNESS/AGENT):** .claude/skills/, .claude/rules/, CLAUDE.md, .mcp.json, install tools
   - **Tier 5 (DESIGN):** .claude/rules/design.md, .claude/skills/design-systems/knowledge/
   - See `.claude/rules/resource-integration.md` for the COMPLETE routing table with 5 tiers and quick-reference chart
5. **INSTALL actionable tools immediately:**
   - `npm install -g <tool>` for CLI tools
   - Add MCP servers to `.mcp.json`
   - Download skills/hooks from discovered repos
6. **Update Obsidian vault relationships:**
   - Trace through `vault/MOC - Energy Platform.md` for where new knowledge connects
   - Add wikilinks in existing vault notes to connect new knowledge
   - Update frontmatter tags on relevant notes
7. Move processed files to `resources/read/` with date prefix: `YYYY-MM-DD_originalname`
8. Summarize: what was integrated, WHERE it was integrated, what was installed

## Rules (HARD — Maintainer Directive)

- **NO new random documents.** Do not create `resources/research/`, `content/intelligence/reports/`, or any other new standalone files for daily intake. Weave into existing docs.
- **Dedup before writing.** Check if an insight is already present. If yes, enhance the existing text — don't duplicate.
- Only add **high-value touchpoints** not already covered. Most articles will be "interesting but already addressed."
- Never remove existing content — only enhance
- If a tip contradicts existing guidance, flag it for human review
- Prefer concrete, actionable configurations over vague advice
- Always include source attribution inline (not in a separate catalog)
- Test any new hook or setting configurations for correctness
- **This pipeline builds the NEXT thing.** Every run should make the harness smarter, the content engine sharper, the vault more connected. It's a compounding intelligence loop sourced from the community and the digital AI town square.
