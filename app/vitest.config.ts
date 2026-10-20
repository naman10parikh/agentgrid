import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    globals: true,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // The app keeps the user's live panes on the "agentgrid" tmux server and their details in
    // ~/.agentgrid/terminal-sessions; the tests kill that server after each test, so they get their own.
    env: {
      AGENTGRID_TMUX_SOCKET: `agentgrid-test-${process.pid}`,
      AGENTGRID_SESSION_DIR: join(tmpdir(), `agentgrid-test-sessions-${process.pid}`),
    },
    coverage: {
      provider: "v8",
      include: ["src/main/**/*.ts"],
    },
  },
});
