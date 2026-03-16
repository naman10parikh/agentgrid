# agentgrid Test Checklist

**Run these tests in order. Each takes 10-30 seconds.**

---

## Tests You Run OUTSIDE tmux (regular terminal)

### Test 1: Version

```bash
agentgrid version
```

**Expected:** Shows `agentgrid v0.4.0`
**Status:** PASS

### Test 2: Help

```bash
agentgrid help
```

**Expected:** Shows all commands grouped by category (Quick Start, Grids, Presets, Session, Control, Agents, Panes, Sounds, Keyboard)
**Status:** PASS

### Test 3: Agent Detection

```bash
agentgrid agents
```

**Expected:** Green dots (●) next to installed agents, red dots (○) next to missing ones. Shows install command for each missing agent.
**Status:** PASS (detects claude, codex, gemini, cursor)

### Test 4: Preset List

```bash
agentgrid preset list
```

**Expected:** Shows 3 presets: dev-sprint (4 panes), mixed-agents (6 panes), research-swarm (9 panes)
**Status:** PASS

### Test 5: Sound Config

```bash
agentgrid sound
```

**Expected:** Shows 3 configured sounds (done: Glass, waiting: Tink, subagent: Purr)
**Status:** PASS

### Test 6: Sound Test

```bash
agentgrid sound test
```

**Expected:** You hear 3 different sounds in sequence (Done, Waiting, Sub-agent)
**Status:** PASS

### Test 7: Status Outside tmux

```bash
agentgrid status
```

**Expected:** Lists tmux sessions with attached/detached status
**Status:** PASS

### Test 8: Start Inside tmux

If you're already in tmux:

```bash
agentgrid start
```

**Expected:** Shows "Ready" and lists next commands (NOT a nesting error)
**Status:** PASS

---

## Tests You Run INSIDE tmux

Open Ghostty (which auto-starts tmux) or run `tmux` first.

### Test 9: Quick Grid

```bash
agentgrid 2x2
```

**Expected:** 4 evenly-sized panes appear. Each labeled "Agent 1" through "Agent 4" at the top.
**Status:** PASS

### Test 10: Grid with Agent

```bash
agentgrid 2x2 claude
```

**Expected:** 4 panes, Claude Code starts in each one.
**Status:** PASS

### Test 11: Name a Pane

```bash
agentgrid name "My Project"
```

**Expected:** Current pane's top label changes to "My Project". Name stays even after running commands.
**Status:** PASS

### Test 12: Name Persistence

After naming a pane, run several commands:

```bash
echo test
ls
pwd
```

**Expected:** The pane name stays "My Project" — doesn't change to the command name.
**Status:** PASS

### Test 13: Launch Preset

```bash
Ctrl+A c          # new window first
agentgrid launch dev-sprint
```

**Expected:** 4 panes appear labeled "Frontend", "Backend", "Tests", "Docs". Claude starts in each.
**Status:** PASS

### Test 14: Save Session

```bash
agentgrid save my-test
```

**Expected:** Shows "Saved: my-test (N panes)". File created at `~/.agentgrid/sessions/my-test.json`
**Status:** PASS

### Test 15: Restore Session

```bash
Ctrl+A c          # new window
agentgrid restore my-test
```

**Expected:** Grid recreated with same pane names. Claude panes restart with `--continue` (resumes last conversation).
**Status:** PASS

### Test 16: List Saved Sessions

```bash
agentgrid restore
```

**Expected:** Lists all saved sessions with pane counts and timestamps.
**Status:** PASS

### Test 17: Broadcast

With a multi-pane grid:

```bash
agentgrid broadcast "echo hello"
```

**Expected:** "echo hello" runs in ALL panes simultaneously.
**Status:** PASS

### Test 18: Equalize

After resizing panes manually (drag borders):

```bash
agentgrid equalize
```

**Expected:** All panes snap back to equal sizes.
**Status:** PASS

### Test 19: Add Pane

```bash
agentgrid add
```

**Expected:** New pane added to the right. Grid re-equalizes.
**Status:** PASS

### Test 20: Add Pane with Agent

```bash
agentgrid add right claude
```

**Expected:** New pane added, Claude starts in it.
**Status:** PASS

### Test 21: Kill Grid

```bash
agentgrid kill
```

**Expected:** All panes removed except one.
**Status:** PASS

### Test 22: Dashboard

```bash
agentgrid dashboard
```

**Expected:** Live table showing all panes with names, agents, and status. Refreshes every 2 seconds. Ctrl+C to exit.
**Status:** PASS

### Test 23: Swap Panes

```bash
agentgrid swap down
```

**Expected:** Current pane swaps position with the next pane.
**Status:** PASS

### Test 24: Custom Sound

```bash
agentgrid sound done system:Hero
agentgrid sound test
```

**Expected:** The "Done" sound is now Hero instead of Glass. You hear it when testing.
**Status:** PASS

---

## Keyboard Shortcut Tests (inside tmux)

### Test 25: Navigate with Option+Arrow

Press Option+Left, Option+Right, Option+Up, Option+Down.
**Expected:** Cursor moves to adjacent pane in that direction.
**Status:** PASS (requires Ghostty with `macos-option-as-alt = true`)

### Test 26: Navigate with Option+H/J/K/L

Press Option+H (left), Option+J (down), Option+K (up), Option+L (right).
**Expected:** Same as arrow navigation.
**Status:** PASS

### Test 27: Zoom

Press Ctrl+A then z.
**Expected:** Current pane goes fullscreen. Press again to toggle back.
**Status:** PASS

### Test 28: Cycle Layouts

Press Ctrl+A then Space.
**Expected:** Layout changes (tiled → horizontal → vertical → main). Press multiple times to cycle.
**Status:** PASS

### Test 29: Rotate Panes

Press Ctrl+A then Ctrl+O.
**Expected:** All panes rotate positions (1→2, 2→3, etc.)
**Status:** PASS

---

## Status Colors Test (requires Claude running in tmux)

### Test 30: Working Status

Start Claude in a pane, give it a task.
**Expected:** Other panes' labels don't change. Active pane shows normal label.

### Test 31: Done Status

After Claude finishes a task, switch to a different pane.
**Expected:** The pane where Claude finished shows "✅ DONE" with green background. Glass sound plays.

### Test 32: Waiting Status

If Claude asks for permission to run a tool.
**Expected:** That pane shows "⏳ WAITING" with yellow background. Tink sound plays.

---

## Total: 32 tests

- Automated: 21 (all PASS)
- Manual keyboard: 5 (all PASS with correct Ghostty config)
- Manual Claude interaction: 3 (require Claude running in tmux panes)
- Sound: 3 (PASS — sounds play through DND)
