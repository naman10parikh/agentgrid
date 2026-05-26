---
name: ecosystem-reference
description: Quick-access directory of Claude Code ecosystem repos, skills, plugins, MCPs, and patterns. Use when improving the harness.
---

# Ecosystem Reference — Claude Code Harness Optimization

## Trigger

- Improving Claude Code setup, skills, hooks, or agents
- Looking for existing patterns before building something new
- "What repos have good examples of X?"

## Tier 1 Repos (Study These First)

| Repo                                                                                            | Stars | Use For                                                |
| ----------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)         | ~25K  | Master index of everything                             |
| [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) | —     | 135 agents, 42 commands, 19 hooks, 7 templates         |
| [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)           | —     | 16 agents, 65+ skills, 40 commands (hackathon winner)  |
| [wshobson/commands](https://github.com/wshobson/commands)                                       | —     | 57 production slash commands (15 workflows + 42 tools) |
| [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config)             | —     | Security-focused config, sandboxing, claude-yolo mode  |
| [ChrisWiles/claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase)           | —     | Skill evaluation engine, GitHub Action PR reviews      |
| [ykdojo/claude-code-tips](https://github.com/ykdojo/claude-code-tips)                           | —     | 45 tips, dx plugin, status line customization          |

## Skills & Plugins

| Resource                                | URL                                                                  | What                                              |
| --------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| SkillKit                                | `npx skillkit@latest`                                                | 15,000+ skills, interactive TUI                   |
| travisvn/awesome-claude-skills          | [GitHub](https://github.com/travisvn/awesome-claude-skills)          | ~8K stars, curated by category                    |
| alirezarezvani/claude-skills            | [GitHub](https://github.com/alirezarezvani/claude-skills)            | 180+ production skills                            |
| VoltAgent/awesome-claude-code-subagents | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents) | ~12K stars, 100+ sub-agents                       |
| Official plugins marketplace            | `anthropics/claude-plugins-official`                                 | Asana, Firebase, Linear, Slack, Stripe, Supabase  |
| Community plugins                       | `anthropics/claude-code`                                             | ralph-wiggum, code-review, hookify, agent-sdk-dev |

## MCP Servers

| Server              | Install                                                                | Use For                        |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| Awesome MCP Servers | [GitHub](https://github.com/punkpeye/awesome-mcp-servers) (~82K stars) | Master catalog, 2,500+ servers |
| MCP Directory       | [mcpservers.org](https://mcpservers.org)                               | Searchable catalog             |
| Supabase MCP        | `npx supabase mcp`                                                     | Database via natural language  |
| Sentry MCP          | sentry docs                                                            | Error tracking                 |
| Vercel MCP          | vercel docs                                                            | Deployment management          |

## Documentation Sites

| Site             | URL                                                                | What                            |
| ---------------- | ------------------------------------------------------------------ | ------------------------------- |
| Claude Code Docs | [code.claude.com](https://code.claude.com/docs/en/settings)        | Official reference              |
| SFEIR Institute  | [institute.sfeir.com](https://institute.sfeir.com/en/claude-code/) | Training tracks                 |
| ClaudeLog        | [claudelog.com](https://claudelog.com)                             | Changelog, tutorials            |
| claudefa.st      | [claudefa.st](https://claudefa.st)                                 | Settings reference, model guide |
| awesomeclaude.ai | [awesomeclaude.ai](https://awesomeclaude.ai)                       | Visual directory                |

## How To Use

1. **Before building a new skill/hook/agent**: Search these repos first. Someone probably built it.
2. **Use GitHub MCP**: `gh search repos "claude code {topic}" --sort=stars --limit=5`
3. **Use web search**: For latest community patterns from Reddit (r/ClaudeAI, r/ClaudeCode)
4. **Install via SkillKit**: `npx skillkit@latest` for the broadest skill catalog
5. **Check Trail of Bits**: For security patterns before deploying anything public

## Key Patterns Borrowed

- **Tool Search** (46.9% context reduction): `ENABLE_TOOL_SEARCH=auto:5`
- **File protection hooks**: Block writes to lock files and .env
- **Ralph Wiggum loop**: Official autonomous iteration plugin
- **Sandbox-first security**: OS-level isolation > prompt-level permissions
- **CLI tools > MCP servers**: `gh`, `sentry-cli` etc. have zero context overhead
