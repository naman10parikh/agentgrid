import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "child_process";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

import { GitHubIntegration } from "../../src/main/github-integration";

describe("GitHubIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isAvailable", () => {
    it("returns true when gh CLI is installed", () => {
      vi.mocked(execSync).mockReturnValueOnce("gh version 2.40.0\n" as unknown as Buffer);
      const gh = new GitHubIntegration();
      expect(gh.isAvailable()).toBe(true);
    });

    it("returns false when gh CLI is not found", () => {
      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error("not found");
      });
      const gh = new GitHubIntegration();
      expect(gh.isAvailable()).toBe(false);
    });
  });

  describe("getRepoInfo", () => {
    it("returns owner and repo", () => {
      vi.mocked(execSync).mockReturnValueOnce("gh version" as unknown as Buffer);
      const gh = new GitHubIntegration();

      vi.mocked(execSync).mockReturnValueOnce(
        JSON.stringify({ owner: { login: "naman10parikh" }, name: "agentgrid" }),
      );
      const info = gh.getRepoInfo("/tmp");
      expect(info).toEqual({ owner: "naman10parikh", repo: "agentgrid" });
    });

    it("returns null on error", () => {
      vi.mocked(execSync).mockReturnValueOnce("gh version" as unknown as Buffer);
      const gh = new GitHubIntegration();

      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error("not a repo");
      });
      expect(gh.getRepoInfo("/tmp")).toBeNull();
    });
  });

  describe("listPRs", () => {
    it("returns list of PRs", () => {
      vi.mocked(execSync).mockReturnValueOnce("gh version" as unknown as Buffer);
      const gh = new GitHubIntegration();

      vi.mocked(execSync).mockReturnValueOnce(
        JSON.stringify([
          { number: 1, title: "Fix bug", url: "https://github.com/test/pr/1" },
          { number: 2, title: "Add feature", url: "https://github.com/test/pr/2" },
        ]),
      );
      const prs = gh.listPRs("/tmp");
      expect(prs).toHaveLength(2);
      expect(prs[0]!.title).toBe("Fix bug");
    });

    it("returns empty array on error", () => {
      vi.mocked(execSync).mockReturnValueOnce("gh version" as unknown as Buffer);
      const gh = new GitHubIntegration();

      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error("no repo");
      });
      expect(gh.listPRs("/tmp")).toEqual([]);
    });
  });

  describe("createPR", () => {
    it("returns null when gh not available", () => {
      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error("no gh");
      });
      const gh = new GitHubIntegration();

      expect(
        gh.createPR({
          cwd: "/tmp",
          branch: "test",
          title: "Test",
          body: "Body",
        }),
      ).toBeNull();
    });
  });

  describe("createIssue", () => {
    it("returns null when gh not available", () => {
      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error("no gh");
      });
      const gh = new GitHubIntegration();

      expect(
        gh.createIssue({
          cwd: "/tmp",
          title: "Bug",
          body: "Description",
        }),
      ).toBeNull();
    });
  });
});
