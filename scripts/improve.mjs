#!/usr/bin/env node
// scripts/improve.mjs: one turn of agentgrid's self-improvement loop (run nightly by .github/workflows/improve.yml).
//
// Deterministic: no model call, no secret, no network. It measures the repository against itself and writes
// proposals a person can act on:
//   1. runs the evals (eval/run.sh) and reads the golden results;
//   2. reads the live surface (every CLI command in `agentgrid --help`, every MCP tool in tools/list);
//   3. proposes docs for any command or tool that AGENTS.md, README.md and llms.txt never mention;
//   4. proposes skill coverage for any MCP tool no skill teaches;
//   5. checks the memory budget (MEMORY.md within 2,000 tokens) and that every LEARNINGS entry ends in a rule;
//   6. compares eval time with eval/baseline.json.
// Output: logs/proposal.md (gitignored). It never edits a tracked file, never commits, never merges.
// Exit 1 when the evals fail, so a scheduled run turns red and notifies the owner.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : "");
const proposals = [];
const propose = (area, text) => proposals.push(`- **${area}:** ${text}`);

// 1. Evals.
const evalRun = spawnSync("bash", ["eval/run.sh"], { cwd: ROOT, encoding: "utf8", timeout: 600_000 });
const evalOk = evalRun.status === 0;
const golden = JSON.parse(read("logs/eval-golden.json") || "{}");
if (!evalOk) propose("Evals", "the eval run failed. Read the failing lines below and fix the cause before anything else.");

// 2. The live surface.
const help = execFileSync(join(ROOT, "agentgrid"), ["--help"], { cwd: ROOT, encoding: "utf8" }).replace(/\x1b\[[0-9;]*m/g, "");
const commands = [...new Set([...help.matchAll(/^\s+agentgrid ([a-z][a-z-]+)/gm)].map((m) => m[1]))];
const rpc = [{ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }, { jsonrpc: "2.0", id: 2, method: "tools/list" }];
const mcp = spawnSync("node", ["dist/mcp-server.js"], {
  cwd: ROOT, input: rpc.map((r) => JSON.stringify(r)).join("\n") + "\n", encoding: "utf8", timeout: 30_000,
});
const tools = (mcp.stdout || "").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } })
  .find((m) => m.id === 2)?.result?.tools?.map((t) => t.name) ?? [];
if (tools.length === 0) propose("MCP", "the MCP server listed no tools. Build (`pnpm build`) and check `agentgrid-mcp`.");

// 3. Docs coverage.
const docs = read("AGENTS.md") + read("README.md") + read("llms.txt");
for (const c of commands) if (!docs.includes(`agentgrid ${c}`)) propose("Docs", `\`agentgrid ${c}\` is in --help but not in AGENTS.md, README.md or llms.txt. Document it.`);
for (const t of tools) if (!docs.includes(t)) propose("Docs", `MCP tool \`${t}\` is not described in AGENTS.md, README.md or llms.txt.`);

// 4. Skill coverage.
const skillsDir = join(ROOT, "skills");
const skillText = existsSync(skillsDir)
  ? readdirSync(skillsDir).map((d) => read(join("skills", d, "SKILL.md"))).join("\n") : "";
for (const t of tools) if (!skillText.includes(t)) propose("Skills", `no skill mentions MCP tool \`${t}\`. Add it to the skill that covers its job.`);

// 5. Memory hygiene.
const memTokens = Math.round(read("memory/MEMORY.md").length / 4);
if (memTokens > 2000) propose("Memory", `memory/MEMORY.md is about ${memTokens} tokens, over the 2,000 budget. Move detail to memory/topics/.`);
const learnings = read("memory/LEARNINGS.md").split(/^## /m).slice(1);
const noRule = learnings.filter((e) => !/\*\*Rule:\*\*/.test(e)).map((e) => e.split("\n")[0].trim());
for (const title of noRule) propose("Memory", `LEARNINGS entry "${title}" has no **Rule:** line. Turn the correction into a rule.`);

// 6. Speed against the baseline.
const baseline = JSON.parse(read("eval/baseline.json") || "{}");
if (golden.seconds && baseline.golden_seconds) {
  if (golden.seconds > baseline.golden_seconds * 1.5) propose("Speed", `the golden eval took ${golden.seconds}s against a baseline of ${baseline.golden_seconds}s. Find what slowed down.`);
  if (golden.seconds < baseline.golden_seconds * 0.7) propose("Speed", `the golden eval took ${golden.seconds}s, well under the ${baseline.golden_seconds}s baseline. Lower the baseline in eval/baseline.json.`);
}

const stamp = new Date().toISOString();
const body = [
  `# agentgrid improvement proposal, ${stamp}`,
  "",
  `Evals: **${evalOk ? "pass" : "FAIL"}** · golden ${golden.pass ?? "?"}/${golden.total ?? "?"} over k=${golden.k ?? "?"} in ${golden.seconds ?? "?"}s · ${commands.length} CLI commands · ${tools.length} MCP tools · memory about ${memTokens} tokens`,
  "",
  "## Proposals",
  "",
  proposals.length ? proposals.join("\n") : "- None. Every command and tool is documented and taught, memory is within budget, and the evals pass.",
  "",
  "A person reviews and merges every change. This loop never merges by itself.",
  evalOk ? "" : "\n## Eval output (last 40 lines)\n\n```\n" + (evalRun.stdout + evalRun.stderr).split("\n").slice(-40).join("\n") + "\n```",
].join("\n");
mkdirSync(join(ROOT, "logs"), { recursive: true });
writeFileSync(join(ROOT, "logs/proposal.md"), body + "\n");
console.log(body);
process.exit(evalOk ? 0 : 1);
