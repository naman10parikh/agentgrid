import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "../docs/test-report", open: "never" }]],
  use: {
    trace: "on",
    screenshot: "on",
    video: "retain-on-failure",
  },
});
