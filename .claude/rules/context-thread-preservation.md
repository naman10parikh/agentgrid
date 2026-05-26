# Context Thread Preservation — Seamless Chat Migration (Maintainer Prompt #47)

## The Rule

When context degrades (1 compaction), the CEO MUST migrate to a fresh chat WITHOUT losing any thread of work. One compaction already loses 70-80% of detail — waiting for a second means 91-96% loss. The migration must be invisible to the maintainer — work continues seamlessly.

## The "Reptile Shedding Skin" Protocol

1. **BEFORE exiting** (stop hook or manual):
   - Write `.claude/handoff.md` with: active company, wave status, all signal states, worker pane IDs, what each worker is doing RIGHT NOW
   - Persist critical state via MCP: `create_entities` for active tasks, decisions, blockers
   - Run `scripts/memory-compress.sh` if LEARNINGS > 500 lines
   - Update `memory/daily/{today}.md` with session summary
   - Ensure `.claude/anchor-state.md` captures: BIG PICTURE + FILES CHANGED + NEXT ACTION

2. **auto-switch.sh handles the transition**:
   - Detects exit (signal file from pre-compact hook)
   - Builds resume prompt with: /start + last-session-output + handoff + memory system instructions
   - Starts fresh `claude` session with full context injection
   - New session reads handoff, loads memory, continues

3. **In the NEW session** (first turn):
   - `/start` loads: CLAUDE.md → CONTEXT.md → MEMORY.md → LEARNINGS → handoff
   - Memory Health Check (Step 0 in CEO Launch): search MCP for active state
   - If company was running: read company-state.md, check grid health, resume monitoring
   - If solo work: read anchor-state.md, continue from NEXT ACTION

## For Grid Workers (AgentGrid Migration)

When a WORKER hits context degradation:

1. Worker signals `.migrating` via `.claude/vp-signals/{role}.migrating`
2. CEO detects signal in monitoring cron
3. CEO spawns fresh pane via `agentgrid add right claude`
4. CEO injects mission + progress so far into new pane
5. Old pane exits cleanly
6. New pane continues from where old one left off

## What Gets Persisted (4 Layers)

| Layer     | What                                  | Where                                      | Survives             |
| --------- | ------------------------------------- | ------------------------------------------ | -------------------- |
| Files     | Handoff, anchor, daily log, LEARNINGS | Filesystem                                 | Always               |
| MCP Graph | Active tasks, decisions, patterns     | memory-enhanced JSONL + server-memory JSON | Across sessions      |
| Rules     | Maintainer patterns, operating model    | .claude/rules/\*.md                        | Always (glob-loaded) |
| Vault     | Architecture, research, project state | vault/\*.md                                | Always               |

## Anti-Patterns

- NEVER continue working past 1 compaction (only 20-30% survives — migrate immediately)
- NEVER rely on conversation history alone — always write to files
- NEVER skip the handoff — even if "almost done" (Session 64: 35 compactions, catastrophic)
- NEVER assume the next session remembers anything — write it down or lose it

## Evidence

- Maintainer Prompt #47: "reptile shedding skin" metaphor
- Session 64: 35 compactions proved context death is real
- Research (GitHub #34685): quality degrades at 40-50% of 1M window
- auto-switch.sh: proven across 10+ overnight runs
