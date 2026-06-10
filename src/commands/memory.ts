/**
 * memory.ts — CLI handler for `agentgrid memory-search <query>`.
 *
 * Runs a real BM25 search over agentgrid's own corpus (MEMORY.md, memory/,
 * brain/, docs/) and prints the top-ranked documents with snippets. This is the
 * queryable index half of the Memory component — MEMORY.md is the bootstrap,
 * this is the searchable recall over the whole knowledge base.
 */
import chalk from "chalk";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { searchMemory } from "../lib/memory-index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
/** Repo root: dist/commands -> repo, or src/commands -> repo in dev. */
const REPO_ROOT = join(HERE, "..", "..");

/** Handle `agentgrid memory-search <query> [--limit N]`. */
export function cmdMemorySearch(
  query: string,
  opts?: { limit?: number },
): void {
  if (!query || !query.trim()) {
    console.error(
      chalk.red("[agentgrid]") + ' Usage: agentgrid memory-search "query" [--limit N]',
    );
    process.exit(1);
  }

  const limit = opts?.limit ?? 5;
  const hits = searchMemory(REPO_ROOT, query, limit);

  if (hits.length === 0) {
    console.log(chalk.dim(`No matches for "${query}" in the agentgrid corpus.`));
    return;
  }

  console.log(
    chalk.magenta("[agentgrid]") +
      ` Top ${hits.length} result(s) for ${chalk.bold(query)}:`,
  );
  console.log("");
  for (const [i, hit] of hits.entries()) {
    console.log(
      `${chalk.cyan(`${i + 1}.`)} ${chalk.bold(hit.file)} ` +
        chalk.dim(`(score ${hit.score.toFixed(2)})`),
    );
    console.log(`   ${chalk.dim(hit.snippet)}`);
  }
}
