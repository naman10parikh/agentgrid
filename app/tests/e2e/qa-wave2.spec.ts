import { test, expect, _electron as electron } from "@playwright/test";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const appPath = join(currentDir, "../..");
const screenshotDir = join(appPath, "tests/screenshots/qa-wave2");

test.describe("Wave 2 QA", () => {
  let electronApp: Awaited<ReturnType<typeof electron.launch>>;
  let page: Awaited<ReturnType<(typeof electronApp)["firstWindow"]>>;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [join(appPath, "out/main/index.js")],
      env: { ...process.env, NODE_ENV: "development" },
    });
    page = await electronApp.firstWindow();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
  });

  test.afterAll(async () => {
    await electronApp?.close();
  });

  test("01 - Welcome screen", async () => {
    await page.screenshot({ path: join(screenshotDir, "01-welcome.png") });
    expect(await page.textContent("body")).toBeTruthy();
  });

  test("02 - Create 2x3 grid", async () => {
    const buttons = await page.locator("button").all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.includes("2x3") || text?.includes("2×3")) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(screenshotDir, "02-grid-2x3.png") });
  });

  test("03 - Command palette shows council", async () => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);
    // Type "council" to filter
    await page.keyboard.type("council");
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(screenshotDir, "03-palette-council.png") });
    await page.keyboard.press("Escape");
  });

  test("04 - Council panel (Cmd+Shift+C)", async () => {
    await page.keyboard.press("Meta+Shift+c");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(screenshotDir, "04-council-panel.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("05 - Settings panel categories", async () => {
    await page.keyboard.press("Meta+,");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(screenshotDir, "05-settings-categories.png") });
  });

  test("06 - Settings Terminal tab", async () => {
    const terminalTab = page.locator("button", { hasText: "Terminal" });
    if ((await terminalTab.count()) > 0) {
      await terminalTab.first().click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: join(screenshotDir, "06-settings-terminal.png") });
  });

  test("07 - Settings Appearance tab", async () => {
    const tab = page.locator("button", { hasText: "Appearance" });
    if ((await tab.count()) > 0) {
      await tab.first().click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: join(screenshotDir, "07-settings-appearance.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("08 - Graph view with topology picker", async () => {
    await page.keyboard.press("Meta+g");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(screenshotDir, "08-graph-topology.png") });
  });

  test("09 - Graph hierarchical layout", async () => {
    const hierBtn = page.locator("button", { hasText: "hierarchical" });
    if ((await hierBtn.count()) > 0) {
      await hierBtn.first().click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: join(screenshotDir, "09-graph-hierarchical.png") });
  });

  test("10 - Graph ring layout", async () => {
    const ringBtn = page.locator("button", { hasText: "ring" });
    if ((await ringBtn.count()) > 0) {
      await ringBtn.first().click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: join(screenshotDir, "10-graph-ring.png") });
  });

  test("11 - Graph star layout", async () => {
    const starBtn = page.locator("button", { hasText: "star" });
    if ((await starBtn.count()) > 0) {
      await starBtn.first().click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: join(screenshotDir, "11-graph-star.png") });
    // Switch back to grid view
    await page.keyboard.press("Meta+g");
    await page.waitForTimeout(500);
  });

  test("12 - Sidebar presets tab", async () => {
    await page.keyboard.press("Meta+\\");
    await page.waitForTimeout(500);
    const presetsTab = page.locator("button", { hasText: "Presets" });
    if ((await presetsTab.count()) > 0) {
      await presetsTab.first().click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: join(screenshotDir, "12-sidebar-presets.png") });
    await page.keyboard.press("Meta+\\");
    await page.waitForTimeout(300);
  });

  test("13 - Status bar with info", async () => {
    await page.screenshot({ path: join(screenshotDir, "13-status-bar.png") });
  });

  test("14 - Tab bar with 6 panes", async () => {
    await page.screenshot({ path: join(screenshotDir, "14-tab-bar-6panes.png") });
  });

  test("15 - Control bar broadcast", async () => {
    await page.screenshot({ path: join(screenshotDir, "15-control-bar.png") });
  });

  test("16 - Zen mode hides chrome", async () => {
    await page.keyboard.press("Meta+Shift+f");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(screenshotDir, "16-zen-mode.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("17 - Final state", async () => {
    await page.screenshot({ path: join(screenshotDir, "17-final-state.png") });
  });
});
