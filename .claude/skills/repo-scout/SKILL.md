---
name: repo-scout
description: Scout popular GitHub repos for patterns, frameworks, and harnesses relevant to Energy. Ingest learnings automatically.
---

# Repo Scout — Continuous Learning from the Ecosystem

## Trigger

- User says "scout repos", "find repos", "what's new on GitHub"
- Periodic execution via GHA or session start
- When discovering a new framework/tool and wanting to find usage examples

## Process

### 1. Discovery (parallel sub-agents)

For each search query, launch a background agent:

```
gh search repos --sort=stars --limit=10 "QUERY"
```

**Default search queries** (expand as stack evolves):

- `e2b sandbox agent` — sandbox-based agents
- `claude agent sdk` — Claude Agent SDK usage
- `mcp server tools` — MCP integrations
- `ai agent browser automation` — browser agents
- `composio agent` — Composio-based agents
- `vercel ai sdk chat` — AI chat UIs
- `assistant-ui chat` — assistant-ui implementations
- `shadcn agent` — shadcn/ui + agent combos
- `stagehand browser` — Stagehand browser automation
- `copilotkit agent` — CopilotKit implementations

### 2. Analysis (per repo)

For each promising repo (>50 stars, recent activity):

```
gh api repos/{owner}/{name}/git/trees/main?recursive=1
```

Extract:

- **Architecture**: File structure, package.json deps, framework choices
- **Agent patterns**: How they handle tool calls, state machines, error recovery
- **UI patterns**: Status updates, split-screen, generative UI
- **Browser patterns**: E2B, Playwright, Stagehand, computer use
- **Harness patterns**: Skills, memory, context management

### 3. Document

Write findings to `resources/read/repo-scout-{date}.md`:

```markdown
# Repo Scout — {date}

## {repo-name} ({stars} stars)

- **URL**: {url}
- **Stack**: {frameworks used}
- **Key pattern**: {one-line insight}
- **Files to study**: {list of key files}
- **Adoptable for Energy**: {what we can use}
```

### 4. Integrate

- Update `resources/awesome-repos.md` with new entries
- If a pattern is novel, create a learning in `memory/LEARNINGS.md`
- If a framework is new to us, add to MEMORY.md tech choices

## Reference Repos (Permanent Watchlist)

| Repo                                    | Why                                       |
| --------------------------------------- | ----------------------------------------- |
| ComposioHQ/open-genspark                | Open-source GenSpark clone using Composio |
| FoundationAgents/OpenManus              | Open-source Manus clone                   |
| anthropics/claude-code                  | Official Claude Code patterns + plugins   |
| AbanteAI/nanoclaw                       | Minimal Claude Agent SDK reference        |
| e2b-dev/fragments                       | E2B + AI code generation                  |
| mckaywrigley/chatbot-ui                 | Reference chat UI                         |
| stackblitz/bolt.new                     | Browser-based AI builder                  |
| all-hands-ai/openhands                  | Open-source Devin                         |
| browser-use/browser-use                 | Browser automation for AI                 |
| browserbase/stagehand                   | TS-native browser control                 |
| hesreallyhim/awesome-claude-code        | Master Claude Code ecosystem index        |
| rohitg00/awesome-claude-code-toolkit    | 135 agents, 42 commands, 7 templates      |
| affaan-m/everything-claude-code         | Hackathon winner: 65+ skills, 40 commands |
| wshobson/commands                       | 57 production slash commands              |
| trailofbits/claude-code-config          | Security-focused Claude Code config       |
| VoltAgent/awesome-claude-code-subagents | 100+ sub-agent definitions                |
| punkpeye/awesome-mcp-servers            | 2,500+ MCP servers catalog                |

## Output

- `resources/read/repo-scout-{date}.md` — findings document
- Updated `resources/awesome-repos.md` — catalog
- New learnings in `memory/LEARNINGS.md` if applicable
