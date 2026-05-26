import chalk from "chalk";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { join, basename } from "node:path";
import {
  ensureInsideTmux,
  getCurrentWindowId,
  listPanes,
  sendKeys,
  setPaneOption,
  selectLayout,
  selectPane,
  tmuxRun,
  capturePaneOutput,
  getPaneCount,
  normalizeAgentName,
} from "../lib/tmux.js";
import { SESSIONS_DIR, SESSION_NAME } from "../lib/constants.js";

interface SavedPane {
  pane: number;
  label: string;
  command: string;
  directory: string;
  status: string;
  sessionId: string;
  hasMessages: boolean;
}

interface SavedSession {
  name: string;
  panes: SavedPane[];
}

export function cmdSave(name = "default"): void {
  ensureInsideTmux(SESSION_NAME);
  mkdirSync(SESSIONS_DIR, { recursive: true });

  const panes = listPanes();
  const savedPanes: SavedPane[] = panes.map((p) => {
    // Capture buffer
    const buf = capturePaneOutput(`:.${p.paneIndex}`);
    if (buf.trim()) {
      writeFileSync(join(SESSIONS_DIR, `${name}-pane-${p.paneIndex}.txt`), buf);
    }

    return {
      pane: p.paneIndex,
      label: p.label,
      command: normalizeAgentName(p.command),
      directory: p.directory,
      status: p.status,
      sessionId: "",
      hasMessages: false,
    };
  });

  const session: SavedSession = { name, panes: savedPanes };
  writeFileSync(
    join(SESSIONS_DIR, `${name}.json`),
    JSON.stringify(session, null, 2),
  );

  console.log(`  Saved: ${name} (${savedPanes.length} panes)`);
  for (const p of savedPanes) {
    const agent = p.command || "shell";
    const detail = p.directory.split("/").pop() ?? "~";
    console.log(`    Pane ${p.pane}: ${p.label} (${agent}) ${detail}`);
  }
}

export function cmdRestore(name?: string, opts?: { noStart?: boolean }): void {
  ensureInsideTmux(SESSION_NAME);

  if (!name) {
    console.log(`\n${chalk.bold("⚡ Saved Sessions")}\n`);
    mkdirSync(SESSIONS_DIR, { recursive: true });
    const files = readdirSync(SESSIONS_DIR).filter(
      (f) => f.endsWith(".json") && !f.includes("-pane-"),
    );
    if (files.length === 0) {
      console.log(
        `  ${chalk.dim("No saved sessions. Save one: agentgrid save my-grid")}`,
      );
    } else {
      for (const f of files) {
        const sname = basename(f, ".json");
        try {
          const data: SavedSession = JSON.parse(
            readFileSync(join(SESSIONS_DIR, f), "utf-8"),
          );
          const count = data.panes?.length ?? "?";
          const stat = statSync(join(SESSIONS_DIR, f));
          const savedAt = stat.mtime
            .toISOString()
            .slice(0, 16)
            .replace("T", " ");
          console.log(
            `  ${chalk.magenta("▸")} ${chalk.bold(sname)} — ${count} panes ${chalk.dim(`(saved: ${savedAt})`)}`,
          );
        } catch {
          console.log(`  ${chalk.magenta("▸")} ${chalk.bold(sname)}`);
        }
      }
    }
    console.log(`\n  Restore: ${chalk.cyan("agentgrid restore <name>")}`);
    console.log(
      `  ${chalk.dim("Layout only: agentgrid restore <name> --no-start")}\n`,
    );
    return;
  }

  const file = join(SESSIONS_DIR, `${name}.json`);
  if (!existsSync(file)) {
    console.error(chalk.red("[agentgrid]") + ` No session: ${name}`);
    cmdRestore();
    process.exit(1);
  }

  console.log(chalk.magenta("[agentgrid]") + ` Restoring: ${chalk.bold(name)}`);

  const session: SavedSession = JSON.parse(readFileSync(file, "utf-8"));
  const total = session.panes.length;
  if (!total) {
    console.error(chalk.red("[agentgrid]") + " Empty session file");
    process.exit(1);
  }

  const windowId = getCurrentWindowId();

  // Create panes
  for (let i = 1; i < total; i++) {
    tmuxRun(["split-window", "-t", `${windowId}.1`]);
    selectLayout(windowId, "tiled");
  }

  if (total <= 3) {
    selectLayout(windowId, "even-horizontal");
  } else {
    selectLayout(windowId, "tiled");
  }

  // Apply names and restart
  const started: string[] = [];
  for (const p of session.panes) {
    if (p.pane < 1 || p.pane > total) continue;
    const target = `${windowId}.${p.pane}`;

    setPaneOption(target, "@pane_label", p.label);
    setPaneOption(target, "@pane_status", "");

    if (p.directory) {
      sendKeys(target, `cd ${p.directory}`, true);
    }

    if (!opts?.noStart && p.command && p.command !== "shell") {
      let resumeCmd = p.command;
      if (p.command === "claude") {
        resumeCmd = "claude --model claude-opus-4-6 --effort max";
      }
      sendKeys(target, resumeCmd, true);
      started.push(`    Pane ${p.pane}: ${p.label} -> ${p.command}`);
    }
  }

  selectPane(`${windowId}.1`);
  console.log(`  Restored ${total} panes`);
  if (started.length) {
    console.log(`  Restarted ${started.length} agents:`);
    for (const s of started) console.log(s);
  }
}
