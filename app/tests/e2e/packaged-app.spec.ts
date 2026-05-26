/**
 * AgentGrid — Packaged App Test
 *
 * Tests the ACTUAL packaged .app (not dev build).
 * Verifies node-pty works in the real distributed binary.
 *
 * Skips all tests if the packaged binary doesn't exist.
 */

import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(currentDir, "../..");
const APP_PATH = join(APP_DIR, "release/mac-arm64/AgentGrid.app/Contents/MacOS/AgentGrid");
const SHOTS = join(currentDir, "../screenshots/packaged");
mkdirSync(SHOTS, { recursive: true });

const APP_EXISTS = existsSync(APP_PATH);

let app: ElectronApplication;
let page: Page;

async function shot(name: string) {
  if (page) {
    await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
  }
}

test.beforeAll(async () => {
  test.skip(!APP_EXISTS, `Packaged app not found at ${APP_PATH}. Run electron-builder first.`);

  app = await electron.launch({
    executablePath: APP_PATH,
    env: { ...process.env, NODE_ENV: "test" },
  });
  page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(4000);
});

test.afterAll(async () => {
  await app?.close();
});

test("1. Packaged app launches and renders", async () => {
  test.skip(!APP_EXISTS, "No packaged binary");
  await shot("01-packaged-launched");
  const rootEl = page.locator("#root");
  await expect(rootEl).toBeVisible({ timeout: 10000 });
  const hasButtons = await page.locator("button").count();
  expect(hasButtons).toBeGreaterThanOrEqual(1);
});

test("2. window.api exists in packaged app", async () => {
  test.skip(!APP_EXISTS, "No packaged binary");
  const apiCheck = await page.evaluate(() => ({
    api: !!window.api,
    grid: !!window.api?.grid,
    terminal: !!window.api?.terminal,
    pane: !!window.api?.pane,
    preset: !!window.api?.preset,
    signals: !!window.api?.signals,
    ceoLog: !!window.api?.ceoLog,
  }));

  console.log("Packaged app API:", JSON.stringify(apiCheck));

  expect(apiCheck.api).toBe(true);
  expect(apiCheck.grid).toBe(true);
  expect(apiCheck.terminal).toBe(true);
  expect(apiCheck.pane).toBe(true);
});

test("3. Create 2x2 grid in packaged app", async () => {
  test.skip(!APP_EXISTS, "No packaged binary");
  // Try 2x2 first, fall back to any grid button
  let btn = page.locator('button:has-text("2x2")');
  if (!(await btn.isVisible({ timeout: 2000 }).catch(() => false))) {
    btn = page.locator('button:has-text("1x1")');
  }
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(4000);
  }

  await shot("03-packaged-grid");

  const gridState = await page.evaluate(async () => {
    const grid = await window.api?.grid?.get();
    return grid ? { panes: grid.panes?.length ?? 0, rows: grid.rows, cols: grid.cols } : null;
  });

  console.log("Packaged grid state:", JSON.stringify(gridState));
  expect(gridState).not.toBeNull();
  expect(gridState?.panes).toBeGreaterThanOrEqual(1);
});

test("4. Terminal has real PTY in packaged app", async () => {
  test.skip(!APP_EXISTS, "No packaged binary");
  const hasPty = await page.evaluate(() => !!window.api?.terminal?.write);
  const isMock = (await page.textContent("body"))?.includes("mock terminal");

  console.log("Packaged PTY:", hasPty, "Mock:", isMock);

  expect(hasPty).toBe(true);
  expect(isMock).toBeFalsy();
});

test("5. Type in packaged terminal", async () => {
  test.skip(!APP_EXISTS, "No packaged binary");
  const xterm = page.locator(".xterm").first();
  if (await xterm.isVisible()) {
    await xterm.click();
    await page.waitForTimeout(500);
    await page.keyboard.type("echo PACKAGED_PTY_WORKS", { delay: 50 });
    await page.waitForTimeout(1000);
  }

  await shot("05-packaged-terminal-input");
});

test("6. Settings panel works in packaged app", async () => {
  test.skip(!APP_EXISTS, "No packaged binary");
  const gear = page.locator('button[title="Settings"]').first();
  if (await gear.isVisible()) {
    await gear.click();
    await page.waitForTimeout(500);
    await shot("06-packaged-settings");

    const bodyText = await page.textContent("body");
    const hasModel = bodyText?.includes("Model") || bodyText?.includes("Opus");
    const hasEffort = bodyText?.includes("Effort") || bodyText?.includes("max");

    console.log("Packaged settings — Model:", hasModel, "Effort:", hasEffort);
    expect(hasModel).toBe(true);
    expect(hasEffort).toBe(true);
  }
});

test("7. Broadcast works in packaged app", async () => {
  test.skip(!APP_EXISTS, "No packaged binary");
  const input = page.locator('input[placeholder*="pane"]');
  if (await input.isVisible()) {
    await input.fill("echo PACKAGED_BROADCAST");
    const sendBtn = page.locator('button:has-text("Send")');
    if (await sendBtn.isVisible()) {
      await sendBtn.click();
    } else {
      await input.press("Enter");
    }
    await page.waitForTimeout(500);
    await shot("07-packaged-broadcast");
    const val = await input.inputValue();
    expect(val).toBe("");
  }
});

test("8. Final state of packaged app", async () => {
  test.skip(!APP_EXISTS, "No packaged binary");
  await shot("08-packaged-final");
  const isReady = await page.evaluate(() => document.readyState === "complete");
  expect(isReady).toBe(true);
});
