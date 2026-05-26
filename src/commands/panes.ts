import chalk from "chalk";
import {
  ensureInsideTmux,
  getCurrentWindowId,
  getPaneCount,
  sendKeys,
  setPaneOption,
  selectLayout,
  tmuxRun,
} from "../lib/tmux.js";
import { SESSION_NAME } from "../lib/constants.js";

export function cmdName(name: string): void {
  ensureInsideTmux(SESSION_NAME);
  if (!name) {
    console.error(chalk.red("[agentgrid]") + " Usage: agentgrid name <name>");
    process.exit(1);
  }
  tmuxRun(["set-option", "-p", "@pane_label", name]);
  console.log(chalk.magenta("[agentgrid]") + ` Named: ${chalk.bold(name)}`);
}

export function cmdEqualize(): void {
  ensureInsideTmux(SESSION_NAME);
  selectLayout("", "tiled");
  console.log(chalk.magenta("[agentgrid]") + " Equalized");
}

export function cmdSwap(direction: string): void {
  ensureInsideTmux(SESSION_NAME);
  switch (direction) {
    case "up":
    case "prev":
      tmuxRun(["swap-pane", "-U"]);
      console.log(chalk.magenta("[agentgrid]") + " Swapped up");
      break;
    case "down":
    case "next":
      tmuxRun(["swap-pane", "-D"]);
      console.log(chalk.magenta("[agentgrid]") + " Swapped down");
      break;
    case "":
    case undefined:
      console.log(`\n${chalk.bold("Swap & arrange panes:")}`);
      console.log(
        `  ${chalk.cyan("agentgrid swap up")}     Swap with previous pane`,
      );
      console.log(
        `  ${chalk.cyan("agentgrid swap down")}   Swap with next pane`,
      );
      console.log("");
      break;
    default:
      console.error(
        chalk.red("[agentgrid]") + " Usage: agentgrid swap [up|down]",
      );
  }
}

export function cmdAdd(direction = "right", agent?: string): void {
  ensureInsideTmux(SESSION_NAME);

  const flag = direction === "down" || direction === "d" ? "-v" : "-h";
  tmuxRun(["split-window", flag, "-c", "#{pane_current_path}"]);

  const paneCount = getPaneCount();
  setPaneOption("", "@pane_label", `Pane ${paneCount}`);
  setPaneOption("", "@pane_status", "");

  if (agent) {
    let cmd = agent;
    if (agent === "claude") cmd = "claude --effort max";
    sendKeys("", cmd, true);
    console.log(
      chalk.magenta("[agentgrid]") + ` Added pane → ${chalk.bold(agent)}`,
    );
  } else {
    console.log(chalk.magenta("[agentgrid]") + ` Added pane (${direction})`);
  }

  selectLayout("", "tiled");
}

export function cmdKill(): void {
  ensureInsideTmux(SESSION_NAME);
  const count = getPaneCount();
  while (getPaneCount() > 1) {
    const panes = tmuxRun(["list-panes", "-F", "#{pane_index}"]);
    const last = panes.split("\n").filter(Boolean).pop();
    if (last) tmuxRun(["kill-pane", "-t", `:.${last}`]);
  }
  console.log(chalk.magenta("[agentgrid]") + ` Cleared (was ${count} panes)`);
}
