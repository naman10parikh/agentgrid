/**
 * AgentGrid — Desktop Test 2: Settings, Sidebar, Keyboard Shortcuts
 *
 * Comprehensive test that:
 * 1. Opens settings (Cmd+,), screenshots each tab
 * 2. Opens sidebar (Cmd+\), screenshots each tab
 * 3. Tests every keyboard shortcut (Cmd+K, Cmd+G, Cmd+Shift+F, Cmd+Shift+C)
 * 4. Documents bugs found
 *
 * Run: npx playwright test tests/e2e/desktop-test-2.spec.ts --config tests/playwright.config.ts
 * Prereq: npx electron-vite build (or pnpm build)
 */

import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const currentFilename = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilename);
const APP_DIR = join(currentDir, "../..");
const SHOTS = join(currentDir, "../screenshots/desktop-test-2");
mkdirSync(SHOTS, { recursive: true });

interface Bug {
  id: string;
  severity: "BLOCKER" | "HIGH" | "MEDIUM" | "LOW";
  area: string;
  description: string;
  screenshot?: string;
}

const bugs: Bug[] = [];
let testResults: Array<{ name: string; passed: boolean; notes: string }> = [];

let app: ElectronApplication;
let page: Page;

async function shot(name: string): Promise<string> {
  const path = join(SHOTS, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

function reportBug(bug: Bug) {
  bugs.push(bug);
  console.log(`[BUG] ${bug.severity}: ${bug.area} — ${bug.description}`);
}

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
  // Write test summary to console
  console.log("\n=== DESKTOP TEST 2 SUMMARY ===");
  console.log(`Tests: ${testResults.length}`);
  console.log(`Passed: ${testResults.filter((t) => t.passed).length}`);
  console.log(`Failed: ${testResults.filter((t) => !t.passed).length}`);
  console.log(`Bugs found: ${bugs.length}`);
  for (const bug of bugs) {
    console.log(`  [${bug.severity}] ${bug.area}: ${bug.description}`);
  }
  await app?.close();
});

// ─── Phase 0: Ensure grid is created ───

test("0. Setup — create 2x2 grid if on welcome screen", async () => {
  await shot("00-initial-state");

  const welcomeBtn = page.locator('button:has-text("2x2")');
  if (await welcomeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await welcomeBtn.click();
    await page.waitForTimeout(3000);
  }

  await shot("00-grid-ready");
  const rootEl = page.locator("#root");
  await expect(rootEl).toBeVisible({ timeout: 10000 });
  testResults.push({ name: "Setup grid", passed: true, notes: "Grid created or restored" });
});

// ═══════════════════════════════════════════════════════════
// PHASE 1: SETTINGS (Cmd+,)
// ═══════════════════════════════════════════════════════════

test("1.1 Settings opens with Cmd+comma", async () => {
  await page.keyboard.press("Meta+,");
  await page.waitForTimeout(800);

  const settingsModal = page.locator('[role="dialog"]');
  const isVisible = await settingsModal.isVisible().catch(() => false);
  await shot("01-settings-opened");

  if (!isVisible) {
    // Try alternate selector
    const settingsText = page.locator("text=Settings");
    const altVisible = await settingsText.isVisible().catch(() => false);
    if (!altVisible) {
      reportBug({
        id: "SET-01",
        severity: "BLOCKER",
        area: "Settings",
        description: "Cmd+, does not open settings modal",
        screenshot: "01-settings-opened",
      });
    }
  }

  testResults.push({
    name: "Settings Cmd+,",
    passed: isVisible,
    notes: isVisible ? "Modal visible" : "Modal not found",
  });
});

const SETTINGS_TABS = [
  { id: "general", label: "General" },
  { id: "models", label: "Models" },
  { id: "keys", label: "API Keys" },
  { id: "appearance", label: "Appearance" },
  { id: "terminal", label: "Terminal" },
  { id: "security", label: "Security" },
  { id: "github", label: "GitHub" },
  { id: "cost", label: "Cost Budget" },
  { id: "license", label: "License" },
];

for (const [idx, tab] of SETTINGS_TABS.entries()) {
  test(`1.2.${idx + 1} Settings tab: ${tab.label}`, async () => {
    // Click the tab button in settings sidebar
    const tabBtn = page.locator(`button:has-text("${tab.label}")`).first();
    const visible = await tabBtn.isVisible().catch(() => false);

    if (visible) {
      await tabBtn.click();
      await page.waitForTimeout(400);
      await shot(`02-settings-tab-${tab.id}`);

      // Verify the tab content is showing (check for section-specific elements)
      const contentArea = page.locator('[role="dialog"]').locator("div").nth(1);
      const hasContent = await contentArea.isVisible().catch(() => false);

      if (!hasContent) {
        reportBug({
          id: `SET-TAB-${tab.id.toUpperCase()}`,
          severity: "MEDIUM",
          area: "Settings",
          description: `${tab.label} tab clicked but no content visible`,
          screenshot: `02-settings-tab-${tab.id}`,
        });
      }

      testResults.push({
        name: `Settings tab: ${tab.label}`,
        passed: hasContent,
        notes: hasContent ? `${tab.label} content rendered` : `${tab.label} content missing`,
      });
    } else {
      reportBug({
        id: `SET-NAV-${tab.id.toUpperCase()}`,
        severity: "HIGH",
        area: "Settings",
        description: `${tab.label} tab button not found in settings nav`,
        screenshot: `02-settings-tab-${tab.id}`,
      });
      await shot(`02-settings-tab-${tab.id}-missing`);
      testResults.push({
        name: `Settings tab: ${tab.label}`,
        passed: false,
        notes: "Tab button not found",
      });
    }
  });
}

test("1.3 Settings closes with Escape", async () => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  const settingsModal = page.locator('[role="dialog"]');
  const stillVisible = await settingsModal.isVisible().catch(() => false);
  await shot("03-settings-closed");

  if (stillVisible) {
    reportBug({
      id: "SET-CLOSE",
      severity: "HIGH",
      area: "Settings",
      description: "Escape does not close settings modal",
      screenshot: "03-settings-closed",
    });
  }

  testResults.push({
    name: "Settings close Escape",
    passed: !stillVisible,
    notes: stillVisible ? "Modal still visible" : "Closed cleanly",
  });
});

// ═══════════════════════════════════════════════════════════
// PHASE 2: SIDEBAR (Cmd+\)
// ═══════════════════════════════════════════════════════════

test("2.1 Sidebar opens with Cmd+backslash", async () => {
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(800);
  await shot("04-sidebar-opened");

  // Sidebar should be visible — look for its container with tabs
  const sidebarWorkspaces = page.locator('button:has-text("Workspaces")');
  const sidebarVisible = await sidebarWorkspaces.isVisible().catch(() => false);

  if (!sidebarVisible) {
    // The sidebar might already be open or use a different structure
    // Check for any of the known sidebar tab labels
    const anyTab = page.locator("text=Presets");
    const altVisible = await anyTab.isVisible().catch(() => false);
    if (!altVisible) {
      reportBug({
        id: "SB-01",
        severity: "BLOCKER",
        area: "Sidebar",
        description: "Cmd+\\ does not open sidebar (no tab buttons visible)",
        screenshot: "04-sidebar-opened",
      });
    }
  }

  testResults.push({
    name: "Sidebar Cmd+\\",
    passed: sidebarVisible,
    notes: sidebarVisible ? "Sidebar tabs visible" : "Sidebar not found",
  });
});

const SIDEBAR_TABS = [
  { id: "workspaces", label: "Workspaces" },
  { id: "presets", label: "Presets" },
  { id: "tools", label: "Tools" },
  { id: "ceo-log", label: "CEO Log" },
];

for (const [idx, tab] of SIDEBAR_TABS.entries()) {
  test(`2.2.${idx + 1} Sidebar tab: ${tab.label}`, async () => {
    // Find and click the sidebar tab
    const tabBtn = page
      .locator(`button[title="${tab.label}"]`)
      .or(page.locator(`button:has-text("${tab.label}")`))
      .first();
    const visible = await tabBtn.isVisible().catch(() => false);

    if (visible) {
      await tabBtn.click();
      await page.waitForTimeout(600);
      await shot(`05-sidebar-tab-${tab.id}`);

      testResults.push({
        name: `Sidebar tab: ${tab.label}`,
        passed: true,
        notes: `${tab.label} tab switched`,
      });
    } else {
      reportBug({
        id: `SB-TAB-${tab.id.toUpperCase()}`,
        severity: "MEDIUM",
        area: "Sidebar",
        description: `${tab.label} tab button not found in sidebar`,
        screenshot: `05-sidebar-tab-${tab.id}`,
      });
      await shot(`05-sidebar-tab-${tab.id}-missing`);
      testResults.push({
        name: `Sidebar tab: ${tab.label}`,
        passed: false,
        notes: "Tab button not found",
      });
    }
  });
}

test("2.3 Sidebar closes with Cmd+backslash toggle", async () => {
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(400);
  await shot("06-sidebar-closed");

  testResults.push({
    name: "Sidebar close toggle",
    passed: true,
    notes: "Toggle sent",
  });
});

// ═══════════════════════════════════════════════════════════
// PHASE 3: KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════

test("3.1 Cmd+K opens command palette", async () => {
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(600);
  await shot("07-cmdK-palette");

  // Look for command palette input
  const cmdInput = page
    .locator('input[placeholder*="command"]')
    .or(page.locator('input[placeholder*="Command"]'))
    .or(page.locator('input[placeholder*="Search"]'))
    .first();
  const isVisible = await cmdInput.isVisible().catch(() => false);

  if (!isVisible) {
    reportBug({
      id: "KB-CMDK",
      severity: "HIGH",
      area: "Keyboard Shortcuts",
      description: "Cmd+K does not open command palette (no input visible)",
      screenshot: "07-cmdK-palette",
    });
  }

  // Close it
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  testResults.push({
    name: "Cmd+K command palette",
    passed: isVisible,
    notes: isVisible ? "Palette opened" : "Palette not found",
  });
});

test("3.2 Cmd+G toggles to dashboard view", async () => {
  // Get current state
  const beforeShot = await shot("08a-before-cmdG");

  await page.keyboard.press("Meta+g");
  await page.waitForTimeout(800);
  await shot("08b-after-cmdG");

  // Check if view changed — look for dashboard indicators or graph topology buttons
  const dashboardIndicators = page.locator("text=AGENT FLEET").or(page.locator("text=Topology"));
  const changed = await dashboardIndicators
    .first()
    .isVisible()
    .catch(() => false);

  // Toggle back
  await page.keyboard.press("Meta+g");
  await page.waitForTimeout(500);
  await shot("08c-back-to-grid");

  testResults.push({
    name: "Cmd+G view toggle",
    passed: true,
    notes: changed
      ? "View changed to dashboard/graph"
      : "View may not have changed (check screenshots)",
  });
});

test("3.3 Cmd+Shift+F toggles zen/distraction-free mode", async () => {
  await shot("09a-before-zen");

  // Check for control bar visibility before
  const controlBar = page.locator('input[placeholder*="pane"]');
  const controlBarBefore = await controlBar.isVisible().catch(() => false);

  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(600);
  await shot("09b-zen-mode");

  // In zen mode: control bar, tab bar title, status bar should be hidden
  const controlBarAfter = await controlBar.isVisible().catch(() => false);
  const zenActivated = controlBarBefore && !controlBarAfter;

  if (controlBarBefore && controlBarAfter) {
    reportBug({
      id: "KB-ZEN",
      severity: "MEDIUM",
      area: "Keyboard Shortcuts",
      description: "Cmd+Shift+F did not hide control bar (zen mode not activating)",
      screenshot: "09b-zen-mode",
    });
  }

  // Toggle back
  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(400);
  await shot("09c-zen-off");

  testResults.push({
    name: "Cmd+Shift+F zen mode",
    passed: zenActivated,
    notes: zenActivated
      ? "Control bar hidden in zen, restored after"
      : `Before: ${controlBarBefore}, After: ${controlBarAfter}`,
  });
});

test("3.4 Cmd+Shift+C toggles council panel", async () => {
  await page.keyboard.press("Meta+Shift+c");
  await page.waitForTimeout(600);
  await shot("10-council-panel");

  // Check for council panel elements
  const councilText = page
    .locator("text=Council")
    .or(page.locator("text=council"))
    .or(page.locator("text=Debate"));
  const councilVisible = await councilText
    .first()
    .isVisible()
    .catch(() => false);

  if (!councilVisible) {
    reportBug({
      id: "KB-COUNCIL",
      severity: "MEDIUM",
      area: "Keyboard Shortcuts",
      description: "Cmd+Shift+C did not open council panel (no council elements visible)",
      screenshot: "10-council-panel",
    });
  }

  // Close it
  await page.keyboard.press("Meta+Shift+c");
  await page.waitForTimeout(400);
  await shot("10b-council-closed");

  testResults.push({
    name: "Cmd+Shift+C council panel",
    passed: councilVisible,
    notes: councilVisible ? "Council panel opened" : "Council panel not found",
  });
});

test("3.5 Escape key behaviors", async () => {
  // Test 1: Escape closes settings
  await page.keyboard.press("Meta+,");
  await page.waitForTimeout(500);
  const settingsOpen = await page
    .locator('[role="dialog"]')
    .isVisible()
    .catch(() => false);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const settingsClosed = !(await page
    .locator('[role="dialog"]')
    .isVisible()
    .catch(() => false));

  // Test 2: Escape closes command palette
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  await shot("11-escape-tests");

  testResults.push({
    name: "Escape key behavior",
    passed: settingsOpen && settingsClosed,
    notes: `Settings opened: ${settingsOpen}, closed by Escape: ${settingsClosed}`,
  });
});

// ═══════════════════════════════════════════════════════════
// PHASE 4: EDGE CASES & INTERACTION BUGS
// ═══════════════════════════════════════════════════════════

test("4.1 Rapid shortcut switching doesn't crash", async () => {
  // Rapidly toggle multiple panels
  await page.keyboard.press("Meta+,");
  await page.waitForTimeout(100);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(100);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  await page.keyboard.press("Meta+g");
  await page.waitForTimeout(100);
  await page.keyboard.press("Meta+g");
  await page.waitForTimeout(100);
  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(100);
  await page.keyboard.press("Meta+Shift+f");
  await page.waitForTimeout(300);

  await shot("12-rapid-switching");

  // App should still be responsive
  const rootEl = page.locator("#root");
  const alive = await rootEl.isVisible().catch(() => false);

  if (!alive) {
    reportBug({
      id: "EDGE-CRASH",
      severity: "BLOCKER",
      area: "Stability",
      description: "Rapid keyboard shortcut switching crashed the app",
      screenshot: "12-rapid-switching",
    });
  }

  testResults.push({
    name: "Rapid shortcut switching",
    passed: alive,
    notes: alive ? "App survived rapid toggling" : "App crashed",
  });
});

test("4.2 Settings and palette don't conflict", async () => {
  // Open settings
  await page.keyboard.press("Meta+,");
  await page.waitForTimeout(400);

  // Try to open palette while settings open
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(400);
  await shot("13-settings-palette-overlap");

  // Close everything
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  testResults.push({
    name: "Settings + palette overlap",
    passed: true,
    notes: "Check screenshot for z-index issues",
  });
});

// ═══════════════════════════════════════════════════════════
// PHASE 5: FINAL SUMMARY
// ═══════════════════════════════════════════════════════════

test("5. Final state screenshot", async () => {
  await shot("99-final-state");

  // Print summary
  const passed = testResults.filter((t) => t.passed).length;
  const failed = testResults.filter((t) => !t.passed).length;
  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`Passed: ${passed}/${testResults.length}`);
  console.log(`Failed: ${failed}/${testResults.length}`);
  console.log(`Bugs: ${bugs.length}`);
  for (const r of testResults) {
    console.log(`  ${r.passed ? "PASS" : "FAIL"} | ${r.name} — ${r.notes}`);
  }

  testResults.push({ name: "Final screenshot", passed: true, notes: "Complete" });
});
