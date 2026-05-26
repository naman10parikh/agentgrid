# AgentGrid Launch Thread — X/Twitter

**Post from:** @namanparikh
**When:** Launch day
**Assets needed:** Screenshots of app (grid view, sidebar, CEO log, welcome screen, command palette)

---

### 1/15

We just built a Mission Control app for AI agent swarms — using a swarm of AI agents.

6 Claude agents working in parallel. 3 waves. 345 TODO items. 233 tests.

The result: AgentGrid App.

Here's the story. 🧵

### 2/15

The problem: You're running Claude Code, Codex, and Gemini in separate terminals. You can't see what they're all doing. You can't broadcast a message to all of them. You can't save your grid layout and reload it tomorrow.

AgentGrid fixes this.

### 3/15

What it does:

→ Spawn NxM grids of AI agents in one click
→ Mix and match: Claude + Codex + Gemini + Aider in the same grid
→ Broadcast commands to all agents simultaneously
→ See real-time status: working, idle, done, error
→ Drag to resize panes

[screenshot: 2x3 grid with agents working]

### 4/15

The CLI already had 6,000+ installs.

But a CLI wrapped around tmux has limits. You can't drag-to-resize. You can't click a preset to spawn a team. You can't see a CEO log of what happened.

So we built the desktop app.

### 5/15

Tech stack:

— Electron 33
— React 19
— xterm.js (GPU-accelerated via WebGL)
— node-pty (native terminal)
— Tailwind 4
— TypeScript strict

98MB DMG. Launches in <2 seconds.

### 6/15

The killer feature: Harnesses.

A harness is a YAML file that defines a team:

- Grid size (2x3)
- Roles (CEO, Architect, Builder, QA)
- Which AI model per role
- Mission prompts

One click → full team spawns.

[screenshot: preset browser with 5 built-in harnesses]

### 7/15

Built-in harnesses:

⚡ engineering-sprint — 2x3 with CEO, Architect, 2 Builders, QA, Docs
🎨 design-sprint — 2x2 with Research, Designer, Review
🔬 research-swarm — 3x3 with 4 Analysts, Synthesizer, Writer
✍️ content-engine — 2x2 with Writer, Editor, Publisher
🚀 oss-launch — 2x3 full launch team

### 8/15

The Sidebar has 4 tabs:

1. Workspaces — switch between projects
2. Presets — browse and load harnesses
3. Tools — manage MCP servers, skills, hooks per scope (global/workspace/pane)
4. CEO Log — real-time structured log with level filtering

[screenshot: sidebar open showing tools tab]

### 9/15

Signal Protocol — agents communicate via file system signals.

When an agent finishes: `.done`
When it needs QA: `.needs-qa`
When context degrades: `.migrating`

AgentGrid watches these files and updates the UI in real time. Native OS notifications too.

### 10/15

The CEO Log auto-populates from orchestration events.

Every signal, every pane status change, every decision — logged with timestamps and level (info/warning/error/decision/experiment).

Filter by level. Export as markdown. Search.

[screenshot: CEO log panel with entries]

### 11/15

The meta part: we built this app USING the thing we built.

6 Claude agents in an agentgrid. CEO coordinating 5 VPs:

- VP-RESEARCHER (competitive analysis)
- VP-ARCHITECT (architecture doc)
- VP-ELECTRON (main process)
- VP-FRONTEND (React UI)
- VP-CLI (TypeScript rewrite)
- VP-QA (testing)

### 12/15

Results from the build:

— 309/345 TODO items completed (90%)
— 233 tests passing (16 test files)
— 9 main process modules
— 1,595 renderer modules
— 5 built-in harnesses
— Full IPC protocol (30+ channels)
— Auto-update via GitHub Releases

### 13/15

It's open source. MIT license.

CLI (works today):

```
npm install -g @namanparikh/agentgrid
agentgrid 2x3 claude
```

App (download DMG):
→ github.com/naman10parikh/agentgrid/releases

### 14/15

What's next:

— Canvas view (infinite space, not just grids)
— Recursive sub-grids (CEO spawns sub-CEOs)
— Cost tracking per agent
— Plugin marketplace
— VS Code extension
— Cross-platform (Linux AppImage, Windows MSI)

### 15/15

The future of coding isn't one AI agent.

It's a team of agents — coordinated, monitored, orchestrated.

AgentGrid is the mission control for that future.

Star it: github.com/naman10parikh/agentgrid
Try it: `npm i -g @namanparikh/agentgrid`
Download: releases page

---

## Pre-Launch Checklist

- [ ] Take 4 screenshots (grid view, sidebar, CEO log, welcome screen)
- [ ] Upload screenshots to tweet media
- [ ] Verify repo is public
- [ ] Verify DMGs are on GitHub Releases
- [ ] Schedule thread for peak engagement (10am PT Tuesday or Wednesday)
- [ ] Prepare reply with install command for quote-tweets
- [ ] Cross-post HN Show HN link in reply to thread
