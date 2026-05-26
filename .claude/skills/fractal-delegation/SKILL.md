# Skill: Fractal Delegation (The CEO Operating System)

## Trigger

Every task with 2+ independent workstreams, or any task that would take >15 minutes as solo work. Also triggered by maintainer voice dumps with multiple requirements.

## The Organizational Hierarchy

```
MAINTAINER (the user) — Vision, capital, objective function
    │
CEO (You — Opus) — Decompose, route, delegate, monitor, integrate
    │
    ├── VP Research (Agent Team / Sub-agents)
    ├── VP Frontend (Agent Team with worktree)
    ├── VP Backend (Agent Team with worktree)
    └── VP Quality (Sub-agents for review/test)
         │
         └── Workers (Sub-agents within each VP)
              - Research workers (Haiku)
              - Code workers (Sonnet)
              - Review workers (Sonnet)
```

## The Decision Matrix

For EVERY task, answer these questions:

### 1. Can work be parallelized?

- **NO** → Do it yourself (sequential dependency)
- **YES** → Continue to #2

### 2. Does it modify code files?

- **NO** (research, reading, analysis) → Sub-agents (parallel, no isolation needed)
- **YES** → Continue to #3

### 3. Do the code changes overlap (same files)?

- **YES** → Sub-agents for research, YOU implement (avoid merge conflicts)
- **NO** (different files/packages) → Agent Teams with worktree isolation

### 4. Is this a complex multi-domain task?

- **YES** → Full swarm: Agent Teams + sub-agents within each team (Pattern D)
- **NO** → Single agent with worktree (Pattern B)

## Delegation Patterns

### Pattern A: Research Swarm (most common)

Launch 3-5 sub-agents in background for research while you implement.

```
Agent(research-1, background, haiku) → "Find all instances of X in codebase"
Agent(research-2, background, haiku) → "Read competitor docs for pattern Y"
Agent(research-3, background, haiku) → "Check if library Z supports feature W"
YOU → Start implementing based on what you already know
```

**When:** Need information, not code changes. Protects your context window.

### Pattern B: Worktree Agents (for multi-file features)

Each agent works in an isolated git worktree. Changes merge back.

```
Agent(frontend, worktree, sonnet) → "Build UI component in packages/web/"
Agent(backend, worktree, sonnet) → "Build API route in packages/web/src/app/api/"
Agent(tests, worktree, sonnet) → "Write tests for the feature"
YOU → Orchestrate, review, merge, resolve conflicts
```

**When:** Code changes in non-overlapping files.

### Pattern C: Fractal (agents containing sub-agents)

For large features spanning multiple packages.

```
Agent(infra-team, worktree, sonnet) → {
  This agent internally spawns sub-agents for:
  - Database schema design (haiku)
  - API route scaffolding (sonnet)
  - Type definitions (haiku)
}
Agent(ui-team, worktree, sonnet) → {
  This agent internally spawns sub-agents for:
  - Component research (haiku)
  - Component implementation (sonnet)
  - Visual test (sonnet)
}
YOU → Architecture decisions, final integration, production deploy
```

**When:** Features spanning 3+ packages or requiring 5+ agents.

### Pattern D: Maintainer Directive Swarm (for voice dumps)

Full decomposition of a complex maintainer directive.

```
1. CEO parses directive → extracts EVERY requirement
2. CEO creates TaskList with all tasks + dependencies
3. For each independent workstream:
   a. Launch background research agent (haiku) for context gathering
   b. Wait for research results
   c. Launch implementation agent (worktree, sonnet) with research context
4. CEO monitors via TaskList, integrates results
5. CEO commits stable checkpoint, updates handoff
```

**When:** Maintainer sends a multi-requirement voice dump.

### Pattern E: Grid-Based Recursion (CEO-of-CEOs)

Physical tmux grid nesting. A VP spawns its own agent grid in a separate window, becoming a sub-CEO with its own workers. Enables unlimited parallel compute.

```
Root CEO (depth 0) → agentgrid 2x3 in window "company"
  ├── VP-Mercury (SUB_CEO=true) → creates window "company-mercury"
  │     └── agentgrid 1x3: Trader, Analyst, Risk
  ├── VP-Saturn (SUB_CEO=true) → creates window "company-saturn"
  │     └── agentgrid 2x2: Designer, Developer, Marketer, QA
  ├── VP-Dashboard (flat worker, no sub-grid)
  └── ANVIL-QA (flat worker, waits for all sub-CEOs)
```

Each sub-CEO:

1. Reads mission brief (includes `CEO_DEPTH`, `COMPANY_ID`, `PARENT_COMPANY_ID`)
2. Creates its own tmux window + agentgrid
3. Writes sub-missions, injects into its workers
4. Monitors via CronCreate on its own signal dir
5. When done: signals PARENT's signal dir

**When:**

- 10+ tasks across multiple domains
- Each domain needs its own research → build → test cycle
- Maintainer says "recursive", "CEO of CEOs", or "sub-grids"
- Overnight runs where maximizing parallelism matters

**Decision:** Use Pattern E when you'd naturally say "this VP is really a CEO of its own team."

See `.claude/rules/recursive-grid.md` for the full protocol.

## Model Routing Per Role

| Role                | Model  | Cost/MTok | Why                                      |
| ------------------- | ------ | --------- | ---------------------------------------- |
| CEO (orchestrator)  | Opus   | $15/$75   | Delegation decisions need deep reasoning |
| VP / Team lead      | Sonnet | $3/$15    | Multi-file code changes, integration     |
| Research worker     | Haiku  | $0.80/$4  | Fast, cheap — just reading/searching     |
| Code worker         | Sonnet | $3/$15    | Balanced speed + quality                 |
| Review worker       | Sonnet | $3/$15    | Code review, security scan               |
| Architecture worker | Opus   | $15/$75   | Design trade-offs, deep analysis         |
| Tier 0 (no model)   | —      | $0        | Formatting, linting, git ops, tests      |

## Cross-Terminal Coordination

All terminals share tasks via `CLAUDE_CODE_TASK_LIST_ID=energy-main`.

- Use TaskCreate/TaskUpdate across terminals
- Tasks tagged with terminal context (earning, content, spark, platform)
- Check TaskList before starting work — another terminal may have claimed it

## Escalation Protocol (3-Tier)

Borrowed from Agent Orchestrator (Composio):

1. **Worker self-heal:** Agent retries on failure up to 3x with different approaches
2. **VP mediate:** If worker fails, the team lead reviews and redirects
3. **CEO escalate:** If VP can't resolve, CEO takes over (or escalates to maintainer)

## When NOT to Delegate

- Single-file edits < 20 lines
- Bug fixes where you already know the cause
- Configuration changes (.env, package.json)
- Commits, deploys, git operations
- Anything requiring YOUR conversation context (user preferences, prior decisions)
- Architecture decisions — make them yourself, delegate implementation

## Anti-Patterns

- Don't delegate then do the same work yourself (duplicate effort)
- Don't use worktrees for read-only research (unnecessary overhead)
- Don't spawn agents for tasks that take <2 minutes solo
- Don't create teams of 1 (that's just a sub-agent)
- Don't delegate architecture decisions — make them yourself, delegate implementation
- Don't let agents run unmonitored >30 min — check progress via TaskList
- Don't skip the research phase — always gather context before implementation
