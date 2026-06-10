#!/usr/bin/env node

import { Command } from "commander";
import { VERSION } from "./lib/constants.js";
import { cmdGrid } from "./commands/grid.js";
import { cmdStatus } from "./commands/status.js";
import { cmdBroadcast } from "./commands/broadcast.js";
import {
  cmdName,
  cmdEqualize,
  cmdSwap,
  cmdAdd,
  cmdKill,
} from "./commands/panes.js";
import { cmdDashboard } from "./commands/dashboard.js";
import { cmdAgents, cmdInstall } from "./commands/agents.js";
import { cmdSound } from "./commands/sound.js";
import { cmdPreset } from "./commands/presets.js";
import { cmdSave, cmdRestore } from "./commands/sessions.js";
import { cmdSend, cmdRead, cmdInject } from "./commands/send.js";
import { cmdMonitor, cmdLogs } from "./commands/monitor.js";
import { cmdHarness } from "./commands/harness.js";
import { cmdInit } from "./commands/init.js";
import { cmdHarnessGen } from "./commands/harness-gen.js";
import { cmdMemorySearch } from "./commands/memory.js";
import { cmdSandboxRun } from "./commands/sandbox.js";
import { readRuns } from "./lib/run-log.js";
import {
  cmdStart,
  cmdDetach,
  cmdTips,
  cmdUpdate,
  cmdVersion,
  cmdTerminalSetup,
  cmdHelp,
} from "./commands/misc.js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PRESETS_DIR } from "./lib/constants.js";

const program = new Command();

program
  .name("agentgrid")
  .description("Spawn a grid of AI coding agents in one command")
  .version(VERSION);

// ─── Grid creation (NxM pattern) ───
program
  .command("grid <size> [agent]")
  .description("Create a grid (e.g. 2x3 claude)")
  .option("--model <model>", "Model for Claude (default: claude-opus-4-6)")
  .option("--effort <level>", "Effort level (default: max)")
  .option("--tool <agent>", "Agent binary to use")
  .action((size: string, agent: string | undefined, opts) => {
    const tool = opts.tool ?? agent;
    cmdGrid(size, tool, { model: opts.model, effort: opts.effort });
  });

// ─── Start ───
program
  .command("start [session]")
  .description("Start or attach to tmux session")
  .action((session?: string) => cmdStart(session));

// ─── Setup wizard ───
program
  .command("setup")
  .description("Visual wizard with grid preview")
  .action(() => {
    // Setup is interactive — delegate to bash for now
    // The interactive TUI wizard requires readline which we can add later
    console.log(
      "Use: agentgrid 2x3 claude (or the bash version for interactive setup)",
    );
  });

// ─── Launch preset ───
program
  .command("launch [name]")
  .description("Launch a saved preset")
  .action((name?: string) => {
    if (!name) {
      cmdPreset("list");
      return;
    }
    // Load preset and create grid from it
    const file = join(PRESETS_DIR, `${name}.json`);
    if (!existsSync(file)) {
      console.error(`Preset '${name}' not found.`);
      cmdPreset("list");
      process.exit(1);
    }
    const preset = JSON.parse(readFileSync(file, "utf-8"));
    const total = preset.panes?.length ?? 0;
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    cmdGrid(`${rows}x${cols}`, preset.panes?.[0]?.agent);
  });

// ─── Presets ───
const presetCmd = program.command("preset").description("Manage presets");
presetCmd.command("list").action(() => cmdPreset("list"));
presetCmd
  .command("show <name>")
  .action((name: string) => cmdPreset("show", name));
presetCmd
  .command("delete <name>")
  .action((name: string) => cmdPreset("delete", name));

// ─── Sessions ───
program
  .command("save [name]")
  .description("Save grid layout and state")
  .action((name?: string) => cmdSave(name));

program
  .command("restore [name]")
  .description("Restore a saved grid")
  .option("--no-start", "Restore layout only, don't start agents")
  .action((name: string | undefined, opts) =>
    cmdRestore(name, { noStart: opts.noStart ?? false }),
  );

// ─── Status ───
program
  .command("status")
  .description("Show all pane statuses")
  .option("--json", "Output as JSON")
  .action((opts) => cmdStatus({ json: opts.json }));

// ─── Dashboard ───
program
  .command("dashboard [mode]")
  .alias("dash")
  .description("Live dashboard (auto-refreshing table)")
  .action((mode?: string) => cmdDashboard(mode));

// ─── Broadcast ───
program
  .command("broadcast <text...>")
  .description("Send message to all panes")
  .action((text: string[]) => cmdBroadcast(text.join(" ")));

// ─── Per-pane messaging (NEW) ───
program
  .command("send <pane> <message...>")
  .description("Send message to specific pane")
  .action((pane: string, message: string[]) =>
    cmdSend(pane, message.join(" ")),
  );

program
  .command("read <pane>")
  .description("Capture output from a specific pane")
  .option("-n, --lines <n>", "Number of lines to show", parseInt)
  .action((pane: string, opts) => cmdRead(pane, { lines: opts.lines }));

program
  .command("inject <pane>")
  .description("Inject file or message into a specific pane")
  .option("--file <path>", "File to inject as prompt")
  .option("--message <text>", "Message text to inject")
  .action((pane: string, opts) =>
    cmdInject(pane, { file: opts.file, message: opts.message }),
  );

// ─── Monitoring (NEW) ───
program
  .command("monitor")
  .description("Live monitor with pane output")
  .option("-i, --interval <seconds>", "Refresh interval in seconds", parseInt)
  .action((opts) => cmdMonitor({ interval: opts.interval }));

program
  .command("logs <pane>")
  .description("Show recent pane output")
  .option("-n, --lines <n>", "Number of lines to show", parseInt)
  .action((pane: string, opts) => cmdLogs(pane, { lines: opts.lines }));

// ─── Harness (NEW) ───
const harnessCmd = program
  .command("harness")
  .description("Manage harness configurations");
harnessCmd.command("list").action(() => cmdHarness("list"));
harnessCmd
  .command("save <name>")
  .action((name: string) => cmdHarness("save", name));
harnessCmd
  .command("load <name>")
  .action((name: string) => cmdHarness("load", name));
harnessCmd
  .command("show <name>")
  .action((name: string) => cmdHarness("show", name));

// ─── Pane management ───
program
  .command("name <name>")
  .description("Name the current pane")
  .action((name: string) => cmdName(name));

program
  .command("equalize")
  .description("Even out pane sizes")
  .action(() => cmdEqualize());

program
  .command("swap [direction]")
  .description("Swap pane position (up/down)")
  .action((direction?: string) => cmdSwap(direction ?? ""));

program
  .command("add [direction] [agent]")
  .description("Add a pane to the grid")
  .action((direction?: string, agent?: string) => cmdAdd(direction, agent));

program
  .command("kill")
  .description("Clear grid to 1 pane")
  .action(() => cmdKill());

// ─── Agents ───
program
  .command("agents")
  .description("Detect installed agents")
  .action(() => cmdAgents());

program
  .command("install [agent]")
  .description("Install an agent")
  .action((agent?: string) => cmdInstall(agent ?? ""));

program
  .command("install-all")
  .description("Install all missing agents")
  .action(() => cmdInstall("all"));

// ─── Sound ───
program
  .command("sound [event] [file]")
  .description("Manage notification sounds")
  .action((event?: string, file?: string) => cmdSound(event, file));

// ─── Setup ───
program
  .command("terminal-setup")
  .alias("ts")
  .description("Configure all Claude panes")
  .action(() => cmdTerminalSetup());

program
  .command("tips")
  .description("Usage tips")
  .action(() => cmdTips());
program
  .command("update")
  .description("Check for updates")
  .action(() => cmdUpdate());
program
  .command("detach")
  .alias("exit")
  .description("Detach from tmux")
  .action(() => cmdDetach());

// ─── Init ───
program
  .command("init")
  .description("Initialize AgentGrid in the current project")
  .option("--force", "Overwrite existing config")
  .action((opts: { force?: boolean }) => cmdInit(opts));

// ─── Harness Generator ───
program
  .command("generate <name>")
  .alias("gen")
  .description("Generate a harness from a template")
  .option(
    "-t, --template <template>",
    "Template: solo, pair, squad, company, swarm",
    "squad",
  )
  .option("-a, --agent <agent>", "Default agent CLI tool", "claude")
  .action((name: string, opts: { template?: string; agent?: string }) =>
    cmdHarnessGen(name, opts),
  );

// ─── Memory search (BM25 over the agentgrid corpus) ───
program
  .command("memory-search <query...>")
  .alias("mem")
  .description("Search agentgrid's own docs/brain/memory corpus (BM25 ranked)")
  .option("-n, --limit <n>", "Max results to return", parseInt)
  .action((query: string[], opts) =>
    cmdMemorySearch(query.join(" "), { limit: opts.limit }),
  );

// ─── Observability (read the append-only run-log audit trail) ───
program
  .command("runs")
  .description("Show recent state-mutating actions from the run-log audit trail")
  .option("-n, --limit <n>", "Number of entries to show", parseInt)
  .action((opts) => {
    const entries = readRuns(opts.limit ?? 20);
    if (entries.length === 0) {
      console.log("(no runs recorded yet — logs/runs.jsonl is empty)");
      return;
    }
    for (const e of entries) {
      const mark = e.outcome === "ok" ? "✅" : "❌";
      const note = e.note ? ` — ${e.note}` : e.error ? ` — ${e.error}` : "";
      console.log(
        `${mark} ${e.ts}  ${e.command} ${e.args.join(" ")} (${e.durationMs}ms)${note}`,
      );
    }
  });

// ─── Sandbox (run the core action inside an isolated E2B microVM) ───
program
  .command("sandbox-run [command...]")
  .description("Run a command inside an isolated E2B sandbox (untrusted-code escape hatch)")
  .action(async (command?: string[]) => {
    await cmdSandboxRun(command?.join(" "));
  });

// ─── MCP Server ───
program
  .command("mcp-serve")
  .alias("mcp")
  .description(
    "Start MCP server (stdio transport) — for Claude Code integration",
  )
  .action(async () => {
    // Dynamic import to avoid loading MCP server code for normal CLI usage
    await import("./mcp-server.js");
  });

// ─── Handle NxM pattern as first argument ───
const args = process.argv.slice(2);
if (args[0] && /^\d+x\d+$/.test(args[0])) {
  const size = args[0];
  const rest = args.slice(1);
  // Parse --model and --effort flags from remaining args
  let agent: string | undefined;
  let model: string | undefined;
  let effort: string | undefined;

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--model" && rest[i + 1]) {
      model = rest[++i];
    } else if (rest[i] === "--effort" && rest[i + 1]) {
      effort = rest[++i];
    } else if (rest[i] === "--tool" && rest[i + 1]) {
      agent = rest[++i];
    } else if (!rest[i]!.startsWith("-")) {
      agent = rest[i];
    }
  }

  cmdGrid(size, agent, { model, effort });
} else {
  program.parse(process.argv);
}
