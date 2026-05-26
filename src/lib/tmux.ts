import { execSync, execFileSync } from "node:child_process";

export interface PaneInfo {
  paneId: string;
  paneIndex: number;
  label: string;
  command: string;
  directory: string;
  status: string;
  panePid: number;
}

export function isTmuxAvailable(): boolean {
  try {
    execFileSync("which", ["tmux"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function isInsideTmux(): boolean {
  return !!process.env["TMUX"];
}

export function ensureTmux(): void {
  if (!isTmuxAvailable()) {
    const platform = process.platform;
    console.error("[agentgrid] tmux is required but not installed.");
    if (platform === "darwin") {
      console.error("  Install: brew install tmux");
    } else {
      console.error("  Install: sudo apt install tmux (or dnf/pacman)");
    }
    process.exit(1);
  }
}

export function ensureInsideTmux(sessionName: string): void {
  if (isInsideTmux()) return;
  ensureTmux();
  try {
    execSync(`tmux has-session -t "${sessionName}" 2>/dev/null`);
    // Session exists, attach
    process.stdout.write(`[agentgrid] Attaching to: ${sessionName}\n`);
    execSync(`tmux attach-session -t "${sessionName}"`, { stdio: "inherit" });
  } catch {
    // Create new session
    process.stdout.write(`[agentgrid] Creating: ${sessionName}\n`);
    execSync(`tmux new-session -s "${sessionName}"`, { stdio: "inherit" });
  }
  process.exit(0);
}

export function tmuxRun(args: string[]): string {
  try {
    return execFileSync("tmux", args, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

export function tmuxRunRaw(cmd: string): string {
  try {
    return execSync(`tmux ${cmd}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

export function getCurrentWindowId(): string {
  return tmuxRun(["display-message", "-p", "#{window_id}"]);
}

export function getSessionName(): string {
  return tmuxRun(["display-message", "-p", "#{session_name}"]);
}

export function listPanes(windowId?: string): PaneInfo[] {
  const target = windowId ? `-t ${windowId}` : "";
  const format =
    "#{pane_id}|#{pane_index}|#{@pane_label}|#{pane_current_command}|#{pane_current_path}|#{@pane_status}|#{pane_pid}";
  const raw = tmuxRunRaw(`list-panes ${target} -F '${format}'`);
  if (!raw) return [];

  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [paneId, idx, label, command, directory, status, pid] =
        line.split("|");
      return {
        paneId: paneId ?? "",
        paneIndex: parseInt(idx ?? "0", 10),
        label: label || `Pane ${idx}`,
        command: command ?? "",
        directory: directory ?? "",
        status: status ?? "",
        panePid: parseInt(pid ?? "0", 10),
      };
    });
}

export function listAllPanes(): PaneInfo[] {
  const format =
    "#{session_name}:#{window_index}.#{pane_index}|#{pane_index}|#{@pane_label}|#{pane_current_command}|#{pane_current_path}|#{@pane_status}|#{pane_pid}";
  const raw = tmuxRunRaw(`list-panes -a -F '${format}'`);
  if (!raw) return [];

  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [paneId, idx, label, command, directory, status, pid] =
        line.split("|");
      return {
        paneId: paneId ?? "",
        paneIndex: parseInt(idx ?? "0", 10),
        label: label || "(unnamed)",
        command: command ?? "",
        directory: directory ?? "",
        status: status ?? "",
        panePid: parseInt(pid ?? "0", 10),
      };
    });
}

export function getPaneCount(windowId?: string): number {
  const target = windowId ? `-t ${windowId}` : "";
  const raw = tmuxRunRaw(`list-panes ${target}`);
  return raw ? raw.split("\n").filter(Boolean).length : 0;
}

export function sendKeys(target: string, keys: string, enter = false): void {
  const args = ["send-keys", "-t", target, keys];
  if (enter) args.push("Enter");
  tmuxRun(args);
}

export function setPaneOption(
  target: string,
  key: string,
  value: string,
): void {
  tmuxRun(["set-option", "-p", "-t", target, key, value]);
}

export function splitWindow(target: string, vertical = false): void {
  const flag = vertical ? "-v" : "-h";
  tmuxRun(["split-window", flag, "-t", target]);
}

export function selectLayout(target: string, layout: string): void {
  tmuxRun(["select-layout", "-t", target, layout]);
}

export function selectPane(target: string): void {
  tmuxRun(["select-pane", "-t", target]);
}

export function capturePaneOutput(target: string): string {
  return tmuxRun(["capture-pane", "-p", "-t", target]);
}

export function normalizeAgentName(raw: string): string {
  if (/^\d+\.\d+/.test(raw)) return "claude";
  const map: Record<string, string> = {
    bash: "shell",
    zsh: "shell",
    fish: "shell",
    sh: "shell",
    dash: "shell",
    node: "agent",
  };
  if (map[raw]) return map[raw];
  for (const agent of [
    "codex",
    "gemini",
    "aider",
    "goose",
    "opencode",
    "hermes",
    "cline",
    "copilot",
  ]) {
    if (raw.startsWith(agent)) return agent;
  }
  if (raw.startsWith("python")) return "aider";
  return raw;
}
