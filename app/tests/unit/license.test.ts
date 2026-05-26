import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { rmSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEST_HOME = join(tmpdir(), `agentgrid-license-${Date.now()}`);

vi.mock("os", async () => {
  const actual = await vi.importActual<typeof import("os")>("os");
  return { ...actual, homedir: () => TEST_HOME };
});

describe("LicenseManager", () => {
  beforeEach(() => {
    mkdirSync(TEST_HOME, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_HOME, { recursive: true, force: true });
    vi.resetModules();
  });

  it("defaults to free tier", async () => {
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    expect(lm.getTier()).toBe("free");
    expect(lm.isProOrAbove()).toBe(false);
  });

  it("starts a trial", async () => {
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    expect(lm.startTrial()).toBe(true);
    expect(lm.getTier()).toBe("pro");
    expect(lm.isTrialActive()).toBe(true);
    expect(lm.getTrialDaysRemaining()).toBeLessThanOrEqual(14);
    expect(lm.getTrialDaysRemaining()).toBeGreaterThan(0);
  });

  it("prevents double trial", async () => {
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    expect(lm.startTrial()).toBe(true);
    expect(lm.startTrial()).toBe(false);
  });

  it("activates with valid key", async () => {
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    expect(lm.activate("AGRID-ABCD-1234-WXYZ", "test@test.com")).toBe(true);
    expect(lm.getTier()).toBe("pro");
    expect(lm.isProOrAbove()).toBe(true);
  });

  it("rejects invalid key format", async () => {
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    expect(lm.activate("bad-key", "test@test.com")).toBe(false);
    expect(lm.getTier()).toBe("free");
  });

  it("detects team tier from key prefix", async () => {
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    lm.activate("AGRID-TEAM-1234-WXYZ", "team@test.com");
    expect(lm.getTier()).toBe("team");
  });

  it("deactivates license", async () => {
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    lm.activate("AGRID-ABCD-1234-WXYZ", "test@test.com");
    expect(lm.isProOrAbove()).toBe(true);
    lm.deactivate();
    expect(lm.getTier()).toBe("free");
  });

  it("getInfo returns correct structure", async () => {
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    const info = lm.getInfo();
    expect(info).toHaveProperty("tier");
    expect(info).toHaveProperty("email");
    expect(info).toHaveProperty("trialDaysRemaining");
    expect(info).toHaveProperty("isActive");
  });
});

describe("License edge cases", () => {
  it("getInfo on fresh install", async () => {
    vi.resetModules();
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    const info = lm.getInfo();
    expect(info.tier).toBe("free");
    expect(info.isActive).toBe(false);
    expect(info.trialDaysRemaining).toBe(14);
  });

  it("activate then deactivate then reactivate", async () => {
    vi.resetModules();
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    lm.activate("AGRID-AAAA-BBBB-CCCC", "a@b.com");
    expect(lm.getTier()).toBe("pro");
    lm.deactivate();
    expect(lm.getTier()).toBe("free");
    lm.activate("AGRID-TEAM-DDDD-EEEE", "c@d.com");
    expect(lm.getTier()).toBe("team");
  });

  it("key with lowercase is rejected", async () => {
    vi.resetModules();
    const { LicenseManager } = await import("../../src/main/license");
    const lm = new LicenseManager();
    expect(lm.activate("AGRID-abcd-1234-wxyz", "t@t.com")).toBe(false);
  });
});
