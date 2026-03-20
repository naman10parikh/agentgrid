# Changelog

## v1.0.0 (2026-03-20)

### Added

- **Production-ready release** — comprehensive test suite, polished error messages, npm-publishable package
- **`--json` flag for `agentgrid status`** — machine-readable output for scripting and monitoring
- **Graceful tmux detection** — helpful error messages when tmux is not installed or not running
- **Expanded test suite** — 30+ tests covering grid math, config, agent detection, security, and edge cases

### Changed

- Version bump to 1.0.0 — stable API, all commands documented and tested
- README rewritten with architecture diagram, FAQ, and compelling narrative
- Better error messages throughout — every failure tells you how to fix it

### Fixed

- Edge case: broadcast with no panes now shows helpful message instead of silent failure
- Edge case: grid dimensions > 10x10 rejected with clear message

## v0.7.0 (2026-03-17)

### Added

- **Session ID restore** — `agentgrid save` captures each Claude pane's exact conversation ID by walking the process tree (pane PID → shell → Claude child → `~/.claude/sessions/<PID>.json`). Restore resumes the exact chat, not just the most recent one.
- **Multi-agent detection** — save inspects child process command lines via `ps -o args=` to accurately identify Claude, Codex, Gemini, Aider, Goose, etc. (tmux shows "node" for many agents — this fixes that).
- **Per-agent restore commands** — Claude: `--resume <sessionId>`, Codex: `codex resume <id>`, Gemini: `--resume latest`, Goose: `session resume --last`, others: fresh start.
- **Empty session handling** — Claude panes with no messages sent start fresh instead of hijacking another pane's conversation.
- **Pane buffer capture** — `agentgrid save` stores each pane's visible screen content as `~/.agentgrid/sessions/<name>-pane-<N>.txt` for reference.
- `--no-start` flag for `agentgrid restore` — restore layout/names only, without starting agents.

### Fixed

- ANSI colors in `agentgrid help` — switched from `'\033[1m'` to `$'\033[1m'` (ANSI-C quoting) so heredocs render colors correctly.
- Python `NameError` in restore — bash `true`/`false` injected into Python heredoc now correctly maps to `True`/`False`.

## v0.5.0 (2026-03-16)

### Added

- `agentgrid update` — self-update from GitHub
- Option+Z zoom shortcut (2 keys, no prefix)
- `agentgrid terminal-setup` — configure all Claude panes at once
- Trust dialog documentation and UX improvements

### Fixed

- Restore no longer auto-starts agents in all panes with same chat
- Grid layout: split+tile algorithm for even pane sizing
- Trust dialog appears in correct pane

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
