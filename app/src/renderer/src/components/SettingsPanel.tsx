import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SettingsState {
  defaultAgent: string;
  defaultModel: string;
  defaultEffort: string;
  autoSaveInterval: number;
  soundEnabled: boolean;
  theme: "dark" | "light";
  fontSize: number;
  showStatusBar: boolean;
  autoApprovePermissions: boolean;
}

const DEFAULTS: SettingsState = {
  defaultAgent: "claude",
  defaultModel: "claude-opus-4-6",
  defaultEffort: "max",
  autoSaveInterval: 60,
  soundEnabled: true,
  theme: "dark",
  fontSize: 13,
  showStatusBar: true,
  autoApprovePermissions: true,
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem("agentgrid-settings");
      if (stored) setSettings({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {
      // Use defaults
    }
  }, []);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("agentgrid-settings", JSON.stringify(next));
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#141312]/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-grid-border bg-grid-surface shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-grid-border px-4 py-3">
          <span className="font-mono text-sm font-medium text-grid-fg">Settings</span>
          <button onClick={onClose} className="text-grid-fg-muted hover:text-grid-fg-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          {/* Default Agent */}
          <div>
            <label className="mb-1 block font-mono text-[10px] text-grid-fg-muted">
              Default Agent
            </label>
            <select
              value={settings.defaultAgent}
              onChange={(e) => updateSetting("defaultAgent", e.target.value)}
              className="w-full rounded border border-grid-border bg-grid-bg px-3 py-1.5 font-mono text-xs text-grid-fg outline-none focus:border-grid-accent/50"
            >
              <option value="claude">Claude</option>
              <option value="codex">Codex</option>
              <option value="gemini">Gemini</option>
              <option value="aider">Aider</option>
              <option value="goose">Goose</option>
            </select>
          </div>

          {/* Default Model */}
          <div>
            <label className="mb-1 block font-mono text-[10px] text-grid-fg-muted">
              Default Model
            </label>
            <select
              value={settings.defaultModel}
              onChange={(e) => updateSetting("defaultModel", e.target.value)}
              className="w-full rounded border border-grid-border bg-grid-bg px-3 py-1.5 font-mono text-xs text-grid-fg outline-none focus:border-grid-accent/50"
            >
              <option value="claude-opus-4-6">Opus 4.6</option>
              <option value="claude-sonnet-4-6">Sonnet 4.6</option>
              <option value="claude-haiku-4-5-20251001">Haiku 4.5</option>
            </select>
          </div>

          {/* Default Effort */}
          <div>
            <label className="mb-1 block font-mono text-[10px] text-grid-fg-muted">
              Default Effort
            </label>
            <div className="flex gap-1">
              {(["low", "medium", "high", "max"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => updateSetting("defaultEffort", e)}
                  className={`flex-1 rounded px-2 py-1.5 font-mono text-[10px] ${
                    settings.defaultEffort === e
                      ? "bg-grid-accent text-grid-fg"
                      : "bg-grid-bg text-grid-fg-muted hover:text-grid-fg-secondary"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="mb-1 block font-mono text-[10px] text-grid-fg-muted">
              Terminal Font Size: {settings.fontSize}px
            </label>
            <input
              type="range"
              min={10}
              max={20}
              value={settings.fontSize}
              onChange={(e) => updateSetting("fontSize", parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="font-mono text-xs text-grid-fg-secondary">Sound notifications</span>
              <button
                onClick={() => updateSetting("soundEnabled", !settings.soundEnabled)}
                className={`h-5 w-9 rounded-full transition-colors ${settings.soundEnabled ? "bg-grid-accent" : "bg-grid-border"}`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${settings.soundEnabled ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <span className="font-mono text-xs text-grid-fg-secondary">
                Auto-approve permissions
              </span>
              <button
                onClick={() =>
                  updateSetting("autoApprovePermissions", !settings.autoApprovePermissions)
                }
                className={`h-5 w-9 rounded-full transition-colors ${settings.autoApprovePermissions ? "bg-grid-accent" : "bg-grid-border"}`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${settings.autoApprovePermissions ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
