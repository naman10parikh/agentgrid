import chalk from "chalk";
import { execSync } from "node:child_process";
import {
  ensureTmux,
  isInsideTmux,
  getSessionName,
  tmuxRunRaw,
} from "../lib/tmux.js";
import { VERSION, SESSION_NAME } from "../lib/constants.js";

export function cmdStart(session?: string): void {
  ensureTmux();
  if (isInsideTmux()) {
    const name = getSessionName();
    console.log(
      chalk.magenta("[agentgrid]") +
        ` ${chalk.green("Ready")} — tmux session: ${chalk.bold(name)}`,
    );
    console.log("");
    console.log(`  ${chalk.cyan("agentgrid 2x3 claude")}      Quick grid`);
    console.log(`  ${chalk.cyan("agentgrid setup")}            Visual wizard`);
    console.log(`  ${chalk.cyan("agentgrid launch <name>")}    Launch preset`);
    console.log(`  ${chalk.cyan("agentgrid preset list")}      See presets`);
    console.log("");
    return;
  }

  const target = session ?? SESSION_NAME;
  try {
    execSync(`tmux has-session -t "${target}" 2>/dev/null`);
    console.log(
      chalk.magenta("[agentgrid]") + ` Attaching to: ${chalk.bold(target)}`,
    );
    execSync(`tmux attach-session -t "${target}"`, { stdio: "inherit" });
  } catch {
    console.log(
      chalk.magenta("[agentgrid]") + ` Creating: ${chalk.bold(target)}`,
    );
    execSync(`tmux new-session -s "${target}"`, { stdio: "inherit" });
  }
}

export function cmdDetach(): void {
  if (isInsideTmux()) {
    console.log(
      chalk.magenta("[agentgrid]") +
        " Detaching — grid keeps running in background",
    );
    console.log(
      chalk.magenta("[agentgrid]") +
        ` Reattach: ${chalk.cyan("agentgrid start")}`,
    );
    tmuxRunRaw("detach-client");
  } else {
    console.log(
      chalk.magenta("[agentgrid]") + " Not in tmux — nothing to detach from",
    );
  }
}

export function cmdTips(): void {
  console.log("");
  console.log(`  ${chalk.bold("⚡ agentgrid tips")}`);
  console.log("");
  console.log(`  ${chalk.bold("Multi-line input:")}`);
  console.log(
    `    Ghostty, iTerm2, Kitty, WezTerm: ${chalk.bold("Shift+Enter")} for new line`,
  );
  console.log(
    `    Any terminal: type ${chalk.bold("\\")} then Enter for new line`,
  );
  console.log(`    Claude Code: long-press Spacebar for voice input`);
  console.log("");
  console.log(`  ${chalk.bold("Trust folder prompt:")}`);
  console.log(`    First time in a new directory, Claude asks to trust it.`);
  console.log(`    Click ${chalk.bold("Yes")} on each pane.`);
  console.log(
    `    ${chalk.dim("Tip: cd into your project BEFORE running agentgrid")}`,
  );
  console.log("");
  console.log(`  ${chalk.bold("Voice input:")}`);
  console.log(`    Claude Code: long-press Spacebar`);
  console.log(`    macOS dictation: press Fn key twice`);
  console.log("");
  console.log(`  ${chalk.bold("Files & images:")}`);
  console.log(`    Drag & drop files into any pane`);
  console.log("");
  console.log(`  ${chalk.bold("Zoom:")}`);
  console.log(`    Option+Z = fullscreen one pane (press again to go back)`);
  console.log("");
}

export function cmdUpdate(): void {
  console.log(chalk.magenta("[agentgrid]") + " Checking for updates...");
  try {
    const raw = execSync(
      'curl -fsSL "https://raw.githubusercontent.com/naman10parikh/agentgrid/main/package.json" 2>/dev/null',
      { encoding: "utf-8" },
    );
    const remote = JSON.parse(raw);
    const latest = remote.version;

    if (latest === VERSION) {
      console.log(
        chalk.magenta("[agentgrid]") +
          ` ${chalk.green("Already on latest")} (v${VERSION})`,
      );
      return;
    }

    console.log(
      chalk.magenta("[agentgrid]") +
        ` Update available: ${chalk.bold(`v${VERSION} → v${latest}`)}`,
    );
    console.log(`  Run: ${chalk.cyan("npm update -g @namanparikh/agentgrid")}`);
  } catch {
    console.error(
      chalk.red("[agentgrid]") + " Couldn't check for updates (no internet?)",
    );
  }
}

export function cmdVersion(): void {
  console.log(`agentgrid v${VERSION}`);
}

export function cmdTerminalSetup(): void {
  if (!isInsideTmux()) {
    console.log(
      chalk.magenta("[agentgrid]") +
        ` ${chalk.yellow("Not in tmux")} — start first: ${chalk.cyan("agentgrid start")}`,
    );
    return;
  }

  // Send /terminal-setup to all Claude panes
  const raw = tmuxRunRaw("list-panes -F '#{pane_id}|#{pane_current_command}'");
  if (!raw) return;

  let count = 0;
  for (const line of raw.split("\n").filter(Boolean)) {
    const [paneId, cmd] = line.split("|");
    if (cmd && /^\d+\.\d+/.test(cmd)) {
      // Claude shows version as command
      tmuxRunRaw(`send-keys -t ${paneId} "/terminal-setup" Enter`);
      count++;
    }
  }

  if (count > 0) {
    console.log(
      chalk.magenta("[agentgrid]") +
        ` Sent ${chalk.cyan("/terminal-setup")} to ${chalk.bold(String(count))} Claude panes`,
    );
  } else {
    console.log(
      chalk.magenta("[agentgrid]") +
        ` ${chalk.yellow("No Claude panes found")}`,
    );
  }
}

export function cmdHelp(): void {
  console.log(`
  ${chalk.bold(`⚡ agentgrid v${VERSION}`)} — Spawn a grid of AI coding agents in one command

  ${chalk.bold("QUICK START")}
    agentgrid 2x3 claude               ${chalk.dim("Quick grid with one agent")}
    agentgrid setup                     ${chalk.dim("Visual wizard (grid preview, 4 steps)")}
    agentgrid launch dev-sprint         ${chalk.dim("Launch a saved preset")}

  ${chalk.bold("GRIDS")}
    agentgrid ROWSxCOLS [agent]         Create grid (e.g. 2x3 claude)
      --model <model>                   ${chalk.dim("Model for Claude (default: claude-opus-4-6)")}
      --effort <level>                  ${chalk.dim("Effort level (default: max)")}
      --tool <agent>                    ${chalk.dim("Agent binary to use")}
    agentgrid setup                     Visual wizard with grid preview

  ${chalk.bold("PRESETS")}
    agentgrid launch <name>             Launch a preset
    agentgrid preset list               Show presets
    agentgrid preset show <name>        View details
    agentgrid preset delete <name>      Delete

  ${chalk.bold("SESSION")}
    agentgrid save [name]               Save grid layout, names, commands + buffers
    agentgrid restore [name]            Restore grid and restart agents
    agentgrid restore [name] --no-start Restore layout only (no agents)

  ${chalk.bold("AGENTS")}
    agentgrid agents                    Detect installed agents
    agentgrid install <agent>           Install one
    agentgrid install-all               Install all missing

  ${chalk.bold("MESSAGING")}
    agentgrid send <pane> "msg"         ${chalk.dim("Send message to specific pane")}
    agentgrid read <pane>               ${chalk.dim("Capture pane output")}
    agentgrid inject <pane> --file <f>  ${chalk.dim("Inject file as prompt")}
    agentgrid broadcast <text>          Send to all panes

  ${chalk.bold("MONITORING")}
    agentgrid status                    All pane statuses (--json for scripts)
    agentgrid dashboard                 ${chalk.dim("Live dashboard (auto-refreshing table)")}
    agentgrid monitor                   ${chalk.dim("Live monitor with pane output")}
    agentgrid logs <pane>               ${chalk.dim("Show recent pane output")}

  ${chalk.bold("HARNESS")}
    agentgrid harness list              ${chalk.dim("Show saved harnesses")}
    agentgrid harness save <name>       ${chalk.dim("Save current harness config")}
    agentgrid harness load <name>       ${chalk.dim("Load a harness")}

  ${chalk.bold("CONTROL")}
    agentgrid add [right|down] [agent]  Add a pane to the grid
    agentgrid swap [up|down]            Swap current pane position

  ${chalk.bold("PANES")}
    agentgrid name <name>               Name pane (locked)
    agentgrid equalize                  Even sizes
    agentgrid kill                      Clear to 1 pane

  ${chalk.bold("SETUP")}
    agentgrid terminal-setup            Configure all Claude panes
    agentgrid tips                      Usage tips (voice, files, trust)
    agentgrid update                    Check for updates

  ${chalk.bold("SOUNDS")}
    agentgrid sound                     Current sounds
    agentgrid sound <event> <file>      Custom sound
    agentgrid sound test                Preview
    agentgrid sound off                 Disable

  ${chalk.bold("KEYBOARD & MOUSE")}
    ${chalk.dim("Navigate")}    Option+H/J/K/L · Option+Arrow · Click pane
    ${chalk.dim("Split")}       Ctrl+A |  right  ·  Ctrl+A -  down
    ${chalk.dim("Zoom")}        Ctrl+A z  (fullscreen one pane, toggle back)
    ${chalk.dim("Swap")}        Ctrl+A {  up  ·  Ctrl+A }  down
    ${chalk.dim("Layout")}      Ctrl+A Space  (cycle: tiled/horiz/vert/main)
    ${chalk.dim("Detach")}      Ctrl+A d  (grid keeps running)
`);
}
