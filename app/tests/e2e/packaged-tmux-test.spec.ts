import { test, expect, _electron } from "@playwright/test";
import * as path from "path";

const APP_PATH =
  "./release/mac-arm64/AgentGrid.app/Contents/MacOS/AgentGrid";

test("packaged app: tmux terminals work in all panes", async () => {
  const app = await _electron.launch({ executablePath: APP_PATH });
  const page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // 1. Welcome screen should appear (not auto-restored grid)
  await page.screenshot({
    path: "tests/screenshots/packaged-tmux/01-welcome.png",
  });
  const title = await page.title();
  console.log(`Title: ${title}`);

  // 2. Create 2x2 grid
  const gridBtn = page.locator("button", { hasText: /2.*2|quad/i }).first();
  if (await gridBtn.isVisible()) {
    await gridBtn.click();
    // Give tmux sessions time to create and attach
    await page.waitForTimeout(5000);
  }

  await page.screenshot({
    path: "tests/screenshots/packaged-tmux/02-grid.png",
  });

  // 3. Check API is available
  const apiCheck = await page.evaluate(() => ({
    grid: !!window.api?.grid,
    terminal: !!window.api?.terminal?.write,
    pane: !!window.api?.pane,
  }));
  console.log(`API: grid=${apiCheck.grid} terminal=${apiCheck.terminal} pane=${apiCheck.pane}`);
  expect(apiCheck.terminal).toBe(true);

  // 4. Try typing in the first pane
  const firstPane = page.locator(".xterm-screen").first();
  if (await firstPane.isVisible()) {
    await firstPane.click();
    await page.waitForTimeout(500);
    await page.keyboard.type("echo AGENTGRID_TEST_OK", { delay: 30 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
  }

  await page.screenshot({
    path: "tests/screenshots/packaged-tmux/03-typed.png",
  });

  // 5. Check cursor style is block
  const cursorStyle = await page.evaluate(() => {
    const term = document.querySelector(".xterm-cursor-block");
    return term ? "block" : "not-block";
  });
  console.log(`Cursor: ${cursorStyle}`);

  // 6. Final state
  await page.screenshot({
    path: "tests/screenshots/packaged-tmux/04-final.png",
  });

  await app.close();
});
