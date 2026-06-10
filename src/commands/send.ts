import chalk from "chalk";
import {
  readFileSync,
  writeFileSync as writeTmpFile,
  unlinkSync,
} from "node:fs";
import {
  ensureInsideTmux,
  sendKeys,
  capturePaneOutput,
  tmuxRun,
} from "../lib/tmux.js";
import { SESSION_NAME } from "../lib/constants.js";
import { recordRun } from "../lib/run-log.js";

/** Send a message to a specific pane */
export function cmdSend(pane: string, message: string): void {
  const start = Date.now();
  ensureInsideTmux(SESSION_NAME);

  if (!pane || !message) {
    console.error(
      chalk.red("[agentgrid]") + ' Usage: agentgrid send <pane> "message"',
    );
    console.error('  Example: agentgrid send %42 "Fix the auth bug"');
    process.exit(1);
  }

  sendKeys(pane, message, true);
  console.log(
    chalk.magenta("[agentgrid]") +
      ` Sent to ${chalk.bold(pane)}: ${chalk.dim(message.slice(0, 60))}${message.length > 60 ? "..." : ""}`,
  );
  // Observability: a send injects a prompt into an agent pane — record it.
  recordRun({
    command: "send",
    args: [pane],
    durationMs: Date.now() - start,
    outcome: "ok",
    note: `${message.length} chars`,
  });
}

/** Read/capture output from a specific pane */
export function cmdRead(pane: string, opts?: { lines?: number }): void {
  ensureInsideTmux(SESSION_NAME);

  if (!pane) {
    console.error(chalk.red("[agentgrid]") + " Usage: agentgrid read <pane>");
    process.exit(1);
  }

  const output = capturePaneOutput(pane);
  if (!output.trim()) {
    console.log(chalk.dim(`(pane ${pane} is empty)`));
    return;
  }

  const lines = output.split("\n");
  const limit = opts?.lines ?? lines.length;
  const display = lines.slice(-limit);
  console.log(display.join("\n"));
}

/** Inject a file's contents as a prompt into a specific pane */
export function cmdInject(
  pane: string,
  opts: { file?: string; message?: string },
): void {
  const start = Date.now();
  ensureInsideTmux(SESSION_NAME);

  if (!pane) {
    console.error(
      chalk.red("[agentgrid]") +
        " Usage: agentgrid inject <pane> --file <path>",
    );
    process.exit(1);
  }

  let content: string;
  if (opts.file) {
    try {
      content = readFileSync(opts.file, "utf-8");
    } catch {
      console.error(chalk.red("[agentgrid]") + ` File not found: ${opts.file}`);
      process.exit(1);
    }
  } else if (opts.message) {
    content = opts.message;
  } else {
    console.error(
      chalk.red("[agentgrid]") + " Provide --file <path> or --message <text>",
    );
    process.exit(1);
  }

  // For long content, write to a temp file and use clipboard-style injection
  // to avoid tmux send-keys escaping issues
  if (content.length > 500) {
    // Write temp file and use tmux load-buffer approach
    const tmpFile = `/tmp/agentgrid-inject-${Date.now()}.txt`;
    writeTmpFile(tmpFile, content);
    // Use tmux load-buffer + paste-buffer for safe injection
    tmuxRun(["load-buffer", tmpFile]);
    tmuxRun(["paste-buffer", "-t", pane]);
    sendKeys(pane, "", true); // Press Enter
    try {
      unlinkSync(tmpFile);
    } catch {
      /* cleanup best-effort */
    }
  } else {
    sendKeys(pane, content, true);
  }

  const label = opts.file
    ? `file: ${opts.file}`
    : `message (${content.length} chars)`;
  console.log(
    chalk.magenta("[agentgrid]") +
      ` Injected ${chalk.bold(label)} into ${chalk.bold(pane)}`,
  );
  // Observability: injecting a task file/prompt into a pane is state-mutating.
  recordRun({
    command: "inject",
    args: [pane, label],
    durationMs: Date.now() - start,
    outcome: "ok",
  });
}
