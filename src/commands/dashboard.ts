import chalk from "chalk";
import {
  ensureInsideTmux,
  getSessionName,
  getPaneCount,
  listPanes,
  normalizeAgentName,
} from "../lib/tmux.js";
import { SESSION_NAME } from "../lib/constants.js";

function drawDashboardTable(): void {
  const panes = listPanes();

  console.log(
    chalk.dim("  ┌─────┬──────────────────┬──────────────────┬────────────┐"),
  );
  console.log(
    `  ${chalk.dim("│")} ${chalk.bold(" #  ")}${chalk.dim("│")} ${chalk.bold("Name             ")}${chalk.dim("│")} ${chalk.bold("Agent            ")}${chalk.dim("│")} ${chalk.bold("Status     ")}${chalk.dim("│")}`,
  );
  console.log(
    chalk.dim("  ├─────┼──────────────────┼──────────────────┼────────────┤"),
  );

  for (const p of panes) {
    const label = (p.label || `Pane ${p.paneIndex}`).slice(0, 16);
    const cmd = normalizeAgentName(p.command || "—").slice(0, 16);
    let sd: string;

    switch (p.status) {
      case "done":
        sd = chalk.green("✅ DONE  ");
        break;
      case "needs-input":
        sd = chalk.yellow("⏳ WAIT  ");
        break;
      case "running":
        sd = chalk.blue("⚡ RUN   ");
        break;
      default:
        sd = chalk.dim("   idle  ");
    }

    const idx = String(p.paneIndex).padEnd(3);
    const labelPad = label.padEnd(16);
    const cmdPad = cmd.padEnd(16);
    console.log(
      `  ${chalk.dim("│")} ${idx} ${chalk.dim("│")} ${labelPad} ${chalk.dim("│")} ${cmdPad} ${chalk.dim("│")} ${sd}${chalk.dim("│")}`,
    );
  }

  console.log(
    chalk.dim("  └─────┴──────────────────┴──────────────────┴────────────┘"),
  );
  console.log("");
}

export function cmdDashboard(mode?: string): void {
  ensureInsideTmux(SESSION_NAME);

  const session = getSessionName();
  const total = getPaneCount();

  if (mode === "live" || mode === "watch") {
    console.log(
      `${chalk.bold("⚡ agentgrid dashboard")} ${chalk.dim("(live — Ctrl+C to exit)")}`,
    );
    console.log("");

    const interval = setInterval(() => {
      process.stdout.write("\x1B[2J\x1B[H"); // Clear screen
      console.log(
        `${chalk.bold("⚡ agentgrid dashboard")} ${chalk.dim("(live — Ctrl+C to exit)")}`,
      );
      console.log("");
      drawDashboardTable();
    }, 2000);

    process.on("SIGINT", () => {
      clearInterval(interval);
      process.exit(0);
    });

    // Draw first frame
    drawDashboardTable();
    return;
  }

  // Static mode
  console.log("");
  console.log(`  ${chalk.bold("⚡ agentgrid dashboard")}`);
  console.log(
    `  ${chalk.dim(`Session: ${session} · ${total} panes · ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`)}`,
  );
  console.log("");
  drawDashboardTable();
  console.log(`  ${chalk.bold("Quick actions:")}`);
  console.log(`    ${chalk.cyan("agentgrid add")}             Add a pane`);
  console.log(
    `    ${chalk.cyan("agentgrid name <n>")}        Name current pane`,
  );
  console.log(`    ${chalk.cyan("agentgrid swap up/down")}    Move panes`);
  console.log(`    ${chalk.cyan("agentgrid equalize")}        Even sizes`);
  console.log(`    ${chalk.cyan("agentgrid save <n>")}        Save this grid`);
  console.log(
    `    ${chalk.cyan("agentgrid dashboard live")}  Auto-refreshing view`,
  );
  console.log("");
}
