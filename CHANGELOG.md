# Changelog

## v0.4.0 (2026-03-16)

### Added
- `agentgrid dashboard` — live-refreshing control pane with table view of all panes, statuses, agents
- `agentgrid swap [up|down]` — swap pane positions
- `agentgrid restore` (no name) — lists saved sessions with timestamps
- `agentgrid restore <name>` — now restarts agents automatically (not just layout)
- `npm install -g agentgrid` — npm package distribution
- `package.json` for npm registry publishing

### Fixed
- Setup wizard creates grid INLINE (not subprocess) — names and agents now always apply
- Pane-status script more robust — walks PID tree when TMUX env missing
- Session save captures agent commands for auto-restart on restore

## v0.3.0 (2026-03-16)

### Added
- `agentgrid start` auto-detects tmux (no nesting errors)
- Fast setup wizard: 3 inputs for any number of panes (including 50+)
- Override syntax: `1:codex,5:gemini` to customize specific panes
- Auto-install: prompts to install missing agents before grid creation
- `agentgrid install-all` — install every missing agent at once
- 10 known agents: claude, codex, gemini, aider, opencode, goose, cline, hermes, copilot, cursor
- `agentgrid status` works outside tmux (shows session list)
- `agentgrid start` inside tmux shows helpful next steps (not an error)
- Every command auto-launches tmux if not already inside

### Fixed
- `sessions should be nested with care` error when running inside tmux
- Bash 3.2 compatibility (stock macOS — no associative arrays)
- Bulletproof pane-status: walks process tree to find tmux pane

## v0.2.0 (2026-03-15)

### Added
- `agentgrid launch` — interactive setup wizard (pick agents, names, sounds per pane)
- `agentgrid launch <preset>` — launch a saved grid configuration
- `agentgrid preset create <name>` — create reusable configurations interactively
- `agentgrid preset list` — view all saved presets
- `agentgrid preset show <name>` — view preset details
- `agentgrid preset delete <name>` — remove a preset
- 3 built-in presets: `dev-sprint`, `mixed-agents`, `research-swarm`
- Mixed agent support: different agents per pane (3 Claude + 2 Codex + 1 Gemini)
- Presets saved as JSON in `~/.agentgrid/presets/`

## v0.1.0 (2026-03-15)

### Added
- `agentgrid grid ROWSxCOLS [command]` — create evenly-sized grids
- `agentgrid start [session]` — start or attach to tmux session
- `agentgrid name <name>` — name panes with locked labels
- `agentgrid sound <event> <file>` — custom sounds (MP3/WAV/AIFF)
- `agentgrid sound test` — preview all configured sounds
- `agentgrid sound off` — disable sounds
- `agentgrid status` — show all panes with colored status
- `agentgrid broadcast <text>` — send text to all panes
- `agentgrid equalize` — even out pane sizes
- `agentgrid kill` — remove all panes except one
- Colored pane labels: ✅ DONE (green), ⏳ WAITING (yellow), ⚡ WORKING (blue)
- Sound alerts via `afplay` (macOS) / `paplay` (Linux) — works through DND
- Claude Code hooks for automatic status updates
- Support for any CLI agent (Claude, Codex, Gemini, Cursor, Aider, etc.)
- One-command installer: `curl -fsSL ... | bash`
- Cross-platform: macOS, Linux, Windows (WSL)
