import chalk from "chalk";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const DEFAULT_CONFIG = {
  defaultAgent: "claude",
  defaultModel: "claude-opus-4-6",
  defaultEffort: "max",
  defaultGrid: "2x3",
  mcpServers: [],
  skills: [],
  autoApprove: true,
};

const EXAMPLE_HARNESS = `name: my-project
description: Custom development team
version: 1
grid:
  rows: 2
  cols: 2
roles:
  - label: Builder 1
    agent: claude
    model: claude-opus-4-6
    effort: max
    position: [0, 0]
  - label: Builder 2
    agent: claude
    position: [0, 1]
  - label: QA
    agent: claude
    position: [1, 0]
  - label: Docs
    agent: claude
    position: [1, 1]
`;

export function cmdInit(opts?: { force?: boolean }): void {
  const cwd = process.cwd();
  const configPath = join(cwd, ".agentgrid.json");
  const harnessDir = join(cwd, ".agentgrid", "harnesses");

  if (existsSync(configPath) && !opts?.force) {
    console.log(
      chalk.yellow(
        "⚠ .agentgrid.json already exists. Use --force to overwrite.",
      ),
    );
    return;
  }

  // Write config
  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
  console.log(chalk.green("✓ Created .agentgrid.json"));

  // Create harness directory with example
  mkdirSync(harnessDir, { recursive: true });
  const examplePath = join(harnessDir, "example.yaml");
  if (!existsSync(examplePath)) {
    writeFileSync(examplePath, EXAMPLE_HARNESS);
    console.log(chalk.green("✓ Created .agentgrid/harnesses/example.yaml"));
  }

  console.log("");
  console.log(chalk.white("AgentGrid initialized! Next steps:"));
  console.log(chalk.dim("  1. Edit .agentgrid.json to set defaults"));
  console.log(
    chalk.dim("  2. Edit .agentgrid/harnesses/example.yaml for your team"),
  );
  console.log(chalk.dim("  3. Run: agentgrid 2x2 claude"));
  console.log("");
}
