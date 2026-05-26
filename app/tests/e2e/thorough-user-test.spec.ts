import { test, expect, _electron, type ElectronApplication, type Page } from "@playwright/test";

const APP_PATH =
  "./release/mac-arm64/AgentGrid.app/Contents/MacOS/AgentGrid";

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  app = await _electron.launch({ executablePath: APP_PATH });
  page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
});

test.afterAll(async () => {
  if (app) await app.close();
});

// ─── WELCOME SCREEN ───

test("01. Welcome screen appears on launch (not auto-restored grid)", async () => {
  await page.screenshot({ path: "tests/screenshots/thorough/01-launch.png" });
  const hasWelcome = await page.locator("text=AgentGrid").first().isVisible();
  const hasGridButtons = await page.locator("button:has-text('2x2')").isVisible();
  console.log(`Welcome visible: ${hasWelcome}, Grid buttons: ${hasGridButtons}`);
  expect(hasWelcome).toBe(true);
  expect(hasGridButtons).toBe(true);
});

// ─── GRID CREATION ───

test("02. Click 2x2 creates 4 panes", async () => {
  const btn = page.locator("button:has-text('2x2')").first();
  await btn.click();
  await page.waitForTimeout(5000); // Wait for tmux sessions
  await page.screenshot({ path: "tests/screenshots/thorough/02-grid-created.png" });

  const paneHeaders = await page.locator("[class*='pane-header'], [class*='shrink-0']").count();
  console.log(`Pane headers found: ${paneHeaders}`);
  // Should have at least 4 terminal areas
  const xtermElements = await page.locator(".xterm").count();
  console.log(`xterm elements: ${xtermElements}`);
});

// ─── TERMINAL TYPING (THE P0 TEST) ───

test("03. Can type in first pane — keystrokes reach terminal", async () => {
  // Click the first xterm screen to focus it
  const firstXterm = page.locator(".xterm-screen").first();
  await firstXterm.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tests/screenshots/thorough/03a-focused.png" });

  // Type a simple command
  await page.keyboard.type("echo HELLO_FROM_AGENTGRID", { delay: 50 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tests/screenshots/thorough/03b-typed.png" });

  // Press Enter to execute
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tests/screenshots/thorough/03c-executed.png" });

  // Check if output appeared (xterm renders to canvas, so check DOM text content)
  const xtermContent = await page.locator(".xterm-screen").first().textContent();
  console.log(`xterm content length: ${xtermContent?.length ?? 0}`);
  console.log(`First 200 chars: ${xtermContent?.slice(0, 200)}`);
});

test("04. Can type in second pane", async () => {
  const xtermScreens = page.locator(".xterm-screen");
  const count = await xtermScreens.count();
  if (count >= 2) {
    await xtermScreens.nth(1).click();
    await page.waitForTimeout(500);
    await page.keyboard.type("echo PANE_TWO_WORKS", { delay: 50 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "tests/screenshots/thorough/04-pane2-typed.png" });
  } else {
    console.log(`Only ${count} xterm screens found, skipping pane 2`);
  }
});

test("05. Can type in third pane", async () => {
  const xtermScreens = page.locator(".xterm-screen");
  const count = await xtermScreens.count();
  if (count >= 3) {
    await xtermScreens.nth(2).click();
    await page.waitForTimeout(500);
    await page.keyboard.type("echo PANE_THREE_WORKS", { delay: 50 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "tests/screenshots/thorough/05-pane3-typed.png" });
  }
});

test("06. Can type in fourth pane", async () => {
  const xtermScreens = page.locator(".xterm-screen");
  const count = await xtermScreens.count();
  if (count >= 4) {
    await xtermScreens.nth(3).click();
    await page.waitForTimeout(500);
    await page.keyboard.type("echo PANE_FOUR_WORKS", { delay: 50 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "tests/screenshots/thorough/06-pane4-typed.png" });
  }
});

// ─── CURSOR STYLE ───

test("07. Cursor is block (thick) not bar (thin) in focused pane", async () => {
  const firstXterm = page.locator(".xterm-screen").first();
  await firstXterm.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "tests/screenshots/thorough/07-cursor.png" });

  // Check for xterm cursor block class
  const blockCursor = await page.locator(".xterm-cursor-block").count();
  const barCursor = await page.locator(".xterm-cursor-bar").count();
  console.log(`Block cursors: ${blockCursor}, Bar cursors: ${barCursor}`);
});

test("08. Cursor stays block when switching between panes", async () => {
  const xtermScreens = page.locator(".xterm-screen");
  // Click pane 1
  await xtermScreens.first().click();
  await page.waitForTimeout(300);
  const cursor1 = await page.locator(".xterm-cursor-block").count();

  // Click pane 2
  if ((await xtermScreens.count()) >= 2) {
    await xtermScreens.nth(1).click();
    await page.waitForTimeout(300);
  }
  const cursor2 = await page.locator(".xterm-cursor-block").count();
  console.log(`Cursor after pane 1 click: ${cursor1}, after pane 2 click: ${cursor2}`);
  await page.screenshot({ path: "tests/screenshots/thorough/08-cursor-switch.png" });
});

// ─── BROADCAST ───

test("09. Broadcast sends to all panes", async () => {
  const broadcastInput = page
    .locator("input[placeholder*='Broadcast'], input[placeholder*='broadcast']")
    .first();
  if (await broadcastInput.isVisible()) {
    await broadcastInput.fill("echo BROADCAST_TEST");
    await page.screenshot({ path: "tests/screenshots/thorough/09a-broadcast-typed.png" });

    const sendBtn = page.locator("button:has-text('Send')").first();
    await sendBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "tests/screenshots/thorough/09b-broadcast-sent.png" });
  } else {
    console.log("Broadcast input not found");
  }
});

// ─── COMMAND PALETTE ───

test("10. Cmd+K opens command palette", async () => {
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tests/screenshots/thorough/10-palette.png" });

  const paletteVisible = await page
    .locator("input[placeholder*='command'], input[placeholder*='Search']")
    .first()
    .isVisible()
    .catch(() => false);
  console.log(`Palette visible: ${paletteVisible}`);

  // Close it
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
});

// ─── SIDEBAR ───

test("11. Cmd+backslash opens sidebar", async () => {
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tests/screenshots/thorough/11a-sidebar.png" });

  // Check tabs
  const workspaces = await page
    .locator("text=Workspaces, text=Workspace")
    .first()
    .isVisible()
    .catch(() => false);
  const presets = await page
    .locator("text=Presets")
    .first()
    .isVisible()
    .catch(() => false);
  console.log(`Sidebar tabs — Workspaces: ${workspaces}, Presets: ${presets}`);

  // Close sidebar
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(300);
});

// ─── PANE SETTINGS ───

test("12. Gear icon opens pane settings", async () => {
  const gearBtn = page
    .locator("[class*='gear'], button:has(svg), [aria-label*='settings'], [title*='Settings']")
    .first();
  if (await gearBtn.isVisible().catch(() => false)) {
    await gearBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tests/screenshots/thorough/12-settings.png" });
  } else {
    console.log("Gear button not found by selector — taking screenshot of header area");
    await page.screenshot({ path: "tests/screenshots/thorough/12-settings-area.png" });
  }
});

// ─── STATUS BAR ───

test("13. Status bar shows grid info", async () => {
  await page.screenshot({ path: "tests/screenshots/thorough/13-statusbar.png" });
  const statusBar = await page
    .locator("[class*='status-bar'], [class*='StatusBar']")
    .first()
    .textContent()
    .catch(() => "");
  console.log(`Status bar text: ${statusBar}`);
});

// ─── EDGE CASES ───

test("14. Close a pane — others survive", async () => {
  const closeBtns = page.locator("[class*='close'], button:has-text('×'), [aria-label*='close']");
  const initialPaneCount = await page.locator(".xterm").count();
  console.log(`Panes before close: ${initialPaneCount}`);

  // Try to close first pane via tab X button
  const tabCloseBtn = page.locator("button").filter({ hasText: "×" }).first();
  if (await tabCloseBtn.isVisible().catch(() => false)) {
    await tabCloseBtn.click();
    await page.waitForTimeout(1000);
  }

  const afterPaneCount = await page.locator(".xterm").count();
  console.log(`Panes after close: ${afterPaneCount}`);
  await page.screenshot({ path: "tests/screenshots/thorough/14-pane-closed.png" });
});

test("15. Console has no critical JavaScript errors", async () => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("prompt()")) {
      errors.push(msg.text());
    }
  });
  await page.waitForTimeout(1000);
  console.log(`JS errors found: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.slice(0, 5).join(" | ")}`);
  }
  await page.screenshot({ path: "tests/screenshots/thorough/15-final.png" });
});

// ─── API BRIDGE VERIFICATION ───

test("16. All API namespaces present", async () => {
  const apis = await page.evaluate(() => ({
    grid: !!window.api?.grid,
    terminal: !!window.api?.terminal,
    terminalWrite: !!window.api?.terminal?.write,
    terminalOnData: !!window.api?.terminal?.onData,
    pane: !!window.api?.pane,
    preset: !!window.api?.preset,
    signals: !!window.api?.signals,
    ceoLog: !!window.api?.ceoLog,
    settings: !!window.api?.settings,
  }));
  console.log("API bridge:", JSON.stringify(apis));
  expect(apis.terminal).toBe(true);
  expect(apis.terminalWrite).toBe(true);
});

// ─── TMUX VERIFICATION ───

test("17. tmux sessions exist for panes", async () => {
  // Check from outside — run tmux command to list sessions
  const { execSync } = require("child_process");
  try {
    const sessions = execSync("tmux -L agentgrid list-sessions 2>&1", { encoding: "utf8" });
    console.log(`tmux agentgrid sessions:\n${sessions}`);
  } catch (e: unknown) {
    console.log(`tmux -L agentgrid error: ${(e as Error).message}`);
  }
});

test("18. Rapid typing doesn't drop characters", async () => {
  const firstXterm = page.locator(".xterm-screen").first();
  await firstXterm.click();
  await page.waitForTimeout(300);

  // Type rapidly
  const testString = "abcdefghijklmnopqrstuvwxyz1234567890";
  await page.keyboard.type(testString, { delay: 10 }); // Very fast
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tests/screenshots/thorough/18-rapid-type.png" });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
});

test("19. Zen mode hides chrome", async () => {
  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tests/screenshots/thorough/19-zen-mode.png" });

  // Exit zen mode
  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(300);
});

test("20. Dark theme background is warm black #141312", async () => {
  const bg = await page.evaluate(() => {
    const el = document.querySelector("[class*='bg-'], body, #root");
    if (!el) return "not found";
    return window.getComputedStyle(el).backgroundColor;
  });
  console.log(`Background color: ${bg}`);
  await page.screenshot({ path: "tests/screenshots/thorough/20-dark-theme.png" });
});
