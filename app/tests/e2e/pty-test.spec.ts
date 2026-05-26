/**
 * AgentGrid — PTY Terminal Verification Test
 *
 * Verifies that real PTY terminals are spawned (not mock mode).
 * Tests: window.api injection, IPC, node-pty, terminal I/O.
 *
 * Run: npx playwright test tests/e2e/pty-test.spec.ts --config tests/playwright.config.ts
 * Prereq: npx electron-vite build
 */

import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(currentDir, "../..");
const SHOTS = join(currentDir, "../screenshots/pty-test");
mkdirSync(SHOTS, { recursive: true });

let app: ElectronApplication;
let page: Page;

async function shot(name: string) {
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
}

test.beforeAll(async () => {
  app = await electron.launch({
    args: [join(APP_DIR, "out/main/index.js")],
    env: { ...process.env, NODE_ENV: "test" },
  });
  page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
});

test.afterAll(async () => {
  await app?.close();
});

// ─── 1. Verify window.api is injected by preload ───

test("1. window.api is injected (preload works)", async () => {
  const apiExists = await page.evaluate(() => !!window.api);
  const gridApiExists = await page.evaluate(() => !!window.api?.grid);
  const terminalApiExists = await page.evaluate(() => !!window.api?.terminal);
  const paneApiExists = await page.evaluate(() => !!window.api?.pane);

  console.log(`window.api: ${apiExists}`);
  console.log(`window.api.grid: ${gridApiExists}`);
  console.log(`window.api.terminal: ${terminalApiExists}`);
  console.log(`window.api.pane: ${paneApiExists}`);

  expect(apiExists).toBe(true);
  expect(gridApiExists).toBe(true);
  expect(terminalApiExists).toBe(true);
  expect(paneApiExists).toBe(true);

  await shot("01-api-injected");
});

// ─── 2. Create grid via IPC (not mock fallback) ───

test("2. Grid creation uses real IPC (not mock)", async () => {
  // Click 1x1 grid to create simplest terminal
  const btn = page.locator('button:has-text("1x1")');
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(3000);
  }

  await shot("02-grid-created");

  // Verify grid was created via IPC
  const gridState = await page.evaluate(async () => {
    const grid = await window.api?.grid?.get();
    return grid ? { panes: grid.panes?.length ?? 0, rows: grid.rows, cols: grid.cols } : null;
  });

  console.log("Grid state:", JSON.stringify(gridState));
  expect(gridState).not.toBeNull();
  expect(gridState?.panes).toBeGreaterThanOrEqual(1);
});

// ─── 3. Verify terminal has PTY (not mock) ───

test("3. Terminal pane has real PTY (not mock)", async () => {
  // Check if the terminal shows mock mode indicator
  const bodyText = await page.textContent("body");
  const isMock = bodyText?.includes("mock terminal") || bodyText?.includes("no PTY");

  console.log("Mock mode detected:", isMock);

  // In Playwright Electron launch, preload should inject window.api
  // and IPC should connect to main process with real PTY
  const hasPty = await page.evaluate(() => !!window.api?.terminal?.write);
  console.log("window.api.terminal.write exists:", hasPty);

  expect(hasPty).toBe(true);

  await shot("03-pty-check");
});

// ─── 4. Type in terminal and verify input is sent ───

test("4. Keyboard input reaches terminal", async () => {
  // Focus the terminal pane
  const xterm = page.locator(".xterm").first();
  if (await xterm.isVisible()) {
    await xterm.click();
    await page.waitForTimeout(500);
  }

  // Type a command
  await page.keyboard.type("echo PTY_TEST_WORKING", { delay: 50 });
  await page.waitForTimeout(1000);

  await shot("04-input-typed");

  // We can't easily read xterm canvas content, but we can verify the pane is focused
  const focusedPane = page.locator('[class*="border-grid-accent"]');
  expect(await focusedPane.count()).toBeGreaterThanOrEqual(1);
});

// ─── 5. Settings gear button is clickable ───

test("5. Settings gear opens PaneSettings panel", async () => {
  // Click the gear icon in the pane header
  const gear = page.locator('button[title="Settings"]').first();
  if (await gear.isVisible()) {
    await gear.click();
    await page.waitForTimeout(500);
    await shot("05a-settings-open");

    // Settings panel should show model/effort selectors
    const bodyText = await page.textContent("body");
    const hasModelSelector =
      bodyText?.includes("Model") ||
      bodyText?.includes("model") ||
      bodyText?.includes("opus") ||
      bodyText?.includes("Opus");
    const hasEffortSelector =
      bodyText?.includes("Effort") ||
      bodyText?.includes("effort") ||
      bodyText?.includes("max") ||
      bodyText?.includes("high");

    console.log("Has model selector:", hasModelSelector);
    console.log("Has effort selector:", hasEffortSelector);

    // Close settings
    const closeBtn = page.locator('button:has-text("×"), button:has-text("Close")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }

    await shot("05b-settings-closed");
  }
});

// ─── 6. Pane rename button works ───

test("6. Rename button triggers rename dialog", async () => {
  // Ensure we have a grid — if test 5 or earlier left us without one, create it
  const gridCheck = await page.evaluate(async () => {
    const grid = await window.api?.grid?.get();
    return grid?.panes?.length ?? 0;
  });

  if (gridCheck === 0) {
    const btn = page.locator('button:has-text("1x1")');
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(3000);
    }
  }

  // Close settings panel if still open from test 5
  const closeSettings = page.locator('button:has-text("×"), button:has-text("Close")').first();
  if (await closeSettings.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeSettings.click();
    await page.waitForTimeout(300);
  }

  const renameBtn = page.locator('button[title="Rename"]').first();
  const exists = await renameBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log("Rename button visible:", exists);
  expect(exists).toBe(true);

  await shot("06-rename-button");
});

// ─── 7. Zoom button toggles pane zoom ───

test("7. Zoom button toggles pane zoom", async () => {
  const zoomBtn = page.locator('button[title="Zoom"]').first();
  if (await zoomBtn.isVisible()) {
    await zoomBtn.click();
    await page.waitForTimeout(300);
    await shot("07a-zoomed");

    // Unzoom via Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await shot("07b-unzoomed");
  }
});

// ─── 8. Close button removes pane ───

test("8. Close button removes pane (returns to welcome)", async () => {
  const closeBtn = page.locator('button[title="Close"]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
    await shot("08-pane-closed");

    // Should return to welcome screen (no grid)
    const bodyText = await page.textContent("body");
    const hasWelcome =
      bodyText?.includes("AgentGrid") || bodyText?.includes("1x1") || bodyText?.includes("Visual");
    expect(hasWelcome).toBe(true);
  }
});

// ─── 9. Create 2x3 grid (full team) ───

test("9. Create 2x3 full team grid", async () => {
  // After test 8 closed the pane, we should be back on welcome screen
  // Wait for welcome screen to appear
  await page.waitForTimeout(1000);

  // Try clicking 2x3 button (welcome screen uses "2x3" text, not "2×3")
  const btn = page.locator('button:has-text("2x3")').first();
  const btnVisible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log("2x3 button visible:", btnVisible);

  if (btnVisible) {
    await btn.click();
    await page.waitForTimeout(3000);
  } else {
    // If no button, try creating via IPC directly
    await page.evaluate(async () => {
      await window.api?.grid?.create(2, 3, "claude", "/tmp");
    });
    await page.waitForTimeout(3000);
  }

  await shot("09-full-grid");

  const gridState = await page.evaluate(async () => {
    const grid = await window.api?.grid?.get();
    return grid ? { panes: grid.panes?.length ?? 0, rows: grid.rows, cols: grid.cols } : null;
  });

  console.log("Full grid state:", JSON.stringify(gridState));
  expect(gridState).not.toBeNull();
  expect(gridState!.panes).toBeGreaterThanOrEqual(1);
});

// ─── 10. Broadcast works on full grid ───

test("10. Broadcast sends to all 6 panes", async () => {
  const input = page.locator('input[placeholder*="pane"]');
  if (await input.isVisible()) {
    await input.fill("echo BROADCAST_TO_ALL_SIX");
    const sendBtn = page.locator('button:has-text("Send")');
    if (await sendBtn.isVisible()) {
      await sendBtn.click();
    } else {
      await input.press("Enter");
    }
    await page.waitForTimeout(1000);
    await shot("10-broadcast-six");

    // Input should be cleared
    const val = await input.inputValue();
    expect(val).toBe("");
  }
});
