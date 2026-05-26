/**
 * AgentGrid Security Module — Input validation, PII detection, credential leak prevention.
 * Features 86-93 (Wave 2).
 */

import { appendFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// ─── Types ───

export type SecurityCategory =
  | "prompt-injection"
  | "pii"
  | "path-traversal"
  | "command-injection"
  | "credential-leak";

export interface SecurityFlag {
  category: SecurityCategory;
  pattern: string;
  input: string;
  redacted?: string;
  timestamp: number;
  paneId?: string;
}

export interface SecurityConfig {
  promptInjection: boolean;
  piiDetection: boolean;
  pathTraversal: boolean;
  commandInjection: boolean;
  credentialLeak: boolean;
  autoRedact: boolean;
}

export interface SecurityStats {
  totalFlags: number;
  byCategory: Record<SecurityCategory, number>;
  recentFlags: SecurityFlag[];
}

export interface ScanResult {
  safe: boolean;
  flags: SecurityFlag[];
  redacted?: string;
}

// ─── Default Config ───

const DEFAULT_CONFIG: SecurityConfig = {
  promptInjection: true,
  piiDetection: true,
  pathTraversal: true,
  commandInjection: true,
  credentialLeak: true,
  autoRedact: false,
};

// ─── Pattern Definitions ───

const PROMPT_INJECTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // Role/identity hijacking
  { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, label: "ignore-previous" },
  { pattern: /ignore\s+(all\s+)?above\s+instructions/i, label: "ignore-above" },
  { pattern: /disregard\s+(all\s+)?(previous|prior|above)/i, label: "disregard-previous" },
  {
    pattern: /forget\s+(all\s+)?(previous|prior|above|your)\s+(instructions|rules|context)/i,
    label: "forget-instructions",
  },
  { pattern: /you\s+are\s+now\s+a/i, label: "role-reassign" },
  { pattern: /act\s+as\s+if\s+you\s+(are|were)\s+a/i, label: "role-act-as" },
  { pattern: /pretend\s+(you\s+are|to\s+be)\s+a/i, label: "role-pretend" },
  { pattern: /from\s+now\s+on,?\s+you\s+(are|will\s+be)/i, label: "role-from-now" },
  { pattern: /new\s+persona:/i, label: "persona-override" },
  { pattern: /system\s*:\s*/i, label: "system-prompt-inject" },
  // Jailbreaks
  { pattern: /\bDAN\b.*\bmode\b/i, label: "dan-jailbreak" },
  { pattern: /developer\s+mode\s+(enabled|on|activated)/i, label: "developer-mode" },
  { pattern: /override\s+safety/i, label: "override-safety" },
  { pattern: /bypass\s+(safety|content|filter|restriction)/i, label: "bypass-safety" },
  { pattern: /jailbreak/i, label: "jailbreak-keyword" },
  { pattern: /no\s+restrictions?\s+mode/i, label: "no-restrictions" },
  { pattern: /unfiltered\s+mode/i, label: "unfiltered-mode" },
  { pattern: /uncensored\s+mode/i, label: "uncensored-mode" },
  // Prompt leaking
  { pattern: /repeat\s+(the|your)\s+(system\s+)?prompt/i, label: "leak-prompt" },
  { pattern: /show\s+(me\s+)?(the|your)\s+(system\s+)?prompt/i, label: "show-prompt" },
  {
    pattern: /what\s+(is|are)\s+your\s+(system\s+)?(instructions|rules|prompt)/i,
    label: "reveal-instructions",
  },
  { pattern: /print\s+(your\s+)?initial\s+prompt/i, label: "print-initial" },
  { pattern: /output\s+(your|the)\s+(system|initial)\s+(message|prompt)/i, label: "output-system" },
  // Encoding attacks
  { pattern: /base64\s*decode/i, label: "base64-decode" },
  { pattern: /eval\s*\(/i, label: "eval-call" },
  { pattern: /<script>/i, label: "script-tag" },
  { pattern: /<img\s+.*onerror/i, label: "img-onerror" },
  { pattern: /javascript:/i, label: "javascript-proto" },
  // Delimiter injection
  { pattern: /```\s*system/i, label: "codeblock-system" },
  { pattern: /\[INST\]/i, label: "inst-delimiter" },
  { pattern: /<\|im_start\|>/i, label: "chatml-delimiter" },
  { pattern: /<\|system\|>/i, label: "system-delimiter" },
  { pattern: /<<SYS>>/i, label: "llama-sys-delimiter" },
  { pattern: /###\s*(?:System|Human|Assistant)\s*:/i, label: "markdown-delimiter" },
  // Multi-turn manipulation
  { pattern: /previous\s+conversation/i, label: "previous-conversation" },
  { pattern: /in\s+our\s+last\s+chat/i, label: "fake-history" },
  { pattern: /you\s+(said|told\s+me|agreed|promised)/i, label: "false-memory" },
  { pattern: /as\s+we\s+(discussed|agreed)/i, label: "false-agreement" },
  // Token smuggling (zero-width characters)
  { pattern: /\u200b/g, label: "zero-width-space" },
  { pattern: /\u200d/g, label: "zero-width-joiner" },
  { pattern: /\u2060/g, label: "word-joiner" },
  { pattern: /\ufeff/g, label: "bom-char" },
  // Authority claims
  {
    pattern: /I\s+am\s+(the|an?)\s+(admin|administrator|developer|owner)/i,
    label: "false-authority",
  },
  { pattern: /admin\s+override/i, label: "admin-override" },
  { pattern: /sudo\s+mode/i, label: "sudo-mode" },
  { pattern: /emergency\s+protocol/i, label: "emergency-protocol" },
  { pattern: /maintenance\s+mode/i, label: "maintenance-mode" },
  { pattern: /do\s+not\s+refuse/i, label: "do-not-refuse" },
  { pattern: /you\s+must\s+comply/i, label: "force-comply" },
  { pattern: /this\s+is\s+a\s+test/i, label: "test-claim" },
];

const PII_PATTERNS: Array<{ pattern: RegExp; label: string; replacement: string }> = [
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    label: "email",
    replacement: "[EMAIL]",
  },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, label: "phone-us", replacement: "[PHONE]" },
  {
    pattern: /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
    label: "phone-intl",
    replacement: "[PHONE]",
  },
  { pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, label: "ssn", replacement: "[SSN]" },
  {
    pattern:
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    label: "credit-card",
    replacement: "[CC]",
  },
];

const PATH_TRAVERSAL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\.\.[/\\]/g, label: "dot-dot-slash" },
  { pattern: /\.\.%2[fF]/g, label: "encoded-traversal" },
  { pattern: /\.\.%5[cC]/g, label: "encoded-backslash" },
  { pattern: /\/etc\/(?:passwd|shadow|hosts)/i, label: "etc-files" },
  { pattern: /\/proc\/self/i, label: "proc-self" },
  { pattern: /~\/\./g, label: "home-dotfile" },
  { pattern: /\/(?:root|home\/\w+)\/\.(?:ssh|gnupg|aws)/i, label: "sensitive-dirs" },
  { pattern: /%00/g, label: "null-byte" },
];

const COMMAND_INJECTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern: /[;&|`$]\s*(?:rm|dd|mkfs|wget|nc|ncat)\b/i,
    label: "chained-destructive-cmd",
  },
  { pattern: /\$\(.*\)/g, label: "command-substitution" },
  { pattern: /`[^`]+`/g, label: "backtick-exec" },
  { pattern: />\s*\/dev\/sd[a-z]/i, label: "disk-write" },
  { pattern: /\|\s*(?:bash|sh|zsh)\b/i, label: "pipe-to-shell" },
  { pattern: /;\s*(?:chmod|chown)\s+(?:777|666|\+[rwx])/i, label: "permission-change" },
  { pattern: /&&\s*(?:rm|dd|mkfs|shutdown|reboot|kill\s+-9)/i, label: "destructive-chain" },
  { pattern: /\breverse\s+shell\b/i, label: "reverse-shell" },
  { pattern: /\bnc\s+-[elp]/i, label: "netcat-listener" },
];

const CREDENTIAL_PATTERNS: Array<{ pattern: RegExp; label: string; replacement: string }> = [
  { pattern: /\bsk-[A-Za-z0-9]{20,}\b/g, label: "openai-key", replacement: "[OPENAI_KEY]" },
  {
    pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
    label: "anthropic-key",
    replacement: "[ANTHROPIC_KEY]",
  },
  { pattern: /\bghp_[A-Za-z0-9]{36,}\b/g, label: "github-pat", replacement: "[GITHUB_PAT]" },
  {
    pattern: /\bghs_[A-Za-z0-9]{36,}\b/g,
    label: "github-server-token",
    replacement: "[GITHUB_TOKEN]",
  },
  {
    pattern: /\bgho_[A-Za-z0-9]{36,}\b/g,
    label: "github-oauth",
    replacement: "[GITHUB_OAUTH]",
  },
  { pattern: /\bnpm_[A-Za-z0-9]{36,}\b/g, label: "npm-token", replacement: "[NPM_TOKEN]" },
  {
    pattern: /\bxoxb-[0-9]+-[A-Za-z0-9-]+/g,
    label: "slack-bot-token",
    replacement: "[SLACK_TOKEN]",
  },
  {
    pattern: /\bxoxp-[0-9]+-[0-9]+-[A-Za-z0-9]+/g,
    label: "slack-user-token",
    replacement: "[SLACK_TOKEN]",
  },
  { pattern: /\bAKIA[0-9A-Z]{16}\b/g, label: "aws-access-key", replacement: "[AWS_KEY]" },
  {
    pattern: /\bAIza[A-Za-z0-9_-]{35}\b/g,
    label: "google-api-key",
    replacement: "[GOOGLE_KEY]",
  },
  {
    pattern: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g,
    label: "sendgrid-key",
    replacement: "[SENDGRID_KEY]",
  },
  {
    pattern: /\bsk_live_[A-Za-z0-9]{24,}\b/g,
    label: "stripe-live-key",
    replacement: "[STRIPE_KEY]",
  },
  {
    pattern: /\bsk_test_[A-Za-z0-9]{24,}\b/g,
    label: "stripe-test-key",
    replacement: "[STRIPE_KEY]",
  },
  {
    pattern: /\brk_live_[A-Za-z0-9]{24,}\b/g,
    label: "stripe-restricted",
    replacement: "[STRIPE_KEY]",
  },
  {
    pattern: /\bey[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
    label: "jwt-token",
    replacement: "[JWT]",
  },
  {
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    label: "private-key",
    replacement: "[PRIVATE_KEY]",
  },
  {
    pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/g,
    label: "gitlab-pat",
    replacement: "[GITLAB_PAT]",
  },
  {
    pattern: /\bpypi-[A-Za-z0-9_-]{20,}\b/g,
    label: "pypi-token",
    replacement: "[PYPI_TOKEN]",
  },
  {
    pattern: /\bvlt_[A-Za-z0-9]{20,}\b/g,
    label: "vercel-token",
    replacement: "[VERCEL_TOKEN]",
  },
];

// ─── Security Scanner ───

export class SecurityScanner {
  private config: SecurityConfig;
  private flags: SecurityFlag[] = [];
  private logPath: string;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const dir = join(homedir(), ".agentgrid");
    mkdirSync(dir, { recursive: true });
    this.logPath = join(dir, "security.log");
  }

  /** Scan input text for all enabled security categories */
  scan(input: string, paneId?: string): ScanResult {
    const flags: SecurityFlag[] = [];
    let redacted = input;

    if (this.config.promptInjection) {
      for (const { pattern, label } of PROMPT_INJECTION_PATTERNS) {
        const p = new RegExp(pattern.source, pattern.flags);
        if (p.test(input)) {
          flags.push({
            category: "prompt-injection",
            pattern: label,
            input: input.slice(0, 200),
            timestamp: Date.now(),
            paneId,
          });
        }
      }
    }

    if (this.config.piiDetection) {
      for (const { pattern, label, replacement } of PII_PATTERNS) {
        const p = new RegExp(pattern.source, pattern.flags);
        if (p.test(input)) {
          flags.push({
            category: "pii",
            pattern: label,
            input: input.slice(0, 200),
            timestamp: Date.now(),
            paneId,
          });
          if (this.config.autoRedact) {
            redacted = redacted.replace(new RegExp(pattern.source, pattern.flags), replacement);
          }
        }
      }
    }

    if (this.config.pathTraversal) {
      for (const { pattern, label } of PATH_TRAVERSAL_PATTERNS) {
        const p = new RegExp(pattern.source, pattern.flags);
        if (p.test(input)) {
          flags.push({
            category: "path-traversal",
            pattern: label,
            input: input.slice(0, 200),
            timestamp: Date.now(),
            paneId,
          });
        }
      }
    }

    if (this.config.commandInjection) {
      for (const { pattern, label } of COMMAND_INJECTION_PATTERNS) {
        const p = new RegExp(pattern.source, pattern.flags);
        if (p.test(input)) {
          flags.push({
            category: "command-injection",
            pattern: label,
            input: input.slice(0, 200),
            timestamp: Date.now(),
            paneId,
          });
        }
      }
    }

    if (this.config.credentialLeak) {
      for (const { pattern, label, replacement } of CREDENTIAL_PATTERNS) {
        const p = new RegExp(pattern.source, pattern.flags);
        if (p.test(input)) {
          flags.push({
            category: "credential-leak",
            pattern: label,
            input: input.slice(0, 100) + "...",
            timestamp: Date.now(),
            paneId,
          });
          if (this.config.autoRedact) {
            redacted = redacted.replace(new RegExp(pattern.source, pattern.flags), replacement);
          }
        }
      }
    }

    // Log and store flags
    for (const flag of flags) {
      this.flags.push(flag);
      this.writeLog(flag);
    }

    return {
      safe: flags.length === 0,
      flags,
      redacted: this.config.autoRedact ? redacted : undefined,
    };
  }

  /** Redact sensitive data from text */
  redact(input: string): string {
    let result = input;
    for (const { pattern, replacement } of PII_PATTERNS) {
      result = result.replace(new RegExp(pattern.source, pattern.flags), replacement);
    }
    for (const { pattern, replacement } of CREDENTIAL_PATTERNS) {
      result = result.replace(new RegExp(pattern.source, pattern.flags), replacement);
    }
    return result;
  }

  /** Get security statistics for current session */
  getStats(): SecurityStats {
    const byCategory: Record<SecurityCategory, number> = {
      "prompt-injection": 0,
      pii: 0,
      "path-traversal": 0,
      "command-injection": 0,
      "credential-leak": 0,
    };
    for (const flag of this.flags) {
      byCategory[flag.category]++;
    }
    return {
      totalFlags: this.flags.length,
      byCategory,
      recentFlags: this.flags.slice(-50),
    };
  }

  /** Get current config */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /** Update config */
  setConfig(updates: Partial<SecurityConfig>): SecurityConfig {
    this.config = { ...this.config, ...updates };
    return this.getConfig();
  }

  /** Read security log from disk */
  getLog(limit = 100): string[] {
    try {
      if (!existsSync(this.logPath)) return [];
      const content = readFileSync(this.logPath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      return lines.slice(-limit);
    } catch {
      return [];
    }
  }

  /** Clear session flags (not the disk log) */
  clearSession(): void {
    this.flags = [];
  }

  /** Write a security flag to the log file */
  private writeLog(flag: SecurityFlag): void {
    const line = `[${new Date(flag.timestamp).toISOString()}] ${flag.category} | ${flag.pattern} | pane=${flag.paneId ?? "n/a"} | ${flag.input.slice(0, 120).replace(/\n/g, "\\n")}\n`;
    try {
      appendFileSync(this.logPath, line);
    } catch {
      // Intentionally silent: log write failure is non-critical
    }
  }
}
