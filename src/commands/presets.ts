import chalk from "chalk";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
} from "node:fs";
import { join, basename } from "node:path";
import { PRESETS_DIR } from "../lib/constants.js";

interface PresetPaneConfig {
  name: string;
  agent: string;
}

interface Preset {
  description?: string;
  panes: PresetPaneConfig[];
}

export function cmdPreset(action = "list", name?: string): void {
  switch (action) {
    case "list": {
      console.log(`\n${chalk.bold("⚡ Presets")}\n`);
      mkdirSync(PRESETS_DIR, { recursive: true });
      const files = readdirSync(PRESETS_DIR).filter((f) => f.endsWith(".json"));
      if (files.length === 0) {
        console.log(
          `  ${chalk.dim("No presets. Create one with: agentgrid setup")}`,
        );
      } else {
        for (const f of files) {
          const pname = basename(f, ".json");
          try {
            const data: Preset = JSON.parse(
              readFileSync(join(PRESETS_DIR, f), "utf-8"),
            );
            const count = data.panes?.length ?? "?";
            const desc = data.description ?? "";
            console.log(
              `  ${chalk.magenta("▸")} ${chalk.bold(pname)} — ${count} panes ${chalk.dim(desc)}`,
            );
          } catch {
            console.log(
              `  ${chalk.magenta("▸")} ${chalk.bold(pname)} — error reading`,
            );
          }
        }
      }
      console.log("");
      break;
    }

    case "show": {
      if (!name) {
        console.error(
          chalk.red("[agentgrid]") + " Usage: agentgrid preset show <name>",
        );
        process.exit(1);
      }
      const file = join(PRESETS_DIR, `${name}.json`);
      if (!existsSync(file)) {
        console.error(chalk.red("[agentgrid]") + ` Not found: ${name}`);
        process.exit(1);
      }
      const data: Preset = JSON.parse(readFileSync(file, "utf-8"));
      console.log(`\n  ${name}: ${data.description ?? ""}`);
      console.log(`  Panes: ${data.panes.length}\n`);
      for (let i = 0; i < data.panes.length; i++) {
        const p = data.panes[i]!;
        console.log(`  ${i + 1}. ${p.name} -> ${p.agent || "(empty)"}`);
      }
      console.log("");
      break;
    }

    case "delete": {
      if (!name) {
        console.error(
          chalk.red("[agentgrid]") + " Usage: agentgrid preset delete <name>",
        );
        process.exit(1);
      }
      const file = join(PRESETS_DIR, `${name}.json`);
      if (existsSync(file)) {
        unlinkSync(file);
        console.log(chalk.magenta("[agentgrid]") + ` Deleted: ${name}`);
      } else {
        console.error(chalk.red("[agentgrid]") + ` Not found: ${name}`);
      }
      break;
    }

    default:
      console.error(
        chalk.red("[agentgrid]") +
          " Usage: agentgrid preset [list|show|delete] <name>",
      );
  }
}
