import chalk from "chalk";
import {
  ensureInsideTmux,
  getCurrentWindowId,
  sendKeys,
  tmuxRunRaw,
} from "../lib/tmux.js";
import { SESSION_NAME } from "../lib/constants.js";

export function cmdBroadcast(text: string): void {
  ensureInsideTmux(SESSION_NAME);

  if (!text) {
    console.error(
      chalk.red("[agentgrid]") + " Usage: agentgrid broadcast <text>",
    );
    process.exit(1);
  }

  const windowId = getCurrentWindowId();
  const raw = tmuxRunRaw(`list-panes -t ${windowId} -F '#{pane_id}'`);
  const paneIds = raw.split("\n").filter(Boolean);

  if (paneIds.length === 0) {
    console.error(
      chalk.red("[agentgrid]") + " No panes found in current window",
    );
    process.exit(1);
  }

  let count = 0;
  for (const pid of paneIds) {
    sendKeys(pid, text, true);
    count++;
  }

  console.log(
    chalk.magenta("[agentgrid]") +
      ` Broadcast to ${chalk.bold(String(count))} panes`,
  );
}
