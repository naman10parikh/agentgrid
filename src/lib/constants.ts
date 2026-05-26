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

export const AGENT_INSTALL_COMMANDS: Record<string, string> = {
  claude: "npm install -g @anthropic-ai/claude-code",
  codex: "npm install -g @openai/codex",
  gemini: "npm install -g @google/gemini-cli",
  aider: "pip install aider-chat",
  opencode: "npm install -g opencode",
  goose: "brew install goose",
  cline: "npm install -g @anthropic-ai/cline",
  hermes: "npm install -g hermes-cli",
  copilot: "npm install -g @github/copilot",
  cursor: "brew install --cask cursor",
};
