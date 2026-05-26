import { describe, it, expect, vi } from "vitest";
import { execSync } from "node:child_process";

// Mock execSync to avoid actually checking installed agents
vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn(),
}));

import {
  checkAgentInstalled,
  getAgentInstallCmd,
  getAgentVersion,
} from "../lib/agents.js";

describe("agents", () => {
  it("checkAgentInstalled returns true when command exists", () => {
    vi.mocked(execSync).mockReturnValueOnce(Buffer.from("/usr/bin/claude"));
    expect(checkAgentInstalled("claude")).toBe(true);
  });

  it("checkAgentInstalled returns false when command not found", () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      throw new Error("not found");
    });
    expect(checkAgentInstalled("nonexistent")).toBe(false);
  });

  it("getAgentInstallCmd returns install command for known agents", () => {
    expect(getAgentInstallCmd("claude")).toContain("npm install");
    expect(getAgentInstallCmd("aider")).toContain("pip install");
    expect(getAgentInstallCmd("goose")).toContain("brew install");
  });

  it("getAgentInstallCmd returns empty for unknown agents", () => {
    expect(getAgentInstallCmd("unknown-agent")).toBe("");
  });

  it("getAgentVersion returns version string", () => {
    vi.mocked(execSync).mockReturnValueOnce("2.1.0\n" as unknown as Buffer);
    expect(getAgentVersion("claude")).toBe("2.1.0");
  });

  it("getAgentVersion returns 'installed' on error", () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      throw new Error("no version");
    });
    expect(getAgentVersion("broken-agent")).toBe("installed");
  });
});
