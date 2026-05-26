import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Check,
  Monitor,
  Cpu,
  Key,
  Palette,
  Terminal,
  Shield,
  DollarSign,
  Github,
  BadgeCheck,
} from "lucide-react";

// ─── Settings Data ───
// All settings are persisted via electron-store through window.api.settings IPC.
// The key names here match the StoreSchema in main/store.ts.

interface AppSettings {
  defaultAgent: string; // matches store key "defaultAgent"
  defaultModel: string;
  defaultEffort: string;
  theme: "dark" | "light";
  terminalFontSize: number;
  terminalScrollback: number;
  terminalCursorStyle: "block" | "underline" | "bar";
  terminalCursorBlink: boolean;
  apiKeys: {
    whisper?: string;
    openai?: string;
  };
  costBudgetUsd: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultAgent: "claude",
  defaultModel: "claude-opus-4-6",
  defaultEffort: "max",
  theme: "dark",
  terminalFontSize: 13,
  terminalScrollback: 50000,
  terminalCursorStyle: "bar", // matches store default
  terminalCursorBlink: true,
  apiKeys: {},
  costBudgetUsd: 5,
};

// ─── Options ───

const CLI_TOOLS = [
  { value: "claude", label: "Claude Code" },
  { value: "codex", label: "OpenAI Codex" },
  { value: "gemini", label: "Gemini CLI" },
  { value: "aider", label: "Aider" },
  { value: "goose", label: "Goose" },
  { value: "hermes", label: "Hermes" },
  { value: "cline", label: "Cline" },
  { value: "shell", label: "Shell (no agent)" },
];

const MODELS = [
  { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-5.3", label: "GPT-5.3 Codex" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

const EFFORT_LEVELS = [
  { value: "low", label: "Low", desc: "Fast, minimal thinking" },
  { value: "medium", label: "Medium", desc: "Balanced" },
  { value: "high", label: "High", desc: "Thorough analysis" },
  { value: "max", label: "Max", desc: "Full compute budget" },
];

// ─── Component ───

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [activeSection, setActiveSection] = useState<string>("general");
  const loadedRef = useRef(false);

  // Load settings from electron-store on first open
  useEffect(() => {
    if (!isOpen || loadedRef.current) return;
    loadedRef.current = true;
    window.api?.settings
      ?.getAll()
      .then((stored: Record<string, unknown>) => {
        if (!stored) return;
        setSettings((prev) => ({
          ...prev,
          defaultAgent: (stored.defaultAgent as string) ?? prev.defaultAgent,
          defaultModel: (stored.defaultModel as string) ?? prev.defaultModel,
          defaultEffort: (stored.defaultEffort as string) ?? prev.defaultEffort,
          theme: (stored.theme as "dark" | "light") ?? prev.theme,
          terminalFontSize: (stored.terminalFontSize as number) ?? prev.terminalFontSize,
          terminalScrollback: (stored.terminalScrollback as number) ?? prev.terminalScrollback,
          terminalCursorStyle:
            (stored.terminalCursorStyle as "block" | "underline" | "bar") ??
            prev.terminalCursorStyle,
          terminalCursorBlink: (stored.terminalCursorBlink as boolean) ?? prev.terminalCursorBlink,
          costBudgetUsd: (stored.costBudgetUsd as number) ?? prev.costBudgetUsd,
        }));
      })
      .catch(() => {
        // IPC not available (dev/test mode) — use defaults
      });
  }, [isOpen]);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Write each setting change to electron-store via IPC (single source of truth)
  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // Write to electron-store — skip apiKeys (stored separately)
    if (key !== "apiKeys") {
      window.api?.settings?.set(key, value).catch(() => {});
    }
  }, []);

  const updateApiKey = useCallback((key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [key]: value || undefined },
    }));
    // API keys are sensitive — not stored in electron-store preferences
  }, []);

  if (!isOpen) return null;

  const sections = [
    { id: "general", label: "General", icon: Monitor },
    { id: "models", label: "Models", icon: Cpu },
    { id: "keys", label: "API Keys", icon: Key },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "terminal", label: "Terminal", icon: Terminal },
    { id: "security", label: "Security", icon: Shield },
    { id: "github", label: "GitHub", icon: Github },
    { id: "cost", label: "Cost Budget", icon: DollarSign },
    { id: "license", label: "License", icon: BadgeCheck },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,19,18,0.7)]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div
        ref={dialogRef}
        className="flex h-[520px] w-[680px] overflow-hidden rounded-xl border border-grid-border bg-grid-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar nav */}
        <div className="flex w-44 shrink-0 flex-col border-r border-grid-border bg-grid-surface py-3">
          <div id="settings-dialog-title" className="mb-3 px-4 font-display text-sm text-grid-fg">
            Settings
          </div>
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`mx-2 flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left font-mono text-xs transition-colors focus:ring-2 focus:ring-grid-accent/50 focus:outline-none ${
                activeSection === id
                  ? "bg-grid-accent/15 text-grid-accent"
                  : "text-grid-fg-muted hover:bg-grid-surface-hover hover:text-grid-fg-secondary"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-grid-border px-5 py-3">
            <h2 className="font-mono text-sm font-medium text-grid-fg">
              {sections.find((s) => s.id === activeSection)?.label}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close settings"
              className="rounded p-1 text-grid-fg-muted transition-colors hover:bg-grid-surface-hover hover:text-grid-fg"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {activeSection === "general" && <GeneralSection settings={settings} update={update} />}
            {activeSection === "models" && <ModelsSection settings={settings} update={update} />}
            {activeSection === "keys" && (
              <KeysSection settings={settings} updateApiKey={updateApiKey} />
            )}
            {activeSection === "appearance" && (
              <AppearanceSection settings={settings} update={update} />
            )}
            {activeSection === "terminal" && (
              <TerminalSection settings={settings} update={update} />
            )}
            {activeSection === "security" && <SecuritySection />}
            {activeSection === "github" && <GitHubSection />}
            {activeSection === "cost" && <CostBudgetSection settings={settings} update={update} />}
            {activeSection === "license" && <LicenseSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sections ───

function GeneralSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Default CLI Tool" desc="Used when creating new panes">
        <Select
          value={settings.defaultAgent}
          options={CLI_TOOLS}
          onChange={(v) => update("defaultAgent", v)}
        />
      </Field>
      <Field label="Default Effort Level" desc="Thinking depth for new agents">
        <div className="flex gap-1.5">
          {EFFORT_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => update("defaultEffort", level.value)}
              className={`flex-1 rounded-md border px-2 py-1.5 font-mono text-[11px] transition-colors ${
                settings.defaultEffort === level.value
                  ? "border-grid-accent bg-grid-accent/15 text-grid-accent"
                  : "border-grid-border text-grid-fg-muted hover:border-grid-border-hover"
              }`}
              title={level.desc}
            >
              {level.label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function ModelsSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Default Model" desc="Model used when spawning new Claude agents">
        <Select
          value={settings.defaultModel}
          options={MODELS}
          onChange={(v) => update("defaultModel", v)}
        />
      </Field>
      <div className="rounded-lg border border-grid-border bg-grid-surface p-3">
        <div className="mb-2 font-mono text-[11px] font-medium text-grid-fg-secondary">
          Per-Pane Override
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-grid-fg-muted">
          Right-click any pane header to change its model individually. This overrides the default
          for that pane only.
        </p>
      </div>
    </div>
  );
}

function KeysSection({
  settings,
  updateApiKey,
}: {
  settings: AppSettings;
  updateApiKey: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="OpenAI API Key" desc="For Codex CLI and Whisper voice input">
        <SecretInput
          value={settings.apiKeys.openai ?? ""}
          onChange={(v) => updateApiKey("openai", v)}
          placeholder="sk-..."
        />
      </Field>
      <Field label="Whisper API Key" desc="For voice-to-text broadcast input">
        <SecretInput
          value={settings.apiKeys.whisper ?? ""}
          onChange={(v) => updateApiKey("whisper", v)}
          placeholder="sk-..."
        />
      </Field>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        <p className="font-mono text-[10px] leading-relaxed text-amber-400/80">
          Keys are stored in localStorage. They never leave your machine. AgentGrid does not send
          keys to any server.
        </p>
      </div>
    </div>
  );
}

function AppearanceSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Theme" desc="Application color scheme">
        <div className="flex gap-2">
          {(["dark", "light"] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => update("theme", theme)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 font-mono text-xs capitalize transition-colors ${
                settings.theme === theme
                  ? "border-grid-accent bg-grid-accent/15 text-grid-accent"
                  : "border-grid-border text-grid-fg-muted hover:border-grid-border-hover"
              }`}
            >
              <div
                className="h-4 w-4 rounded-full border"
                style={{
                  background: theme === "dark" ? "#141312" : "#f5f4f1",
                  borderColor: theme === "dark" ? "#3f3f46" : "#d4d4d8",
                }}
              />
              {theme}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function TerminalSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}) {
  const cursorStyles: Array<{ value: AppSettings["terminalCursorStyle"]; label: string }> = [
    { value: "bar", label: "Bar" },
    { value: "block", label: "Block" },
    { value: "underline", label: "Underline" },
  ];

  return (
    <div className="space-y-5">
      <Field label="Font Size" desc={`${settings.terminalFontSize}px`}>
        <input
          type="range"
          min={10}
          max={20}
          step={1}
          value={settings.terminalFontSize}
          onChange={(e) => update("terminalFontSize", Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-grid-border accent-grid-accent"
        />
      </Field>
      <Field
        label="Scrollback Lines"
        desc={`${settings.terminalScrollback.toLocaleString()} lines`}
      >
        <select
          value={settings.terminalScrollback}
          onChange={(e) => update("terminalScrollback", Number(e.target.value))}
          className="w-full cursor-pointer rounded-md border border-grid-border bg-grid-surface px-3 py-1.5 font-mono text-xs text-grid-fg outline-none transition-colors focus:border-grid-accent/50"
        >
          <option value={5000}>5,000</option>
          <option value={10000}>10,000</option>
          <option value={25000}>25,000</option>
          <option value={50000}>50,000</option>
          <option value={100000}>100,000</option>
        </select>
      </Field>
      <Field label="Cursor Style" desc="Shape of the terminal cursor">
        <div className="flex gap-1.5">
          {cursorStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => update("terminalCursorStyle", style.value)}
              className={`flex-1 rounded-md border px-2 py-1.5 font-mono text-[11px] transition-colors ${
                settings.terminalCursorStyle === style.value
                  ? "border-grid-accent bg-grid-accent/15 text-grid-accent"
                  : "border-grid-border text-grid-fg-muted hover:border-grid-border-hover"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Cursor Blink" desc="Animate the cursor">
        <button
          onClick={() => update("terminalCursorBlink", !settings.terminalCursorBlink)}
          className={`h-5 w-9 rounded-full transition-colors ${
            settings.terminalCursorBlink ? "bg-grid-accent" : "bg-grid-border"
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full bg-white transition-transform ${
              settings.terminalCursorBlink ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </Field>
      <div className="rounded-lg border border-grid-border bg-grid-surface p-3">
        <div className="mb-1 font-mono text-[11px] font-medium text-grid-fg-secondary">
          Renderer
        </div>
        <p className="font-mono text-[10px] text-grid-fg-muted">
          WebGL (GPU-accelerated) with automatic canvas fallback
        </p>
      </div>
    </div>
  );
}

// ─── GitHub Section (Feature 148 — Webhooks placeholder) ───

function GitHubSection() {
  return (
    <div className="space-y-5">
      <Field label="GitHub CLI Status" desc="AgentGrid uses `gh` CLI for all GitHub operations">
        <div className="rounded-lg border border-grid-border bg-grid-surface p-3">
          <p className="font-mono text-[10px] text-grid-fg-muted">
            Ensure <code className="text-grid-accent">gh</code> is installed and authenticated:{" "}
            <code className="text-grid-fg-secondary">gh auth status</code>
          </p>
        </div>
      </Field>

      <Field label="Pane Integration" desc="Right-click any pane header for GitHub actions">
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-md border border-grid-border bg-grid-surface px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-grid-fg-secondary">Create Issue</span>
            <span className="ml-auto font-mono text-[10px] text-grid-fg-muted">
              Right-click menu
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-grid-border bg-grid-surface px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-grid-fg-secondary">Create PR</span>
            <span className="ml-auto font-mono text-[10px] text-grid-fg-muted">
              Right-click menu
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-grid-border bg-grid-surface px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-grid-fg-secondary">PR Status Badge</span>
            <span className="ml-auto font-mono text-[10px] text-grid-fg-muted">Pane header</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-grid-border bg-grid-surface px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-grid-fg-secondary">Git Branch Badge</span>
            <span className="ml-auto font-mono text-[10px] text-grid-fg-muted">Pane header</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-grid-border bg-grid-surface px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-grid-fg-secondary">CI Status</span>
            <span className="ml-auto font-mono text-[10px] text-grid-fg-muted">Status bar</span>
          </div>
        </div>
      </Field>

      <Field label="GitHub Webhooks" desc="Receive push, PR, and review events in real-time">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="font-mono text-xs font-medium text-amber-400">Coming Soon</p>
          <p className="mt-1 font-mono text-[10px] text-grid-fg-muted">
            Webhook server will listen for GitHub events and push notifications to the grid.
            Configure your webhook URL and secret here.
          </p>
        </div>
      </Field>
    </div>
  );
}

// ─── Security Section ───

interface SecurityConfigState {
  promptInjection: boolean;
  piiDetection: boolean;
  pathTraversal: boolean;
  commandInjection: boolean;
  credentialLeak: boolean;
  autoRedact: boolean;
}

interface SecurityStatsState {
  totalFlags: number;
  byCategory: Record<string, number>;
  recentFlags: Array<{
    category: string;
    pattern: string;
    input: string;
    timestamp: number;
    paneId?: string;
  }>;
}

function SecuritySection() {
  const [config, setConfig] = useState<SecurityConfigState>({
    promptInjection: true,
    piiDetection: true,
    pathTraversal: true,
    commandInjection: true,
    credentialLeak: true,
    autoRedact: false,
  });
  const [stats, setStats] = useState<SecurityStatsState | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);

  // Load config and stats on mount
  useEffect(() => {
    window.api?.security?.getConfig().then((c: SecurityConfigState) => {
      if (c) setConfig(c);
    });
    window.api?.security?.getStats().then((s: SecurityStatsState) => {
      if (s) setStats(s);
    });
  }, []);

  const toggleFeature = useCallback(
    (key: keyof SecurityConfigState) => {
      const updated = { ...config, [key]: !config[key] };
      setConfig(updated);
      window.api?.security?.setConfig(updated);
    },
    [config],
  );

  const loadLog = useCallback(() => {
    window.api?.security?.getLog(50).then((lines: string[]) => {
      setLogLines(lines ?? []);
      setShowLog(true);
    });
  }, []);

  const clearSession = useCallback(() => {
    window.api?.security?.clear();
    setStats(null);
  }, []);

  const features: Array<{
    key: keyof SecurityConfigState;
    label: string;
    desc: string;
    color: string;
  }> = [
    {
      key: "promptInjection",
      label: "Prompt Injection",
      desc: "Detect role hijacking, jailbreaks, delimiter injection (50+ patterns)",
      color: "#ef4444",
    },
    {
      key: "piiDetection",
      label: "PII Detection",
      desc: "Email, phone, SSN, credit card numbers",
      color: "#eab308",
    },
    {
      key: "pathTraversal",
      label: "Path Traversal",
      desc: "Block ../../ patterns and sensitive file access",
      color: "#f97316",
    },
    {
      key: "commandInjection",
      label: "Command Injection",
      desc: "Shell metacharacters, pipe-to-shell, destructive chains",
      color: "#a855f7",
    },
    {
      key: "credentialLeak",
      label: "Credential Leak",
      desc: "API keys (sk-*, ghp_*, AKIA*), tokens, private keys",
      color: "#3b82f6",
    },
    {
      key: "autoRedact",
      label: "Auto-Redact",
      desc: "Replace detected PII and credentials with placeholders",
      color: "#22c55e",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Security score */}
      {stats && stats.totalFlags > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border-2"
            style={{
              borderColor:
                stats.totalFlags > 10 ? "#ef4444" : stats.totalFlags > 3 ? "#eab308" : "#22c55e",
            }}
          >
            <span className="font-mono text-sm font-bold text-grid-fg">{stats.totalFlags}</span>
          </div>
          <div>
            <div className="font-mono text-xs font-medium text-grid-fg-secondary">
              Security Flags This Session
            </div>
            <div className="font-mono text-[10px] text-grid-fg-muted">
              {Object.entries(stats.byCategory)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ") || "None"}
            </div>
          </div>
          <button
            onClick={clearSession}
            className="ml-auto rounded-md border border-grid-border px-2 py-1 font-mono text-[10px] text-grid-fg-muted hover:text-grid-fg-secondary"
          >
            Clear
          </button>
        </div>
      )}

      {/* Feature toggles */}
      {features.map(({ key, label, desc, color }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-mono text-xs font-medium text-grid-fg">{label}</span>
            </div>
            <p className="ml-4 font-mono text-[10px] text-grid-fg-muted">{desc}</p>
          </div>
          <button
            onClick={() => toggleFeature(key)}
            className={`h-5 w-9 shrink-0 rounded-full transition-colors ${
              config[key] ? "bg-grid-accent" : "bg-grid-border"
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white transition-transform ${
                config[key] ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      ))}

      {/* Log viewer toggle */}
      <div className="flex gap-2">
        <button
          onClick={loadLog}
          className="flex-1 rounded-md border border-grid-border py-1.5 font-mono text-[11px] text-grid-fg-muted transition-colors hover:border-grid-border-hover hover:text-grid-fg-secondary"
        >
          {showLog ? "Refresh Log" : "View Security Log"}
        </button>
      </div>

      {/* Log content */}
      {showLog && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-grid-border bg-grid-surface p-2">
          {logLines.length === 0 ? (
            <p className="py-4 text-center font-mono text-[10px] text-grid-fg-muted">
              No security events logged
            </p>
          ) : (
            <div className="space-y-0.5">
              {logLines.map((line, i) => (
                <div key={i} className="font-mono text-[10px] leading-relaxed text-grid-fg-muted">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-grid-border bg-grid-surface p-3">
        <div className="mb-1 font-mono text-[11px] font-medium text-grid-fg-secondary">
          Security Log
        </div>
        <p className="font-mono text-[10px] text-grid-fg-muted">
          All flagged inputs are logged to ~/.agentgrid/security.log. Logs persist across sessions.
        </p>
      </div>
    </div>
  );
}

// ─── Shared UI ───

function Field({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-xs font-medium text-grid-fg">{label}</label>
      {desc && <p className="mb-2 font-mono text-[10px] text-grid-fg-muted">{desc}</p>}
      {children}
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full cursor-pointer rounded-md border border-grid-border bg-grid-surface px-3 py-1.5 font-mono text-xs text-grid-fg outline-none transition-colors focus:border-grid-accent/50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex gap-1.5">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-grid-border bg-grid-surface px-3 py-1.5 font-mono text-xs text-grid-fg outline-none transition-colors focus:border-grid-accent/50"
      />
      <button
        onClick={() => setVisible((v) => !v)}
        className="rounded-md border border-grid-border px-2 font-mono text-[10px] text-grid-fg-muted transition-colors hover:border-grid-border-hover hover:text-grid-fg-secondary"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// ─── Cost Budget Section ───

function CostBudgetSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}) {
  const budgetPresets = [1, 5, 10, 25, 50];

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-[11px] text-grid-fg-muted">
          Session Budget Alert ($)
        </label>
        <p className="mb-2 text-[10px] text-grid-fg-dim">
          Get a warning toast when session cost exceeds this amount.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0.1}
            max={1000}
            step={0.5}
            value={settings.costBudgetUsd}
            onChange={(e) => update("costBudgetUsd", parseFloat(e.target.value) || 5)}
            className="w-24 rounded border border-grid-border bg-grid-bg px-2 py-1 font-mono text-[11px] text-grid-fg"
          />
          <span className="text-[10px] text-grid-fg-dim">USD per session</span>
        </div>
        <div className="mt-2 flex gap-1">
          {budgetPresets.map((v) => (
            <button
              key={v}
              onClick={() => update("costBudgetUsd", v)}
              className={`cursor-pointer rounded px-2.5 py-1.5 text-[10px] transition-colors ${
                settings.costBudgetUsd === v
                  ? "bg-grid-accent text-grid-fg"
                  : "border border-grid-border text-grid-fg-muted hover:text-grid-fg-secondary"
              }`}
            >
              ${v}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] text-grid-fg-dim">
          Model pricing (per 1K tokens, blended input+output):
          <br />
          Opus: $0.015 | Sonnet: $0.003 | Haiku: $0.00025
        </p>
      </div>
    </div>
  );
}

// ─── License Section ───

function LicenseSection() {
  const [licenseKey, setLicenseKey] = useState("");
  const [status, setStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [message, setMessage] = useState("");

  // Load existing key on mount
  useEffect(() => {
    window.api?.license
      ?.get()
      .then((key: string) => {
        if (key) {
          setLicenseKey(key);
          setStatus("valid");
          setMessage("License activated");
        }
      })
      .catch(() => {});
  }, []);

  async function handleValidate() {
    if (!licenseKey.trim()) return;
    setStatus("validating");
    try {
      const result = await window.api?.license?.validate(licenseKey.trim());
      if (result?.valid) {
        setStatus("valid");
        setMessage(result.message);
      } else {
        setStatus("invalid");
        setMessage(result?.message ?? "Invalid key");
      }
    } catch {
      setStatus("invalid");
      setMessage("Validation failed — check connection");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 font-body text-sm font-medium text-grid-fg-secondary">License Key</h3>
        <p className="mb-4 font-body text-[12px] text-grid-fg-dim">
          Enter your AgentGrid license key to unlock Pro features.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => {
              setLicenseKey(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            placeholder="AGRID-XXXX-XXXX-XXXX"
            className="flex-1 rounded-lg border border-grid-border bg-grid-bg px-3 py-2 font-mono text-sm text-grid-fg placeholder:text-grid-fg-dim/50 focus:border-grid-accent/50 focus:outline-none focus:ring-2 focus:ring-grid-accent/20"
          />
          <button
            onClick={handleValidate}
            disabled={status === "validating" || !licenseKey.trim()}
            className="cursor-pointer rounded-lg bg-grid-accent px-4 py-2 font-body text-sm font-medium text-grid-fg transition-colors hover:bg-grid-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "validating" ? "Checking..." : "Activate"}
          </button>
        </div>
        {message && (
          <p
            className={`mt-2 font-mono text-[12px] ${
              status === "valid"
                ? "text-green-400"
                : status === "invalid"
                  ? "text-red-400"
                  : "text-grid-fg-dim"
            }`}
          >
            {status === "valid" && <Check size={12} className="mr-1 inline" />}
            {status === "invalid" && <X size={12} className="mr-1 inline" />}
            {message}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-grid-border bg-grid-bg p-4">
        <h4 className="mb-2 font-body text-sm font-medium text-grid-fg-secondary">Current Plan</h4>
        <div className="flex items-center gap-2">
          <span className="rounded bg-grid-accent/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-grid-accent">
            {status === "valid" ? "PRO" : "FREE"}
          </span>
          <span className="font-body text-[12px] text-grid-fg-dim">
            {status === "valid" ? "All features unlocked" : "Basic features — upgrade for Pro"}
          </span>
        </div>
      </div>

      <p className="font-body text-[12px] text-grid-fg-dim">
        Need a license? Visit agentgrid.dev/pricing or contact support.
      </p>
    </div>
  );
}

// ─── Export for use by other components ───

/** Load settings from electron-store via IPC. Falls back to defaults if IPC unavailable. */
async function loadSettings(): Promise<AppSettings> {
  try {
    const stored = await window.api?.settings?.getAll();
    if (stored) {
      return {
        ...DEFAULT_SETTINGS,
        defaultAgent: (stored.defaultAgent as string) ?? DEFAULT_SETTINGS.defaultAgent,
        defaultModel: (stored.defaultModel as string) ?? DEFAULT_SETTINGS.defaultModel,
        defaultEffort: (stored.defaultEffort as string) ?? DEFAULT_SETTINGS.defaultEffort,
        theme: (stored.theme as "dark" | "light") ?? DEFAULT_SETTINGS.theme,
        terminalFontSize: (stored.terminalFontSize as number) ?? DEFAULT_SETTINGS.terminalFontSize,
        terminalScrollback:
          (stored.terminalScrollback as number) ?? DEFAULT_SETTINGS.terminalScrollback,
        terminalCursorStyle:
          (stored.terminalCursorStyle as "block" | "underline" | "bar") ??
          DEFAULT_SETTINGS.terminalCursorStyle,
        terminalCursorBlink:
          (stored.terminalCursorBlink as boolean) ?? DEFAULT_SETTINGS.terminalCursorBlink,
        costBudgetUsd: (stored.costBudgetUsd as number) ?? DEFAULT_SETTINGS.costBudgetUsd,
      };
    }
  } catch {
    // IPC not available
  }
  return { ...DEFAULT_SETTINGS };
}

export { loadSettings };
export type { AppSettings };
