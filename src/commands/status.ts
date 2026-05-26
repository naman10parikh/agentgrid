import chalk from "chalk";
import {
  ensureTmux,
  isInsideTmux,
  listAllPanes,
  normalizeAgentName,
  tmuxRunRaw,
} from "../lib/tmux.js";

export function cmdStatus(opts: { json?: boolean }): void {
  if (!isInsideTmux()) {
    ensureTmux();
    if (opts.json) {
      console.log('{"error":"not_in_tmux","sessions":[]}');
      return;
    }
    console.log(
      `\n${chalk.bold("⚡ agentgrid")} ${chalk.dim("(outside tmux)")}\n`,
    );
    const sessions = tmuxRunRaw(
      'list-sessions -F "#{session_name}: #{session_windows} windows"',
    );
    if (sessions) {
      for (const s of sessions.split("\n").filter(Boolean)) {
        console.log(`  ${chalk.magenta("▸")} ${s}`);
      }
    } else {
      console.log("  No sessions");
    }
    console.log(`\n  Start: ${chalk.cyan("agentgrid start")}\n`);
    return;
  }

  const panes = listAllPanes();

  if (opts.json) {
    const jsonPanes = panes.map((p) => ({
      ref: p.paneId,
      status: p.status || "idle",
      label: p.label,
      command: p.command,
    }));
    console.log(JSON.stringify({ panes: jsonPanes }));
    return;
  }

  console.log(`\n${chalk.bold("⚡ agentgrid status")}\n`);
  let cd = 0,
    cw = 0,
    cr = 0,
    ci = 0;

  for (const p of panes) {
    const label = p.label || "(unnamed)";
    const ref = p.paneId;
    switch (p.status) {
      case "done":
        console.log(
          `  ${chalk.green("✅ DONE")}     ${label} ${chalk.dim(`[${ref}]`)}`,
        );
        cd++;
        break;
      case "needs-input":
        console.log(
          `  ${chalk.yellow("⏳ WAITING")}  ${label} ${chalk.dim(`[${ref}]`)}`,
        );
        cw++;
        break;
      case "running":
        console.log(
          `  ${chalk.blue("⚡ WORKING")}  ${label} ${chalk.dim(`[${ref}]`)}`,
        );
        cr++;
        break;
      default:
        console.log(
          `  ${chalk.dim("   IDLE")}     ${label} ${chalk.dim(`[${ref}]`)}`,
        );
        ci++;
    }
  }

  console.log(
    `\n  ${chalk.green("Done:")} ${cd}  ${chalk.yellow("Waiting:")} ${cw}  ${chalk.blue("Working:")} ${cr}  ${chalk.dim("Idle:")} ${ci}\n`,
  );
}
