import chalk from "chalk";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";

const HARNESS_DIR = join(homedir(), ".agentgrid", "harnesses");

interface HarnessConfig {
  name: string;
  description?: string;
  model?: string;
  effort?: string;
  context?: string[];
  tools?: string[];
  rules?: string[];
  createdAt?: string;
}

export function cmdHarness(action: string, nameOrPath?: string): void {
  mkdirSync(HARNESS_DIR, { recursive: true });

  switch (action) {
    case "list": {
      console.log(`\n${chalk.bold("⚡ Harnesses")}\n`);
      const files = readdirSync(HARNESS_DIR).filter((f) => f.endsWith(".json"));
      if (files.length === 0) {
        console.log(
          `  ${chalk.dim("No harnesses. Save one: agentgrid harness save <name>")}`,
        );
      } else {
        for (const f of files) {
          const hname = basename(f, ".json");
          try {
            const data: HarnessConfig = JSON.parse(
              readFileSync(join(HARNESS_DIR, f), "utf-8"),
            );
            const desc = data.description ?? "";
            const model = data.model
              ? chalk.cyan(data.model)
              : chalk.dim("default");
            console.log(
              `  ${chalk.magenta("▸")} ${chalk.bold(hname)} — ${model} ${chalk.dim(desc)}`,
            );
          } catch {
            console.log(
              `  ${chalk.magenta("▸")} ${chalk.bold(hname)} — error reading`,
            );
          }
        }
      }
      console.log("");
      break;
    }

    case "save": {
      if (!nameOrPath) {
        console.error(
          chalk.red("[agentgrid]") + " Usage: agentgrid harness save <name>",
        );
        process.exit(1);
      }
      // Capture current harness state from CWD
      const config: HarnessConfig = {
        name: nameOrPath,
        description: `Harness from ${process.cwd()}`,
        model: "claude-opus-4-6",
        effort: "max",
        context: [],
        tools: [],
        rules: [],
        createdAt: new Date().toISOString(),
      };

      // Read .claude/rules/ if exists
      const rulesDir = join(process.cwd(), ".claude", "rules");
      if (existsSync(rulesDir)) {
        config.rules = readdirSync(rulesDir)
          .filter((f) => f.endsWith(".md"))
          .map((f) => f);
      }

      writeFileSync(
        join(HARNESS_DIR, `${nameOrPath}.json`),
        JSON.stringify(config, null, 2),
      );
      console.log(
        chalk.magenta("[agentgrid]") +
          ` Harness saved: ${chalk.bold(nameOrPath)}`,
      );
      break;
    }

    case "load": {
      if (!nameOrPath) {
        console.error(
          chalk.red("[agentgrid]") + " Usage: agentgrid harness load <name>",
        );
        process.exit(1);
      }
      const file = join(HARNESS_DIR, `${nameOrPath}.json`);
      if (!existsSync(file)) {
        console.error(
          chalk.red("[agentgrid]") + ` Harness not found: ${nameOrPath}`,
        );
        process.exit(1);
      }

      const config: HarnessConfig = JSON.parse(readFileSync(file, "utf-8"));
      console.log(`\n${chalk.bold("Harness:")} ${config.name}`);
      console.log(`  ${chalk.dim("Model:")} ${config.model ?? "default"}`);
      console.log(`  ${chalk.dim("Effort:")} ${config.effort ?? "default"}`);
      if (config.rules?.length) {
        console.log(`  ${chalk.dim("Rules:")} ${config.rules.join(", ")}`);
      }
      if (config.context?.length) {
        console.log(`  ${chalk.dim("Context:")} ${config.context.join(", ")}`);
      }
      console.log("");
      break;
    }

    case "show": {
      // Alias for load
      cmdHarness("load", nameOrPath);
      break;
    }

    default:
      console.error(
        chalk.red("[agentgrid]") +
          " Usage: agentgrid harness [list|save|load] <name>",
      );
      process.exit(1);
  }
}
