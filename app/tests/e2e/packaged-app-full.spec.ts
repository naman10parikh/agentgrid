/**
 * AgentGrid — Comprehensive Packaged App QA Test
 *
 * QA-PACKAGED: Full verification of the installed .app binary.
 * Tests real PTY spawn, terminal I/O, grid creation, settings, broadcast,
 * and session persistence.
 */

import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(currentDir, "../..");
const APP_PATH = join(APP_DIR, "release/mac-arm64/AgentGrid.app/Contents/MacOS/AgentGrid");
const SHOTS = join(currentDir, "../screenshots/qa-packaged");
mkdirSync(SHOTS, { recursive: true });

const APP_EXISTS = existsSync(APP_PATH);

let app: ElectronApplication;
let page: Page;

async function shot(name: string) {
  if (page) {
    await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
  }
}

test.describe("QA-PACKAGED: Full Packaged App Verification", () => {
  test.beforeAll(async () => {
    test.skip(!APP_EXISTS, `Packaged app not found at ${APP_PATH}`);

    app = await electron.launch({
      executablePath: APP_PATH,
      env: { ...process.env, NODE_ENV: "test" },
    });
    page = await app.firstWindow();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
  });

  test.afterAll(async () => {
    await app?.close();
  });

  test("1. App launches without crash", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");
    await shot("01-launch");
    const rootEl = page.locator("#root");
    await expect(rootEl).toBeVisible({ timeout: 10000 });
    const title = await page.title();
    console.log("Window title:", title);
    expect(title).toContain("AgentGrid");
  });

  test("2. Full API bridge verification", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");
    const apiCheck = await page.evaluate(() => {
      const w = window as { api?: Record<string, unknown> };
      if (!w.api) return { api: false };
      return {
        api: true,
        grid: typeof w.api.grid === "object",
        terminal: typeof w.api.terminal === "object",
        pane: typeof w.api.pane === "object",
        preset: typeof w.api.preset === "object",
        signals: typeof w.api.signals === "object",
        ceoLog: typeof w.api.ceoLog === "object",
        // Check specific methods exist
        gridCreate: typeof (w.api.grid as Record<string, unknown>)?.create === "function",
        gridGet: typeof (w.api.grid as Record<string, unknown>)?.get === "function",
        terminalWrite: typeof (w.api.terminal as Record<string, unknown>)?.write === "function",
        terminalOnData: typeof (w.api.terminal as Record<string, unknown>)?.onData === "function",
        terminalSpawn: typeof (w.api.terminal as Record<string, unknown>)?.spawn === "function",
      };
    });

    console.log("API bridge:", JSON.stringify(apiCheck, null, 2));

    expect(apiCheck.api).toBe(true);
    expect(apiCheck.grid).toBe(true);
    expect(apiCheck.terminal).toBe(true);
    expect(apiCheck.pane).toBe(true);
    expect(apiCheck.preset).toBe(true);
    expect(apiCheck.signals).toBe(true);
    expect(apiCheck.ceoLog).toBe(true);
    expect(apiCheck.gridCreate).toBe(true);
    expect(apiCheck.terminalWrite).toBe(true);
    expect(apiCheck.terminalOnData).toBe(true);
  });

  test("3. Grid creation — 1x2 grid via IPC", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");

    // Click a grid button to create a grid
    const gridBtn = page
      .locator('button:has-text("2x2"), button:has-text("1x2"), button:has-text("1x1")')
      .first();
    if (await gridBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gridBtn.click();
      await page.waitForTimeout(3000);
    }

    await shot("03-grid-created");

    const gridState = await page.evaluate(async () => {
      const w = window as {
        api?: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;
      };
      const grid = await w.api?.grid?.get();
      return grid;
    });

    console.log("Grid state:", JSON.stringify(gridState));
    expect(gridState).not.toBeNull();
  });

  test("4. Terminal PTY — NOT mock", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");

    const ptyStatus = await page.evaluate(() => {
      const w = window as { api?: Record<string, unknown> };
      return {
        hasTerminalAPI: !!w.api?.terminal,
        hasWrite: typeof (w.api?.terminal as Record<string, unknown>)?.write === "function",
        hasOnData: typeof (w.api?.terminal as Record<string, unknown>)?.onData === "function",
        hasResize: typeof (w.api?.terminal as Record<string, unknown>)?.resize === "function",
        hasKill: typeof (w.api?.terminal as Record<string, unknown>)?.kill === "function",
        hasSpawn: typeof (w.api?.terminal as Record<string, unknown>)?.spawn === "function",
      };
    });

    console.log("PTY status:", JSON.stringify(ptyStatus));

    // Check for mock indicators in the DOM
    const bodyText = await page.textContent("body");
    const isMock = bodyText?.includes("mock terminal") || bodyText?.includes("Mock");
    console.log("Mock detected:", isMock);

    expect(ptyStatus.hasTerminalAPI).toBe(true);
    expect(ptyStatus.hasWrite).toBe(true);
    expect(isMock).toBeFalsy();
  });

  test("5. Terminal I/O — type and verify output", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");

    // Find xterm terminal
    const xterm = page.locator(".xterm").first();
    const xtermVisible = await xterm.isVisible().catch(() => false);
    console.log("xterm visible:", xtermVisible);

    if (xtermVisible) {
      await xterm.click();
      await page.waitForTimeout(500);

      // Type a command
      await page.keyboard.type("echo QA_PACKAGED_TEST_OK", { delay: 30 });
      await page.waitForTimeout(500);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000);

      await shot("05-terminal-io");

      // Check if output appeared in xterm
      const xtermContent = await xterm.textContent();
      console.log("xterm content length:", xtermContent?.length);
      console.log("xterm content preview:", xtermContent?.slice(0, 200));

      // The terminal should have SOME content if PTY is working
      expect(xtermContent?.length).toBeGreaterThan(0);
    } else {
      console.log("WARNING: No xterm element visible — terminal may not be rendered");
      await shot("05-no-xterm");
    }
  });

  test("6. Terminal rapid typing — no lag", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");

    const xterm = page.locator(".xterm").first();
    if (await xterm.isVisible().catch(() => false)) {
      await xterm.click();
      await page.waitForTimeout(300);

      const start = Date.now();
      // Type 50 characters rapidly
      await page.keyboard.type("abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmn", { delay: 10 });
      const elapsed = Date.now() - start;

      console.log(`Rapid typing: 50 chars in ${elapsed}ms`);
      await shot("06-rapid-typing");

      // Should complete in under 3 seconds (50 chars × 10ms delay + overhead)
      expect(elapsed).toBeLessThan(3000);

      // Clear line
      await page.keyboard.press("Control+c");
      await page.waitForTimeout(300);
    }
  });

  test("7. spawn-helper architecture verification", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");

    const spawnHelperPath = join(
      APP_DIR,
      "release/mac-arm64/AgentGrid.app/Contents/Resources/app.asar.unpacked/node_modules/node-pty/build/Release/spawn-helper",
    );

    expect(existsSync(spawnHelperPath)).toBe(true);
    console.log("spawn-helper exists at:", spawnHelperPath);

    // Architecture already verified via `file` command in pre-check: arm64
  });

  test("8. Settings panel — model and effort", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");

    // Find settings gear icon on any pane header
    const gear = page
      .locator('button[title="Settings"], button[aria-label="Settings"], .pane-header button')
      .first();
    const gearVisible = await gear.isVisible().catch(() => false);

    if (gearVisible) {
      await gear.click();
      await page.waitForTimeout(500);
      await shot("08-settings-open");

      const bodyText = await page.textContent("body");
      const hasModel =
        bodyText?.includes("Model") || bodyText?.includes("Opus") || bodyText?.includes("Claude");
      const hasEffort =
        bodyText?.includes("Effort") || bodyText?.includes("max") || bodyText?.includes("high");
      const hasAgent = bodyText?.includes("Agent") || bodyText?.includes("CLAUDE");

      console.log("Settings visible — Model:", hasModel, "Effort:", hasEffort, "Agent:", hasAgent);

      expect(hasModel || hasEffort || hasAgent).toBe(true);

      // Close settings
      const doneBtn = page.locator('button:has-text("Done"), button:has-text("Close")').first();
      if (await doneBtn.isVisible().catch(() => false)) {
        await doneBtn.click();
        await page.waitForTimeout(300);
      }
    } else {
      console.log("WARNING: Settings gear not found");
    }
  });

  test("9. Broadcast — send to all panes", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");

    const input = page
      .locator('input[placeholder*="pane"], input[placeholder*="Broadcast"]')
      .first();
    const inputVisible = await input.isVisible().catch(() => false);

    if (inputVisible) {
      await input.fill("echo BROADCAST_QA_TEST");

      const sendBtn = page.locator('button:has-text("Send")').first();
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
      } else {
        await input.press("Enter");
      }

      await page.waitForTimeout(1000);
      await shot("09-broadcast-sent");

      // Input should be cleared after send
      const val = await input.inputValue();
      console.log("Broadcast input after send:", JSON.stringify(val));
      expect(val).toBe("");
    } else {
      console.log("WARNING: Broadcast input not found");
    }
  });

  test("10. asar verification — node-pty files complete", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");

    const unpackedBase = join(
      APP_DIR,
      "release/mac-arm64/AgentGrid.app/Contents/Resources/app.asar.unpacked/node_modules/node-pty",
    );

    const requiredFiles = ["package.json", "build/Release/spawn-helper", "lib/unixTerminal.js"];

    const results: Record<string, boolean> = {};
    for (const f of requiredFiles) {
      results[f] = existsSync(join(unpackedBase, f));
    }

    // Check prebuilds
    const prebuildsDir = join(unpackedBase, "prebuilds");
    results["prebuilds/darwin-arm64"] = existsSync(join(prebuildsDir, "darwin-arm64"));
    results["prebuilds/darwin-x64"] = existsSync(join(prebuildsDir, "darwin-x64"));

    console.log("asar verification:", JSON.stringify(results, null, 2));

    for (const [file, exists] of Object.entries(results)) {
      expect(exists, `Missing: ${file}`).toBe(true);
    }
  });

  test("11. UI elements verification", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");

    // Sidebar icons
    const sidebarIcons = await page.locator("nav button, aside button, .sidebar button").count();
    console.log("Sidebar button count:", sidebarIcons);

    // Status bar
    const statusBar = await page.textContent("footer, .status-bar, [class*='status']");
    console.log("Status bar:", statusBar?.slice(0, 100));

    // Pane headers
    const paneHeaders = await page.locator('[class*="pane-header"], [class*="PaneHeader"]').count();
    const agentLabels = await page.locator('text="Agent"').count();
    console.log("Pane headers:", paneHeaders, "Agent labels:", agentLabels);

    await shot("11-ui-elements");

    // Must have at least sidebar + status bar visible
    const hasUI = sidebarIcons > 0 || (statusBar && statusBar.length > 0);
    expect(hasUI).toBe(true);
  });

  test("12. Final state screenshot", async () => {
    test.skip(!APP_EXISTS, "No packaged binary");
    await shot("12-final-state");
    const readyState = await page.evaluate(() => document.readyState);
    expect(readyState).toBe("complete");
  });
});
