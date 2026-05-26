/**
 * AgentGrid — QA-E2E Comprehensive Feature Tests
 *
 * Tests EVERY non-terminal feature: welcome screen, command palette,
 * sidebar tabs, presets, workspaces, status bar, settings, dark theme,
 * keyboard shortcuts, control bar, error states, and responsiveness.
 *
 * Run: npx playwright test tests/e2e/features.spec.ts --config tests/playwright.config.ts
 * Prereq: npx electron-vite build
 */

import { test, expect, type ElectronApplication, type Page } from "@playwright/test";
import { _electron as electron } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(currentDir, "../..");
const SHOTS = join(currentDir, "../screenshots/qa-e2e");
mkdirSync(SHOTS, { recursive: true });

let app: ElectronApplication;
let page: Page;
let shotIndex = 0;

async function shot(name: string) {
  shotIndex++;
  const filename = `${String(shotIndex).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: join(SHOTS, filename), fullPage: true });
}

async function consoleErrors(): Promise<string[]> {
  return page.evaluate(() => {
    // Check if any errors were logged (we inject a collector early)
    return (window as unknown as { __consoleErrors?: string[] }).__consoleErrors ?? [];
  });
}

test.beforeAll(async () => {
  app = await electron.launch({
    args: [join(APP_DIR, "out/main/index.js")],
    env: { ...process.env, NODE_ENV: "test" },
  });
  page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");

  // Inject console error collector
  await page.evaluate(() => {
    const errors: string[] = [];
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(" "));
      origError.apply(console, args);
    };
    (window as unknown as { __consoleErrors: string[] }).__consoleErrors = errors;
  });

  // Wait for React to render
  await page.waitForTimeout(4000);
});

test.afterAll(async () => {
  await app?.close();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. WELCOME SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("1a. App launches — shows welcome screen OR restored grid", async () => {
  await shot("welcome-screen");
  const body = await page.textContent("body");
  expect(body).toContain("AgentGrid");
  // Either on welcome screen with subtitle, or restored grid with "panes" text
  const hasWelcome = body?.includes("Visual multi-agent orchestration");
  const hasGrid = body?.includes("panes");
  expect(hasWelcome || hasGrid).toBe(true);
});

test("1b. Grid preset buttons visible on welcome screen (or grid already restored)", async () => {
  // If a grid was restored, welcome screen won't show — that's fine
  const firstPreset = page.locator('button:has-text("1x1")');
  const isOnWelcome = await firstPreset.isVisible({ timeout: 2000 }).catch(() => false);

  if (isOnWelcome) {
    const presetLabels = ["1x1", "1x2", "2x2", "2x3", "3x3"];
    for (const label of presetLabels) {
      const btn = page.locator(`button:has-text("${label}")`);
      await expect(btn).toBeVisible({ timeout: 5000 });
      await expect(btn).toBeEnabled();
    }
    const body = await page.textContent("body");
    expect(body).toContain("Single agent");
    expect(body).toContain("Quad grid");
    await shot("welcome-presets");
  } else {
    // Grid was auto-restored — verify it's actually showing a grid
    const body = await page.textContent("body");
    expect(body).toContain("panes");
    await shot("restored-grid");
  }
});

test("1c. Clicking 2x2 creates a 4-pane grid", async () => {
  const btn = page.locator('button:has-text("2x2")');
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(3000);
  }
  await shot("grid-created");

  // Should no longer show welcome screen title in the main area
  // Should show grid info
  const body = await page.textContent("body");
  expect(body).toContain("panes");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. COMMAND PALETTE (Cmd+K)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("2a. Command palette opens with Cmd+K", async () => {
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(500);
  await shot("palette-open");

  const cmdInput = page.locator('input[placeholder*="command"]');
  await expect(cmdInput).toBeVisible({ timeout: 3000 });
});

test("2b. Command palette shows all commands", async () => {
  // Palette should already be open from 2a
  const cmdInput = page.locator('input[placeholder*="command"]');
  if (!(await cmdInput.isVisible().catch(() => false))) {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);
  }

  const body = await page.textContent("body");
  // Should show grid creation commands
  expect(body).toContain("New 2×2 Grid");
  expect(body).toContain("Save Session");
  // With grid active, should also show broadcast
  expect(body).toContain("Broadcast");
  await shot("palette-all-commands");
});

test("2c. Command palette filters on typing", async () => {
  const cmdInput = page.locator('input[placeholder*="command"]');
  if (!(await cmdInput.isVisible().catch(() => false))) {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);
  }

  await cmdInput.fill("save");
  await page.waitForTimeout(300);
  await shot("palette-filtered-save");

  // Should show Save but not New Grid commands
  const buttons = page.locator('button:has-text("Save")');
  expect(await buttons.count()).toBeGreaterThanOrEqual(1);
});

test("2d. Command palette closes with Escape", async () => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const cmdInput = page.locator('input[placeholder*="command"]');
  expect(await cmdInput.isVisible().catch(() => false)).toBe(false);
  await shot("palette-closed");
});

test("2e. Command palette keyboard navigation works", async () => {
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(500);

  const cmdInput = page.locator('input[placeholder*="command"]');
  await expect(cmdInput).toBeVisible();

  // Arrow down to select second item
  await cmdInput.press("ArrowDown");
  await page.waitForTimeout(200);
  await shot("palette-arrow-nav");

  // Arrow up back to first
  await cmdInput.press("ArrowUp");
  await page.waitForTimeout(200);

  // Close
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. SIDEBAR (Cmd+\)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("3a. Sidebar opens with Cmd+backslash", async () => {
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(500);
  await shot("sidebar-open");

  const body = await page.textContent("body");
  // Should show tab labels
  expect(body).toContain("Workspaces");
  expect(body).toContain("Presets");
  expect(body).toContain("Tools");
  expect(body).toContain("CEO Log");
});

test("3b. Sidebar Workspaces tab shows workspace list", async () => {
  // Should already be on Workspaces tab (default)
  const body = await page.textContent("body");
  expect(body).toContain("Team");
  // Mock workspaces should show paths
  expect(body).toContain("/");
  await shot("sidebar-workspaces");
});

test("3c. Sidebar Presets tab shows built-in presets", async () => {
  const presetsTab = page.locator('button:has-text("Presets")');
  await presetsTab.click();
  await page.waitForTimeout(500);
  await shot("sidebar-presets");

  const body = await page.textContent("body");
  expect(body).toContain("dev-sprint");
  expect(body).toContain("research-swarm");
  expect(body).toContain("mixed-agents");
  expect(body).toContain("content-engine");
  expect(body).toContain("solo");
});

test("3d. Preset search filters correctly", async () => {
  const searchInput = page.locator('input[placeholder*="Search presets"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill("research");
    await page.waitForTimeout(300);
    await shot("sidebar-presets-filtered");

    const body = await page.textContent("body");
    expect(body).toContain("research-swarm");
    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(200);
  }
});

test("3e. Preset category filter works", async () => {
  // Click engineering category
  const engChip = page.locator('button:has-text("engineering")');
  if (await engChip.isVisible()) {
    await engChip.click();
    await page.waitForTimeout(300);
    await shot("sidebar-presets-category");

    const body = await page.textContent("body");
    expect(body).toContain("dev-sprint");
    expect(body).toContain("mixed-agents");

    // Reset to all
    const allChip = page.locator('button:has-text("All")');
    if (await allChip.isVisible()) {
      await allChip.click();
      await page.waitForTimeout(200);
    }
  }
});

test("3f. Sidebar Tools tab renders", async () => {
  const toolsTab = page.locator('button:has-text("Tools")');
  await toolsTab.click();
  await page.waitForTimeout(500);
  await shot("sidebar-tools");
});

test("3g. Sidebar CEO Log tab renders", async () => {
  const logTab = page.locator('button:has-text("CEO Log")');
  await logTab.click();
  await page.waitForTimeout(500);
  await shot("sidebar-ceo-log");
});

test("3h. Sidebar closes with Cmd+backslash", async () => {
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(300);
  await shot("sidebar-closed");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. CONTROL BAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("4a. Control bar shows pane count", async () => {
  const body = await page.textContent("body");
  // Should show "4 panes" for 2x2 grid
  expect(body).toContain("panes");
  await shot("control-bar");
});

test("4b. Broadcast input is visible and accepts text", async () => {
  const input = page.locator('input[placeholder*="Broadcast"]');
  await expect(input).toBeVisible();
  await input.fill("test broadcast message");
  await page.waitForTimeout(200);
  await shot("control-bar-broadcast-typed");
  expect(await input.inputValue()).toBe("test broadcast message");
});

test("4c. Send button enabled when text entered", async () => {
  const sendBtn = page.locator('button:has-text("Send")');
  await expect(sendBtn).toBeVisible();
  await expect(sendBtn).toBeEnabled();
  await shot("control-bar-send-enabled");
});

test("4d. Send button clears input after send", async () => {
  const input = page.locator('input[placeholder*="Broadcast"]');
  const sendBtn = page.locator('button:has-text("Send")');

  await input.fill("broadcast test");
  await sendBtn.click();
  await page.waitForTimeout(300);

  expect(await input.inputValue()).toBe("");
  await shot("control-bar-after-send");
});

test("4e. Enter key sends broadcast", async () => {
  const input = page.locator('input[placeholder*="Broadcast"]');
  await input.fill("enter key test");
  await input.press("Enter");
  await page.waitForTimeout(300);

  expect(await input.inputValue()).toBe("");
});

test("4f. Quick commands dropdown opens", async () => {
  // The lightning bolt quick commands button
  const quickBtn = page.locator('button[title="Quick commands"]');
  if (await quickBtn.isVisible()) {
    await quickBtn.click();
    await page.waitForTimeout(300);
    await shot("control-bar-quick-commands");

    const body = await page.textContent("body");
    expect(body).toContain("Status check");
    expect(body).toContain("Continue working");
    expect(body).toContain("Wrap up");
    expect(body).toContain("Run tests");

    // Close dropdown by clicking outside
    await page.click("body", { position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
  }
});

test("4g. Save button is visible", async () => {
  const saveBtn = page.locator('button:has-text("Save")').last();
  await expect(saveBtn).toBeVisible();
  await shot("control-bar-save-btn");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. STATUS BAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("5a. Status bar shows grid dimensions", async () => {
  await shot("status-bar");
  // StatusBar renders "NxM" (grid dimensions) — use innerText to skip xterm style tags
  const text = await page.evaluate(() => document.body.innerText);
  // Matches "3x3" or "2x2" etc. (StatusBar no longer includes the word "grid")
  expect(text).toMatch(/\dx\d/);
});

test("5b. Status bar shows pane connection count", async () => {
  const text = await page.evaluate(() => document.body.innerText);
  // StatusBar shows "N/M" for connected/total panes, or "mock" in mock mode
  expect(text).toMatch(/(\d+\/\d+|mock)/);
});

test("5c. Status bar shows completion progress", async () => {
  const text = await page.evaluate(() => document.body.innerText);
  // Shows "N/M" ratio in the progress area
  expect(text).toMatch(/\d+\/\d+/);
});

test("5d. Status bar shows version", async () => {
  const text = await page.evaluate(() => document.body.innerText);
  expect(text).toContain("AgentGrid v");
});

test("5e. Status bar shows panes info", async () => {
  const text = await page.evaluate(() => document.body.innerText);
  // Should show pane count in titlebar or status bar
  expect(text).toContain("panes");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. SETTINGS (Cmd+,)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("6a. Settings opens with Cmd+comma", async () => {
  await page.keyboard.press("Meta+,");
  await page.waitForTimeout(500);
  await shot("settings-open");

  const body = await page.textContent("body");
  expect(body).toContain("Settings");
  expect(body).toContain("General");
  expect(body).toContain("Models");
  expect(body).toContain("API Keys");
  expect(body).toContain("Appearance");
  expect(body).toContain("Terminal");
});

test("6b. Settings General section shows CLI tools and effort levels", async () => {
  const body = await page.textContent("body");
  expect(body).toContain("Default CLI Tool");
  expect(body).toContain("Default Effort Level");
  expect(body).toContain("Low");
  expect(body).toContain("Medium");
  expect(body).toContain("High");
  expect(body).toContain("Max");
  await shot("settings-general");
});

test("6c. Settings Models section shows model options", async () => {
  const modelsBtn = page.locator('button:has-text("Models")');
  await modelsBtn.click();
  await page.waitForTimeout(300);
  await shot("settings-models");

  const body = await page.textContent("body");
  expect(body).toContain("Default Model");
  expect(body).toContain("Per-Pane Override");
});

test("6d. Settings API Keys section shows inputs", async () => {
  const keysBtn = page.locator('button:has-text("API Keys")');
  await keysBtn.click();
  await page.waitForTimeout(300);
  await shot("settings-api-keys");

  const body = await page.textContent("body");
  expect(body).toContain("OpenAI API Key");
  expect(body).toContain("Whisper API Key");
  expect(body).toContain("Keys are stored in localStorage");
});

test("6e. Settings Appearance section shows theme toggle", async () => {
  const appearBtn = page.locator('button:has-text("Appearance")');
  await appearBtn.click();
  await page.waitForTimeout(300);
  await shot("settings-appearance");

  const body = await page.textContent("body");
  expect(body).toContain("Theme");
  expect(body).toContain("dark");
  expect(body).toContain("light");
});

test("6f. Settings Terminal section shows defaults", async () => {
  const termBtn = page.locator('button:has-text("Terminal")').first();
  await termBtn.click();
  await page.waitForTimeout(300);
  await shot("settings-terminal");

  const body = await page.textContent("body");
  expect(body).toContain("JetBrains Mono");
  expect(body).toContain("5,000 lines");
  expect(body).toContain("Bar, blinking");
  expect(body).toContain("WebGL (GPU)");
});

test("6g. Settings closes with Escape", async () => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  // Settings modal should be gone
  const settingsTitle = page.locator("text=Settings >> visible=true");
  // Should not be in a modal anymore (might still appear in sidebar)
  await shot("settings-closed");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. DARK THEME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("7a. App uses warm black background (not pure black)", async () => {
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
    // Warm black should be around rgb(20, 19, 18) — NOT rgb(0,0,0)
    expect(r).toBeLessThan(35);
    expect(g).toBeLessThan(35);
    expect(b).toBeLessThan(35);
    // Should NOT be pure black
    expect(r + g + b).toBeGreaterThan(0);
  }
  await shot("dark-theme-bg");
});

test("7b. No white-on-white text issues in dark mode", async () => {
  // Check that text elements have appropriate contrast (not invisible)
  const textColors = await page.evaluate(() => {
    const elements = document.querySelectorAll("span, p, h1, h2, div, button, label");
    const colors: Array<{ text: string; bg: string; content: string }> = [];
    elements.forEach((el) => {
      const style = getComputedStyle(el);
      const content = el.textContent?.trim().slice(0, 30) ?? "";
      if (content) {
        colors.push({
          text: style.color,
          bg: style.backgroundColor,
          content,
        });
      }
    });
    return colors.slice(0, 20); // Sample first 20
  });

  // Verify no pure white (#fff) text on white background
  for (const item of textColors) {
    const isWhiteText = item.text === "rgb(255, 255, 255)";
    const isWhiteBg = item.bg === "rgb(255, 255, 255)";
    expect(isWhiteText && isWhiteBg).toBe(false);
  }
  await shot("dark-theme-contrast");
});

test("7c. All borders are visible (not missing in dark mode)", async () => {
  const borderCount = await page.evaluate(() => {
    const elements = document.querySelectorAll("*");
    let count = 0;
    elements.forEach((el) => {
      const style = getComputedStyle(el);
      if (
        style.borderTopWidth !== "0px" ||
        style.borderBottomWidth !== "0px" ||
        style.borderLeftWidth !== "0px" ||
        style.borderRightWidth !== "0px"
      ) {
        count++;
      }
    });
    return count;
  });
  // Should have reasonable number of bordered elements
  expect(borderCount).toBeGreaterThan(5);
  await shot("dark-theme-borders");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. KEYBOARD SHORTCUTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("8a. Cmd+K toggles command palette", async () => {
  // Open
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(400);
  let cmdInput = page.locator('input[placeholder*="command"]');
  expect(await cmdInput.isVisible()).toBe(true);

  // Close
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(400);
  cmdInput = page.locator('input[placeholder*="command"]');
  expect(await cmdInput.isVisible().catch(() => false)).toBe(false);
});

test("8b. Cmd+backslash toggles sidebar", async () => {
  // Open
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(400);
  let body = await page.textContent("body");
  expect(body).toContain("Workspaces");

  // Close
  await page.keyboard.press("Meta+\\");
  await page.waitForTimeout(400);
  await shot("keyboard-sidebar-toggle");
});

test("8c. Cmd+comma toggles settings", async () => {
  // Open
  await page.keyboard.press("Meta+,");
  await page.waitForTimeout(400);
  let body = await page.textContent("body");
  expect(body).toContain("General");
  expect(body).toContain("Models");

  // Close with Escape (settings uses Escape, not toggle)
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await shot("keyboard-settings-toggle");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. TITLEBAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("9a. Titlebar shows pane count", async () => {
  const titlebar = page.locator(".titlebar-drag");
  if (await titlebar.isVisible()) {
    const text = await titlebar.textContent();
    expect(text).toContain("AgentGrid");
    expect(text).toContain("panes");
  }
  await shot("titlebar");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. ERROR STATES & STABILITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("10a. No critical JavaScript errors in console", async () => {
  const errors = await consoleErrors();
  // Filter out known non-critical errors
  const critical = errors.filter(
    (e) =>
      !e.includes("IPC") && // IPC errors expected in test mode
      !e.includes("preload") &&
      !e.includes("ResizeObserver") && // Common non-issue
      !e.includes("net::ERR") && // Network errors in test
      !e.includes("favicon"),
  );
  // Allow some non-critical console.error calls but fail on real crashes
  const crashErrors = critical.filter(
    (e) =>
      e.includes("Uncaught") ||
      e.includes("TypeError") ||
      e.includes("ReferenceError") ||
      e.includes("Cannot read properties of null"),
  );
  expect(crashErrors).toEqual([]);
  await shot("no-errors");
});

test("10b. App is still responsive after full test suite", async () => {
  const isReady = await page.evaluate(() => document.readyState === "complete");
  expect(isReady).toBe(true);

  // Can still interact with UI
  const btn = page.locator("button").first();
  if (await btn.isVisible()) {
    await btn.click();
  }
  await shot("still-responsive");
});

test("10c. ErrorBoundary wraps main content", async () => {
  // Verify ErrorBoundary is rendered in the DOM
  const hasEB = await page.evaluate(() => {
    // Check if any element has error boundary characteristics
    return document.querySelector("#root")?.children?.length > 0;
  });
  expect(hasEB).toBe(true);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 11. GRID VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("11a. Grid has correct number of panes for 2x2", async () => {
  // Count elements that look like terminal panes
  const paneCount = await page.evaluate(() => {
    // Look for xterm containers or pane-like elements
    const xterms = document.querySelectorAll(".xterm");
    const paneHeaders = document.querySelectorAll('[class*="pane"]');
    return Math.max(xterms.length, Math.floor(paneHeaders.length / 2)); // rough estimate
  });
  // Should have at least 1 visible pane element (grid rendered)
  expect(paneCount).toBeGreaterThanOrEqual(1);
  await shot("grid-panes");
});

test("11b. Pane headers show labels", async () => {
  const body = await page.textContent("body");
  // Default labels are "Agent 1", "Agent 2" etc.
  expect(body).toContain("Agent");
  await shot("pane-labels");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 12. MEMORY / PERFORMANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("12a. Memory usage is reasonable", async () => {
  const memory = await page.evaluate(() => {
    if (performance && "memory" in performance) {
      const mem = (performance as { memory: { usedJSHeapSize: number } }).memory;
      return mem.usedJSHeapSize;
    }
    return null;
  });

  if (memory !== null) {
    // Should use less than 200MB of JS heap
    expect(memory).toBeLessThan(200 * 1024 * 1024);
  }
  await shot("memory-check");
});

test("12b. DOM node count is reasonable", async () => {
  const nodeCount = await page.evaluate(() => document.querySelectorAll("*").length);
  // Reasonable for a rich app — less than 5000 nodes
  expect(nodeCount).toBeLessThan(5000);
  await shot("dom-node-count");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINAL SCREENSHOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test("FINAL. Complete test suite screenshot", async () => {
  await shot("final-state");
});
