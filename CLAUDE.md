@AGENTS.md

# Claude Code in agentgrid

Everything any coding agent needs is in `AGENTS.md`, imported above. This file holds only what is specific to Claude
Code.

## What loads when you open this repository

- **Hooks** (`.claude/settings.json`): `SessionStart` runs `.claude/hooks/session-context.sh`, which prints the memory
  bootstrap and the newest rules; `PostToolUse` on Write, Edit and Bash runs `.claude/hooks/audit-log.sh`, which
  appends one line per change to `.claude/audit.jsonl` (gitignored).
- **Sub-agents** (`.claude/agents/`): `grid-operator` and `pane-doctor` are agentgrid's own; the other seven
  (`architect`, `code-reviewer`, `test-writer` and the rest) are general reviewers for work on this codebase.
- **MCP** (`.mcp.json`): only agentgrid's own server, `agentgrid-mcp`. The inherited development servers (GitHub,
  Context7, a file-backed memory and an Obsidian vault) need a token or a relative path, so they live in
  `.mcp.dev.json`. Load them with `claude --mcp-config .mcp.dev.json`.
- **Rules** (`.claude/rules/`) are glob-loaded every session.

## The plugin

`.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` make this repository a Claude Code plugin:
the skills in `skills/`, the two sub-agents, the MCP server and the pane-status hooks in `hooks/hooks.json`.
Check it with `claude plugin validate .` before you change any of those files.

## Working here

- You operate inside the person's tmux. Never run `agentgrid ROWSxCOLS` in your own pane to test it: it splits the
  window the person is watching. Use `pnpm eval`, which runs every grid on a private tmux server.
- Follow the commit grammar in `AGENTS.md` (`feat(cli):`, `fix(app):`, `docs:` and the rest).
- Act, then test as a user: `pnpm build && pnpm test && pnpm eval`, then the command you changed.
- When you fix an error, add it to `memory/LEARNINGS.md` as what broke, the root cause, and the rule.
