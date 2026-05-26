import chalk from "chalk";
import {
  ensureInsideTmux,
  getCurrentWindowId,
  getPaneCount,
  sendKeys,
  setPaneOption,
  selectLayout,
  selectPane,
  tmuxRun,
} from "../lib/tmux.js";
import { checkAgentInstalled, installAgent } from "../lib/agents.js";
import { SESSION_NAME } from "../lib/constants.js";

export function cmdGrid(
  grid: string,
  command?: string,
  opts?: { model?: string; effort?: string },
): void {
  ensureInsideTmux(SESSION_NAME);

  const match = grid.match(/^(\d+)x(\d+)$/);
  if (!match) {
    console.error(
      chalk.red("[agentgrid]") + ` Invalid grid format: ${chalk.bold(grid)}`,
    );
    console.error("  Expected: agentgrid ROWSxCOLS [agent]  (e.g. 2x3 claude)");
    process.exit(1);
  }

  const rows = parseInt(match[1]!, 10);
  const cols = parseInt(match[2]!, 10);

  if (rows < 1 || rows > 10 || cols < 1 || cols > 10) {
    console.error(
      chalk.red("[agentgrid]") +
        ` Grid size must be between 1x1 and 10x10 (got ${rows}x${cols})`,
    );
    process.exit(1);
  }

  // Check if agent is installed
  if (command) {
    const agentBin = command.split(" ")[0]!;
    if (!checkAgentInstalled(agentBin)) {
      console.log(
        chalk.magenta("[agentgrid]") +
          ` ${chalk.yellow(agentBin + " not installed.")}`,
      );
      installAgent(agentBin);
    }
  }

  const total = rows * cols;
  console.log(
    chalk.magenta("[agentgrid]") +
      ` Creating ${chalk.bold(`${rows}x${cols}`)} grid (${total} panes)...`,
  );

  const windowId = getCurrentWindowId();

  // Create panes
  for (let i = 1; i < total; i++) {
    tmuxRun(["split-window", "-t", `${windowId}.1`]);
    selectLayout(windowId, "tiled");
  }

  // Pick best layout
  if (total <= 3 && cols >= rows) {
    selectLayout(windowId, "even-horizontal");
  } else if (total <= 3 && rows > cols) {
    selectLayout(windowId, "even-vertical");
  } else {
    selectLayout(windowId, "tiled");
  }

  const totalPanes = getPaneCount(windowId);

  // Label all panes
  for (let p = 1; p <= totalPanes; p++) {
    setPaneOption(`${windowId}.${p}`, "@pane_label", `Agent ${p}`);
    setPaneOption(`${windowId}.${p}`, "@pane_status", "");
  }

  // Start agents
  if (command) {
    let launchCmd = command;
    const agentBase = command.split(" ")[0]!;
    if (agentBase === "claude" && !command.includes("--effort")) {
      const effort = opts?.effort ?? "max";
      launchCmd = `${command} --effort ${effort}`;
    }
    if (opts?.model && !launchCmd.includes("--model")) {
      launchCmd = `${launchCmd} --model ${opts.model}`;
    }

    for (let p = 1; p <= totalPanes; p++) {
      sendKeys(`${windowId}.${p}`, launchCmd, true);
    }
  }

  selectPane(`${windowId}.1`);

  console.log(
    chalk.magenta("[agentgrid]") +
      ` ${chalk.green(`✅ ${rows}x${cols} = ${totalPanes} panes`)}`,
  );
  if (command) {
    console.log(
      chalk.magenta("[agentgrid]") + ` Running: ${chalk.bold(command)}`,
    );
  }
}
