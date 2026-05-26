import { describe, it, expect } from "vitest";
import { normalizeAgentName } from "../lib/tmux.js";

describe("normalizeAgentName", () => {
  it("detects Claude from version string", () => {
    expect(normalizeAgentName("2.1.76")).toBe("claude");
    expect(normalizeAgentName("1.0.0")).toBe("claude");
    expect(normalizeAgentName("10.2.3")).toBe("claude");
  });

  it("maps shell processes", () => {
    expect(normalizeAgentName("bash")).toBe("shell");
    expect(normalizeAgentName("zsh")).toBe("shell");
    expect(normalizeAgentName("fish")).toBe("shell");
    expect(normalizeAgentName("sh")).toBe("shell");
    expect(normalizeAgentName("dash")).toBe("shell");
  });

  it("maps node to agent (ambiguous)", () => {
    expect(normalizeAgentName("node")).toBe("agent");
  });

  it("maps python to aider", () => {
    expect(normalizeAgentName("python3")).toBe("aider");
    expect(normalizeAgentName("python")).toBe("aider");
  });

  it("detects agent prefixes", () => {
    expect(normalizeAgentName("codex")).toBe("codex");
    expect(normalizeAgentName("codex-cli")).toBe("codex");
    expect(normalizeAgentName("gemini")).toBe("gemini");
    expect(normalizeAgentName("gemini-cli")).toBe("gemini");
    expect(normalizeAgentName("aider")).toBe("aider");
    expect(normalizeAgentName("goose")).toBe("goose");
    expect(normalizeAgentName("opencode")).toBe("opencode");
    expect(normalizeAgentName("hermes")).toBe("hermes");
    expect(normalizeAgentName("cline")).toBe("cline");
    expect(normalizeAgentName("copilot")).toBe("copilot");
  });

  it("returns unknown names as-is", () => {
    expect(normalizeAgentName("custom-agent")).toBe("custom-agent");
    expect(normalizeAgentName("vim")).toBe("vim");
  });
});
