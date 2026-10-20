import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AGENT_INSTALL_COMMANDS, AGENT_INSTALL_PAGES, KNOWN_AGENTS } from "../lib/constants.js";

// Every install command agentgrid can run must be in install-allowlist.json with its source, in both code paths:
// the bash script (`agentgrid`) and the TypeScript constants. A command nobody checked could install a stranger's
// package under a familiar name.
const root = (rel: string): string => fileURLToPath(new URL(`../../${rel}`, import.meta.url));

interface Allowlist {
  commands: { agent: string; command: string; source: string; checked: string }[];
  pages: { agent: string; page: string; why: string; checked: string }[];
}

const allow = JSON.parse(readFileSync(root("install-allowlist.json"), "utf8")) as Allowlist;
const script = readFileSync(root("agentgrid"), "utf8");

/** The `agent) echo "value" ;;` pairs inside one bash function of the script. */
function bashCase(fn: string): Record<string, string> {
  const start = script.indexOf(`${fn}() {`);
  const body = script.slice(start, script.indexOf("\n}\n", start));
  const pairs: Record<string, string> = {};
  for (const m of body.matchAll(/^\s+([a-z]+)\)\s+echo "([^"]+)" ;;$/gm)) pairs[m[1]!] = m[2]!;
  return pairs;
}

describe("install allowlist", () => {
  const listed = new Map(allow.commands.map((c) => [c.agent, c]));

  it("lists a source and a check date for every command and page", () => {
    for (const c of allow.commands) expect(c.source.length > 10 && /^\d{4}-\d{2}-\d{2}$/.test(c.checked)).toBe(true);
    for (const p of allow.pages) expect(p.why.length > 10 && p.page.startsWith("https://")).toBe(true);
  });

  it("allows every command in src/lib/constants.ts", () => {
    for (const [agent, command] of Object.entries(AGENT_INSTALL_COMMANDS)) {
      expect(listed.get(agent)?.command, agent).toBe(command);
    }
  });

  it("allows every command in the agentgrid script", () => {
    const commands = bashCase("get_agent_install_cmd");
    expect(Object.keys(commands).length).toBeGreaterThan(0);
    for (const [agent, command] of Object.entries(commands)) expect(listed.get(agent)?.command, agent).toBe(command);
  });

  it("keeps the script and the constants identical", () => {
    expect(bashCase("get_agent_install_cmd")).toEqual(AGENT_INSTALL_COMMANDS);
    expect(bashCase("get_agent_install_page")).toEqual(AGENT_INSTALL_PAGES);
    expect(Object.fromEntries(allow.pages.map((p) => [p.agent, p.page]))).toEqual(AGENT_INSTALL_PAGES);
  });

  it("gives every known agent a verified command or a vendor page, never both", () => {
    for (const agent of KNOWN_AGENTS) {
      expect(Boolean(AGENT_INSTALL_COMMANDS[agent]) !== Boolean(AGENT_INSTALL_PAGES[agent]), agent).toBe(true);
    }
  });
});
