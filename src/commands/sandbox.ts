/**
 * sandbox.ts — Run agentgrid's core action inside an isolated E2B microVM.
 *
 * agentgrid spawns arbitrary agent CLIs (claude, codex, aider, …) which then
 * execute model-generated code on the host. `sandbox-run` is the isolation
 * escape hatch: instead of running an agent command directly in a host tmux
 * pane, it boots a fresh E2B Firecracker microVM (~150ms cold start, isolated
 * filesystem + network) and runs the command there. This is the real
 * integration point for executing untrusted/agent-generated code safely.
 *
 * Pattern follows energy's `packages/runtime/src/sandbox/container-runner.ts`
 * and the sandforge `e2b-default` trust envelope. The boot is wired into the
 * run-log observability spine so every sandbox execution is auditable.
 *
 * Usage:
 *   agentgrid sandbox-run "node --version"
 *   agentgrid sandbox-run            # defaults to a harness self-check command
 */
import chalk from "chalk";
import { Sandbox } from "e2b";
import { recordRun } from "../lib/run-log.js";

/** Result of a single sandboxed command execution. */
export interface SandboxRunResult {
  sandboxId: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

/**
 * Boot an E2B sandbox, run `command` inside it, tear it down, and return the
 * result. Throws if E2B_API_KEY is missing or the SDK errors — callers (the CLI
 * wrapper) surface that to the user. Records one run-log entry per invocation.
 */
export async function runInSandbox(
  command: string,
  opts?: { template?: string; timeoutMs?: number },
): Promise<SandboxRunResult> {
  const apiKey = process.env["E2B_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "E2B_API_KEY is required for sandbox-run. Add it to your .env (see .env.example).",
    );
  }

  const start = Date.now();
  // Boot a fresh Firecracker microVM. `base` is E2B's maintained default image.
  const sandbox = await Sandbox.create(opts?.template ?? "base", {
    apiKey,
    timeoutMs: opts?.timeoutMs ?? 60_000,
    metadata: { tool: "agentgrid", action: "sandbox-run" },
  });

  try {
    const result = await sandbox.commands.run(command, { timeoutMs: 30_000 });
    const out: SandboxRunResult = {
      sandboxId: sandbox.sandboxId,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      durationMs: Date.now() - start,
    };
    recordRun({
      command: "sandbox-run",
      args: [command],
      durationMs: out.durationMs,
      outcome: out.exitCode === 0 ? "ok" : "error",
      note: `e2b ${sandbox.sandboxId} exit=${out.exitCode}`,
    });
    return out;
  } finally {
    // Always reclaim the microVM, even if the command threw.
    await sandbox.kill().catch(() => {
      /* best-effort teardown */
    });
  }
}

/** CLI handler for `agentgrid sandbox-run [command]`. */
export async function cmdSandboxRun(command?: string): Promise<void> {
  // Default action: prove the agent runtime works inside the isolated VM.
  const cmd = command?.trim() || "node --version && echo agentgrid-sandbox-ok";

  console.log(
    chalk.magenta("[agentgrid]") +
      ` Booting E2B sandbox to run: ${chalk.bold(cmd)}`,
  );

  try {
    const res = await runInSandbox(cmd);
    console.log(
      chalk.magenta("[agentgrid]") +
        ` ${chalk.green(`✅ sandbox ${res.sandboxId}`)} (exit ${res.exitCode}, ${res.durationMs}ms)`,
    );
    if (res.stdout.trim()) console.log(res.stdout.trimEnd());
    if (res.stderr.trim())
      console.error(chalk.yellow("stderr:"), res.stderr.trimEnd());
    if (res.exitCode !== 0) process.exit(res.exitCode);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    recordRun({
      command: "sandbox-run",
      args: [cmd],
      durationMs: 0,
      outcome: "error",
      error: msg,
    });
    console.error(chalk.red("[agentgrid]") + ` Sandbox run failed: ${msg}`);
    process.exit(1);
  }
}
