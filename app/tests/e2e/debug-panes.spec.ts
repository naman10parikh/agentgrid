import { test, expect, _electron } from "@playwright/test";

const APP_PATH =
  "./release/mac-arm64/AgentGrid.app/Contents/MacOS/AgentGrid";

test("debug: check each pane individually for shell output", async () => {
  const app = await _electron.launch({ executablePath: APP_PATH });
  const page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // Create 2x2 grid
  const btn = page.locator("button:has-text('2x2')").first();
  if (await btn.isVisible()) await btn.click();

  // Wait LONGER for all 4 tmux sessions to fully initialize (500ms stagger = 2s total + margin)
  await page.waitForTimeout(8000);
  await page.screenshot({ path: "tests/screenshots/debug/01-after-8s-wait.png" });

  // Check each xterm element individually
  const xtermScreens = page.locator(".xterm-screen");
  const count = await xtermScreens.count();
  console.log(`Total xterm screens: ${count}`);

  for (let i = 0; i < count; i++) {
    const screen = xtermScreens.nth(i);
    const box = await screen.boundingBox();
    console.log(`Pane ${i}: box=${JSON.stringify(box)}`);

    // Click into pane
    await screen.click();
    await page.waitForTimeout(500);

    // Type a unique command
    await page.keyboard.type(`echo PANE_${i}_OK`, { delay: 30 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `tests/screenshots/debug/02-pane${i}-typed.png` });
  }

  // Final screenshot showing all panes
  await page.screenshot({ path: "tests/screenshots/debug/03-all-panes-final.png" });

  // Check tmux sessions from within the app
  const tmuxInfo = await page.evaluate(async () => {
    try {
      // Try to get grid info
      const grid = await (window as any).api?.grid?.get();
      return {
        gridExists: !!grid,
        paneCount: grid?.panes?.length ?? 0,
        paneIds: grid?.panes?.map((p: any) => p.id) ?? [],
      };
    } catch (e) {
      return { error: String(e) };
    }
  });
  console.log("Grid info:", JSON.stringify(tmuxInfo));

  await app.close();
});
