import { defineConfig } from "vitest/config";

// Root config scopes vitest to the CLI package (src/). The Electron desktop
// app under app/ is a separate workspace with its own package.json, its own
// node_modules (incl. the node-pty native module), and its own
// app/vitest.config.ts — run `pnpm --dir app test` to exercise that suite.
export default defineConfig({
  test: {
    fileParallelism: false,
    include: ["src/**/*.{test,spec}.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/out/**",
      "**/release/**",
      "**/e2e/**",
      "**/*.e2e.*",
      "app/**",
    ],
  },
});
