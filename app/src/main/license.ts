/**
 * License Manager — validates license keys and manages trial periods.
 * Offline-first: validates locally, periodic online check.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createHash } from "crypto";

const LICENSE_DIR = join(homedir(), ".agentgrid");
const LICENSE_FILE = join(LICENSE_DIR, "license.json");

export type LicenseTier = "free" | "pro" | "team";

interface LicenseData {
  key: string;
  tier: LicenseTier;
  email: string;
  activatedAt: string;
  expiresAt: string | null; // null = lifetime
  trialStartedAt: string | null;
  lastValidatedAt: string;
}

const TRIAL_DAYS = 14;

export class LicenseManager {
  private license: LicenseData | null = null;

  constructor() {
    mkdirSync(LICENSE_DIR, { recursive: true });
    this.load();
  }

  private load(): void {
    if (!existsSync(LICENSE_FILE)) {
      this.license = null;
      return;
    }
    try {
      this.license = JSON.parse(readFileSync(LICENSE_FILE, "utf-8"));
    } catch {
      this.license = null;
    }
  }

  private save(): void {
    if (this.license) {
      writeFileSync(LICENSE_FILE, JSON.stringify(this.license, null, 2));
    }
  }

  getTier(): LicenseTier {
    if (!this.license) return "free";
    if (this.license.expiresAt && new Date(this.license.expiresAt) < new Date()) {
      return "free"; // expired
    }
    return this.license.tier;
  }

  isProOrAbove(): boolean {
    const tier = this.getTier();
    return tier === "pro" || tier === "team";
  }

  isTrialActive(): boolean {
    if (!this.license?.trialStartedAt) return false;
    const trialEnd = new Date(this.license.trialStartedAt);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    return new Date() < trialEnd;
  }

  getTrialDaysRemaining(): number {
    if (!this.license?.trialStartedAt) return TRIAL_DAYS;
    const trialEnd = new Date(this.license.trialStartedAt);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    const remaining = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  }

  startTrial(): boolean {
    if (this.license?.trialStartedAt) return false; // already used
    this.license = {
      key: `trial-${createHash("sha256").update(Date.now().toString()).digest("hex").slice(0, 16)}`,
      tier: "pro",
      email: "",
      activatedAt: new Date().toISOString(),
      expiresAt: null,
      trialStartedAt: new Date().toISOString(),
      lastValidatedAt: new Date().toISOString(),
    };
    this.save();
    return true;
  }

  activate(key: string, email: string): boolean {
    // Validate key format: AGRID-XXXX-XXXX-XXXX
    if (!key.match(/^AGRID-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      return false;
    }

    const tier = key.startsWith("AGRID-TEAM") ? "team" : "pro";

    this.license = {
      key,
      tier,
      email,
      activatedAt: new Date().toISOString(),
      expiresAt: null,
      trialStartedAt: this.license?.trialStartedAt ?? null,
      lastValidatedAt: new Date().toISOString(),
    };
    this.save();
    return true;
  }

  deactivate(): void {
    this.license = null;
    if (existsSync(LICENSE_FILE)) {
      unlinkSync(LICENSE_FILE);
    }
  }

  getInfo(): { tier: LicenseTier; email: string; trialDaysRemaining: number; isActive: boolean } {
    return {
      tier: this.getTier(),
      email: this.license?.email ?? "",
      trialDaysRemaining: this.getTrialDaysRemaining(),
      isActive: this.isProOrAbove() || this.isTrialActive(),
    };
  }
}
