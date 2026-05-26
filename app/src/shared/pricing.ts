/**
 * AgentGrid Pricing Tiers
 * Used by landing page and in-app upgrade prompts.
 */

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "CLI",
    price: "Free",
    period: "forever",
    description: "Multi-agent orchestration from your terminal",
    features: [
      "Grid creation (NxM)",
      "All CLI agents (Claude, Codex, Gemini, etc.)",
      "Broadcast & targeted messaging",
      "Preset save/restore",
      "Signal protocol support",
      "Community presets",
    ],
    cta: "npm install -g agentgrid",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Visual Mission Control for serious builders",
    features: [
      "Everything in CLI, plus:",
      "Electron desktop app",
      "Visual grid builder",
      "Command palette (⌘K)",
      "CEO log & monitoring",
      "Tool management UI",
      "Signal watcher dashboard",
      "Preset marketplace access",
      "Priority support",
    ],
    cta: "Download App",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "Shared workspaces for agent teams",
    features: [
      "Everything in Pro, plus:",
      "Team workspaces",
      "Shared harness library",
      "Session sharing & replay",
      "Cloud sync",
      "Custom integrations (webhooks, MCP)",
      "Admin dashboard",
      "SSO / SAML",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];
