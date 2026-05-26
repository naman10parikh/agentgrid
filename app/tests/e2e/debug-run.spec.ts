import { _electron } from "@playwright/test";

(async () => {
  const app = await _electron.launch({ args: ["./out/main/index.js"] });
  const page = await app.firstWindow();
  await page.waitForTimeout(2000);

  // Create 2x2 grid
  const btn = page.locator("button:has-text('2x2')").first();
  if (await btn.isVisible()) await btn.click();

  // Wait for all 4 sessions (500ms stagger)
  await page.waitForTimeout(6000);

  // Check tmux sessions
  const { execSync } = await import("child_process");
  try {
    const sessions = execSync("tmux -L agentgrid list-sessions 2>&1", { encoding: "utf8" });
    console.log("TMUX SESSIONS:", sessions);
  } catch (e: any) {
    console.log("TMUX ERROR:", e.stderr || e.message);
  }

  await page.screenshot({ path: "tests/screenshots/debug/04-debug-run.png" });
  await app.close();
})();
