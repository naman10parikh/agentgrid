/**
 * memory-index.ts — A real queryable BM25 index over agentgrid's own corpus.
 *
 * Ports the spirit of energy's `scripts/memory-search.sh` (term-frequency x recency
 * x source-weight ranking) into TypeScript, but uses a proper BM25 ranking function
 * instead of a flat grep count. The corpus is THIS repo's own knowledge:
 *   - MEMORY.md           (bootstrap memory)
 *   - memory/**.md        (LEARNINGS, daily logs, topics, maintainer prompts)
 *   - brain/**.md         (the navigable knowledge graph)
 *   - docs/**.md          (user-facing docs)
 *
 * BM25 (Okapi) ranks a document d for query q as:
 *   score(d, q) = Σ_t IDF(t) · ( f(t,d)·(k1+1) ) / ( f(t,d) + k1·(1 - b + b·|d|/avgdl) )
 * where IDF(t) = ln( (N - n_t + 0.5) / (n_t + 0.5) + 1 ).
 *
 * This is a genuine inverted-index search — not grep, not a flat key-value lookup.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

/** BM25 tuning constants (standard defaults). */
const K1 = 1.5;
const B = 0.75;

/** A single ranked search result. */
export interface MemoryHit {
  /** Repo-relative path of the matching document. */
  file: string;
  /** BM25 relevance score (higher = more relevant). */
  score: number;
  /** A short snippet of the first line that contains a query term. */
  snippet: string;
}

/** An indexed document with its tokenized term-frequency map. */
interface IndexedDoc {
  file: string;
  /** term -> count within this doc */
  tf: Map<string, number>;
  /** total token count (document length) */
  length: number;
  /** raw lines, kept for snippet extraction */
  lines: string[];
}

/** The directories (relative to repo root) that make up the searchable corpus. */
export const CORPUS_DIRS = ["memory", "brain", "docs"] as const;
/** Standalone corpus files at the repo root. */
export const CORPUS_FILES = ["MEMORY.md"] as const;

/** Tokenize text into lowercase alphanumeric terms (length >= 2). */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (t) => t.length >= 2,
  );
}

/** Recursively collect `.md` files under a directory. */
function collectMarkdown(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectMarkdown(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Gather every corpus file path (absolute) for the given repo root.
 * Exported so tests can assert the corpus is non-empty.
 */
export function corpusFiles(repoRoot: string): string[] {
  const files: string[] = [];
  for (const d of CORPUS_DIRS) files.push(...collectMarkdown(join(repoRoot, d)));
  for (const f of CORPUS_FILES) {
    const p = join(repoRoot, f);
    if (existsSync(p) && statSync(p).isFile()) files.push(p);
  }
  // De-dupe (MEMORY.md could appear via both a dir scan and the file list).
  return [...new Set(files)];
}

/** Build an in-memory inverted index over the corpus. */
export function buildIndex(repoRoot: string): {
  docs: IndexedDoc[];
  df: Map<string, number>;
  avgdl: number;
} {
  const docs: IndexedDoc[] = [];
  const df = new Map<string, number>(); // document frequency per term
  let totalLen = 0;

  for (const abs of corpusFiles(repoRoot)) {
    let raw: string;
    try {
      raw = readFileSync(abs, "utf-8");
    } catch {
      continue; // unreadable file — skip, don't crash the index
    }
    const tokens = tokenize(raw);
    if (tokens.length === 0) continue;
    const tf = new Map<string, number>();
    for (const tok of tokens) tf.set(tok, (tf.get(tok) ?? 0) + 1);
    for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
    totalLen += tokens.length;
    docs.push({
      file: relative(repoRoot, abs),
      tf,
      length: tokens.length,
      lines: raw.split("\n"),
    });
  }

  return { docs, df, avgdl: docs.length ? totalLen / docs.length : 0 };
}

/** Inverse document frequency for a term given N docs and its doc-frequency. */
function idf(n: number, docFreq: number): number {
  return Math.log((n - docFreq + 0.5) / (docFreq + 0.5) + 1);
}

/** Extract the first line of `doc` containing any query term, trimmed for display. */
function snippetFor(doc: IndexedDoc, terms: string[]): string {
  for (const line of doc.lines) {
    const lower = line.toLowerCase();
    if (terms.some((t) => lower.includes(t))) {
      const trimmed = line.trim();
      return trimmed.length > 140 ? trimmed.slice(0, 137) + "..." : trimmed;
    }
  }
  // Fall back to the first non-empty line.
  const first = doc.lines.find((l) => l.trim().length > 0)?.trim() ?? "";
  return first.length > 140 ? first.slice(0, 137) + "..." : first;
}

/**
 * Search the corpus and return the top `limit` BM25-ranked hits.
 * Pure function over (repoRoot, query) — easy to unit test.
 */
export function searchMemory(
  repoRoot: string,
  query: string,
  limit = 5,
): MemoryHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const { docs, df, avgdl } = buildIndex(repoRoot);
  const n = docs.length;
  if (n === 0) return [];

  const scored: MemoryHit[] = [];
  for (const doc of docs) {
    let score = 0;
    for (const term of terms) {
      const f = doc.tf.get(term);
      if (!f) continue;
      const termIdf = idf(n, df.get(term) ?? 0);
      const denom = f + K1 * (1 - B + (B * doc.length) / (avgdl || 1));
      score += termIdf * ((f * (K1 + 1)) / denom);
    }
    if (score > 0) {
      scored.push({ file: doc.file, score, snippet: snippetFor(doc, terms) });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
