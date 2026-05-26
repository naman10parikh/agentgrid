import chalk from "chalk";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { stringify } from "yaml";

interface HarnessRole {
  label: string;
  agent: string;
  model?: string;
  effort?: string;
  position: [number, number];
  mission?: string;
}

interface HarnessDefinition {
  name: string;
  description: string;
  version: number;
  grid: { rows: number; cols: number };
  roles: HarnessRole[];
  tags: string[];
}

const PREBUILT_TEMPLATES: Record<
  string,
  { desc: string; grid: string; roles: string[] }
> = {
  solo: { desc: "Single focused agent", grid: "1x1", roles: ["Agent"] },
  pair: {
    desc: "Two agents side by side",
    grid: "1x2",
    roles: ["Builder 1", "Builder 2"],
  },
  squad: {
    desc: "Four-agent team",
    grid: "2x2",
    roles: ["Lead", "Builder", "QA", "Docs"],
  },
  company: {
    desc: "Full 6-agent company",
    grid: "2x3",
    roles: ["CEO", "Architect", "Builder 1", "Builder 2", "QA", "Content"],
  },
  swarm: {
    desc: "9-agent research swarm",
    grid: "3x3",
    roles: [
      "Lead",
      "Analyst 1",
      "Analyst 2",
      "Analyst 3",
      "Researcher 1",
      "Researcher 2",
      "Writer",
      "Editor",
      "QA",
    ],
  },
};

export function cmdHarnessGen(
  name: string,
  opts: { template?: string; agent?: string },
): void {
  const agent = opts.agent ?? "claude";
  const template = opts.template ?? "squad";
  const tmpl = PREBUILT_TEMPLATES[template];

  if (!tmpl) {
    console.log(chalk.red(`Unknown template: ${template}`));
    console.log(
      chalk.dim(`Available: ${Object.keys(PREBUILT_TEMPLATES).join(", ")}`),
    );
    return;
  }

  const [rows, cols] = tmpl.grid.split("x").map(Number);
  const roles: HarnessRole[] = tmpl.roles.map((label, i) => ({
    label,
    agent,
    model: "claude-opus-4-6",
    effort: "max",
    position: [Math.floor(i / cols), i % cols] as [number, number],
  }));

  const harness: HarnessDefinition = {
    name,
    description: tmpl.desc,
    version: 1,
    grid: { rows, cols },
    roles,
    tags: [template, agent],
  };

  // Write to .agentgrid/harnesses/ or ~/.agentgrid/harnesses/
  const localDir = join(process.cwd(), ".agentgrid", "harnesses");
  const outputDir = existsSync(join(process.cwd(), ".agentgrid"))
    ? localDir
    : localDir;
  mkdirSync(outputDir, { recursive: true });

  const filePath = join(outputDir, `${name}.yaml`);
  if (existsSync(filePath)) {
    console.log(chalk.yellow(`⚠ ${filePath} already exists. Overwriting.`));
  }

  writeFileSync(filePath, stringify(harness));
  console.log(chalk.green(`✓ Generated harness: ${filePath}`));
  console.log(chalk.dim(`  Template: ${template} (${tmpl.desc})`));
  console.log(chalk.dim(`  Grid: ${tmpl.grid}, ${roles.length} roles`));
  console.log(chalk.dim(`  Agent: ${agent}`));
  console.log("");
  console.log(chalk.white("Load it with:"));
  console.log(chalk.dim(`  agentgrid harness load ${name}`));
}
