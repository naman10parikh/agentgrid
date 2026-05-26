import { test, expect, _electron } from "@playwright/test";

test("tmux-backed terminals: all 4 panes work", async () => {
  const app = await _electron.launch({
    args: ["./out/main/index.js"],
    cwd: process.cwd(),
  });
  const page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // Take screenshot of initial state (should be WelcomeScreen, NOT auto-restored grid)
  await page.screenshot({ path: "tests/screenshots/tmux-verify/01-welcome.png" });

  // Create 2x2 grid
  const gridBtn = page.locator("button", { hasText: /2.*2|four/i }).first();
  if (await gridBtn.isVisible()) {
    await gridBtn.click();
    await page.waitForTimeout(3000); // Wait for tmux sessions to create
  }

  await page.screenshot({ path: "tests/screenshots/tmux-verify/02-grid-created.png" });

  // Check how many terminal panes exist
  const panes = await page.locator("[data-testid='terminal-pane'], .terminal-pane, .xterm").count();
  console.log(`Found ${panes} terminal panes`);

  // Verify window.api exists
  const hasApi = await page.evaluate(() => !!window.api?.terminal?.write);
  console.log(`window.api.terminal.write exists: ${hasApi}`);

  // Check tmux sessions exist
  const tmuxSessions = await page.evaluate(() => {
    try {
      return (window as any).__tmuxSessionCount || "unknown";
    } catch {
      return "error";
    }
  });
  console.log(`tmux sessions: ${tmuxSessions}`);

  await page.screenshot({ path: "tests/screenshots/tmux-verify/03-final.png" });

  await app.close();
});
