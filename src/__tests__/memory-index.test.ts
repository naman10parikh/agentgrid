import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  tokenize,
  corpusFiles,
  buildIndex,
  searchMemory,
} from "../lib/memory-index.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("tokenize", () => {
  it("lowercases and splits on non-alphanumerics", () => {
    expect(tokenize("Tmux PANE-status!")).toEqual(["tmux", "pane", "status"]);
  });

  it("drops single-character tokens", () => {
    expect(tokenize("a I x grid")).toEqual(["grid"]);
  });

  it("returns [] for empty / symbol-only input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("!!! ---")).toEqual([]);
  });
});

describe("BM25 search over a fixture corpus", () => {
  let fixtureRoot: string;

  beforeAll(() => {
    // Build a tiny deterministic corpus shaped like the real repo
    // (memory/ + brain/ + docs/ dirs and a root MEMORY.md).
    fixtureRoot = mkdtempSync(join(tmpdir(), "agentgrid-memidx-"));
    mkdirSync(join(fixtureRoot, "memory"), { recursive: true });
    mkdirSync(join(fixtureRoot, "brain"), { recursive: true });
    mkdirSync(join(fixtureRoot, "docs"), { recursive: true });
    writeFileSync(
      join(fixtureRoot, "MEMORY.md"),
      "# Bootstrap\nagentgrid spawns grids of agents in tmux panes.\n",
    );
    writeFileSync(
      join(fixtureRoot, "memory", "sandbox.md"),
      "# Sandbox\nThe firecracker microvm sandbox isolates untrusted agent code. " +
        "firecracker boots fast.\n",
    );
    writeFileSync(
      join(fixtureRoot, "brain", "sounds.md"),
      "# Sounds\nafplay plays alert sounds through do not disturb.\n",
    );
    writeFileSync(
      join(fixtureRoot, "docs", "presets.md"),
      "# Presets\nPresets store saved grid layouts as json files.\n",
    );
  });

  afterAll(() => {
    rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("indexes every corpus file exactly once", () => {
    const files = corpusFiles(fixtureRoot);
    expect(files).toHaveLength(4);
    expect(new Set(files).size).toBe(4);
  });

  it("builds an index with document frequencies and avgdl", () => {
    const { docs, df, avgdl } = buildIndex(fixtureRoot);
    expect(docs).toHaveLength(4);
    expect(avgdl).toBeGreaterThan(0);
    // "firecracker" appears in exactly one document.
    expect(df.get("firecracker")).toBe(1);
  });

  it("ranks the on-topic document first for a rare-term query", () => {
    const hits = searchMemory(fixtureRoot, "firecracker sandbox isolation");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].file).toBe(join("memory", "sandbox.md"));
    expect(hits[0].score).toBeGreaterThan(0);
    expect(hits[0].snippet.toLowerCase()).toContain("firecracker");
  });

  it("scores multi-match docs above single-match docs (BM25 ordering)", () => {
    const hits = searchMemory(fixtureRoot, "grid layouts presets");
    // docs/presets.md matches all three terms; MEMORY.md matches only "grid".
    expect(hits[0].file).toBe(join("docs", "presets.md"));
    const memHit = hits.find((h) => h.file === "MEMORY.md");
    if (memHit) expect(memHit.score).toBeLessThan(hits[0].score);
  });

  it("returns [] for queries with no matching terms", () => {
    expect(searchMemory(fixtureRoot, "zzzqqqxxx nonexistent")).toEqual([]);
  });

  it("returns [] for empty queries and respects the limit", () => {
    expect(searchMemory(fixtureRoot, "   ")).toEqual([]);
    expect(
      searchMemory(fixtureRoot, "agent sandbox grid sounds", 2).length,
    ).toBeLessThanOrEqual(2);
  });
});

describe("real repo corpus (integration)", () => {
  it("finds a non-empty corpus in this repo", () => {
    expect(corpusFiles(REPO_ROOT).length).toBeGreaterThan(10);
  });

  it("answers a real question about this repo from its own memory", () => {
    const hits = searchMemory(REPO_ROOT, "tmux pane status colors");
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.score).toBeGreaterThan(0);
      expect(hit.file.length).toBeGreaterThan(0);
    }
  });
});
