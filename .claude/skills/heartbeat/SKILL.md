# Skill: Heartbeat System

Implement the HEARTBEAT.md pattern for proactive agent behavior. Agents check for updates, run scheduled tasks, and act without user prompting.

## Pattern (From OpenClaw/NanoClaw)

Each agent has a `HEARTBEAT.md` file that defines scheduled tasks:

```markdown
# Heartbeat — GiftFinder

## Every 6 hours

- [ ] Check tracked items for price drops
- [ ] Scan wishlists for new additions

## Every 24 hours

- [ ] Review saved preferences for staleness
- [ ] Check for new product launches in tracked categories

## Weekly

- [ ] Generate gift suggestion digest for upcoming events
```

If HEARTBEAT.md is empty or missing, no heartbeat fires (saves API costs).

## Implementation

### Task Scheduler (Host Process)

```typescript
import { CronJob } from "cron-parser";

interface ScheduledTask {
  id: string;
  agentId: string;
  prompt: string;
  scheduleType: "cron" | "interval" | "once";
  scheduleValue: string; // cron expression, ms interval, or ISO date
  nextRun: Date;
  status: "active" | "paused" | "completed";
}

// SQLite schema
const SCHEMA = `
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  schedule_type TEXT NOT NULL,
  schedule_value TEXT NOT NULL,
  next_run TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  last_run TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`;

// Polling loop — check every 30 seconds
async function heartbeatLoop(db: Database): Promise<void> {
  while (true) {
    const due = db
      .prepare(
        `SELECT * FROM scheduled_tasks
       WHERE status = 'active' AND next_run <= datetime('now')
       ORDER BY next_run ASC LIMIT 5`,
      )
      .all() as ScheduledTask[];

    for (const task of due) {
      await executeHeartbeatTask(task);
      updateNextRun(db, task);
    }

    await sleep(30_000);
  }
}
```

### HEARTBEAT.md Parser

```typescript
function parseHeartbeat(content: string): ScheduledTask[] {
  const tasks: ScheduledTask[] = [];
  let currentSchedule = "";

  for (const line of content.split("\n")) {
    const scheduleMatch = line.match(/^##\s+(.+)/);
    if (scheduleMatch) {
      currentSchedule = scheduleMatch[1].trim();
      continue;
    }

    const taskMatch = line.match(/^-\s+\[[ x]\]\s+(.+)/);
    if (taskMatch && currentSchedule) {
      tasks.push({
        id: crypto.randomUUID(),
        agentId: "", // set by caller
        prompt: taskMatch[1].trim(),
        scheduleType: inferScheduleType(currentSchedule),
        scheduleValue: inferScheduleValue(currentSchedule),
        nextRun: computeNextRun(currentSchedule),
        status: "active",
      });
    }
  }
  return tasks;
}

function inferScheduleValue(schedule: string): string {
  const lower = schedule.toLowerCase();
  if (lower.includes("every 6 hours")) return "0 */6 * * *";
  if (lower.includes("every 24 hours") || lower === "daily") return "0 0 * * *";
  if (lower === "weekly") return "0 0 * * 0";
  if (lower.includes("every")) {
    const match = lower.match(/every (\d+) (minute|hour|day)/);
    if (match) {
      const [, n, unit] = match;
      if (unit === "minute") return `*/${n} * * * *`;
      if (unit === "hour") return `0 */${n} * * *`;
      if (unit === "day") return `0 0 */${n} * *`;
    }
  }
  return "0 0 * * *"; // default: daily
}
```

### Heartbeat Execution

```typescript
async function executeHeartbeatTask(task: ScheduledTask): Promise<void> {
  // Spawn sandbox with task prompt + agent context
  const prompt = [
    `[HEARTBEAT TASK] ${task.prompt}`,
    `This is an automated scheduled task. Act on it, save results to memory.`,
    `If nothing actionable, reply briefly and exit.`,
  ].join("\n");

  await spawnSandbox({
    agentId: task.agentId,
    prompt,
    isHeartbeat: true, // lower priority in concurrency queue
    maxTurns: 10, // cap heartbeat complexity
  });
}
```

## Key Design Decisions

- Empty HEARTBEAT.md = no heartbeat (cost control)
- Heartbeat tasks run at lower priority than user messages
- Max 10 turns per heartbeat (prevents runaway costs)
- Results saved to agent memory for user visibility
- Tasks are idempotent — safe to retry on failure
