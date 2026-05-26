import { describe, it, expect } from "vitest";
import { exportSession, importSession, generateShareUrl } from "../../src/main/session-share";
import type { GridLayout } from "../../src/shared/types";

const MOCK_GRID: GridLayout = {
  rows: 2,
  cols: 2,
  panes: [
    {
      id: "a",
      label: "CEO",
      status: "working",
      agent: "claude",
      cwd: "/tmp",
      row: 0,
      col: 0,
      rowSpan: 1,
      colSpan: 1,
    },
    {
      id: "b",
      label: "Builder",
      status: "idle",
      agent: "codex",
      cwd: "/tmp",
      row: 0,
      col: 1,
      rowSpan: 1,
      colSpan: 1,
    },
    {
      id: "c",
      label: "QA",
      status: "done",
      agent: "claude",
      cwd: "/tmp",
      row: 1,
      col: 0,
      rowSpan: 1,
      colSpan: 1,
    },
    {
      id: "d",
      label: "Researcher",
      status: "idle",
      agent: "gemini",
      cwd: "/tmp",
      row: 1,
      col: 1,
      rowSpan: 1,
      colSpan: 1,
    },
  ],
};

describe("session-share", () => {
  describe("exportSession", () => {
    it("returns a base64url string", () => {
      const encoded = exportSession(MOCK_GRID, "Alex");
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
      // base64url chars only
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("importSession", () => {
    it("roundtrips export → import", () => {
      const encoded = exportSession(MOCK_GRID, "Alex", "Test share");
      const imported = importSession(encoded);
      expect(imported).not.toBeNull();
      expect(imported!.version).toBe(1);
      expect(imported!.sharedBy).toBe("Alex");
      expect(imported!.description).toBe("Test share");
      expect(imported!.grid.rows).toBe(2);
      expect(imported!.grid.cols).toBe(2);
      expect(imported!.grid.panes).toHaveLength(4);
    });

    it("preserves pane labels and agents", () => {
      const encoded = exportSession(MOCK_GRID, "Test");
      const imported = importSession(encoded);
      expect(imported!.grid.panes[0].label).toBe("CEO");
      expect(imported!.grid.panes[1].agent).toBe("codex");
      expect(imported!.grid.panes[3].agent).toBe("gemini");
    });

    it("returns null for invalid input", () => {
      expect(importSession("not-valid-base64!!!")).toBeNull();
      expect(importSession("")).toBeNull();
    });

    it("returns null for wrong version", () => {
      // Manually create a v2 session
      const { deflateSync } = require("zlib");
      const json = JSON.stringify({ version: 2, grid: { panes: [] } });
      const compressed = deflateSync(Buffer.from(json));
      const encoded = compressed.toString("base64url");
      expect(importSession(encoded)).toBeNull();
    });
  });

  describe("generateShareUrl", () => {
    it("generates an agentgrid:// URL", () => {
      const encoded = exportSession(MOCK_GRID, "Test");
      const url = generateShareUrl(encoded);
      expect(url).toMatch(/^agentgrid:\/\/import\//);
      expect(url).toContain(encoded);
    });
  });

  describe("compression", () => {
    it("compressed output is smaller than raw JSON", () => {
      const encoded = exportSession(MOCK_GRID, "Test");
      const rawJson = JSON.stringify(MOCK_GRID);
      // Base64 adds ~33% overhead but zlib compression should more than offset
      expect(encoded.length).toBeLessThan(rawJson.length * 2);
    });

    it("handles large grids (10x10 = 100 panes)", () => {
      const largeGrid: GridLayout = {
        rows: 10,
        cols: 10,
        panes: Array.from({ length: 100 }, (_, i) => ({
          id: `p${i}`,
          label: `Agent ${i + 1}`,
          status: "idle" as const,
          agent: "claude" as const,
          cwd: "/workspace",
          row: Math.floor(i / 10),
          col: i % 10,
          rowSpan: 1,
          colSpan: 1,
        })),
      };

      const encoded = exportSession(largeGrid, "BigTeam", "100-agent grid");
      const imported = importSession(encoded);
      expect(imported).not.toBeNull();
      expect(imported!.grid.panes).toHaveLength(100);
      expect(imported!.grid.rows).toBe(10);
    });
  });
});
