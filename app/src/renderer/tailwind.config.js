/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "grid-bg": "var(--grid-bg)",
        "grid-bg-raised": "var(--grid-bg-raised)",
        "grid-bg-elevated": "var(--grid-bg-elevated)",
        "grid-surface": "var(--grid-bg-raised)",
        "grid-border": "var(--grid-border)",
        "grid-border-subtle": "var(--grid-border-subtle)",
        "grid-border-hover": "var(--grid-fg-dim)",
        "grid-fg": "var(--grid-fg)",
        "grid-fg-primary": "var(--grid-fg)",
        "grid-fg-secondary": "var(--grid-fg-muted)",
        "grid-fg-muted": "var(--grid-fg-muted)",
        "grid-fg-dim": "var(--grid-fg-dim)",
        "grid-accent": "var(--grid-accent)",
        "grid-accent-hover": "var(--grid-accent-hover)",
        "grid-accent-muted": "var(--grid-accent-muted)",
        status: {
          idle: "var(--status-idle)",
          working: "var(--status-working)",
          waiting: "var(--status-waiting)",
          done: "var(--status-done)",
          error: "var(--status-error)",
          spawning: "var(--status-spawning)",
          stuck: "var(--status-stuck)",
          migrating: "var(--status-migrating)",
        },
      },
      fontFamily: {
        display: ["Instrument Serif", "serif"],
        body: ["Poppins", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      spacing: {
        sidebar: "var(--sidebar-width)",
        controlbar: "var(--controlbar-height)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
