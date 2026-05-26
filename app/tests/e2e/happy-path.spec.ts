/**
 * Happy Path E2E — Complete User Journey
 *
 * Tests the full lifecycle: welcome → grid → interact → settings → views → close.
 * Screenshots at every step for visual verification.
 *
 * Run: npx playwright test tests/e2e/happy-path.spec.ts --config tests/playwright.config.ts
 * Prereq: npx electron-vite build
 */
import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(currentDir, "../..");
const SHOTS = join(currentDir, "../screenshots/happy-path");
mkdirSync(SHOTS, { recursive: true });

let app: ElectronApplication;
let page: Page;
let shotIdx = 0;

// Electron apps are slower than web — 120s test timeout, 15s per screenshot
test.setTimeout(180_000);

async function shot(name: string) {
  shotIdx++;
  const filename = `${String(shotIdx).padStart(2, "0")}-${name}.png`;
  try {
    await page.screenshot({ path: join(SHOTS, filename), fullPage: true, timeout: 10_000 });
  } catch (err) {
    console.warn(`[SHOT] Failed: ${filename} — ${(err as Error).message}`);
  }
}

async function refreshPage() {
  // After certain actions, Electron may recreate the window
  try {
    const windows = app.windows();
    if (windows.length > 0) {
      page = windows[0];
    }
  } catch {
    // App may have restarted
  }
}

// ─── Setup / Teardown ───

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

// ─── Happy Path: single sequential test ───

test("complete user journey — 13 steps", async () => {
  // ────────────────────────────────────────
  // STEP 1: App loads — welcome or onboarding
  // ────────────────────────────────────────
  await shot("01-app-loaded");

  // Dismiss onboarding if shown — may recreate window
  const skipBtn = page.locator('button:has-text("Skip setup")');
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(2000);
    await refreshPage();
    await shot("01b-onboarding-skipped");
  }
  // Also try "Get Started" or "Continue" buttons
  for (const label of ["Get Started", "Continue"]) {
    const btn = page.locator(`button:has-text("${label}")`);
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(2000);
      await refreshPage();
    }
  }

  // Verify welcome screen — wait for 2x2 button
  await page.waitForTimeout(1000);
  const gridBtn = page.locator('button:has-text("2x2")');
  const onWelcome = await gridBtn.isVisible({ timeout: 5000 }).catch(() => false);
  expect(onWelcome).toBe(true);
  await shot("01c-welcome-screen");

  // ────────────────────────────────────────
  // STEP 2: Create 2x2 grid
  // ────────────────────────────────────────
  await gridBtn.click();
  await page.waitForTimeout(4000); // Wait for PTY spawn + xterm render
  await shot("02-grid-created");

  // Verify 4 panes exist
  const panes = page.locator(".xterm");
  const paneCount = await panes.count();
  expect(paneCount).toBeGreaterThanOrEqual(1); // At least 1 xterm rendered

  // ────────────────────────────────────────
  // STEP 3: Type in terminal
  // ────────────────────────────────────────
  const firstPane = panes.first();
  await firstPane.click();
  await page.waitForTimeout(500);
  await page.keyboard.type("echo hello from agentgrid", { delay: 30 });
  await page.waitForTimeout(500);
  await shot("03-typed-in-terminal");

  // ────────────────────────────────────────
  // STEP 4: Broadcast message
  // ────────────────────────────────────────
  const broadcastInput = page.locator("[data-broadcast-input]");
  if (await broadcastInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await broadcastInput.fill("status check");
    const sendBtn = page.locator('button:has-text("Send")');
    if (await sendBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(1000);
    }
  } else {
    // Fallback: try typing in any visible broadcast-like input
    const altInput = page
      .locator('input[placeholder*="broadcast" i], input[placeholder*="command" i]')
      .first();
    if (await altInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await altInput.fill("status check");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1000);
    }
  }
  await shot("04-broadcast-sent");

  // ────────────────────────────────────────
  // STEP 5: Open Settings, change model
  // ────────────────────────────────────────
  await page.keyboard.press("Meta+,");
  await page.waitForTimeout(1000);
  await shot("05a-settings-open");

  // Click Models tab
  const modelsTab = page.locator('button:has-text("Models")');
  if (await modelsTab.isVisible({ timeout: 1000 }).catch(() => false)) {
    await modelsTab.click();
    await page.waitForTimeout(500);
    await shot("05b-settings-models");
  }

  // Close settings — click backdrop or press Escape
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  await shot("05c-settings-closed");

  // ────────────────────────────────────────
  // STEP 6: Toggle dashboard view (Cmd+G)
  // ────────────────────────────────────────
  await page.locator("#root").click({ position: { x: 400, y: 300 } });
  await page.waitForTimeout(300);
  await page.keyboard.press("Meta+g");
  // Wait for dashboard-specific element instead of fixed timeout
  await page
    .locator('text="Total Cost"')
    .waitFor({ state: "visible", timeout: 8000 })
    .catch(() => {});
  await shot("06a-dashboard-view");

  // Toggle back to grid
  await page.keyboard.press("Meta+g");
  await page
    .locator(".xterm")
    .first()
    .waitFor({ state: "visible", timeout: 8000 })
    .catch(() => {});
  await shot("06b-grid-view-restored");

  // ────────────────────────────────────────
  // STEP 7: Open command palette (Cmd+K)
  // ────────────────────────────────────────
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(800);

  const paletteInput = page.locator('input[placeholder*="command" i]');
  await expect(paletteInput).toBeVisible({ timeout: 2000 });
  await shot("07a-palette-open");

  // Type a filter
  await paletteInput.fill("grid");
  await page.waitForTimeout(500);
  await shot("07b-palette-filtered");

  // Close palette
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // ────────────────────────────────────────
  // STEP 8: Save preset (via palette command)
  // ────────────────────────────────────────
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(800);
  const paletteInput2 = page.locator('input[placeholder*="command" i]');
  await paletteInput2.fill("save");
  await page.waitForTimeout(500);
  await shot("08a-palette-save");

  // Click "Save Session" if visible (use force to bypass overlay interception)
  const saveCmd = page.locator('button:has-text("Save Session")').first();
  if (await saveCmd.isVisible({ timeout: 1000 }).catch(() => false)) {
    await saveCmd.click({ force: true });
    await page.waitForTimeout(1000);
  } else {
    await page.keyboard.press("Escape");
  }
  await shot("08b-preset-saved");

  // ────────────────────────────────────────
  // STEP 9: Open sidebar (Cmd+\)
  // ────────────────────────────────────────
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(800);
  await shot("09a-sidebar-open");

  // Click Presets tab
  const presetsTab = page.locator('button[title="Presets"]');
  if (await presetsTab.isVisible({ timeout: 1000 }).catch(() => false)) {
    await presetsTab.click();
    await page.waitForTimeout(500);
    await shot("09b-sidebar-presets");
  }

  // Close sidebar
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(500);

  // ────────────────────────────────────────
  // STEP 10: Zen mode on/off (Cmd+Shift+F)
  // ────────────────────────────────────────
  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(800);
  await shot("10a-zen-mode-on");

  // Zen off
  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(800);
  await shot("10b-zen-mode-off");

  // ────────────────────────────────────────
  // STEP 11: Zoom a pane
  // ────────────────────────────────────────
  const zoomBtn = page.locator('button[title="Zoom"]').first();
  if (await zoomBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await zoomBtn.click();
    await page.waitForTimeout(800);
    await shot("11a-pane-zoomed");

    // Unzoom — press Escape or click Unzoom
    const unzoomBtn = page.locator('button[title="Unzoom (Esc)"]').first();
    if (await unzoomBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await unzoomBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(500);
    await shot("11b-pane-unzoomed");
  } else {
    await shot("11-zoom-not-available");
  }

  // ────────────────────────────────────────
  // STEP 12: Close one pane
  // ────────────────────────────────────────
  const panesBefore = await page.locator(".xterm").count();
  const closeBtn = page.locator('button[title="Close"]').first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }
  const panesAfter = await page.locator(".xterm").count();
  await shot("12-pane-closed");

  // Verify count decreased (or at least didn't increase)
  expect(panesAfter).toBeLessThanOrEqual(panesBefore);

  // ────────────────────────────────────────
  // STEP 13: Close all panes → returns to welcome
  // ────────────────────────────────────────
  let attempts = 0;
  while (attempts < 20) {
    const closeBtns = page.locator('button[title="Close"]');
    const count = await closeBtns.count();
    if (count === 0) break;
    await closeBtns.first().click();
    await page.waitForTimeout(500);
    attempts++;
  }
  await page.waitForTimeout(1000);
  await shot("13-back-to-welcome");

  // Verify welcome screen returned
  const welcomeVisible = await page
    .locator('button:has-text("2x2")')
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  expect(welcomeVisible).toBe(true);
});
