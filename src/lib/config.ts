import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { CONFIG_DIR, CONFIG_FILE } from "./constants.js";

export function getConfig(key: string, defaultValue: string): string {
  if (!existsSync(CONFIG_FILE)) return defaultValue;
  try {
    const data = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    const keys = key.split(".");
    let val: unknown = data;
    for (const k of keys) {
      if (val && typeof val === "object" && k in val) {
        val = (val as Record<string, unknown>)[k];
      } else {
        return defaultValue;
      }
    }
    return typeof val === "string" ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setConfig(key: string, value: string): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  let data: Record<string, unknown> = {};
  if (existsSync(CONFIG_FILE)) {
    try {
      data = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    } catch {
      data = {};
    }
  }
  const keys = key.split(".");
  let ref: Record<string, unknown> = data;
  for (const k of keys.slice(0, -1)) {
    if (!ref[k] || typeof ref[k] !== "object") {
      ref[k] = {};
    }
    ref = ref[k] as Record<string, unknown>;
  }
  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    ref[lastKey] = value;
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

export function readJsonFile<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2));
}
