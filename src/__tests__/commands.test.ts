import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock tmux module to prevent actual tmux calls
vi.mock("../lib/tmux.js", () => ({
  ensureTmux: vi.fn(),
  ensureInsideTmux: vi.fn(),
  isInsideTmux: vi.fn(() => true),
  isTmuxAvailable: vi.fn(() => true),
  getCurrentWindowId: vi.fn(() => "@0"),
  getSessionName: vi.fn(() => "test"),
  listPanes: vi.fn(() => [
    {
      paneId: "%1",
      paneIndex: 1,
      label: "Agent 1",
      command: "2.1.0",
      directory: "/home/test",
      status: "running",
      panePid: 1234,
    },
    {
      paneId: "%2",
      paneIndex: 2,
      label: "Agent 2",
      command: "zsh",
      directory: "/home/test",
      status: "idle",
      panePid: 5678,
    },
  ]),
  listAllPanes: vi.fn(() => [
    {
      paneId: "test:0.1",
      paneIndex: 1,
      label: "Agent 1",
      command: "2.1.0",
      directory: "/home/test",
      status: "running",
      panePid: 1234,
    },
  ]),
  getPaneCount: vi.fn(() => 2),
  sendKeys: vi.fn(),
  setPaneOption: vi.fn(),
  splitWindow: vi.fn(),
  selectLayout: vi.fn(),
  selectPane: vi.fn(),
  capturePaneOutput: vi.fn(() => "$ some output\nprompt>"),
  normalizeAgentName: vi.fn((raw: string) => {
    if (/^\d+\.\d+/.test(raw)) return "claude";
    if (["bash", "zsh", "fish", "sh"].includes(raw)) return "shell";
    return raw;
  }),
  tmuxRun: vi.fn(() => ""),
  tmuxRunRaw: vi.fn(() => ""),
}));

// Mock sound
vi.mock("../lib/sound.js", () => ({
  playSound: vi.fn(),
  setSoundFile: vi.fn(),
  disableAllSounds: vi.fn(),
  getSoundConfig: vi.fn(() => ({
    done: "/System/Library/Sounds/Glass.aiff",
    waiting: "/System/Library/Sounds/Tink.aiff",
    subagent: "/System/Library/Sounds/Purr.aiff",
  })),
}));

// Mock agents
vi.mock("../lib/agents.js", () => ({
  checkAgentInstalled: vi.fn(() => true),
  installAgent: vi.fn(() => true),
  getAgentInstallCmd: vi.fn(() => "npm install -g test"),
  getAgentVersion: vi.fn(() => "1.0.0"),
  listKnownAgents: vi.fn(() => [
    { name: "claude", installed: true, version: "2.1.0" },
    { name: "codex", installed: false },
  ]),
}));

import { cmdStatus } from "../commands/status.js";
import { cmdDashboard } from "../commands/dashboard.js";
import { cmdSend, cmdRead } from "../commands/send.js";
import { cmdSound } from "../commands/sound.js";
import { cmdAgents } from "../commands/agents.js";
import { sendKeys, capturePaneOutput } from "../lib/tmux.js";

describe("cmdStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("outputs status in text mode without error", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdStatus({ json: false });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("outputs status in JSON mode", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdStatus({ json: true });
    const lastCall = log.mock.calls[0]?.[0];
    expect(() => JSON.parse(lastCall)).not.toThrow();
    const parsed = JSON.parse(lastCall);
    expect(parsed).toHaveProperty("panes");
    expect(Array.isArray(parsed.panes)).toBe(true);
    log.mockRestore();
  });
});

describe("cmdSend", () => {
  it("sends keys to target pane", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdSend("%1", "Hello world");
    expect(sendKeys).toHaveBeenCalledWith("%1", "Hello world", true);
    log.mockRestore();
  });
});

describe("cmdRead", () => {
  it("captures and displays pane output", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdRead("%1");
    expect(capturePaneOutput).toHaveBeenCalledWith("%1");
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe("cmdSound", () => {
  it("displays sound config when called without args", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdSound();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe("cmdAgents", () => {
  it("lists agents without error", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdAgents();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
