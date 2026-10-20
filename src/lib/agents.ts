import { execSync } from "node:child_process";
import { KNOWN_AGENTS, AGENT_INSTALL_COMMANDS, AGENT_INSTALL_PAGES } from "./constants.js";

export function checkAgentInstalled(agent: string): boolean {
  try {
    execSync(`which ${agent}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function getAgentVersion(agent: string): string {
  try {
    return execSync(`${agent} --version 2>/dev/null`, {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")[0]!;
  } catch {
    return "installed";
  }
}

export function getAgentInstallCmd(agent: string): string {
  return AGENT_INSTALL_COMMANDS[agent] ?? "";
}

export function getAgentInstallPage(agent: string): string {
  return AGENT_INSTALL_PAGES[agent] ?? "";
}

/** How to install an agent, for display: the command, or the vendor's page. */
export function getAgentInstallHint(agent: string): string {
  const cmd = getAgentInstallCmd(agent);
  if (cmd) return cmd;
  const page = getAgentInstallPage(agent);
  return page ? `install from ${page}` : "";
}

export function installAgent(agent: string): boolean {
  const cmd = getAgentInstallCmd(agent);
  if (!cmd) {
    const page = getAgentInstallPage(agent);
    if (page) console.log(`[agentgrid] No verified package for ${agent}. Install it from ${page}`);
    return false;
  }
  try {
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

export function listKnownAgents(): Array<{
  name: string;
  installed: boolean;
  version?: string;
}> {
  return KNOWN_AGENTS.map((name) => {
    const installed = checkAgentInstalled(name);
    return {
      name,
      installed,
      version: installed ? getAgentVersion(name) : undefined,
    };
  });
}
