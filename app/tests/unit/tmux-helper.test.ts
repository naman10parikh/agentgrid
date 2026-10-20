import { describe, it, expect, vi, beforeEach } from "vitest";
import { homedir } from "node:os";

const execFileSync = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", async () => {
  const actual = await vi.importActual<typeof import("node:child_process")>("node:child_process");
  return { ...actual, execFileSync };
});

import { SESSION_DIR, SOCKET_NAME, tmuxExec } from "../../src/main/tmux-helper";

beforeEach(() => {
  execFileSync.mockReset();
});

describe("tmux helper", () => {
  it("runs the unit tests on their own tmux server and session folder, never the app's live ones", () => {
    expect(SOCKET_NAME).not.toBe("agentgrid");
    expect(SESSION_DIR.startsWith(homedir())).toBe(false);
  });

  it("tries again when a command reaches a server that is still exiting", () => {
    execFileSync
      .mockImplementationOnce(() => {
        throw new Error("Command failed: tmux new-session\nserver exited unexpectedly\n");
      })
      .mockImplementationOnce(() => "ok\n");
    expect(tmuxExec("new-session", "-d")).toBe("ok");
    expect(execFileSync).toHaveBeenCalledTimes(2);
  });

  it("does not retry any other error", () => {
    execFileSync.mockImplementation(() => {
      throw new Error("Command failed: tmux has-session\ncan't find session: ag-x\n");
    });
    expect(() => tmuxExec("has-session", "-t", "ag-x")).toThrow("can't find session");
    expect(execFileSync).toHaveBeenCalledTimes(1);
  });

  it("gives up after three tries", () => {
    execFileSync.mockImplementation(() => {
      throw new Error("server exited unexpectedly");
    });
    expect(() => tmuxExec("list-sessions")).toThrow("server exited unexpectedly");
    expect(execFileSync).toHaveBeenCalledTimes(3);
  });
});
