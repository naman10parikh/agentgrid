import { homedir } from "node:os";
import { join } from "node:path";

export const VERSION = "2.0.0";

export const CONFIG_DIR = join(homedir(), ".agentgrid");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");
export const SOUNDS_DIR = join(CONFIG_DIR, "sounds");
export const PRESETS_DIR = join(CONFIG_DIR, "presets");
export const SESSIONS_DIR = join(CONFIG_DIR, "sessions");
export const SESSION_NAME = process.env["AGENTGRID_SESSION"] ?? "agentgrid";

export const KNOWN_AGENTS = [
  "claude",
  "codex",
  "gemini",
  "aider",
  "opencode",
  "goose",
  "cline",
  "hermes",
  "copilot",
  "cursor",
] as const;

export type AgentName = (typeof KNOWN_AGENTS)[number];

/** Only packages checked against their registry; install-allowlist.json gives each one's source. */
export const AGENT_INSTALL_COMMANDS: Record<string, string> = {
  claude: "npm install -g @anthropic-ai/claude-code",
  codex: "npm install -g @openai/codex",
  gemini: "npm install -g @google/gemini-cli",
  aider: "pip install aider-chat",
  opencode: "npm install -g opencode-ai",
  goose: "brew install block-goose-cli",
  cline: "npm install -g cline",
  copilot: "npm install -g @github/copilot",
};

/** Agents with no package we could verify: agentgrid shows the vendor's own install page and runs nothing. */
export const AGENT_INSTALL_PAGES: Record<string, string> = {
  hermes: "https://github.com/NousResearch/hermes-agent",
  cursor: "https://cursor.com/docs/cli/installation",
};
