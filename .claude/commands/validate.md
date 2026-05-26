---
description: Validate the Energy Claude Code setup is internally consistent and complete.
---

Check the integrity of the setup:

1. All directories referenced by commands exist:
   - experiments/
   - .agent/tasks/, .agent/system/, .agent/sops/, .agent/decisions/, .agent/changelog/, .agent/learnings/
   - resources/unread/, resources/read/
2. CONTEXT.md exists and is < 100 lines (not bloated)
3. CLAUDE.md exists and is < 100 lines / < 2K tokens
4. All skill files in .claude/skills/ have valid SKILL.md frontmatter
5. All command files in .claude/commands/ exist and are non-empty
6. .gitignore excludes .env, node_modules, CLAUDE.local.md
7. .claudeignore exists
8. .mcp.json exists
9. Git is initialized and has a remote

Report any issues found and suggest fixes.
