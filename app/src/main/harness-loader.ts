/**
 * Harness Loader — Read YAML harness files, configure grids from templates.
 *
 * Harness format:
 * ```yaml
 * name: engineering-sprint
 * description: Full dev team for feature work
 * version: 1
 * grid:
 *   rows: 2
 *   cols: 3
 * roles:
 *   - label: CEO
 *     agent: claude
 *     model: claude-opus-4-6
 *     effort: max
 *     position: [0, 0]
 *   - label: VP-ARCHITECT
 *     agent: claude
 *     position: [0, 1]
 *   - label: VP-BUILDER-1
 *     agent: claude
 *     position: [0, 2]
 * ```
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join, basename } from "path";
import { parse, stringify } from "yaml";
import type { CliTool, EffortLevel } from "../shared/types";

export interface HarnessRole {
  label: string;
  agent: CliTool;
  model?: string;
  effort?: EffortLevel;
  position: [number, number]; // [row, col]
  mission?: string;
  phase?: number; // execution order (0 = first wave)
}

export interface HarnessDefinition {
  name: string;
  description?: string;
  version: number;
  grid: {
    rows: number;
    cols: number;
  };
  roles: HarnessRole[];
  tags?: string[];
}

export class HarnessLoader {
  private harnessDir: string;

  constructor(harnessDir?: string) {
    this.harnessDir = harnessDir ?? join(process.cwd(), ".claude", "harnesses");
  }

  /**
   * Load a harness by name from the harness directory.
   */
  load(name: string): HarnessDefinition | null {
    const filePath = join(this.harnessDir, `${name}.yaml`);
    if (!existsSync(filePath)) {
      // Try .yml extension
      const ymlPath = join(this.harnessDir, `${name}.yml`);
      if (!existsSync(ymlPath)) return null;
      return this.parseFile(ymlPath);
    }
    return this.parseFile(filePath);
  }

  /**
   * List all available harnesses.
   */
  list(): Array<{ name: string; description?: string; roles: number }> {
    if (!existsSync(this.harnessDir)) return [];

    const files = readdirSync(this.harnessDir).filter(
      (f) => f.endsWith(".yaml") || f.endsWith(".yml"),
    );

    return files
      .map((f) => {
        const harness = this.parseFile(join(this.harnessDir, f));
        if (!harness) return null;
        return {
          name: harness.name,
          description: harness.description,
          roles: harness.roles.length,
        };
      })
      .filter((h): h is NonNullable<typeof h> => h !== null);
  }

  /**
   * Save a harness definition to a YAML file.
   */
  save(harness: HarnessDefinition): void {
    mkdirSync(this.harnessDir, { recursive: true });
    const filePath = join(this.harnessDir, `${harness.name}.yaml`);
    writeFileSync(filePath, stringify(harness));
  }

  /**
   * Delete a harness file.
   */
  delete(name: string): boolean {
    const filePath = join(this.harnessDir, `${name}.yaml`);
    if (!existsSync(filePath)) return false;
    unlinkSync(filePath);
    return true;
  }

  /**
   * Validate a harness definition.
   */
  validate(harness: HarnessDefinition): string[] {
    const errors: string[] = [];

    if (!harness.name) errors.push("Missing name");
    if (!harness.grid) errors.push("Missing grid");
    if (!harness.roles || harness.roles.length === 0) errors.push("No roles defined");

    if (harness.grid) {
      if (harness.grid.rows < 1 || harness.grid.rows > 10) {
        errors.push("Grid rows must be 1-10");
      }
      if (harness.grid.cols < 1 || harness.grid.cols > 10) {
        errors.push("Grid cols must be 1-10");
      }
    }

    if (harness.roles) {
      const maxPanes = (harness.grid?.rows ?? 0) * (harness.grid?.cols ?? 0);
      if (harness.roles.length > maxPanes) {
        errors.push(`Too many roles (${harness.roles.length}) for grid (${maxPanes} panes)`);
      }

      for (const role of harness.roles) {
        if (!role.label) errors.push("Role missing label");
        if (!role.agent) errors.push(`Role ${role.label} missing agent`);
        if (!role.position || role.position.length !== 2) {
          errors.push(`Role ${role.label} missing position [row, col]`);
        }
      }
    }

    return errors;
  }

  /**
   * Generate a harness from an active grid layout.
   */
  fromGrid(
    name: string,
    grid: {
      rows: number;
      cols: number;
      panes: Array<{
        label: string;
        agent: string;
        model?: string;
        effort?: string;
        row: number;
        col: number;
      }>;
    },
    description?: string,
  ): HarnessDefinition {
    return {
      name,
      description,
      version: 1,
      grid: { rows: grid.rows, cols: grid.cols },
      roles: grid.panes.map((p) => ({
        label: p.label,
        agent: p.agent as CliTool,
        model: p.model,
        effort: p.effort as EffortLevel | undefined,
        position: [p.row, p.col] as [number, number],
      })),
    };
  }

  /**
   * Get built-in harness templates.
   */
  getTemplates(): HarnessDefinition[] {
    return [
      {
        name: "dev-sprint",
        description: "Software engineering sprint — CEO + architect + 2 builders + QA",
        version: 1,
        grid: { rows: 2, cols: 3 },
        roles: [
          { label: "CEO", agent: "claude", effort: "max", position: [0, 0] },
          { label: "VP-ARCHITECT", agent: "claude", position: [0, 1] },
          { label: "VP-BUILDER-1", agent: "claude", position: [0, 2] },
          { label: "VP-BUILDER-2", agent: "claude", position: [1, 0] },
          { label: "VP-QA", agent: "claude", position: [1, 1] },
          { label: "VP-RESEARCHER", agent: "claude", position: [1, 2] },
        ],
      },
      {
        name: "research-swarm",
        description: "Deep research — 3x3 grid of research agents",
        version: 1,
        grid: { rows: 3, cols: 3 },
        roles: Array.from({ length: 9 }, (_, i) => ({
          label: `Researcher ${i + 1}`,
          agent: "claude" as CliTool,
          position: [Math.floor(i / 3), i % 3] as [number, number],
        })),
      },
      {
        name: "mixed-agents",
        description: "Multi-model team — Claude + Codex + Gemini",
        version: 1,
        grid: { rows: 2, cols: 3 },
        roles: [
          { label: "Claude-Lead", agent: "claude", effort: "max", position: [0, 0] },
          { label: "Claude-2", agent: "claude", position: [0, 1] },
          { label: "Codex-1", agent: "codex", position: [0, 2] },
          { label: "Codex-2", agent: "codex", position: [1, 0] },
          { label: "Gemini-1", agent: "gemini", position: [1, 1] },
          { label: "Gemini-2", agent: "gemini", position: [1, 2] },
        ],
      },
    ];
  }

  /**
   * Generate a harness from a project description.
   * Uses pattern matching to assign roles, grid size, and phases.
   */
  generateFromDescription(description: string): HarnessDefinition {
    const desc = description.toLowerCase();

    // Detect project type and size
    const isLarge =
      desc.includes("full") ||
      desc.includes("complete") ||
      desc.includes("production") ||
      desc.length > 200;
    const hasDesign =
      desc.includes("design") ||
      desc.includes("ui") ||
      desc.includes("ux") ||
      desc.includes("frontend");
    const hasBackend =
      desc.includes("api") ||
      desc.includes("backend") ||
      desc.includes("server") ||
      desc.includes("database");
    const hasResearch =
      desc.includes("research") || desc.includes("investigate") || desc.includes("analyze");
    const hasContent =
      desc.includes("content") ||
      desc.includes("article") ||
      desc.includes("blog") ||
      desc.includes("docs");
    const hasQA = true; // Always include QA

    const roles: HarnessRole[] = [];
    let row = 0;
    let col = 0;
    const cols = isLarge ? 3 : 2;

    const addRole = (label: string, agent: CliTool = "claude", phase = 0) => {
      roles.push({ label, agent, position: [row, col] as [number, number], phase });
      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    };

    // CEO always first
    addRole("CEO", "claude", 0);

    if (hasResearch) addRole("VP-RESEARCHER", "claude", 0);
    if (hasDesign) addRole("VP-DESIGNER", "claude", 1);
    if (hasBackend) addRole("VP-BACKEND", "claude", 1);
    if (!hasDesign && !hasBackend) addRole("VP-BUILDER-1", "claude", 1);
    if (isLarge) addRole("VP-BUILDER-2", "claude", 1);
    if (hasContent) addRole("VP-CONTENT", "claude", 1);
    if (hasQA) addRole("ANVIL-QA", "claude", 2);

    const rows = row + (col > 0 ? 1 : 0);
    const name = `generated-${Date.now().toString(36)}`;

    const harness: HarnessDefinition = {
      name,
      description: description.slice(0, 200),
      version: 1,
      grid: { rows, cols },
      roles,
    };

    // Save to disk
    const outPath = join(this.harnessDir, `${name}.yaml`);
    writeFileSync(outPath, stringify(harness));

    return harness;
  }

  private parseFile(filePath: string): HarnessDefinition | null {
    try {
      const content = readFileSync(filePath, "utf-8");
      const data = parse(content) as HarnessDefinition;
      if (!data || typeof data !== "object") return null;
      // Default name from filename if not in YAML
      if (!data.name) {
        data.name = basename(filePath).replace(/\.(yaml|yml)$/, "");
      }
      return data;
    } catch {
      return null;
    }
  }
}
