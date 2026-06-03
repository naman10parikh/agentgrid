# agentgrid — Community TODOS

> Checkbox list for contributors and the maintainer's coding agent.
> Mark completed items `[x]`; open items stay `[ ]`.
> IDs are stable — reference them in commits and PRs.

## Harness Completion (CP117 Wave D)

- [x] **AG-01** Add `agentgrid-orchestrate` skill — mission inject / broadcast / monitor / read pattern (`.claude/skills/agentgrid-orchestrate/SKILL.md`)
- [x] **AG-02** Add `agentgrid-sessions` skill — save / restore / preset workflows (`.claude/skills/agentgrid-sessions/SKILL.md`)
- [x] **AG-03** Update `claude-plugin.json` to list all three skills (agentgrid, agentgrid-orchestrate, agentgrid-sessions) completing the full quad: CLI + MCP + skills + plugin
- [ ] **AG-04** `npm publish` — package name `agentgrid` is unclaimed on npm; publish when ready. **CHAIRMAN BLOCKED: requires `npm login` as naman10parikh then `pnpm prepublishOnly && npm publish --access public`**

## CLI & Features

- [ ] **AG-10** `agentgrid inject` — add `--append` flag to concat text to an existing mission file before injecting
- [ ] **AG-11** `agentgrid monitor` — add `--filter <status>` to show only WORKING/WAITING/DONE panes
- [ ] **AG-12** `agentgrid preset create` — interactive wizard to save current grid layout as a named preset
- [ ] **AG-13** `agentgrid logs` — pipe captured pane output to a file for post-session audit

## Desktop App

- [ ] **AG-20** App: surface `agentgrid restore <session>` from the Electron UI session picker
- [ ] **AG-21** App: add keyboard shortcut to broadcast a message to all panes (Cmd+Shift+B)
- [ ] **AG-22** App: Playwright e2e coverage for the session save/restore flow

## Docs & Eval

- [ ] **AG-30** Extend `eval/smoke.sh` to assert `agentgrid inject --help` is listed (covers the inject command)
- [ ] **AG-31** Add a `docs/skills-guide.md` that explains which skill to use and when (agentgrid vs agentgrid-orchestrate vs agentgrid-sessions)
- [ ] **AG-32** Add a `harnesses/README.md` describing the bundled YAML format for community harness submissions

## Ecosystem

- [ ] **AG-40** Submit agentgrid to `awesome-mcp-servers` once MCP server (`src/mcp-server.ts`) is verified against the latest MCP spec
- [ ] **AG-41** Homebrew tap formula (`Formula/agentgrid.rb`) — update SHA256 after next npm publish
- [ ] **AG-42** Add `agentgrid` to Quartermaster catalog (`/Users/naman/quartermaster`) with measured eval_score

---

_Last updated: 2026-06-03 (CP117 Wave D)_
