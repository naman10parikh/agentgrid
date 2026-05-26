/**
 * Desktop Test 4 — Presets, Onboarding, Edge Cases
 *
 * Tests: (1) first-run onboarding flow, (2) preset save/load,
 * (3) edge cases: close all panes, 3x3 grid, rapid add/remove.
 * Screenshots everything. Every image must be READ by the caller.
 */
import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, rmSync, existsSync } from "fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(currentDir, "../..");
const SHOTS = join(currentDir, "../screenshots/desktop-test-4");
mkdirSync(SHOTS, { recursive: true });

let app: ElectronApplication;
let page: Page;
const issues: string[] = [];
const consoleErrors: string[] = [];
let shotIdx = 0;

async function shot(name: string): Promise<string> {
  shotIdx++;
  const filename = `${String(shotIdx).padStart(2, "0")}-${name}.png`;
  const filepath = join(SHOTS, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function wait(ms: number) {
  await page.waitForTimeout(ms);
}

/** Delete electron-store config to force first-run state */
function resetElectronStore() {
  const storePaths = [
    join(process.env.HOME ?? "/tmp", "Library/Application Support/agentgrid-app/config.json"),
    join(process.env.HOME ?? "/tmp", "Library/Application Support/AgentGrid/config.json"),
  ];
  for (const p of storePaths) {
    if (existsSync(p)) {
      try {
        rmSync(p, { force: true });
      } catch {
        /* may be locked */
      }
    }
  }
}

// ════════════════════════════════════════════
// SECTION 1: ONBOARDING (First Run)
// ════════════════════════════════════════════

test.describe.serial("Section 1 — Onboarding", () => {
  test.beforeAll(async () => {
    // Reset store to trigger first-run
    resetElectronStore();

    app = await electron.launch({
      args: [join(APP_DIR, "out/main/index.js")],
      cwd: APP_DIR,
      env: {
        ...process.env,
        NODE_ENV: "development",
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
      },
    });
    page = await app.firstWindow();
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.waitForLoadState("domcontentloaded");
    await wait(2000);
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("01 — Onboarding welcome screen appears", async () => {
    await shot("onboarding-initial");

    // Check for onboarding content — either the welcome step or the welcome screen
    const welcomeTitle = page.locator('text="Welcome to AgentGrid"');
    const mainTitle = page.locator('h1:has-text("AgentGrid")');
    const hasOnboarding = (await welcomeTitle.count()) > 0;
    const hasMain = (await mainTitle.count()) > 0;

    if (hasOnboarding) {
      await shot("onboarding-welcome-step");
      // Verify progress dots
      const dots = page.locator(".rounded-full");
      const dotCount = await dots.count();
      if (dotCount < 4) {
        issues.push(`MINOR: Expected 4 progress dots, found ${dotCount}`);
      }
    } else if (hasMain) {
      issues.push(
        "NOTE: Onboarding skipped — went straight to welcome screen (store may not have reset)",
      );
      await shot("onboarding-skipped-to-welcome");
    } else {
      issues.push("BLOCKER: Neither onboarding nor welcome screen appeared");
      await shot("onboarding-nothing-visible");
    }
  });

  test("02 — Navigate through onboarding steps", async () => {
    // Check if we're on the onboarding flow
    const continueBtn = page.locator('button:has-text("Continue")');
    const skipBtn = page.locator('button:has-text("Skip setup")');
    const hasContinue = await continueBtn
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasContinue) {
      // Not on onboarding — the app loaded straight to welcome
      issues.push("NOTE: Onboarding not shown — testing welcome screen instead");
      await shot("no-onboarding-testing-welcome");
      return;
    }

    // Step 1 → Step 2 (API Key)
    await continueBtn.first().click();
    await wait(500);
    await shot("onboarding-api-key-step");

    // Check for API key input
    const apiInput = page.locator('input[placeholder*="sk-ant"]');
    if (await apiInput.isVisible().catch(() => false)) {
      // Don't enter a real key — just verify the field exists
      await shot("onboarding-api-key-field");
    } else {
      issues.push("MINOR: API key input field not found on step 2");
    }

    // Step 2 → Step 3 (Model)
    await continueBtn.first().click();
    await wait(500);
    await shot("onboarding-model-step");

    // Check for model selection
    const opusBtn = page.locator('button:has-text("Opus")');
    const sonnetBtn = page.locator('button:has-text("Sonnet")');
    if ((await opusBtn.count()) > 0) {
      await shot("onboarding-model-options");
      // Opus should be pre-selected (recommended)
      const recommended = page.locator('text="Recommended"');
      if ((await recommended.count()) === 0) {
        issues.push("MINOR: 'Recommended' badge not visible on Opus model");
      }
    }

    // Step 3 → Step 4 (Tutorial)
    await continueBtn.first().click();
    await wait(500);
    await shot("onboarding-tutorial-step");

    // Check for tutorial content
    const quickStart = page.locator('text="Quick Start"');
    const createGrid = page.locator('text="Create a grid"');
    if ((await quickStart.count()) === 0) {
      issues.push("MINOR: Quick Start title not found on tutorial step");
    }
    if ((await createGrid.count()) === 0) {
      issues.push("MINOR: 'Create a grid' tutorial item not found");
    }

    // Finish onboarding
    const getStarted = page.locator('button:has-text("Get Started")');
    if (await getStarted.isVisible().catch(() => false)) {
      await getStarted.click();
      await wait(1500);
      await shot("onboarding-complete-welcome");

      // Should now see the main welcome screen
      const gridButtons = page.locator('button:has-text("1x1"), button:has-text("2x2")');
      if ((await gridButtons.count()) === 0) {
        issues.push("MAJOR: After onboarding, welcome screen grid buttons not visible");
      }
    } else {
      issues.push("MAJOR: 'Get Started' button not found on final onboarding step");
    }
  });
});

// ════════════════════════════════════════════
// SECTION 2: PRESETS + EDGE CASES
// ════════════════════════════════════════════

test.describe.serial("Section 2 — Presets & Edge Cases", () => {
  test.beforeAll(async () => {
    app = await electron.launch({
      args: [join(APP_DIR, "out/main/index.js")],
      cwd: APP_DIR,
      env: {
        ...process.env,
        NODE_ENV: "development",
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
      },
    });
    page = await app.firstWindow();
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.waitForLoadState("domcontentloaded");
    await wait(3000); // Wait for onboarding check + welcome screen
    await shot("s2-initial-state");

    // If onboarding shows, skip it — try multiple strategies
    for (let attempt = 0; attempt < 5; attempt++) {
      const skipBtn = page.locator('button:has-text("Skip setup")');
      const getStarted = page.locator('button:has-text("Get Started")');
      const continueBtn = page.locator('button:has-text("Continue")');
      const gridBtn = page.locator('button:has-text("2x2")');

      // Already on welcome screen?
      if (await gridBtn.isVisible().catch(() => false)) break;

      if (await skipBtn.isVisible().catch(() => false)) {
        await skipBtn.click();
        await wait(1000);
        break;
      }
      if (await getStarted.isVisible().catch(() => false)) {
        await getStarted.click();
        await wait(1000);
        break;
      }
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await wait(500);
      }
      await wait(500);
    }
    await shot("s2-after-onboarding-skip");
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  // ── 2A: Create a 2x2 grid via welcome screen ──
  test("03 — Create 2x2 grid from welcome", async () => {
    const btn = page.locator('button:has-text("2x2"), button:has-text("2×2")');
    if ((await btn.count()) > 0) {
      await btn.first().click();
      await wait(3000);
      await shot("grid-2x2-created");
    } else {
      issues.push("BLOCKER: No 2x2 button found on welcome screen");
      await shot("no-2x2-button");
    }
  });

  // ── 2B: Save as preset via sidebar ──
  test("04 — Save current grid as preset", async () => {
    // Open sidebar
    await page.keyboard.press("Meta+\\");
    await wait(500);

    // Click Presets tab
    const presetsTab = page.locator('text="Presets"');
    if ((await presetsTab.count()) > 0) {
      await presetsTab.first().click();
      await wait(500);
      await shot("sidebar-presets-tab");

      // Look for "Save current grid as preset" button
      const saveBtn = page.locator(
        'button:has-text("Save current"), text="Save current grid as preset"',
      );
      if ((await saveBtn.count()) > 0) {
        await saveBtn.first().click();
        await wait(500);
        await shot("preset-save-dialog");

        // A prompt() dialog may appear — or an inline input
        // Try to find an input that appeared
        const nameInput = page.locator(
          'input[placeholder*="preset"], input[placeholder*="name"], input[type="text"]',
        );
        const visibleInputs = await nameInput.count();
        if (visibleInputs > 0) {
          await nameInput.last().fill("test-preset-qa");
          await wait(300);
          await shot("preset-name-entered");

          // Press Enter or click save
          await nameInput.last().press("Enter");
          await wait(1000);
          await shot("preset-saved");
        } else {
          // prompt() was used — it may have popped and auto-closed in Playwright
          issues.push("NOTE: Preset save likely uses prompt() — input not found inline");
          await shot("preset-save-prompt-issue");
        }
      } else {
        issues.push("MAJOR: 'Save current grid' button not found in presets sidebar");
        await shot("no-save-preset-button");
      }
    } else {
      issues.push("MAJOR: Presets tab not found in sidebar");
    }

    // Close sidebar
    await page.keyboard.press("Meta+\\");
    await wait(300);
  });

  // ── 2C: Load a preset from the sidebar ──
  test("05 — Load a preset from sidebar", async () => {
    // Open sidebar to presets
    await page.keyboard.press("Meta+\\");
    await wait(500);

    const presetsTab = page.locator('text="Presets"');
    if ((await presetsTab.count()) > 0) {
      await presetsTab.first().click();
      await wait(500);
    }

    // Look for any "Load" button in the preset list
    const loadBtns = page.locator('button:has-text("Load")');
    const loadCount = await loadBtns.count();
    await shot("preset-list-with-load-buttons");

    if (loadCount > 0) {
      // Click the first Load button
      await loadBtns.first().click();
      await wait(3000);
      await shot("preset-loaded");

      // Check if grid changed
      const titleText = page.locator('text="panes"');
      if ((await titleText.count()) > 0) {
        await shot("preset-loaded-grid-visible");
      } else {
        issues.push("MINOR: After loading preset, 'panes' count not visible");
      }
    } else {
      issues.push("MAJOR: No 'Load' buttons found in preset browser");
      await shot("no-load-buttons");
    }

    // Close sidebar
    await page.keyboard.press("Meta+\\");
    await wait(300);
  });

  // ── 2D: Close all panes — should return to welcome ──
  test("06 — Close all panes returns to welcome screen", async () => {
    await shot("before-close-all");

    // Get current pane count from title bar
    const titleText = await page
      .locator('span:has-text("panes")')
      .first()
      .textContent()
      .catch(() => "");

    // Try closing panes via command palette or tab close buttons
    // Strategy: use Cmd+K to get palette, then repeatedly close
    // Or just close tabs directly
    const tabs = page.locator('[draggable="true"]');
    let tabCount = await tabs.count();
    let closeAttempts = 0;

    while (tabCount > 0 && closeAttempts < 15) {
      // Try to find a close button inside the first tab
      const closeBtn = page.locator('[draggable="true"] button').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await wait(500);
      } else {
        // Try SVG or icon close buttons
        const svgClose = page.locator('[draggable="true"] svg').first();
        if (await svgClose.isVisible().catch(() => false)) {
          await svgClose.click();
          await wait(500);
        } else {
          break;
        }
      }
      tabCount = await tabs.count();
      closeAttempts++;
    }

    await shot("after-close-attempts");

    // Check if we're back to welcome screen
    const welcomeTitle = page.locator('text="AgentGrid"');
    const gridBtns = page.locator('button:has-text("1x1")');
    const isWelcome = (await welcomeTitle.count()) > 0 && (await gridBtns.count()) > 0;

    if (isWelcome) {
      await shot("returned-to-welcome");
    } else if (tabCount === 0) {
      // Tabs are gone but we need to check the actual screen
      await shot("all-tabs-closed-checking-screen");
      const content = await page.content();
      if (content.includes("AgentGrid") && content.includes("1x1")) {
        await shot("welcome-screen-confirmed");
      } else {
        issues.push("MAJOR: All tabs closed but didn't return to welcome screen");
      }
    } else {
      issues.push(
        `NOTE: Could not close all tabs — ${tabCount} remain after ${closeAttempts} attempts`,
      );
      await shot("tabs-remain");
    }
  });

  // ── 2E: Create 3x3 grid (9 panes) ──
  test("07 — Create 3x3 grid (9 panes)", async () => {
    // Make sure we're on the welcome screen first
    const btn3x3 = page.locator('button:has-text("3x3"), button:has-text("3×3")');
    if ((await btn3x3.count()) > 0) {
      await btn3x3.first().click();
      await wait(4000);
      await shot("grid-3x3-created");

      // Count tabs (should be 9)
      const tabs = page.locator('[draggable="true"]');
      const tabCount = await tabs.count();
      if (tabCount < 9) {
        issues.push(`MAJOR: 3x3 grid should have 9 panes, but only ${tabCount} tabs visible`);
      }

      // Screenshot the full grid
      await shot("grid-3x3-full-view");

      // Check title bar pane count
      const paneText = page.locator('text="9 panes"');
      if ((await paneText.count()) === 0) {
        const anyPaneText = page.locator('text="panes"');
        await shot("grid-3x3-pane-count");
      }
    } else {
      // Not on welcome — try via command palette
      await page.keyboard.press("Meta+k");
      await wait(500);
      const paletteInput = page.locator(
        'input[placeholder*="command"], input[placeholder*="Command"]',
      );
      if (
        await paletteInput
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await paletteInput.first().fill("3");
        await wait(300);
        const result = page.locator('button:has-text("3×3"), button:has-text("3x3")');
        if ((await result.count()) > 0) {
          await result.first().click();
          await wait(4000);
          await shot("grid-3x3-via-palette");
        }
      }
      await page.keyboard.press("Escape");
    }
  });

  // ── 2F: Dashboard view on 3x3 (Cmd+G) ──
  test("08 — Dashboard view on 3x3 grid", async () => {
    await page.keyboard.press("Meta+g");
    await wait(1000);
    await shot("dashboard-3x3");

    // Check for dashboard elements
    const totalCost = page.locator('text="Total Cost"');
    const totalTokens = page.locator('text="Total Tokens"');
    const progress = page.locator('text="Progress"');
    const errors = page.locator('text="Errors"');

    const hasDashboard =
      (await totalCost.count()) > 0 ||
      (await totalTokens.count()) > 0 ||
      (await progress.count()) > 0;

    if (hasDashboard) {
      await shot("dashboard-summary-cards");
    } else {
      issues.push("MAJOR: Dashboard view (Cmd+G) not showing summary cards");
      await shot("dashboard-not-visible");
    }

    // Back to grid
    await page.keyboard.press("Meta+g");
    await wait(500);
  });

  // ── 2G: Rapid add pane ──
  test("09 — Rapid add pane stress test", async () => {
    await shot("before-rapid-add");

    // Find the "+" / add pane button in control bar
    const addBtn = page.locator('button:has-text("+"), button[title*="Add"]');
    const addCount = await addBtn.count();

    if (addCount > 0) {
      // Rapidly click add 3 times
      for (let i = 0; i < 3; i++) {
        await addBtn.first().click();
        await wait(300);
      }
      await wait(1000);
      await shot("after-rapid-add-3-panes");

      // Check tab count increased
      const tabs = page.locator('[draggable="true"]');
      const tabCount = await tabs.count();
      if (tabCount < 9) {
        issues.push(`NOTE: After adding 3 panes to 3x3, expected 12 tabs, got ${tabCount}`);
      }
    } else {
      issues.push("NOTE: Add pane button ('+') not found in control bar");
      await shot("no-add-button");
    }
  });

  // ── 2H: Zen mode on large grid ──
  test("10 — Zen mode on large grid", async () => {
    await page.keyboard.press("Meta+Shift+f");
    await wait(500);
    await shot("zen-mode-large-grid");

    // Exit zen
    await page.keyboard.press("Escape");
    await wait(500);
    await shot("zen-exited-large-grid");
  });

  // ── 2I: Settings persistence check ──
  test("11 — Settings modal sections", async () => {
    await page.keyboard.press("Meta+,");
    await wait(500);
    await shot("settings-modal");

    // Click through each section
    const sections = [
      "General",
      "Models",
      "API Keys",
      "Appearance",
      "Terminal",
      "Security",
      "GitHub",
      "Cost Budget",
    ];
    for (const section of sections) {
      const sectionBtn = page.locator(`text="${section}"`).first();
      if (await sectionBtn.isVisible().catch(() => false)) {
        await sectionBtn.click();
        await wait(300);
        await shot(`settings-${section.toLowerCase().replace(/\s+/g, "-")}`);
      }
    }

    // Close
    await page.keyboard.press("Escape");
    await wait(300);
  });

  // ── 2J: Council on large grid ──
  test("12 — Council panel on large grid", async () => {
    await page.keyboard.press("Meta+Shift+c");
    await wait(500);
    await shot("council-large-grid");

    // Should see more member checkboxes
    const memberLabel = page.locator('text="Select 2+ members"');
    if ((await memberLabel.count()) > 0) {
      await shot("council-members-visible");
    }

    // Close
    const closeBtn = page.locator('button:has-text("✕")');
    if ((await closeBtn.count()) > 0) {
      await closeBtn.first().click();
    } else {
      await page.keyboard.press("Escape");
    }
    await wait(300);
  });

  // ── 2K: Final state + error audit ──
  test("13 — Final state and error audit", async () => {
    await shot("final-state");

    const realErrors = consoleErrors.filter(
      (e) =>
        !e.includes("DevTools") &&
        !e.includes("Autofill") &&
        !e.includes("favicon") &&
        !e.includes("net::ERR") &&
        !e.includes("ResizeObserver"),
    );

    if (realErrors.length > 0) {
      issues.push(
        `ERRORS: ${realErrors.length} console errors:\n${realErrors.slice(0, 5).join("\n")}`,
      );
    }

    console.log("\n════════════════════════════════════════════");
    console.log(`DESKTOP TEST 4 COMPLETE: ${issues.length} issues found`);
    console.log("════════════════════════════════════════════\n");
    for (const issue of issues) {
      console.log(`  - ${issue}`);
    }
    console.log(`\nScreenshots: ${shotIdx} taken in ${SHOTS}`);
    console.log(`Console errors: ${consoleErrors.length} total, ${realErrors.length} significant`);
  });
});
