/**
 * Model choices. The app names no model ID: an ID freezes on one model, while Claude Code's own
 * default and its aliases move to newer models by themselves.
 *
 * An empty value ("") means Default: the CLI starts with no --model flag and picks its own model.
 */

/** Picker choices for a Claude Code pane: Default first, then the Claude Code aliases. */
export const CLAUDE_MODEL_OPTIONS = [
  { value: "", label: "Default" },
  { value: "opus", label: "Opus" },
  { value: "sonnet", label: "Sonnet" },
  { value: "haiku", label: "Haiku" },
];

/** Picker choices for a pane's agent. The app passes a model to Claude Code only. */
export function modelOptionsFor(agent: string): typeof CLAUDE_MODEL_OPTIONS {
  return agent === "claude" ? CLAUDE_MODEL_OPTIONS : CLAUDE_MODEL_OPTIONS.slice(0, 1);
}

/**
 * Read a saved model value, so a config saved by an older version still loads. A full Claude ID
 * becomes its alias. A GPT or Gemini ID becomes Default, since the app never passes a model to
 * those CLIs, and so does "default". Aliases and other values pass through. Non-strings become
 * undefined.
 */
export function normalizeModel(model: string | undefined): string | undefined {
  if (typeof model !== "string") return undefined;
  const id = model.toLowerCase();
  if (id === "default" || id.startsWith("gpt-") || id.startsWith("gemini-")) return "";
  if (id.startsWith("claude-")) {
    return ["opus", "sonnet", "haiku"].find((alias) => id.includes(alias)) ?? model;
  }
  return model;
}

/**
 * Estimated US dollars per 1M tokens, keyed by alias: the mean of the input and output price that
 * Anthropic lists for the model each alias picks on the Anthropic API, read on 20 October 2026
 * (for haiku, the price for prompts up to 100,000 tokens). Callers price Default and unknown
 * models as opus, which is Claude Code's default on most plans.
 */
export const PRICE_PER_MTOK: Record<string, number> = {
  opus: 12,
  sonnet: 6,
  haiku: 0.3,
};
