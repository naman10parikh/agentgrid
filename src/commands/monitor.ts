import chalk from "chalk";
import {
  ensureInsideTmux,
  listPanes,
  normalizeAgentName,
  capturePaneOutput,
} from "../lib/tmux.js";
import { SESSION_NAME } from "../lib/constants.js";

/** Live monitoring of all panes with auto-refresh */
export function cmdMonitor(opts?: { interval?: number }): void {
  ensureInsideTmux(SESSION_NAME);

  const intervalMs = (opts?.interval ?? 5) * 1000;

  console.log(
    `${chalk.bold("⚡ agentgrid monitor")} ${chalk.dim(`(every ${intervalMs / 1000}s — Ctrl+C to exit)`)}`,
  );

  const tick = () => {
    process.stdout.write("\x1B[2J\x1B[H");
    console.log(
      `${chalk.bold("⚡ agentgrid monitor")} ${chalk.dim(`${new Date().toLocaleTimeString()} — Ctrl+C to exit`)}`,
    );
    console.log("");

    const panes = listPanes();
    for (const p of panes) {
      const agent = normalizeAgentName(p.command);
      const label = p.label || `Pane ${p.paneIndex}`;
      const statusIcon =
        p.status === "done"
          ? chalk.green("✅")
          : p.status === "running"
            ? chalk.blue("⚡")
            : p.status === "needs-input"
              ? chalk.yellow("⏳")
              : chalk.dim("○");

      console.log(`  ${statusIcon} ${chalk.bold(label)} (${agent})`);

      // Show last 3 lines of output
      const output = capturePaneOutput(`:.${p.paneIndex}`);
      if (output.trim()) {
        const lines = output.split("\n").filter(Boolean).slice(-3);
        for (const line of lines) {
          console.log(`    ${chalk.dim(line.slice(0, 80))}`);
        }
      }
      console.log("");
    }
  };

  tick();
  const handle = setInterval(tick, intervalMs);
  process.on("SIGINT", () => {
    clearInterval(handle);
    process.exit(0);
  });
}

/** Show recent logs/output from a specific pane */
export function cmdLogs(pane: string, opts?: { lines?: number }): void {
  ensureInsideTmux(SESSION_NAME);

  if (!pane) {
    console.error(chalk.red("[agentgrid]") + " Usage: agentgrid logs <pane>");
    process.exit(1);
  }

  const output = capturePaneOutput(pane);
  if (!output.trim()) {
    console.log(chalk.dim(`(pane ${pane} has no output)`));
    return;
  }

  const lines = output.split("\n");
  const limit = opts?.lines ?? 50;
  const display = lines.slice(-limit);
  console.log(chalk.bold(`Logs from ${pane} (last ${display.length} lines):`));
  console.log(display.join("\n"));
}
