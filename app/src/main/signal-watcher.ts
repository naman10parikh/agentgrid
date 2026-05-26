/**
 * Signal Watcher — Monitors .claude/vp-signals/ for .done, .needs-qa, .migrating files
 * Updates pane status and notifies renderer when agents signal completion.
 */

import { watch, existsSync, readdirSync, readFileSync } from "fs";
import { join, basename } from "path";
import { EventEmitter } from "events";

export interface SignalEvent {
  role: string;
  type: "done" | "needs-qa" | "migrating" | "unknown";
  content: string;
  path: string;
  timestamp: number;
  companyId?: string;
}

export class SignalWatcher extends EventEmitter {
  private watcher: ReturnType<typeof watch> | null = null;
  private signalDir: string = "";
  private companyDirs: Map<string, ReturnType<typeof watch>> = new Map();

  start(cwd: string): void {
    this.stop();
    this.signalDir = join(cwd, ".claude", "vp-signals");

    if (!existsSync(this.signalDir)) return;

    // Watch root signal dir
    this.watcher = watch(this.signalDir, { recursive: false }, (_event, filename) => {
      if (filename) this.handleChange(this.signalDir, filename);
    });

    // Watch company subdirectories (recursive grid support)
    try {
      const entries = readdirSync(this.signalDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith("archive")) {
          this.watchCompanyDir(join(this.signalDir, entry.name));
        }
      }
    } catch {
      // dir read failed
    }

    // Initial scan
    this.scan();
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    for (const w of this.companyDirs.values()) {
      w.close();
    }
    this.companyDirs.clear();
  }

  private watchCompanyDir(dir: string): void {
    if (this.companyDirs.has(dir)) return;
    const w = watch(dir, (_event, filename) => {
      if (filename) this.handleChange(dir, filename);
    });
    this.companyDirs.set(dir, w);
  }

  private handleChange(dir: string, filename: string): void {
    const filepath = join(dir, filename);
    if (!existsSync(filepath)) return;

    const signal = this.parseSignalFile(filepath);
    if (signal) {
      this.emit("signal", signal);
    }
  }

  getSignals(): SignalEvent[] {
    return this.scan();
  }

  private parseSignalFile(filepath: string): SignalEvent | null {
    const name = basename(filepath);
    const match = name.match(/^(.+)\.(done|needs-qa|migrating)$/);
    if (!match) return null;

    let content = "";
    try {
      content = readFileSync(filepath, "utf-8").trim();
    } catch {
      // file might be in-flight
    }

    // Extract company ID from path for recursive grid signal propagation
    const parts = filepath.split("/");
    const signalDirIdx = parts.indexOf("vp-signals");
    const companyId =
      signalDirIdx >= 0 && parts.length > signalDirIdx + 2 ? parts[signalDirIdx + 1] : undefined;

    return {
      role: match[1],
      type: match[2] as SignalEvent["type"],
      content,
      path: filepath,
      timestamp: Date.now(),
      companyId,
    };
  }

  scan(): SignalEvent[] {
    const signals: SignalEvent[] = [];
    if (!existsSync(this.signalDir)) return signals;

    try {
      const files = readdirSync(this.signalDir);
      for (const f of files) {
        const signal = this.parseSignalFile(join(this.signalDir, f));
        if (signal) signals.push(signal);
      }
    } catch {
      // scan failed
    }

    return signals;
  }

  getSignalDir(): string {
    return this.signalDir;
  }
}
