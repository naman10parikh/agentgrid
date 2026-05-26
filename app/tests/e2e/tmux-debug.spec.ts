import { test, _electron } from "@playwright/test";
import { execSync } from "child_process";

test("tmux debug: verify sessions exist and have shells", async () => {
  const app = await _electron.launch({
    args: ["./out/main/index.js"],
    cwd: process.cwd(),
  });
  const page = await app.firstWindow();
  await page.waitForTimeout(2000);

  // Create 2x2 grid
  const btn = page.locator("button:has-text('2x2')").first();
  if (await btn.isVisible()) await btn.click();
  await page.waitForTimeout(8000); // 500ms stagger * 4 + margin

  // Check tmux sessions from OUTSIDE the app
  try {
    const sessions = execSync("tmux -L agentgrid list-sessions 2>&1", {
      encoding: "utf8",
    });
    console.log("TMUX SESSIONS:\n" + sessions);
  } catch (e: unknown) {
    console.log("TMUX ERROR: " + ((e as { stderr?: string }).stderr || (e as Error).message));
  }

  // Also try listing panes
  try {
    const panes = execSync(
      "tmux -L agentgrid list-panes -a -F '#{session_name}: #{pane_pid} #{pane_current_command}' 2>&1",
      { encoding: "utf8" },
    );
    console.log("TMUX PANES:\n" + panes);
  } catch (e: unknown) {
    console.log("PANES ERROR: " + (e as Error).message);
  }

  // Try sending a command to first session
  try {
    const sessions = execSync("tmux -L agentgrid list-sessions -F '#{session_name}' 2>&1", {
      encoding: "utf8",
    })
      .trim()
      .split("\n");
    if (sessions.length > 0) {
      // Send 'echo TEST' to first session
      execSync(`tmux -L agentgrid send-keys -t '${sessions[0]}' 'echo TMUX_DIRECT_TEST' Enter`, {
        encoding: "utf8",
      });
      console.log(`Sent command to ${sessions[0]}`);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "tests/screenshots/debug/05-after-tmux-send.png" });
    }
  } catch (e: unknown) {
    console.log("SEND ERROR: " + (e as Error).message);
  }

  await page.screenshot({ path: "tests/screenshots/debug/06-tmux-debug-final.png" });
  await app.close();
});
