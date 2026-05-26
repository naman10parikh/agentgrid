import { execSync } from "node:child_process";
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { getConfig, setConfig } from "./config.js";
import { SOUNDS_DIR } from "./constants.js";

const SOUND_DEFAULTS: Record<string, string> = {
  done: "/System/Library/Sounds/Glass.aiff",
  waiting: "/System/Library/Sounds/Tink.aiff",
  subagent: "/System/Library/Sounds/Purr.aiff",
};

function resolveSoundPath(path: string): string {
  if (path.startsWith("system:")) {
    return `/System/Library/Sounds/${path.slice(7)}.aiff`;
  }
  return path;
}

export function playSound(event: string): void {
  const configKey =
    event === "subagent" ? "sounds.sub_agent" : `sounds.${event}`;
  const soundPath = resolveSoundPath(
    getConfig(configKey, SOUND_DEFAULTS[event] ?? ""),
  );
  if (!soundPath || !existsSync(soundPath)) return;

  try {
    execSync(`afplay "${soundPath}" &`, { stdio: "ignore" });
  } catch {
    try {
      execSync(`paplay "${soundPath}" &`, { stdio: "ignore" });
    } catch {
      // No sound player available
    }
  }
}

export function setSoundFile(event: string, file: string): void {
  const configKey =
    event === "subagent" ? "sounds.sub_agent" : `sounds.${event}`;
  if (!file.startsWith("system:") && existsSync(file)) {
    mkdirSync(SOUNDS_DIR, { recursive: true });
    const dest = join(SOUNDS_DIR, basename(file));
    copyFileSync(file, dest);
    setConfig(configKey, dest);
  } else {
    setConfig(configKey, file);
  }
}

export function disableAllSounds(): void {
  setConfig("sounds.done", "");
  setConfig("sounds.waiting", "");
  setConfig("sounds.sub_agent", "");
}

export function getSoundConfig(): Record<string, string> {
  return {
    done: getConfig("sounds.done", SOUND_DEFAULTS["done"]!),
    waiting: getConfig("sounds.waiting", SOUND_DEFAULTS["waiting"]!),
    subagent: getConfig("sounds.sub_agent", SOUND_DEFAULTS["subagent"]!),
  };
}
