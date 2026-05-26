/**
 * Settings persistence tests
 * Tests loadSettings round-trip with electron-store IPC mock
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock window.api.settings IPC
let mockStore: Record<string, unknown> = {};

const mockSettingsApi = {
  getAll: vi.fn(async () => ({ ...mockStore })),
  set: vi.fn(async (key: string, value: unknown) => {
    mockStore[key] = value;
  }),
};

Object.defineProperty(globalThis, "window", {
  value: {
    api: {
      settings: mockSettingsApi,
    },
  },
  writable: true,
});

describe("Settings", () => {
  beforeEach(() => {
    mockStore = {};
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns defaults when no settings stored", async () => {
    const { loadSettings } = await import("../../src/renderer/src/components/Settings");
    const settings = await loadSettings();
    expect(settings.defaultAgent).toBe("claude");
    expect(settings.defaultModel).toBe("claude-opus-4-6");
    expect(settings.defaultEffort).toBe("max");
    expect(settings.theme).toBe("dark");
    expect(settings.apiKeys).toEqual({});
  });

  it("round-trips settings through electron-store", async () => {
    mockStore = {
      defaultAgent: "codex",
      defaultModel: "gpt-5.3",
      defaultEffort: "high",
      theme: "light",
    };

    const { loadSettings } = await import("../../src/renderer/src/components/Settings");
    const loaded = await loadSettings();
    expect(loaded.defaultAgent).toBe("codex");
    expect(loaded.defaultModel).toBe("gpt-5.3");
    expect(loaded.defaultEffort).toBe("high");
    expect(loaded.theme).toBe("light");
  });

  it("handles IPC failure gracefully", async () => {
    mockSettingsApi.getAll.mockRejectedValueOnce(new Error("IPC not ready"));
    const { loadSettings } = await import("../../src/renderer/src/components/Settings");
    const settings = await loadSettings();
    // Should not throw, returns defaults
    expect(settings.defaultAgent).toBe("claude");
  });

  it("merges partial stored settings with defaults", async () => {
    mockStore = { defaultEffort: "low" };
    const { loadSettings } = await import("../../src/renderer/src/components/Settings");
    const settings = await loadSettings();
    expect(settings.defaultEffort).toBe("low");
    // Other fields should be defaults
    expect(settings.defaultAgent).toBe("claude");
    expect(settings.defaultModel).toBe("claude-opus-4-6");
    expect(settings.theme).toBe("dark");
  });

  it("preserves apiKeys as empty object by default", async () => {
    const { loadSettings } = await import("../../src/renderer/src/components/Settings");
    const settings = await loadSettings();
    expect(settings.apiKeys).toBeDefined();
    expect(typeof settings.apiKeys).toBe("object");
  });
});
