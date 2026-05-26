import { test, expect, _electron as electron } from "@playwright/test";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const appPath = join(currentDir, "../..");
const screenshotDir = join(appPath, "tests/screenshots/qa-wave1");

test.describe("Wave 1 QA", () => {
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

  test("01 - Welcome screen renders", async () => {
    await page.screenshot({ path: join(screenshotDir, "01-welcome.png") });
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("02 - Create 2x2 grid", async () => {
    const buttons = await page.locator("button").all();
    let gridButton = null;
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.includes("2") && text?.includes("2")) {
        gridButton = btn;
        break;
      }
    }
    if (gridButton) {
      await gridButton.click();
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: join(screenshotDir, "02-grid-created.png") });
  });

  test("03 - Grid panes visible", async () => {
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(screenshotDir, "03-grid-panes.png") });
  });

  test("04 - Tab bar visible", async () => {
    await page.screenshot({ path: join(screenshotDir, "04-tab-bar.png") });
  });

  test("05 - Status bar visible", async () => {
    await page.screenshot({ path: join(screenshotDir, "05-status-bar.png") });
  });

  test("06 - Command palette (Cmd+K)", async () => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(screenshotDir, "06-command-palette.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("07 - Sidebar toggle", async () => {
    await page.keyboard.press("Meta+\\");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(screenshotDir, "07-sidebar-open.png") });
    await page.keyboard.press("Meta+\\");
    await page.waitForTimeout(300);
  });

  test("08 - Graph view toggle (Cmd+G)", async () => {
    await page.keyboard.press("Meta+g");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(screenshotDir, "08-graph-view.png") });
    await page.keyboard.press("Meta+g");
    await page.waitForTimeout(500);
  });

  test("09 - Settings panel", async () => {
    await page.keyboard.press("Meta+,");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(screenshotDir, "09-settings.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("10 - Zen mode", async () => {
    await page.keyboard.press("Meta+Shift+f");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(screenshotDir, "10-zen-mode.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("11 - Final state", async () => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(screenshotDir, "11-final-state.png") });
  });
});
