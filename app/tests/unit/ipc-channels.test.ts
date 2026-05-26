import { describe, it, expect } from "vitest";
import { IPC } from "../../src/shared/types";

describe("IPC Channel Registry", () => {
  it("has all grid channels", () => {
    expect(IPC.GRID_CREATE).toBe("grid:create");
    expect(IPC.GRID_GET).toBe("grid:get");
    expect(IPC.GRID_SAVE).toBe("grid:save");
    expect(IPC.GRID_RESTORE).toBe("grid:restore");
    expect(IPC.GRID_EQUALIZE).toBe("grid:equalize");
  });

  it("has all pane channels", () => {
    expect(IPC.PANE_ADD).toBe("pane:add");
    expect(IPC.PANE_REMOVE).toBe("pane:remove");
    expect(IPC.PANE_RENAME).toBe("pane:rename");
    expect(IPC.PANE_STATUS).toBe("pane:status");
    expect(IPC.PANE_SWAP).toBe("pane:swap");
    expect(IPC.PANE_FOCUS).toBe("pane:focus");
    expect(IPC.PANE_BROADCAST).toBe("pane:broadcast");
    expect(IPC.PANE_BROADCAST_SUBSET).toBe("pane:broadcastSubset");
    expect(IPC.PANE_RESTART).toBe("pane:restart");
    expect(IPC.PANE_SET_MODEL).toBe("pane:setModel");
    expect(IPC.PANE_SET_EFFORT).toBe("pane:setEffort");
  });

  it("has all terminal channels", () => {
    expect(IPC.TERMINAL_DATA).toBe("terminal:data");
    expect(IPC.TERMINAL_INPUT).toBe("terminal:input");
    expect(IPC.TERMINAL_RESIZE).toBe("terminal:resize");
    expect(IPC.TERMINAL_SPAWN).toBe("terminal:spawn");
    expect(IPC.TERMINAL_KILL).toBe("terminal:kill");
    expect(IPC.TERMINAL_INJECT_FILE).toBe("terminal:injectFile");
    expect(IPC.TERMINAL_AUTO_APPROVE).toBe("terminal:autoApprove");
  });

  it("has all preset channels", () => {
    expect(IPC.PRESET_LIST).toBe("preset:list");
    expect(IPC.PRESET_SAVE).toBe("preset:save");
    expect(IPC.PRESET_LOAD).toBe("preset:load");
    expect(IPC.PRESET_DELETE).toBe("preset:delete");
    expect(IPC.PRESET_EXPORT).toBe("preset:export");
    expect(IPC.PRESET_IMPORT).toBe("preset:import");
  });

  it("has session channels", () => {
    expect(IPC.SESSION_SAVE).toBe("session:save");
    expect(IPC.SESSION_RESTORE).toBe("session:restore");
  });

  it("has task channels", () => {
    expect(IPC.TASK_LIST).toBe("task:list");
    expect(IPC.TASK_CREATE).toBe("task:create");
    expect(IPC.TASK_UPDATE).toBe("task:update");
    expect(IPC.TASK_DELETE).toBe("task:delete");
  });

  it("has message channels", () => {
    expect(IPC.MSG_SEND).toBe("msg:send");
    expect(IPC.MSG_LIST).toBe("msg:list");
  });

  it("has CEO log channels", () => {
    expect(IPC.CEO_LOG_ENTRY).toBe("ceo:log:entry");
    expect(IPC.CEO_LOG_GET).toBe("ceo:log:get");
  });

  it("has app channels", () => {
    expect(IPC.APP_GET_INFO).toBe("app:getInfo");
    expect(IPC.APP_COMMAND_PALETTE).toBe("app:commandPalette");
  });

  it("has no duplicate channel values", () => {
    const values = Object.values(IPC);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("all channels are non-empty strings", () => {
    for (const [key, value] of Object.entries(IPC)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
      expect(value).toContain(":");
    }
  });
});
