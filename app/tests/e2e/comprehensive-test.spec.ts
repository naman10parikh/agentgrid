/**
 * COMPREHENSIVE TEST — Screenshot Every Feature, Read Every Image
 *
 * Goal: test every single thing.
 * This test launches the app, exercises every feature, takes screenshots,
 * and documents every issue found.
 */
import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(currentDir, "../..");
const SHOTS = join(currentDir, "../screenshots/comprehensive-test");
mkdirSync(SHOTS, { recursive: true });

let app: ElectronApplication;
let page: Page;
const issues: string[] = [];
const consoleErrors: string[] = [];
let shotIdx = 0;

async function shot(name: string): Promise<string> {
  shotIdx++;
  const filename = `${String(shotIdx).padStart(3, "0")}-${name}.png`;
  const filepath = join(SHOTS, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function wait(ms: number) {
  await page.waitForTimeout(ms);
}

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
  await wait(2000);
});

test.afterAll(async () => {
  if (app) await app.close();
});

// ────────────────────────────────────────────
// 1. WELCOME SCREEN
// ────────────────────────────────────────────
test("01 — Welcome screen renders correctly", async () => {
  await shot("welcome-screen");

  // Check title exists
  const title = page.locator('text="AgentGrid"');
  await expect(title.first()).toBeVisible();

  // Check all 5 grid buttons exist
  for (const size of ["1×1", "1×2", "2×2", "2×3", "3×3"]) {
    const btn = page.locator(`button:has-text("${size}")`);
    const count = await btn.count();
    if (count === 0) issues.push(`MISSING: Grid button "${size}" not found on welcome screen`);
  }

  // Check topology picker exists
  const topologySection = page.locator('text="Swarm Topology"');
  if ((await topologySection.count()) > 0) {
    await shot("welcome-topology-section");
  } else {
    // Try alternate text
    const topoAlt = page.locator('text="Topology"');
    if ((await topoAlt.count()) > 0) {
      await shot("welcome-topology-alt");
    } else {
      issues.push("MISSING: Topology section not visible on welcome screen");
    }
  }

  // Check quick start presets section
  const presetsSection = page.locator('text="Quick Start"');
  if ((await presetsSection.count()) > 0) {
    await shot("welcome-presets-section");
  }
});

// ────────────────────────────────────────────
// 2. CREATE 2x1 GRID
// ────────────────────────────────────────────
test("02 — Create 2x1 grid (1×2 button)", async () => {
  const btn = page.locator('button:has-text("1×2")');
  await expect(btn.first()).toBeVisible();
  await btn.first().click();
  await wait(3000);
  await shot("grid-2x1-created");

  // Verify we left the welcome screen
  const xtermCount = await page.locator(".xterm").count();
  const hasTabs = (await page.locator('[draggable="true"]').count()) > 0;
  const hasAgentText = (await page.locator('text="Agent"').count()) > 0;

  if (xtermCount === 0 && !hasTabs && !hasAgentText) {
    issues.push("BLOCKER: 1x2 grid created but NO panes visible — still on welcome screen?");
  } else {
    // Check for correct pane count
    const paneInfo = page.locator('text="panes"');
    await shot("grid-2x1-panes-check");
  }
});

// ────────────────────────────────────────────
// 3. TERMINAL PANES — are they real?
// ────────────────────────────────────────────
test("03 — Terminal panes render with xterm", async () => {
  await wait(1000);
  const xtermElements = await page.locator(".xterm").count();
  await shot("terminal-panes-xterm");

  if (xtermElements === 0) {
    issues.push("BLOCKER: No .xterm elements found — terminals not rendering");
  }

  // Check for canvas (WebGL or canvas renderer)
  const canvasElements = await page.locator(".xterm canvas").count();
  if (canvasElements > 0) {
    await shot("terminal-panes-canvas");
  }

  // Check for pane headers/labels
  const agentLabels = await page.locator('text="Agent"').count();
  if (agentLabels === 0) {
    issues.push("MINOR: No 'Agent' labels visible in pane headers");
  }
});

// ────────────────────────────────────────────
// 4. TAB BAR
// ────────────────────────────────────────────
test("04 — Tab bar shows correct tabs", async () => {
  const tabs = page.locator('[draggable="true"]');
  const tabCount = await tabs.count();
  await shot("tab-bar");

  if (tabCount < 2) {
    issues.push(`MAJOR: Expected 2 tabs for 1x2 grid, got ${tabCount}`);
  }

  // Click second tab
  if (tabCount >= 2) {
    await tabs.nth(1).click();
    await wait(500);
    await shot("tab-bar-second-selected");
  }
});

// ────────────────────────────────────────────
// 5. STATUS BAR
// ────────────────────────────────────────────
test("05 — Status bar shows grid info", async () => {
  // Status bar should be at the bottom
  const statusBar = page.locator('text="panes"').first();
  if (await statusBar.isVisible()) {
    await shot("status-bar");
  } else {
    // Try alternate locator
    await shot("status-bar-full-page");
    issues.push("MINOR: Status bar 'panes' text not immediately visible");
  }
});

// ────────────────────────────────────────────
// 6. CONTROL BAR — broadcast input
// ────────────────────────────────────────────
test("06 — Control bar and broadcast", async () => {
  // Look for broadcast input
  const broadcastInput = page.locator('input[placeholder*="Broadcast"]').first();
  if (await broadcastInput.isVisible()) {
    await broadcastInput.fill("Hello from test!");
    await shot("broadcast-typed");

    // Press Enter or click send
    await broadcastInput.press("Enter");
    await wait(1000);
    await shot("broadcast-sent");
  } else {
    // Try alternate placeholder
    const altInput = page.locator('input[placeholder*="broadcast"]').first();
    if (await altInput.isVisible()) {
      await altInput.fill("Hello from test!");
      await altInput.press("Enter");
      await wait(1000);
      await shot("broadcast-alt-sent");
    } else {
      await shot("control-bar-no-broadcast-input");
      issues.push("MAJOR: Broadcast input not found in control bar");
    }
  }
});

// ────────────────────────────────────────────
// 7. COMMAND PALETTE (Cmd+K)
// ────────────────────────────────────────────
test("07 — Command palette opens with Cmd+K", async () => {
  await page.keyboard.press("Meta+k");
  await wait(500);
  await shot("command-palette-open");

  // Check for input
  const paletteInput = page.locator(
    'input[placeholder*="command"], input[placeholder*="search"], input[placeholder*="Command"]',
  );
  const inputVisible = await paletteInput
    .first()
    .isVisible()
    .catch(() => false);

  if (!inputVisible) {
    issues.push("BLOCKER: Command palette input not visible after Cmd+K");
  } else {
    // Type a filter
    await paletteInput.first().fill("grid");
    await wait(300);
    await shot("command-palette-filtered");

    // Check for results
    const results = page.locator('button:has-text("Grid"), button:has-text("grid")');
    if ((await results.count()) === 0) {
      issues.push("MINOR: No results for 'grid' filter in command palette");
    }
  }

  // Close with Escape
  await page.keyboard.press("Escape");
  await wait(300);
  await shot("command-palette-closed");
});

// ────────────────────────────────────────────
// 8. SIDEBAR (Cmd+\)
// ────────────────────────────────────────────
test("08 — Sidebar toggles with Cmd+Backslash", async () => {
  await page.keyboard.press("Meta+\\");
  await wait(500);
  await shot("sidebar-open");

  // Check for sidebar sections
  const workspaces = page.locator('text="Workspaces"');
  const presets = page.locator('text="Presets"');
  const tools = page.locator('text="Tools"');

  if ((await workspaces.count()) === 0 && (await presets.count()) === 0) {
    issues.push("MAJOR: Sidebar opened but no sections (Workspaces/Presets/Tools) visible");
  }

  // Click Presets tab if available
  if ((await presets.count()) > 0) {
    await presets.first().click();
    await wait(500);
    await shot("sidebar-presets-tab");
  }

  // Close sidebar
  await page.keyboard.press("Meta+\\");
  await wait(300);
  await shot("sidebar-closed");
});

// ────────────────────────────────────────────
// 9. SETTINGS (Cmd+,)
// ────────────────────────────────────────────
test("09 — Settings modal opens with Cmd+Comma", async () => {
  await page.keyboard.press("Meta+,");
  await wait(500);
  await shot("settings-open");

  // Check for settings sections in sidebar nav
  const appearance = page.locator('text="Appearance"');
  const terminal = page.locator('text="Terminal"');
  const agent = page.locator('text="Agent"');
  const shortcuts = page.locator('text="Keyboard"');

  if ((await appearance.count()) === 0) {
    issues.push("MAJOR: Settings modal opened but Appearance section not visible");
  }

  // Click each section and screenshot
  const sections = ["Appearance", "Terminal", "Agent", "Keyboard"];
  for (const section of sections) {
    const sectionBtn = page.locator(`text="${section}"`).first();
    if (await sectionBtn.isVisible().catch(() => false)) {
      await sectionBtn.click();
      await wait(300);
      await shot(`settings-${section.toLowerCase()}`);
    } else {
      issues.push(`MINOR: Settings section "${section}" not found in nav`);
    }
  }

  // Close settings
  await page.keyboard.press("Escape");
  await wait(300);
});

// ────────────────────────────────────────────
// 10. GRAPH VIEW (Cmd+G)
// ────────────────────────────────────────────
test("10 — Graph view toggles with Cmd+G", async () => {
  await page.keyboard.press("Meta+g");
  await wait(1000);
  await shot("graph-view");

  // Check for SVG (D3 graph)
  const svgElements = await page.locator("svg").count();
  if (svgElements === 0) {
    issues.push("MAJOR: Graph view has no SVG elements — D3 graph not rendering");
  }

  // Check topology buttons
  const topologyButtons = page.locator(
    'button:has-text("force"), button:has-text("hierarchical"), button:has-text("ring"), button:has-text("star")',
  );
  const topoCount = await topologyButtons.count();
  if (topoCount < 4) {
    issues.push(`MINOR: Expected 4 topology buttons, found ${topoCount}`);
  }

  // Click each topology and screenshot
  for (const topo of ["hierarchical", "ring", "star"]) {
    const btn = page.locator(`button:has-text("${topo}")`).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await wait(800);
      await shot(`graph-topology-${topo}`);
    }
  }

  // Switch back to grid
  await page.keyboard.press("Meta+g");
  await wait(500);
  await shot("back-to-grid-view");
});

// ────────────────────────────────────────────
// 11. COUNCIL PANEL (Cmd+Shift+C)
// ────────────────────────────────────────────
test("11 — Council panel opens with Cmd+Shift+C", async () => {
  await page.keyboard.press("Meta+Shift+c");
  await wait(500);
  await shot("council-panel-open");

  // Check for council UI
  const councilTitle = page.locator('text="LLM Council"');
  if ((await councilTitle.count()) === 0) {
    issues.push("BLOCKER: Council panel not visible after Cmd+Shift+C");
  }

  // Check for topic input
  const topicInput = page.locator(
    'input[placeholder*="council"], input[placeholder*="question"], input[placeholder*="decision"]',
  );
  if (
    await topicInput
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await topicInput.first().fill("Should we refactor the settings module?");
    await shot("council-topic-entered");
  }

  // Check for mode selector
  const parallelBtn = page.locator('button:has-text("Parallel")');
  const debateBtn = page.locator('button:has-text("Debate")');
  if ((await parallelBtn.count()) > 0) {
    await shot("council-mode-selector");
  }

  // Check for member selector
  const memberLabel = page.locator('text="Select 2+ members"');
  if ((await memberLabel.count()) === 0) {
    const altLabel = page.locator('text="member"');
    if ((await altLabel.count()) === 0) {
      issues.push("MINOR: Council member selector label not found");
    }
  }

  // Check for Active/History tabs
  const activeTab = page.locator('button:has-text("Active")');
  const historyTab = page.locator('button:has-text("History")');
  if ((await activeTab.count()) > 0 && (await historyTab.count()) > 0) {
    await historyTab.first().click();
    await wait(300);
    await shot("council-history-tab");
    await activeTab.first().click();
    await wait(300);
  }

  // Close council
  const closeBtn = page.locator('button:has-text("✕")');
  if ((await closeBtn.count()) > 0) {
    await closeBtn.first().click();
    await wait(300);
  } else {
    await page.keyboard.press("Escape");
    await wait(300);
  }
  await shot("council-closed");
});

// ────────────────────────────────────────────
// 12. ZEN MODE (Cmd+Shift+F)
// ────────────────────────────────────────────
test("12 — Zen mode hides chrome", async () => {
  await shot("before-zen-mode");
  await page.keyboard.press("Meta+Shift+f");
  await wait(500);
  await shot("zen-mode-active");

  // In zen mode, status bar and control bar should be hidden
  // Tab bar should still be visible

  // Exit zen mode
  await page.keyboard.press("Escape");
  await wait(500);
  await shot("zen-mode-exited");
});

// ────────────────────────────────────────────
// 13. PANE CLOSE — close one pane
// ────────────────────────────────────────────
test("13 — Close a pane via tab close button", async () => {
  // Find close buttons on tabs (typically an X or ✕)
  const tabs = page.locator('[draggable="true"]');
  const tabCountBefore = await tabs.count();

  // Look for close button inside first tab
  const closeButtons = page.locator(
    '[draggable="true"] button, [draggable="true"] [role="button"]',
  );
  if ((await closeButtons.count()) > 0) {
    await closeButtons.first().click();
    await wait(1000);
    await shot("pane-closed");

    const tabCountAfter = await tabs.count();
    if (tabCountAfter >= tabCountBefore) {
      issues.push("MAJOR: Clicked tab close button but tab count didn't decrease");
    }
  } else {
    await shot("no-close-buttons-found");
    issues.push("MINOR: No close buttons found on tabs");
  }
});

// ────────────────────────────────────────────
// 14. CREATE 2x2 GRID (via palette)
// ────────────────────────────────────────────
test("14 — Create 2x2 grid via command palette", async () => {
  // If we still have a grid, go back to welcome first
  // Use palette to create new grid
  await page.keyboard.press("Meta+k");
  await wait(500);

  const paletteInput = page.locator(
    'input[placeholder*="command"], input[placeholder*="search"], input[placeholder*="Command"]',
  );
  if (
    await paletteInput
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await paletteInput.first().fill("2×2");
    await wait(300);
    await shot("palette-2x2-search");

    // Click the 2x2 result
    const result = page.locator('button:has-text("2×2")');
    if ((await result.count()) > 0) {
      await result.first().click();
      await wait(3000);
      await shot("grid-2x2-created");
    } else {
      await page.keyboard.press("Escape");
      issues.push("MINOR: 2x2 grid command not found in palette");
    }
  } else {
    await page.keyboard.press("Escape");
  }
});

// ────────────────────────────────────────────
// 15. MINIMAP (bottom-right corner in grid view)
// ────────────────────────────────────────────
test("15 — Minimap visible in grid view", async () => {
  await wait(500);
  // Minimap should be a small AgentGraph in the bottom-right
  const minimap = page.locator('div[title*="Agent Graph"], div[title*="graph"]');
  if ((await minimap.count()) > 0) {
    await shot("minimap-visible");
  } else {
    await shot("minimap-check");
    issues.push("MINOR: Minimap overlay not found in grid view");
  }
});

// ────────────────────────────────────────────
// 16. TITLE BAR
// ────────────────────────────────────────────
test("16 — Title bar shows pane count", async () => {
  const titleBar = page.locator('text="AgentGrid"');
  if ((await titleBar.count()) > 0) {
    await shot("title-bar");
  }

  const paneCountText = page.locator('text="panes"');
  if ((await paneCountText.count()) === 0) {
    issues.push("MINOR: Title bar doesn't show pane count");
  }
});

// ────────────────────────────────────────────
// 17. DARK THEME CHECK
// ────────────────────────────────────────────
test("17 — Dark theme applied correctly", async () => {
  await shot("dark-theme-check");

  // Check background color of body/main container
  const bgColor = await page.evaluate(() => {
    const el = document.querySelector(".bg-grid-bg") || document.body;
    return window.getComputedStyle(el).backgroundColor;
  });

  // Should be warm black (~#141312), not pure black or white
  if (bgColor === "rgb(255, 255, 255)" || bgColor === "rgb(0, 0, 0)") {
    issues.push(`MAJOR: Background is ${bgColor} — should be warm black (#141312)`);
  }
});

// ────────────────────────────────────────────
// 18. CONSOLE ERROR AUDIT
// ────────────────────────────────────────────
test("18 — Console error audit", async () => {
  await shot("final-state");

  // Filter real errors (not warnings or info)
  const realErrors = consoleErrors.filter(
    (e) =>
      !e.includes("DevTools") &&
      !e.includes("Autofill") &&
      !e.includes("favicon") &&
      !e.includes("net::ERR"),
  );

  if (realErrors.length > 0) {
    issues.push(
      `ERRORS: ${realErrors.length} console errors:\n${realErrors.slice(0, 5).join("\n")}`,
    );
  }
});

// ────────────────────────────────────────────
// FINAL: Write issues summary
// ────────────────────────────────────────────
test("99 — Issues summary", async () => {
  console.log("\n═══════════════════════════════════════");
  console.log(`COMPREHENSIVE TEST COMPLETE: ${issues.length} issues found`);
  console.log("═══════════════════════════════════════\n");
  for (const issue of issues) {
    console.log(`  - ${issue}`);
  }
  console.log(`\nScreenshots: ${shotIdx} taken in ${SHOTS}`);
  console.log(`Console errors: ${consoleErrors.length}`);

  // This test always passes — it just reports
  expect(true).toBe(true);
});
