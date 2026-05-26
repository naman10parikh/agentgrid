/**
 * GitHub Integration — Create PRs, branches, issues from agent output.
 * Uses `gh` CLI (GitHub CLI) for operations, avoiding direct API auth.
 * Features 142-147 (Wave 3).
 */

import { execSync, execFileSync } from "child_process";

interface PRResult {
  url: string;
  number: number;
  title: string;
}

export interface PRStatus {
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  reviewDecision: "approved" | "changes_requested" | "review_required" | "";
  url: string;
  headBranch: string;
}

export interface ActionsRun {
  name: string;
  status: "completed" | "in_progress" | "queued" | "waiting";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | "timed_out" | "";
  url: string;
  headBranch: string;
  updatedAt: string;
}

export interface GitInfo {
  branch: string;
  commitHash: string;
  commitMessage: string;
  isDirty: boolean;
  changedFiles: number;
}

export class GitHubIntegration {
  private ghAvailable: boolean;

  constructor() {
    this.ghAvailable = this.checkGh();
  }

  private checkGh(): boolean {
    try {
      execSync("gh --version", { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  isAvailable(): boolean {
    return this.ghAvailable;
  }

  /** Create a branch, commit changes, and open a PR */
  createPR(opts: {
    cwd: string;
    branch: string;
    title: string;
    body: string;
    baseBranch?: string;
  }): PRResult | null {
    if (!this.ghAvailable) return null;

    try {
      const base = opts.baseBranch ?? "main";
      execFileSync("git", ["checkout", "-b", opts.branch], { cwd: opts.cwd, stdio: "pipe" });
      execFileSync("git", ["add", "-A"], { cwd: opts.cwd, stdio: "pipe" });
      execFileSync("git", ["commit", "-m", opts.title], {
        cwd: opts.cwd,
        stdio: "pipe",
      });
      execFileSync("git", ["push", "-u", "origin", opts.branch], { cwd: opts.cwd, stdio: "pipe" });

      const result = execFileSync(
        "gh",
        [
          "pr",
          "create",
          "--title",
          opts.title,
          "--body",
          opts.body,
          "--base",
          base,
          "--json",
          "url,number",
        ],
        { cwd: opts.cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );

      const parsed = JSON.parse(result);
      return { url: parsed.url, number: parsed.number, title: opts.title };
    } catch {
      return null;
    }
  }

  /** Get current repo info */
  getRepoInfo(cwd: string): { owner: string; repo: string } | null {
    try {
      const result = execSync("gh repo view --json owner,name", {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      const parsed = JSON.parse(result);
      return { owner: parsed.owner.login, repo: parsed.name };
    } catch {
      return null;
    }
  }

  /** List open PRs */
  listPRs(cwd: string, limit = 10): Array<{ number: number; title: string; url: string }> {
    try {
      const result = execSync(`gh pr list --limit ${limit} --json number,title,url`, {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  /** Create a GitHub issue from agent findings */
  createIssue(opts: {
    cwd: string;
    title: string;
    body: string;
    labels?: string[];
  }): { url: string; number: number } | null {
    if (!this.ghAvailable) return null;

    try {
      const labelFlags = opts.labels?.map((l) => `--label "${l}"`).join(" ") ?? "";
      const result = execSync(
        `gh issue create --title "${opts.title.replace(/"/g, '\\"')}" --body "${opts.body.replace(/"/g, '\\"')}" ${labelFlags} --json url,number`,
        { cwd: opts.cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  /** Feature 145: Get PR status for current branch */
  getPRStatus(cwd: string): PRStatus | null {
    if (!this.ghAvailable) return null;
    try {
      const result = execSync(
        "gh pr view --json number,title,state,reviewDecision,url,headRefName",
        { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );
      const parsed = JSON.parse(result);
      return {
        number: parsed.number,
        title: parsed.title,
        state: parsed.state?.toLowerCase() ?? "open",
        reviewDecision: parsed.reviewDecision?.toLowerCase() ?? "",
        url: parsed.url,
        headBranch: parsed.headRefName,
      };
    } catch {
      return null;
    }
  }

  /** Feature 146: Get latest GitHub Actions run */
  getActionsStatus(cwd: string): ActionsRun | null {
    if (!this.ghAvailable) return null;
    try {
      const result = execSync(
        "gh run list --limit 1 --json name,status,conclusion,url,headBranch,updatedAt",
        { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );
      const parsed = JSON.parse(result);
      if (!parsed[0]) return null;
      const run = parsed[0];
      return {
        name: run.name,
        status: run.status,
        conclusion: run.conclusion ?? "",
        url: run.url,
        headBranch: run.headBranch,
        updatedAt: run.updatedAt,
      };
    } catch {
      return null;
    }
  }

  /** Feature 147: Get git info for CWD (branch, commit, dirty state) */
  getGitInfo(cwd: string): GitInfo | null {
    try {
      const branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();

      const commitLine = execSync("git log --oneline -1", {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();

      const hash = commitLine.split(" ")[0] ?? "";
      const message = commitLine.slice(hash.length + 1);

      const status = execSync("git status --porcelain", {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      const changedFiles = status.split("\n").filter(Boolean).length;

      return {
        branch,
        commitHash: hash,
        commitMessage: message,
        isDirty: changedFiles > 0,
        changedFiles,
      };
    } catch {
      return null;
    }
  }
}
