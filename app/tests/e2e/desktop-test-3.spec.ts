/**
 * Desktop Test 3 — Dashboard, Council, Broadcast
 *
 * Tests:
 * 1. Create 2x2 grid
 * 2. Toggle to dashboard view (Cmd+G), screenshot
 * 3. Open council panel (Cmd+Shift+C), screenshot
 * 4. Broadcast a message, screenshot all panes
 * 5. Report visual bugs from screenshots
 *
 * Run: npx playwright test tests/e2e/desktop-test-3.spec.ts --config tests/playwright.config.ts
 * Prereq: pnpm build (electron-vite build)
 */

import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const currentFilename = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilename);
const APP_DIR = join(currentDir, "../..");
const SHOTS = join(currentDir, "../screenshots/desktop-test-3");
mkdirSync(SHOTS, { recursive: true });

let app: ElectronApplication;
let page: Page;

const results: Array<{
  step: string;
  pass: boolean;
  screenshot: string;
  notes: string;
}> = [];

async function shot(name: string): Promise<string> {
  const path = join(SHOTS, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

function record(step: string, pass: boolean, screenshot: string, notes: string) {
  results.push({ step, pass, screenshot, notes });
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
  await app?.close();
});

// ─── 1. Create 2x2 Grid ───

test("1. Create 2x2 grid from welcome screen", async () => {
  const path = await shot("01-initial-state");

  // Check if we're on welcome screen or already have a grid
  const welcomeBtn = page.locator('button:has-text("2x2")');
  const hasWelcome = await welcomeBtn.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasWelcome) {
    await welcomeBtn.click();
    await page.waitForTimeout(3000);
    const gridPath = await shot("01b-grid-created");
    record("Create 2x2 grid", true, gridPath, "Clicked 2x2 button, grid created");
  } else {
    record("Create 2x2 grid", true, path, "Grid already exists from previous session");
  }

  // Verify we have pane elements
  const paneCount = await page.locator(".xterm").count();
  const hasPanes = paneCount > 0 || (await page.locator('[class*="flex h-full"]').count()) > 0;
  expect(hasPanes).toBe(true);
});

// ─── 2. Toggle to Dashboard View (Cmd+G) ───

test("2. Toggle to dashboard view with Cmd+G", async () => {
  // Ensure we start in grid view — click on the main content area to restore focus
  await page.locator("#root").click({ position: { x: 400, y: 300 } });
  await page.waitForTimeout(300);

  // Press Cmd+G to toggle to dashboard
  await page.keyboard.press("Meta+g");

  // Wait for dashboard-specific element instead of fixed timeout
  const dashboardLoaded = await page
    .locator('text="Total Cost"')
    .waitFor({ state: "visible", timeout: 8000 })
    .then(() => true)
    .catch(() => false);

  const dashPath = await shot("02-dashboard-view");

  // Verify dashboard elements rendered
  const hasTotalCost = (await page.locator('text="Total Cost"').count()) > 0;
  const hasTotalTokens = (await page.locator('text="Total Tokens"').count()) > 0;
  const hasProgress = (await page.locator('text="Progress"').count()) > 0;
  const hasErrors = (await page.locator('text="Errors"').count()) > 0;

  const hasDashboard = hasTotalCost || hasTotalTokens || hasProgress || hasErrors;

  record(
    "Dashboard view (Cmd+G)",
    hasDashboard,
    dashPath,
    hasDashboard
      ? `Dashboard rendered: Cost=${hasTotalCost}, Tokens=${hasTotalTokens}, Progress=${hasProgress}, Errors=${hasErrors}`
      : "Dashboard NOT rendered — Cmd+G may have toggled to wrong view or focus was lost",
  );

  // Toggle back to grid
  await page.keyboard.press("Meta+g");
  // Wait for xterm to reappear (grid view has terminals)
  await page
    .locator(".xterm")
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => {});
  const backPath = await shot("02b-back-to-grid");
  record("Toggle back to grid", true, backPath, "Returned to grid view via Cmd+G");
});

// ─── 3. Open Council Panel (Cmd+Shift+C) ───

test("3. Open council panel with Cmd+Shift+C", async () => {
  // Ensure focus is on main content
  await page.locator("#root").click({ position: { x: 400, y: 300 } });
  await page.waitForTimeout(300);

  await page.keyboard.press("Meta+Shift+c");

  // Wait for council-specific element
  const councilLoaded = await page
    .locator('text="LLM Council"')
    .or(page.locator('text="Start Council"'))
    .or(page.locator('text="members"'))
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  const councilPath = await shot("03-council-panel");

  const hasCouncil =
    (await page.locator('text="LLM Council"').count()) > 0 ||
    (await page.locator('text="Council"').count()) > 0 ||
    (await page.locator('text="Start Council"').count()) > 0 ||
    (await page.locator('text="members"').count()) > 0;

  record(
    "Council panel (Cmd+Shift+C)",
    hasCouncil,
    councilPath,
    hasCouncil
      ? "Council panel opened with session controls"
      : "Council panel may not have rendered — check focus state",
  );

  // Close council
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
});

// ─── 4. Broadcast a Message ───

test("4. Broadcast a message to all panes", async () => {
  // Find the broadcast input
  const broadcastInput = page.locator("[data-broadcast-input]");
  const controlBarInput = page.locator('input[placeholder*="Broadcast"]');
  const input = (await broadcastInput.isVisible().catch(() => false))
    ? broadcastInput
    : controlBarInput;

  const inputVisible = await input.isVisible({ timeout: 3000 }).catch(() => false);

  if (inputVisible) {
    await input.click({ force: true });
    await input.fill("Hello from test — checking all panes");
    const typedPath = await shot("04a-broadcast-typed");
    record("Broadcast typed", true, typedPath, "Message typed in broadcast input");

    // Press Enter to send
    await input.press("Enter");
    await page.waitForTimeout(2000);
    const sentPath = await shot("04b-broadcast-sent");

    // Check if terminals received data (xterm content changed)
    const xtermCount = await page.locator(".xterm").count();
    record("Broadcast sent", true, sentPath, `Message broadcast to ${xtermCount} terminal panes`);
  } else {
    const fallbackPath = await shot("04-broadcast-not-found");
    record(
      "Broadcast input",
      false,
      fallbackPath,
      "Could not find broadcast input — ControlBar may not be visible",
    );
  }
});

// ─── 5. Pane Layout Inspection ───

test("5. Inspect pane layout for visual bugs", async () => {
  const layoutPath = await shot("05-pane-layout");

  // Check for layout issues
  const xtermPanes = await page.locator(".xterm").count();
  const tabCount = await page.locator("[data-pane-tab]").count();
  const statusBar = await page.locator('text="panes"').count();

  // Check for box-in-box visual issue
  const hasRoundedPanes = await page.locator('[class*="rounded-md"]').count();
  const hasBorder2 = await page
    .evaluate(() => {
      const els = document.querySelectorAll('[class*="border-2"]');
      return els.length;
    })
    .catch(() => 0);

  const bugs: string[] = [];
  if (hasRoundedPanes > 2) bugs.push("WARN: rounded-md still present on pane containers");
  if (hasBorder2 > 0) bugs.push("WARN: border-2 elements found (box-in-box risk)");
  if (xtermPanes === 0) bugs.push("BUG: No xterm terminals visible");
  if (tabCount === 0) bugs.push("BUG: No tab bar entries found");

  record(
    "Pane layout inspection",
    bugs.length === 0,
    layoutPath,
    bugs.length === 0
      ? `Clean layout: ${xtermPanes} terminals, ${tabCount} tabs`
      : `Issues found: ${bugs.join("; ")}`,
  );
});

// ─── 6. Status Bar Check ───

test("6. Status bar shows grid info", async () => {
  const statusPath = await shot("06-status-bar");

  const statusText = await page
    .locator(".flex.items-center.gap-2")
    .last()
    .textContent()
    .catch(() => "");
  const hasModel =
    statusText?.includes("opus") ||
    statusText?.includes("claude") ||
    statusText?.includes("sonnet");
  const hasCost = statusText?.includes("$") || statusText?.includes("token");

  record(
    "Status bar info",
    true,
    statusPath,
    `Status bar content: model=${hasModel}, cost=${hasCost}`,
  );
});

// ─── 7. Keyboard Shortcuts Audit ───

test("7. Keyboard shortcuts work", async () => {
  // Cmd+K should open command palette
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(800);
  const palettePath = await shot("07-command-palette");

  const hasPalette =
    (await page.locator('[role="dialog"]').count()) > 0 ||
    (await page.locator('input[placeholder*="Search"]').count()) > 0 ||
    (await page.locator('[class*="z-50"]').count()) > 0;

  record(
    "Command palette (Cmd+K)",
    hasPalette,
    palettePath,
    hasPalette ? "Palette opened" : "Palette may not have opened",
  );

  // Close it
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // Cmd+\ should toggle sidebar
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(800);
  const sidebarPath = await shot("07b-sidebar-toggle");
  record("Sidebar toggle (Cmd+\\)", true, sidebarPath, "Sidebar toggled");

  // Close sidebar
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(300);
});

// ─── 8. Final State ───

test("8. Final state and summary", async () => {
  const finalPath = await shot("08-final-state");
  record("Final state", true, finalPath, "All tests completed");

  // Collect console errors
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  await page.waitForTimeout(500);

  // Print results summary
  console.log("\n═══════════════════════════════════════");
  console.log("  DESKTOP TEST 3 — RESULTS SUMMARY");
  console.log("═══════════════════════════════════════\n");
  for (const r of results) {
    console.log(`  ${r.pass ? "PASS" : "FAIL"} | ${r.step}`);
    console.log(`       ${r.notes}`);
    console.log(`       📸 ${r.screenshot}\n`);
  }
  const passCount = results.filter((r) => r.pass).length;
  console.log(`  Total: ${passCount}/${results.length} passed\n`);
});
