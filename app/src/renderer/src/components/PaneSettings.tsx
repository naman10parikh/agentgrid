import { useState, useEffect } from "react";
import type { CliTool, EffortLevel } from "../types";

interface PersonaDef {
  id: string;
  name: string;
  icon: string;
  category: string;
  defaultModel: string;
  defaultEffort: string;
  systemPrompt: string;
  color: string;
  shortLabel: string;
  builtIn: boolean;
}

interface TerminalAppearance {
  terminalFontSize: number;
  terminalFontFamily: string;
  terminalCursorStyle: "block" | "underline" | "bar";
  terminalCursorBlink: boolean;
}

interface PaneSettingsProps {
  agent: CliTool;
  model?: string;
  effort?: EffortLevel;
  cwd?: string;
  paneId?: string;
  onChangeModel: (model: string) => void;
  onChangeEffort: (effort: EffortLevel) => void;
  onChangeAgent: (agent: CliTool) => void;
  onChangeCwd?: (cwd: string) => void;
  onChangeAppearance?: (key: string, value: unknown) => void;
  onChangePersona?: (personaId: string) => void;
  onClose: () => void;
}

const MODELS = [
  { value: "claude-opus-4-6", label: "Opus 4.6" },
  { value: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { value: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
];

const EFFORTS: EffortLevel[] = ["low", "medium", "high", "max"];

const AGENTS: CliTool[] = ["claude", "codex", "gemini", "aider", "goose", "hermes", "cline"];

const CURSOR_STYLES: Array<{ value: TerminalAppearance["terminalCursorStyle"]; label: string }> = [
  { value: "bar", label: "Bar" },
  { value: "block", label: "Block" },
  { value: "underline", label: "Underline" },
];

const FONT_FAMILIES = [
  "'JetBrains Mono', monospace",
  "'Fira Code', monospace",
  "'Cascadia Code', monospace",
  "'SF Mono', monospace",
  "'Menlo', monospace",
  "'Monaco', monospace",
  "monospace",
];

const CATEGORY_LABELS: Record<string, string> = {
  engineering: "Engineering",
  architecture: "Architecture",
  testing: "Testing",
  security: "Security",
  sparc: "SPARC Pipeline",
  research: "Research",
  operations: "Operations",
  custom: "Custom",
};

export function PaneSettings({
  agent,
  model,
  effort,
  cwd,
  paneId,
  onChangeModel,
  onChangeEffort,
  onChangeAgent,
  onChangeCwd,
  onChangeAppearance,
  onChangePersona,
  onClose,
}: PaneSettingsProps) {
  const [appearance, setAppearance] = useState<TerminalAppearance>({
    terminalFontSize: 13,
    terminalFontFamily: "'SF Mono', 'JetBrains Mono', 'Cascadia Code', monospace",
    terminalCursorStyle: "block",
    terminalCursorBlink: true,
  });
  const [personaGroups, setPersonaGroups] = useState<Record<string, PersonaDef[]>>({});
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // Load saved settings + personas on mount
  useEffect(() => {
    if (window.api?.settings?.getAll) {
      window.api.settings
        .getAll()
        .then((saved: Partial<TerminalAppearance>) => {
          if (saved) {
            setAppearance((prev) => ({ ...prev, ...saved }));
          }
        })
        .catch(() => {
          /* no-op */
        });
    }
    // Load persona groups
    if (window.api?.persona?.grouped) {
      window.api.persona
        .grouped()
        .then((groups: Record<string, unknown[]>) => {
          setPersonaGroups(groups as Record<string, PersonaDef[]>);
        })
        .catch(() => {
          /* no-op */
        });
    }
  }, []);

  const updateAppearance = (key: keyof TerminalAppearance, value: unknown) => {
    setAppearance((prev) => ({ ...prev, [key]: value }));
    // Persist to electron-store
    window.api?.settings?.set(key, value).catch(() => {
      /* no-op */
    });
    // Notify parent for live xterm update
    onChangeAppearance?.(key, value);
  };

  return (
    <div className="absolute right-0 top-8 z-20 w-64 max-h-[80vh] overflow-y-auto rounded-lg border border-grid-border bg-grid-surface shadow-lg">
      <div className="border-b border-grid-border px-3 py-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-grid-fg-muted">
          Pane Settings
        </span>
      </div>

      {/* Agent */}
      <div className="border-b border-grid-border px-3 py-2">
        <label className="mb-1 block font-mono text-[10px] text-grid-fg-muted">Agent</label>
        <select
          value={agent}
          onChange={(e) => onChangeAgent(e.target.value as CliTool)}
          className="w-full rounded border border-grid-border bg-grid-bg px-2 py-1 font-mono text-xs text-grid-fg outline-none focus:border-grid-accent/50"
        >
          {AGENTS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Persona Picker */}
      <div className="border-b border-grid-border px-3 py-2">
        <label className="mb-1 block font-mono text-[10px] text-grid-fg-muted">Persona</label>
        <select
          value={selectedPersona}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedPersona(id);
            if (id && paneId) {
              window.api?.persona?.setPane(paneId, id);
              onChangePersona?.(id);
            }
          }}
          className="w-full rounded border border-grid-border bg-grid-bg px-2 py-1 font-mono text-xs text-grid-fg outline-none focus:border-grid-accent/50"
        >
          <option value="">None</option>
          {Object.entries(personaGroups).map(([category, personas]) => (
            <optgroup key={category} label={CATEGORY_LABELS[category] ?? category}>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortLabel} — {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {/* Quick custom persona */}
        <button
          onClick={() => setShowCustomForm((v) => !v)}
          className="mt-1 font-mono text-[10px] text-grid-fg-muted hover:text-grid-accent"
        >
          + Custom persona
        </button>
        {showCustomForm && (
          <div className="mt-1 space-y-1">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Name..."
              className="w-full rounded border border-grid-border bg-grid-bg px-2 py-1 font-mono text-[10px] text-grid-fg outline-none"
            />
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="System prompt..."
              rows={2}
              className="w-full rounded border border-grid-border bg-grid-bg px-2 py-1 font-mono text-[10px] text-grid-fg outline-none resize-none"
            />
            <button
              onClick={() => {
                if (!customName.trim() || !customPrompt.trim()) return;
                const id = customName.toLowerCase().replace(/\s+/g, "-");
                window.api?.persona
                  ?.register({
                    id,
                    name: customName,
                    icon: "user",
                    category: "custom",
                    defaultModel: "claude-opus-4-6",
                    defaultEffort: "high",
                    systemPrompt: customPrompt,
                    color: "#6b7280",
                    shortLabel: customName.slice(0, 4).toUpperCase(),
                    traits: [],
                  })
                  .then(() => {
                    // Refresh personas
                    window.api?.persona?.grouped().then((groups: Record<string, unknown[]>) => {
                      setPersonaGroups(groups as Record<string, PersonaDef[]>);
                    });
                    setSelectedPersona(id);
                    if (paneId) window.api?.persona?.setPane(paneId, id);
                    setShowCustomForm(false);
                    setCustomName("");
                    setCustomPrompt("");
                  });
              }}
              className="w-full rounded bg-grid-accent/20 py-1 font-mono text-[10px] text-grid-accent hover:bg-grid-accent/30"
            >
              Create & Apply
            </button>
          </div>
        )}
      </div>

      {/* Working Directory */}
      {onChangeCwd && (
        <div className="border-b border-grid-border px-3 py-2">
          <label className="mb-1 block font-mono text-[10px] text-grid-fg-muted">
            Working Directory
          </label>
          <div className="flex gap-1">
            <div
              className="flex-1 truncate rounded border border-grid-border bg-grid-bg px-2 py-1 font-mono text-[10px] text-grid-fg-secondary"
              title={cwd ?? "/tmp"}
            >
              {cwd ? cwd.split("/").slice(-2).join("/") : "/tmp"}
            </div>
            <button
              onClick={async () => {
                const picked = await window.api?.pane?.pickCwd();
                if (picked) {
                  onChangeCwd(picked);
                }
              }}
              className="rounded border border-grid-border bg-grid-bg px-2 py-1 font-mono text-[10px] text-grid-fg-muted hover:text-grid-fg-secondary"
              title="Browse..."
            >
              ...
            </button>
          </div>
        </div>
      )}

      {/* Model */}
      <div className="border-b border-grid-border px-3 py-2">
        <label className="mb-1 block font-mono text-[10px] text-grid-fg-muted">Model</label>
        <select
          value={model ?? "claude-opus-4-6"}
          onChange={(e) => onChangeModel(e.target.value)}
          className="w-full rounded border border-grid-border bg-grid-bg px-2 py-1 font-mono text-xs text-grid-fg outline-none focus:border-grid-accent/50"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Effort */}
      <div className="border-b border-grid-border px-3 py-2">
        <label className="mb-1 block font-mono text-[10px] text-grid-fg-muted">Effort</label>
        <div className="flex gap-1">
          {EFFORTS.map((e) => (
            <button
              key={e}
              onClick={() => onChangeEffort(e)}
              className={`flex-1 rounded px-1.5 py-1 font-mono text-[10px] transition-colors ${
                (effort ?? "max") === e
                  ? "bg-grid-accent text-grid-fg"
                  : "bg-grid-bg text-grid-fg-muted hover:text-grid-fg-secondary"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Close */}
      <div className="border-t border-grid-border px-3 py-1.5">
        <button
          onClick={onClose}
          className="w-full rounded py-1 font-mono text-[10px] text-grid-fg-muted hover:text-grid-fg-secondary"
        >
          Done
        </button>
      </div>
    </div>
  );
}
