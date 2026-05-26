---
description: Process new resources dropped into resources/unread/. Extracts tips and updates the setup.
---

Read all files in `resources/unread/`. For each:

1. Extract Claude Code tips, tools, patterns, configurations
2. Categorize by type (skill, hook, command, MCP, workflow, tool)
3. Update relevant files:
   - `docs/guides/SETUP.md` for new tips and tools
   - `.claude/skills/` for new skill patterns
   - `.claude/rules/` for new coding rules
   - `resources/README.md` for the catalog
4. Move processed file to `resources/read/YYYY-MM-DD_originalname.md`
5. Summarize what was extracted and integrated
