import chalk from "chalk";
import {
  listKnownAgents,
  checkAgentInstalled,
  installAgent,
  getAgentInstallCmd,
} from "../lib/agents.js";
import { KNOWN_AGENTS } from "../lib/constants.js";

export function cmdAgents(): void {
  console.log(`\n${chalk.bold("⚡ CLI Agents")}\n`);
  const agents = listKnownAgents();
  for (const a of agents) {
    if (a.installed) {
      console.log(
        `  ${chalk.green("●")} ${chalk.bold(a.name)} ${chalk.dim(a.version ?? "")}`,
      );
    } else {
      console.log(
        `  ${chalk.red("○")} ${a.name} ${chalk.dim(getAgentInstallCmd(a.name))}`,
      );
    }
  }
  console.log(`\n  ${chalk.cyan("agentgrid install <agent>")}   Install one`);
  console.log(
    `  ${chalk.cyan("agentgrid install-all")}       Install all missing`,
  );
  console.log(
    `  ${chalk.dim("Any command works as an agent — not limited to this list")}\n`,
  );
}

export function cmdInstall(agent: string): void {
  if (!agent) {
    cmdAgents();
    return;
  }

  if (agent === "all") {
    for (const a of KNOWN_AGENTS) {
      if (!checkAgentInstalled(a)) {
        console.log(chalk.magenta("[agentgrid]") + ` Installing ${a}...`);
        installAgent(a);
      }
    }
    console.log(chalk.magenta("[agentgrid]") + ` ${chalk.green("Done")}`);
    return;
  }

  if (checkAgentInstalled(agent)) {
    console.log(chalk.magenta("[agentgrid]") + ` ${agent} already installed`);
    return;
  }

  const cmd = getAgentInstallCmd(agent);
  if (!cmd) {
    console.error(
      chalk.red("[agentgrid]") +
        ` Unknown agent: ${chalk.bold(agent)}. Run ${chalk.cyan("agentgrid agents")} to see available agents.`,
    );
    process.exit(1);
  }

  console.log(
    chalk.magenta("[agentgrid]") + ` Installing ${chalk.bold(agent)}...`,
  );
  installAgent(agent);
  console.log(chalk.magenta("[agentgrid]") + ` ${chalk.green("✓ " + agent)}`);
}
