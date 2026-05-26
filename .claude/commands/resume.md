# /resume — Load Context from Vault

Load session context from the Obsidian vault so you know what happened recently and can pick up where you left off.

## What To Do

### Step 1: Read Permanent Memory

Read `vault/CLAUDE-MEMORY.md` — this is the permanent project memory stored in the vault. It contains key decisions, conventions, architecture choices, and active workstreams.

### Step 2: Read Recent Session Logs

List files in `vault/sessions/` sorted by date (newest first). Read the last 3 session logs (or the number specified by the user via `/resume N`).

Each session log has a "Quick Reference" section at the top — read that first for a fast summary. Only dig into the full log if the user asks about a specific topic.

### Step 3: Read Today's Daily Note

Check if `vault/daily/YYYY-MM-DD.md` exists for today. If yes, read it for today's context.

### Step 4: Topic Search (if specified)

If the user ran `/resume TOPIC` (e.g., `/resume auth` or `/resume agentgrid`), search the vault for that topic:

- Use Grep to search `vault/` for the topic keyword
- Read matching notes and surface relevant context

### Step 5: Report

Tell the user:

- What you were last working on (from session logs)
- Key pending tasks
- Any decisions or context they should know about
- If topic search was done, surface those findings

## Usage

```
/resume          — Load last 3 sessions
/resume 10       — Load last 10 sessions
/resume auth     — Load sessions + search for "auth"
/resume 5 vault  — Last 5 sessions + search "vault"
```

## Key Files

- `vault/CLAUDE-MEMORY.md` — permanent memory (always read)
- `vault/sessions/*.md` — session logs (read N most recent)
- `vault/daily/*.md` — daily notes (read today's if exists)
