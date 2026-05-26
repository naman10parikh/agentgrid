/**
 * Onboarding — First-run welcome flow.
 * Screens: Welcome → API Key → Default Model → Quick Tutorial → Done.
 */

import { useState, useCallback } from "react";
import { ArrowRight, ArrowLeft, Key, Cpu, Sparkles, Check, LayoutGrid } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

type Step = "welcome" | "api-key" | "model" | "tutorial";

const STEPS: Step[] = ["welcome", "api-key", "model", "tutorial"];

const MODELS = [
  {
    id: "claude-opus-4-6",
    label: "Claude Opus 4.6",
    desc: "Most capable, deepest reasoning",
    badge: "Recommended",
  },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", desc: "Fast and capable", badge: null },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    desc: "Fastest, most affordable",
    badge: null,
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-opus-4-6");
  const [saving, setSaving] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const next = useCallback(() => {
    if (isLast) {
      finishOnboarding();
    } else {
      setStep(STEPS[stepIndex + 1]);
    }
  }, [stepIndex, isLast]);

  const prev = useCallback(() => {
    if (!isFirst) setStep(STEPS[stepIndex - 1]);
  }, [stepIndex, isFirst]);

  async function finishOnboarding() {
    setSaving(true);
    try {
      if (apiKey.trim()) {
        await window.api?.settings?.set("apiKeyAnthropic", apiKey.trim());
      }
      await window.api?.settings?.set("defaultModel", selectedModel);
      await window.api?.onboarding?.complete();
    } catch {
      // IPC may not be available in dev
    }
    setSaving(false);
    onComplete();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-bg">
      <div className="w-full max-w-lg rounded-2xl border border-grid-border bg-grid-surface p-8 shadow-2xl">
        {/* Progress dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? "w-8 bg-grid-accent"
                  : i < stepIndex
                    ? "w-2 bg-grid-accent/50"
                    : "w-2 bg-grid-border"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {step === "welcome" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-grid-accent/10">
              <LayoutGrid size={32} className="text-grid-accent" />
            </div>
            <h1 className="mb-3 font-display text-2xl text-grid-fg">Welcome to AgentGrid</h1>
            <p className="mb-2 font-body text-sm leading-relaxed text-grid-fg-muted">
              Visual multi-agent orchestration for AI coding tools.
            </p>
            <p className="font-body text-sm leading-relaxed text-grid-fg-dim">
              Spawn grids of Claude, Codex, Gemini, or any CLI agent. Broadcast commands. Watch them
              work in parallel.
            </p>
          </div>
        )}

        {step === "api-key" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-grid-accent/10">
                <Key size={20} className="text-grid-accent" />
              </div>
              <div>
                <h2 className="font-display text-lg text-grid-fg">API Key</h2>
                <p className="font-body text-[12px] text-grid-fg-dim">
                  Optional — needed for cost tracking
                </p>
              </div>
            </div>
            <label
              className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-grid-fg-dim"
              htmlFor="onboarding-api-key"
            >
              Anthropic API Key
            </label>
            <input
              id="onboarding-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full rounded-lg border border-grid-border bg-grid-bg px-4 py-3 font-mono text-sm text-grid-fg placeholder:text-grid-fg-dim/50 focus:border-grid-accent/50 focus:outline-none focus:ring-2 focus:ring-grid-accent/20"
            />
            <p className="mt-3 font-body text-[12px] leading-relaxed text-grid-fg-dim">
              Your key stays local in electron-store. AgentGrid never sends it to our servers. You
              can skip this and add it later in Settings.
            </p>
          </div>
        )}

        {step === "model" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-grid-accent/10">
                <Cpu size={20} className="text-grid-accent" />
              </div>
              <div>
                <h2 className="font-display text-lg text-grid-fg">Default Model</h2>
                <p className="font-body text-[12px] text-grid-fg-dim">
                  Used when creating new agent panes
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                    selectedModel === m.id
                      ? "border-grid-accent/50 bg-grid-accent/10"
                      : "border-grid-border bg-grid-bg hover:border-grid-border-hover"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      selectedModel === m.id
                        ? "border-grid-accent bg-grid-accent"
                        : "border-grid-border"
                    }`}
                  >
                    {selectedModel === m.id && <Check size={12} className="text-grid-fg" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-medium text-grid-fg">{m.label}</span>
                      {m.badge && (
                        <span className="rounded bg-grid-accent/15 px-1.5 py-0.5 font-mono text-[11px] text-grid-accent">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-body text-[12px] text-grid-fg-dim">{m.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "tutorial" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-grid-accent/10">
                <Sparkles size={20} className="text-grid-accent" />
              </div>
              <div>
                <h2 className="font-display text-lg text-grid-fg">Quick Start</h2>
                <p className="font-body text-[12px] text-grid-fg-dim">Three things to know</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  num: "1",
                  title: "Create a grid",
                  desc: "Pick a size (2x2 is great to start) and a topology. Each cell spawns an agent.",
                },
                {
                  num: "2",
                  title: "Broadcast commands",
                  desc: "Type in the control bar and hit Send — your message goes to every agent simultaneously.",
                },
                {
                  num: "3",
                  title: "Use the command palette",
                  desc: "Press Cmd+K for quick access to all actions: new grids, presets, council, graph view, and more.",
                },
              ].map((item) => (
                <div key={item.num} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-grid-accent/10 font-mono text-sm font-semibold text-grid-accent">
                    {item.num}
                  </div>
                  <div>
                    <div className="font-body text-sm font-medium text-grid-fg">{item.title}</div>
                    <div className="font-body text-[12px] leading-relaxed text-grid-fg-dim">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {!isFirst ? (
            <button
              onClick={prev}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2.5 font-body text-sm text-grid-fg-muted transition-colors hover:bg-grid-bg hover:text-grid-fg"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={next}
            disabled={saving}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-grid-accent px-5 py-2.5 font-body text-sm font-medium text-grid-fg transition-all hover:bg-grid-accent/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : isLast ? "Get Started" : "Continue"}
            {!isLast && !saving && <ArrowRight size={14} />}
          </button>
        </div>

        {/* Skip link */}
        {!isLast && (
          <div className="mt-4 text-center">
            <button
              onClick={finishOnboarding}
              className="cursor-pointer font-body text-[12px] text-grid-fg-dim underline-offset-2 transition-colors hover:text-grid-fg-muted hover:underline"
            >
              Skip setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
