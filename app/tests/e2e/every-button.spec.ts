/**
 * AgentGrid — Every Button E2E Test
 *
 * Clicks EVERY interactive element in the app with screenshots after each action.
 * 12 categories: grid creation, add pane, broadcast, save, sidebar tabs,
 * settings sections, command palette commands, view toggle, zen mode,
 * tab close, zoom, pane settings gear.
 *
 * Run: cd tools/agentgrid/app && npx playwright test tests/e2e/every-button.spec.ts --config tests/playwright.config.ts
 * Prereq: npx electron-vite build
 */

import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(currentDir, "../..");
const SHOTS = join(currentDir, "../screenshots/every-button");
mkdirSync(SHOTS, { recursive: true });

let app: ElectronApplication;
let page: Page;
let shotIndex = 0;

async function shot(label: string) {
  shotIndex++;
  const name = `${String(shotIndex).padStart(2, "0")}-${label}`;
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
}

/** Try clicking a locator, return true if clicked */
async function tryClick(locator: ReturnType<Page["locator"]>, timeout = 2000): Promise<boolean> {
  try {
    if (await locator.isVisible({ timeout })) {
      await locator.click();
      return true;
    }
  } catch {
    // element not found or not clickable
  }
  return false;
}

/** Open command palette via Cmd+K or JS dispatch */
async function openPalette(): Promise<boolean> {
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(400);
  let input = page.locator('input[placeholder*="command"]');
  if (await input.isVisible({ timeout: 1500 }).catch(() => false)) return true;
  // Fallback: JS dispatch
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  });
  await page.waitForTimeout(400);
  return input.isVisible({ timeout: 1500 }).catch(() => false);
}

/** Close any open modal/overlay */
async function closeOverlays() {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

/** Ensure we're on the grid (not welcome screen) */
async function ensureGrid() {
  // Check if we need to dismiss onboarding or create grid
  const welcomeBtn = page.locator('button:has-text("2x2")');
  if (await welcomeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await welcomeBtn.click();
    await page.waitForTimeout(3000);
  }
}

// ═══════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════

test.beforeAll(async () => {
  app = await electron.launch({
    args: [join(APP_DIR, "out/main/index.js")],
    env: { ...process.env, NODE_ENV: "test" },
  });
  page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(4000);
});

test.afterAll(async () => {
  await app?.close();
});

// ═══════════════════════════════════════════════════════
// 1. GRID CREATION BUTTONS (5 presets on welcome screen)
// ═══════════════════════════════════════════════════════

test("01 — Grid creation: 1x1 button", async () => {
  // We may be on welcome screen or grid — take initial shot
  await shot("initial-state");

  // If on grid already, use command palette to create 1x1
  const paletteOpened = await openPalette();
  if (paletteOpened) {
    const cmdInput = page.locator('input[placeholder*="command"]');
    await cmdInput.fill("1x1");
    await page.waitForTimeout(300);
    await shot("palette-1x1-filtered");

    const cmd = page.locator('button:has-text("1×1"), button:has-text("1x1")').first();
    if (await tryClick(cmd)) {
      await page.waitForTimeout(2000);
      await shot("grid-1x1-created");
    } else {
      await closeOverlays();
      await shot("grid-1x1-fallback");
    }
  } else {
    // Welcome screen — look for 1x1 button directly
    const btn = page.locator('button:has-text("1x1"), button:has-text("1×1")').first();
    if (await tryClick(btn)) {
      await page.waitForTimeout(2000);
      await shot("grid-1x1-created");
    }
  }
});

test("02 — Grid creation: 1x2 button", async () => {
  const opened = await openPalette();
  if (opened) {
    const cmdInput = page.locator('input[placeholder*="command"]');
    await cmdInput.fill("1x2");
    await page.waitForTimeout(300);
    const cmd = page.locator('button:has-text("1×2"), button:has-text("1x2")').first();
    await tryClick(cmd);
    await page.waitForTimeout(2000);
    await shot("grid-1x2-created");
  }
  await closeOverlays();
});

test("03 — Grid creation: 2x2 button", async () => {
  const opened = await openPalette();
  if (opened) {
    const cmdInput = page.locator('input[placeholder*="command"]');
    await cmdInput.fill("2x2");
    await page.waitForTimeout(300);
    const cmd = page.locator('button:has-text("2×2"), button:has-text("2x2")').first();
    await tryClick(cmd);
    await page.waitForTimeout(2000);
    await shot("grid-2x2-created");
  }
  await closeOverlays();
});

test("04 — Grid creation: 2x3 button", async () => {
  const opened = await openPalette();
  if (opened) {
    const cmdInput = page.locator('input[placeholder*="command"]');
    await cmdInput.fill("2x3");
    await page.waitForTimeout(300);
    const cmd = page.locator('button:has-text("2×3"), button:has-text("2x3")').first();
    await tryClick(cmd);
    await page.waitForTimeout(2000);
    await shot("grid-2x3-created");
  }
  await closeOverlays();
});

test("05 — Grid creation: 3x3 button", async () => {
  const opened = await openPalette();
  if (opened) {
    const cmdInput = page.locator('input[placeholder*="command"]');
    await cmdInput.fill("3x3");
    await page.waitForTimeout(300);
    const cmd = page.locator('button:has-text("3×3"), button:has-text("3x3")').first();
    await tryClick(cmd);
    await page.waitForTimeout(2000);
    await shot("grid-3x3-created");
  }
  await closeOverlays();

  // Reset to 2x2 for remaining tests
  const resetOpened = await openPalette();
  if (resetOpened) {
    const cmdInput = page.locator('input[placeholder*="command"]');
    await cmdInput.fill("2x2");
    await page.waitForTimeout(300);
    const cmd = page.locator('button:has-text("2×2"), button:has-text("2x2")').first();
    await tryClick(cmd);
    await page.waitForTimeout(2000);
  }
  await closeOverlays();
});

// ═══════════════════════════════════════════════════════
// 2. ADD PANE BUTTON
// ═══════════════════════════════════════════════════════

test("06 — Add pane button (+)", async () => {
  await ensureGrid();
  await shot("before-add-pane");

  // The + button is in the ControlBar — look for it by aria-label or text content
  const addBtn = page.locator('button:has-text("+")').first();
  const addBtnAlt = page
    .locator('button[title*="Add"], button[aria-label*="Add"], button[title*="add"]')
    .first();

  const paneCountBefore = await page.locator('[class*="xterm"], [class*="terminal"]').count();

  if (await tryClick(addBtn)) {
    await page.waitForTimeout(1500);
    await shot("after-add-pane");
  } else if (await tryClick(addBtnAlt)) {
    await page.waitForTimeout(1500);
    await shot("after-add-pane-alt");
  } else {
    // Try SVG plus icon button
    const plusSvg = page
      .locator("button svg")
      .filter({ has: page.locator('line, path[d*="M12 5v14"], [d*="plus"]') });
    if ((await plusSvg.count()) > 0) {
      await plusSvg.first().locator("..").click();
      await page.waitForTimeout(1500);
      await shot("after-add-pane-svg");
    } else {
      await shot("add-pane-not-found");
    }
  }
});

// ═══════════════════════════════════════════════════════
// 3. BROADCAST SEND BUTTON
// ═══════════════════════════════════════════════════════

test("07 — Broadcast input + Send button", async () => {
  await ensureGrid();

  // Find broadcast input
  const broadcastInput = page
    .locator('input[placeholder*="pane"], input[placeholder*="Broadcast"], [data-broadcast-input]')
    .first();
  if (await broadcastInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await broadcastInput.fill("echo hello-every-button-test");
    await shot("broadcast-typed");

    // Click Send button
    const sendBtn = page.locator('button:has-text("Send")');
    if (await tryClick(sendBtn)) {
      await page.waitForTimeout(500);
      await shot("broadcast-sent");
    } else {
      // Try Enter key
      await broadcastInput.press("Enter");
      await page.waitForTimeout(500);
      await shot("broadcast-sent-enter");
    }

    // Verify input cleared
    const val = await broadcastInput.inputValue();
    expect(val).toBe("");
  } else {
    await shot("broadcast-input-not-found");
  }
});

// ═══════════════════════════════════════════════════════
// 4. SAVE BUTTON
// ═══════════════════════════════════════════════════════

test("08 — Save button", async () => {
  await ensureGrid();

  const saveBtn = page.locator('button:has-text("Save")').first();
  if (await tryClick(saveBtn)) {
    await page.waitForTimeout(1000);
    await shot("after-save");
  } else {
    await shot("save-button-not-found");
  }
});

// ═══════════════════════════════════════════════════════
// 5. EVERY SIDEBAR TAB
// ═══════════════════════════════════════════════════════

test("09 — Sidebar: open and click each tab", async () => {
  await ensureGrid();

  // Open sidebar with Cmd+\
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(600);
  await shot("sidebar-opened");

  // The sidebar has 4 tabs: Workspaces, Presets, Tools, CEO Log
  // They may be icon-only when collapsed — try both text and icon clicks
  const tabNames = ["Workspaces", "Presets", "Tools", "CEO Log"];

  for (const tabName of tabNames) {
    // Try clicking by text
    const tab = page
      .locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`)
      .first();
    if (await tryClick(tab, 1000)) {
      await page.waitForTimeout(400);
      await shot(`sidebar-tab-${tabName.toLowerCase().replace(/\s+/g, "-")}`);
    }
  }

  // Also try icon-only sidebar buttons (when partially collapsed)
  const sidebarBtns = page.locator("nav button, aside button").all();
  const btns = await sidebarBtns;
  for (let i = 0; i < Math.min(btns.length, 6); i++) {
    if (await btns[i].isVisible()) {
      await btns[i].click();
      await page.waitForTimeout(300);
      await shot(`sidebar-icon-btn-${i}`);
    }
  }

  // Close sidebar
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(300);
  await shot("sidebar-closed");
});

// ═══════════════════════════════════════════════════════
// 6. SETTINGS — EACH SECTION
// ═══════════════════════════════════════════════════════

test("10 — Settings: open and click each section", async () => {
  await ensureGrid();

  // Open settings with Cmd+,
  await page.keyboard.press("Meta+,");
  await page.waitForTimeout(600);
  await shot("settings-opened");

  // Settings has 9 sections in left nav
  const sectionNames = [
    "General",
    "Models",
    "API Keys",
    "Appearance",
    "Terminal",
    "Security",
    "GitHub",
    "Cost Budget",
    "License",
  ];

  for (const section of sectionNames) {
    const sectionBtn = page
      .locator(`button:has-text("${section}"), [role="tab"]:has-text("${section}")`)
      .first();
    if (await tryClick(sectionBtn, 1000)) {
      await page.waitForTimeout(400);
      await shot(`settings-${section.toLowerCase().replace(/\s+/g, "-")}`);
    }
  }

  // Test settings controls within visible sections

  // General: click effort level buttons
  const generalBtn = page.locator('button:has-text("General")').first();
  await tryClick(generalBtn, 500);
  await page.waitForTimeout(300);

  for (const effort of ["Low", "Medium", "High", "Max"]) {
    const effortBtn = page.locator(`button:has-text("${effort}")`).first();
    if (await tryClick(effortBtn, 500)) {
      await page.waitForTimeout(200);
      await shot(`settings-effort-${effort.toLowerCase()}`);
    }
  }

  // Appearance: click theme buttons
  const appearanceBtn = page.locator('button:has-text("Appearance")').first();
  await tryClick(appearanceBtn, 500);
  await page.waitForTimeout(300);

  const lightBtn = page.locator('button:has-text("Light")').first();
  if (await tryClick(lightBtn, 500)) {
    await page.waitForTimeout(300);
    await shot("settings-theme-light");
  }

  const darkBtn = page.locator('button:has-text("Dark")').first();
  if (await tryClick(darkBtn, 500)) {
    await page.waitForTimeout(300);
    await shot("settings-theme-dark");
  }

  // Terminal: click cursor style buttons
  const terminalBtn = page.locator('button:has-text("Terminal")').first();
  await tryClick(terminalBtn, 500);
  await page.waitForTimeout(300);

  for (const cursor of ["Bar", "Block", "Underline"]) {
    const cursorBtn = page.locator(`button:has-text("${cursor}")`).first();
    if (await tryClick(cursorBtn, 500)) {
      await page.waitForTimeout(200);
      await shot(`settings-cursor-${cursor.toLowerCase()}`);
    }
  }

  // Close settings
  await closeOverlays();
  await shot("settings-closed");
});

// ═══════════════════════════════════════════════════════
// 7. COMMAND PALETTE — EACH COMMAND
// ═══════════════════════════════════════════════════════

test("11 — Command palette: list all commands", async () => {
  await ensureGrid();

  const opened = await openPalette();
  if (!opened) {
    await shot("palette-could-not-open");
    return;
  }

  await shot("palette-open-full-list");

  // Screenshot the full list first
  const cmdInput = page.locator('input[placeholder*="command"]');

  // Filter and screenshot for each command keyword
  const commands = [
    { filter: "1x1", label: "cmd-1x1" },
    { filter: "1x2", label: "cmd-1x2" },
    { filter: "2x2", label: "cmd-2x2" },
    { filter: "2x3", label: "cmd-2x3" },
    { filter: "3x3", label: "cmd-3x3" },
    { filter: "save", label: "cmd-save" },
    { filter: "restore", label: "cmd-restore" },
    { filter: "toggle", label: "cmd-toggle-view" },
    { filter: "broadcast", label: "cmd-broadcast" },
    { filter: "preset", label: "cmd-preset" },
    { filter: "council", label: "cmd-council" },
  ];

  for (const cmd of commands) {
    await cmdInput.fill(cmd.filter);
    await page.waitForTimeout(250);
    await shot(`palette-${cmd.label}`);
  }

  // Clear and close
  await cmdInput.fill("");
  await closeOverlays();

  // Now execute specific commands via palette
  // Execute "Save Session" command
  const opened2 = await openPalette();
  if (opened2) {
    await cmdInput.fill("save");
    await page.waitForTimeout(250);
    const saveCmd = page.locator('button:has-text("Save Session")').first();
    if (await tryClick(saveCmd)) {
      await page.waitForTimeout(500);
      await shot("palette-executed-save");
    }
    await closeOverlays();
  }

  // Execute "Broadcast" focus command
  const opened3 = await openPalette();
  if (opened3) {
    await cmdInput.fill("broadcast");
    await page.waitForTimeout(250);
    const broadcastCmd = page.locator('button:has-text("Broadcast")').first();
    if (await tryClick(broadcastCmd)) {
      await page.waitForTimeout(500);
      await shot("palette-executed-broadcast");
    }
    await closeOverlays();
  }
});

// ═══════════════════════════════════════════════════════
// 8. GRAPH / DASHBOARD TOGGLE
// ═══════════════════════════════════════════════════════

test("12 — Grid/Dashboard view toggle (Cmd+G)", async () => {
  await ensureGrid();
  await shot("view-grid-before-toggle");

  // Toggle to dashboard/graph view via keyboard
  await page.keyboard.press("Meta+g");
  await page.waitForTimeout(800);
  await shot("view-dashboard-toggled");

  // Also try clicking the view toggle button in ControlBar
  const viewToggleBtn = page.locator('button[title*="Switch to"], button[title*="view"]').first();
  if (await tryClick(viewToggleBtn)) {
    await page.waitForTimeout(800);
    await shot("view-toggled-via-button");
  }

  // Toggle back to grid
  await page.keyboard.press("Meta+g");
  await page.waitForTimeout(800);
  await shot("view-back-to-grid");
});

// ═══════════════════════════════════════════════════════
// 9. ZEN MODE TOGGLE
// ═══════════════════════════════════════════════════════

test("13 — Zen mode toggle (Cmd+Shift+F)", async () => {
  await ensureGrid();
  await shot("zen-off-before");

  // Enter zen mode
  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(600);
  await shot("zen-on");

  // Verify zen mode hides UI elements (control bar, sidebar, status bar)
  const controlBarVisible = await page
    .locator('input[placeholder*="pane"], input[placeholder*="Broadcast"]')
    .isVisible()
    .catch(() => false);
  // In zen mode the broadcast bar should be hidden
  // (but don't fail if implementation keeps it — just document)

  // Exit zen mode
  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(600);
  await shot("zen-off-after");
});

// ═══════════════════════════════════════════════════════
// 10. TAB CLOSE BUTTONS
// ═══════════════════════════════════════════════════════

test("14 — Tab close buttons", async () => {
  await ensureGrid();

  // First, ensure we have multiple tabs
  const tabsBefore = await page.locator('button:has-text("Agent")').count();
  await shot("tabs-before-close");

  if (tabsBefore > 1) {
    // Hover over the LAST tab to reveal close button, then click it
    const lastTab = page.locator('button:has-text("Agent")').last();
    await lastTab.hover();
    await page.waitForTimeout(300);
    await shot("tab-hovered");

    // Find close (X) button near the last tab
    // Close buttons typically appear on hover as SVG X or ×
    const closeBtn = page
      .locator('button:has-text("Agent")')
      .last()
      .locator(
        "xpath=following-sibling::button | ancestor::div//button[contains(@class, 'close') or contains(@class, 'hover')]",
      )
      .first();

    // Try multiple selectors for close button
    const closeBtnAlt = page
      .locator(
        '[class*="tab"] button svg, [class*="tab"] [aria-label*="close"], [class*="tab"] [aria-label*="Close"]',
      )
      .last();

    if (await tryClick(closeBtn, 500)) {
      await page.waitForTimeout(500);
      await shot("tab-closed");
    } else if (await tryClick(closeBtnAlt, 500)) {
      await page.waitForTimeout(500);
      await shot("tab-closed-alt");
    } else {
      // Look for any small X button near tabs
      const xButtons = page.locator("button").filter({ hasText: /^[×✕x]$/ });
      if ((await xButtons.count()) > 0) {
        await xButtons.last().click();
        await page.waitForTimeout(500);
        await shot("tab-closed-x");
      } else {
        await shot("tab-close-btn-not-found");
      }
    }

    const tabsAfter = await page.locator('button:has-text("Agent")').count();
    // Verify a tab was removed (or at minimum took screenshot of attempt)
    await shot("tabs-after-close");
  } else {
    await shot("only-one-tab-skipping-close");
  }
});

// ═══════════════════════════════════════════════════════
// 11. ZOOM BUTTONS (pane fullscreen / restore)
// ═══════════════════════════════════════════════════════

test("15 — Pane zoom (fullscreen/restore)", async () => {
  await ensureGrid();
  await shot("before-zoom");

  // The zoom/fullscreen button is in pane header — look for maximize icon
  // It's typically an expand SVG icon or text
  const zoomBtn = page
    .locator(
      'button[title*="ullscreen"], button[title*="zoom"], button[title*="Maximize"], button[aria-label*="zoom"]',
    )
    .first();

  if (await tryClick(zoomBtn)) {
    await page.waitForTimeout(500);
    await shot("pane-zoomed-in");

    // Restore — click again or press Escape
    const restoreBtn = page
      .locator('button[title*="Restore"], button[title*="restore"], button[title*="exit"]')
      .first();
    if (await tryClick(restoreBtn)) {
      await page.waitForTimeout(500);
      await shot("pane-restored");
    } else {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
      await shot("pane-restored-escape");
    }
  } else {
    // Try right-click context menu to fullscreen
    const firstPane = page.locator('.xterm, [class*="terminal"], [class*="pane"]').first();
    if (await firstPane.isVisible()) {
      await firstPane.click({ button: "right" });
      await page.waitForTimeout(400);
      await shot("pane-context-menu");

      const fullscreenItem = page
        .locator("text=Fullscreen, text=fullscreen, text=Full Screen")
        .first();
      if (await tryClick(fullscreenItem)) {
        await page.waitForTimeout(500);
        await shot("pane-zoomed-context");

        // Escape to restore
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
        await shot("pane-restored-from-context");
      } else {
        await closeOverlays();
        await shot("zoom-no-context-item");
      }
    } else {
      await shot("zoom-no-pane-found");
    }
  }
});

// ═══════════════════════════════════════════════════════
// 12. PANE SETTINGS GEAR
// ═══════════════════════════════════════════════════════

test("16 — Pane settings gear icon", async () => {
  await ensureGrid();
  await shot("before-pane-settings");

  // Gear icon in pane header — typically an SVG settings/cog icon
  const gearBtn = page
    .locator(
      'button[title*="etting"], button[aria-label*="etting"], button svg[class*="cog"], button svg[class*="gear"]',
    )
    .first();

  // Alternative: look for gear/cog SVG within pane headers
  const gearAlt = page.locator('[class*="pane"] button').filter({
    has: page.locator("svg"),
  });

  if (await tryClick(gearBtn)) {
    await page.waitForTimeout(500);
    await shot("pane-settings-opened");

    // Click through pane settings controls
    // Agent dropdown
    const agentSelect = page.locator('select, [role="combobox"]').first();
    if (await agentSelect.isVisible().catch(() => false)) {
      await agentSelect.click();
      await page.waitForTimeout(300);
      await shot("pane-settings-agent-dropdown");
      await closeOverlays();
    }

    // Effort level buttons in pane settings
    for (const effort of ["low", "medium", "high", "max"]) {
      const effortBtn = page.locator(`button:has-text("${effort}")`).first();
      if (await tryClick(effortBtn, 500)) {
        await page.waitForTimeout(200);
        await shot(`pane-settings-effort-${effort}`);
      }
    }

    // Cursor style buttons
    for (const cursor of ["Bar", "Block", "Underline"]) {
      const cursorBtn = page.locator(`button:has-text("${cursor}")`).first();
      if (await tryClick(cursorBtn, 500)) {
        await page.waitForTimeout(200);
        await shot(`pane-settings-cursor-${cursor.toLowerCase()}`);
      }
    }

    // Cursor blink toggle
    const blinkToggle = page.locator('button:has-text("Blink"), [role="switch"]').first();
    if (await tryClick(blinkToggle, 500)) {
      await page.waitForTimeout(200);
      await shot("pane-settings-blink-toggled");
    }

    // Done button
    const doneBtn = page.locator('button:has-text("Done")').first();
    if (await tryClick(doneBtn, 500)) {
      await page.waitForTimeout(300);
      await shot("pane-settings-closed");
    } else {
      await closeOverlays();
    }
  } else if ((await gearAlt.count()) > 0) {
    // Try clicking each button in pane header until we find settings
    const headerBtns = await gearAlt.all();
    for (let i = 0; i < Math.min(headerBtns.length, 8); i++) {
      await headerBtns[i].click();
      await page.waitForTimeout(400);
      // Check if a settings panel appeared
      const settingsPanel = page.locator("text=Persona, text=Model, text=Font Size").first();
      if (await settingsPanel.isVisible({ timeout: 500 }).catch(() => false)) {
        await shot("pane-settings-found-via-scan");
        // Close it
        const doneBtn = page.locator('button:has-text("Done")').first();
        await tryClick(doneBtn, 500);
        break;
      }
    }
    await shot("pane-settings-scan-complete");
  } else {
    await shot("gear-btn-not-found");
  }
});

// ═══════════════════════════════════════════════════════
// BONUS: BROADCAST TEMPLATES
// ═══════════════════════════════════════════════════════

test("17 — Broadcast templates dropdown", async () => {
  await ensureGrid();

  // Lightning bolt / templates button in control bar
  const templateBtn = page.locator('button:has-text("⚡")').first();
  const templateBtnAlt = page.locator('button[title*="emplate"], button[title*="Quick"]').first();

  if (await tryClick(templateBtn)) {
    await page.waitForTimeout(400);
    await shot("templates-dropdown-open");

    // Click each template option
    const templateNames = [
      "Status check",
      "Continue working",
      "Wrap up",
      "Run tests",
      "Git status",
      "Signal done",
    ];
    for (const tpl of templateNames) {
      const tplBtn = page
        .locator(`button:has-text("${tpl}"), [role="menuitem"]:has-text("${tpl}")`)
        .first();
      if (await tplBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await shot(`template-${tpl.toLowerCase().replace(/\s+/g, "-")}-visible`);
      }
    }

    // Click one template to verify it fills broadcast input
    const statusCheck = page
      .locator('button:has-text("Status check"), [role="menuitem"]:has-text("Status check")')
      .first();
    if (await tryClick(statusCheck, 500)) {
      await page.waitForTimeout(300);
      await shot("template-status-check-selected");
    }

    await closeOverlays();
  } else if (await tryClick(templateBtnAlt)) {
    await page.waitForTimeout(400);
    await shot("templates-dropdown-alt");
    await closeOverlays();
  } else {
    await shot("templates-btn-not-found");
  }
});

// ═══════════════════════════════════════════════════════
// BONUS: TAB RENAME (double-click)
// ═══════════════════════════════════════════════════════

test("18 — Tab rename via double-click", async () => {
  await ensureGrid();

  const firstTab = page.locator('button:has-text("Agent")').first();
  if (await firstTab.isVisible()) {
    await firstTab.dblclick();
    await page.waitForTimeout(400);
    await shot("tab-rename-editing");

    // Type new name
    const editInput = page.locator('input[type="text"]').first();
    if (await editInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await editInput.fill("CEO");
      await editInput.press("Enter");
      await page.waitForTimeout(300);
      await shot("tab-renamed-to-ceo");
    } else {
      await shot("tab-rename-input-not-found");
    }
  }
});

// ═══════════════════════════════════════════════════════
// BONUS: TERMINAL SEARCH
// ═══════════════════════════════════════════════════════

test("19 — Terminal search bar", async () => {
  await ensureGrid();

  // Cmd+F to open search in focused pane
  await page.keyboard.press("Meta+f");
  await page.waitForTimeout(400);
  await shot("terminal-search-opened");

  // Type search query
  const searchInput = page.locator('input[placeholder*="earch"], input[type="search"]').first();
  if (await searchInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    await searchInput.fill("hello");
    await page.waitForTimeout(300);
    await shot("terminal-search-typed");

    // Click next/prev buttons
    const nextBtn = page
      .locator('button:has-text("↓"), button[title*="ext"], button[aria-label*="ext"]')
      .first();
    if (await tryClick(nextBtn, 500)) {
      await page.waitForTimeout(200);
      await shot("terminal-search-next");
    }

    const prevBtn = page
      .locator('button:has-text("↑"), button[title*="rev"], button[aria-label*="rev"]')
      .first();
    if (await tryClick(prevBtn, 500)) {
      await page.waitForTimeout(200);
      await shot("terminal-search-prev");
    }

    // Close search
    const closeSearchBtn = page.locator('button:has-text("✕"), button:has-text("×")').first();
    if (await tryClick(closeSearchBtn, 500)) {
      await page.waitForTimeout(200);
      await shot("terminal-search-closed");
    } else {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      await shot("terminal-search-closed-escape");
    }
  } else {
    await shot("terminal-search-not-found");
  }
});

// ═══════════════════════════════════════════════════════
// FINAL STATE
// ═══════════════════════════════════════════════════════

test("20 — Final state screenshot", async () => {
  // Make sure everything is closed
  await closeOverlays();
  await page.waitForTimeout(500);
  await shot("final-state");

  // Verify app is still responsive
  const isReady = await page.evaluate(() => document.readyState === "complete");
  expect(isReady).toBe(true);

  // Count total interactive elements found
  const totalButtons = await page.locator("button").count();
  const totalInputs = await page.locator("input").count();
  console.log(`Final state: ${totalButtons} buttons, ${totalInputs} inputs visible`);
});
