import { describe, it, expect } from "vitest";
import {
  VERSION,
  CONFIG_DIR,
  CONFIG_FILE,
  SOUNDS_DIR,
  PRESETS_DIR,
  SESSIONS_DIR,
  SESSION_NAME,
  KNOWN_AGENTS,
  AGENT_INSTALL_COMMANDS,
} from "../lib/constants.js";

describe("constants", () => {
  it("exports VERSION as semver string", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("exports config paths under ~/.agentgrid", () => {
    expect(CONFIG_DIR).toContain(".agentgrid");
    expect(CONFIG_FILE).toContain("config.json");
    expect(SOUNDS_DIR).toContain("sounds");
    expect(PRESETS_DIR).toContain("presets");
    expect(SESSIONS_DIR).toContain("sessions");
  });

  it("exports SESSION_NAME with default", () => {
    expect(typeof SESSION_NAME).toBe("string");
    expect(SESSION_NAME.length).toBeGreaterThan(0);
  });

  it("exports 10 known agents", () => {
    expect(KNOWN_AGENTS).toHaveLength(10);
    expect(KNOWN_AGENTS).toContain("claude");
    expect(KNOWN_AGENTS).toContain("codex");
    expect(KNOWN_AGENTS).toContain("gemini");
    expect(KNOWN_AGENTS).toContain("aider");
  });

  it("has install commands for all known agents", () => {
    for (const agent of KNOWN_AGENTS) {
      expect(AGENT_INSTALL_COMMANDS[agent]).toBeTruthy();
    }
  });

  it("claude install command uses npm", () => {
    expect(AGENT_INSTALL_COMMANDS["claude"]).toContain("npm install");
    expect(AGENT_INSTALL_COMMANDS["claude"]).toContain("claude-code");
  });
});
