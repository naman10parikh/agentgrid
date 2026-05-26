# Show HN: AgentGrid — Visual multi-agent orchestration for Claude/Codex/Gemini

**Link:** https://github.com/naman10parikh/Energy/tree/main/tools/agentgrid

**What it does:**

AgentGrid lets you run multiple AI coding agents in parallel — Claude Code, Codex, Gemini CLI, Aider, Goose, and more — in a visual grid. Think tmux for AI agents, but with a real desktop app.

Create a 2x3 grid, each pane runs a different AI agent with its own terminal. Broadcast prompts to all agents at once. Watch them work in parallel. Get notified when they're done.

**CLI (free):**

```bash
npm install -g agentgrid
agentgrid 2x3 claude    # 6 Claude Code agents
agentgrid 2x2 codex     # 4 Codex agents
agentgrid status         # see who's working/idle/done
agentgrid broadcast "fix the tests"
```

**Desktop app:**

```bash
cd tools/agentgrid/app
npm install && npx electron-vite dev
```

**Tech stack:** Electron 33, React 19, xterm.js (GPU-accelerated terminals), node-pty, TypeScript strict, Vitest (278 tests).

**What makes it different:**

1. **Cross-model teams** — Mix Claude + Codex + Gemini + Aider in one grid. No other tool does this.

2. **Signal protocol** — Agents write `.done` files when finished. The app watches for these and updates status automatically. No polling, no APIs.

3. **CEO mode** — Built-in monitoring: real-time activity log, broadcast, auto-approve permissions, progress tracking. Run overnight and check results in the morning.

4. **Recursive grids** — An agent can spawn its own sub-grid of agents. We've tested 3 levels deep.

5. **Preset system** — Save your grid layout + agent config. One click to restore. Export/import as JSON.

**Built using itself:** We used a 6-agent AgentGrid to build AgentGrid. 345 TODO items, 324 completed (93%), ~10K LOC, in one session. The meta-article is at `content/meta-article.md`.

**Status:** Alpha. Terminals work, grid works, broadcast works, presets work. 278 tests pass. App launches clean. Looking for feedback on the orchestration model.

MIT licensed. PRs welcome.
