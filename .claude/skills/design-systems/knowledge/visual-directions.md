# Visual Directions

5 opinionated visual directions. In Step 2 of the pipeline, present ALL five with provisional tokens. The client kills 4. The survivor becomes the design DNA. No compromise, no blending.

## How to Use This File

1. Read the brief from Step 1 (positioning + voice)
2. Present all 5 directions with a one-paragraph pitch, 3 reference brands, and provisional token previews
3. Client picks ONE. The other 4 are recorded as "killed alternatives" in the design system doc
4. The winning direction's tokens become the starting point for Steps 3-6

## Direction 1: Clean Engineering

**Philosophy:** Precision communicates competence. Every pixel is deliberate. Whitespace is a feature, not a gap. The interface disappears — the user's work is the star.

**Reference brands:** Linear, Stripe, Vercel, Raycast, Resend

**Risk:** Can feel cold or sterile without a single warm moment (a brand accent, a micro-animation, a playful empty state).

**Who it's for:** Developer tools, API platforms, infrastructure, fintech, B2B SaaS where the buyer is technical.

**Provisional tokens:**

```typescript
const cleanEngineering = {
  fonts: {
    display: "Geist", // or PP Neue Montreal, Inter Display
    body: "Geist", // or Inter
    mono: "Geist Mono", // or Berkeley Mono, Fira Code
  },
  colors: {
    background: "#09090b", // zinc-950 — cold, not warm
    surface: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.06)",
    text: {
      primary: "#fafafa", // zinc-50
      secondary: "#a1a1aa", // zinc-400
      muted: "#52525b", // zinc-600
    },
    accent: "#3b82f6", // single blue accent — trust
  },
  shape: {
    radius: "6px",
    borderWidth: "1px",
    shadow: "none", // flat, no shadows
  },
  spacing: {
    base: "4px",
    density: "tight", // Major Second scale (1.125)
  },
  motion: {
    duration: "150ms",
    easing: "ease-out",
    philosophy: "functional only — no decoration",
  },
} as const;
```

**Signature moves:**

- Monochrome with ONE accent color
- Keyboard-first interactions (⌘K palettes)
- Monospace data displays
- Subtle grid lines as structural guides
- Status dots (green/yellow/red) as the only color moments

---

## Direction 2: Warm Intelligence

**Philosophy:** Technology should feel like a trusted advisor, not a machine. Rounded edges, natural warmth, generous breathing room. Intelligence without intimidation.

**Reference brands:** Notion, Calm, Headspace, Linear (the warm parts), Craft

**Risk:** Can tip into "wellness app" territory. Needs enough information density to feel substantive, not fluffy.

**Who it's for:** Consumer products, wellness, personal finance, note-taking, knowledge management, education.

**Provisional tokens:**

```typescript
const warmIntelligence = {
  fonts: {
    display: "Instrument Serif", // or Fraunces, DM Serif Display
    body: "Poppins", // or Outfit, DM Sans
    mono: "JetBrains Mono",
  },
  colors: {
    background: "#141312", // warm black — NOT cold zinc
    surface: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.06)",
    text: {
      primary: "#e7e5e4", // stone-200 — warm white
      secondary: "#a8a29e", // stone-400
      muted: "#57534e", // stone-600
    },
    accent: "#8b5cf6", // purple — creativity, warmth
  },
  shape: {
    radius: "8px", // slightly softer than Clean Engineering
    borderWidth: "1px",
    shadow: "0 1px 2px rgba(0,0,0,0.3)", // subtle depth
  },
  spacing: {
    base: "4px",
    density: "relaxed", // Major Third scale (1.250)
  },
  motion: {
    duration: "300ms",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)", // spring-like
    philosophy: "organic, like breathing",
  },
} as const;
```

**Signature moves:**

- Serif + sans-serif pairing (the single biggest anti-AI move)
- Warm black backgrounds with stone/amber tints
- Generous line heights (1.6-1.75 on body)
- Soft shadows instead of hard borders
- Illustrations over photos, hand-drawn over stock

---

## Direction 3: Data-Forward

**Philosophy:** Numbers are the hero. Every chart, table, and metric is treated with the reverence of editorial typography. Data doesn't need decoration — it needs legibility and density.

**Reference brands:** Bloomberg Terminal, Koyfin, TradingView, Robinhood (the data parts), Datadog

**Risk:** Can become overwhelming without clear hierarchy. Needs strong visual hierarchy to prevent "spreadsheet in a browser" syndrome.

**Who it's for:** Trading platforms, analytics dashboards, monitoring tools, financial data, research platforms.

**Provisional tokens:**

```typescript
const dataForward = {
  fonts: {
    display: "Inter Display", // or Space Grotesk
    body: "Inter",
    mono: "Berkeley Mono", // or Fira Code — mono is HERO here
  },
  colors: {
    background: "#0a0a0a", // near-black — maximum data contrast
    surface: "#141414",
    border: "rgba(255,255,255,0.08)",
    text: {
      primary: "#e5e5e5",
      secondary: "#737373",
      muted: "#404040",
    },
    accent: "#22c55e", // green — financial positive
    negative: "#ef4444", // red — financial negative
    chart: [
      // 6-color chart palette
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#06b6d4",
    ],
  },
  shape: {
    radius: "4px", // tighter — data is dense
    borderWidth: "1px",
    shadow: "none",
  },
  spacing: {
    base: "4px",
    density: "compact", // Major Second scale (1.125)
  },
  motion: {
    duration: "200ms",
    easing: "ease-out",
    philosophy: "transitions serve orientation, never decoration",
  },
} as const;
```

**Signature moves:**

- Monospace numbers in tables (tabular-nums font-feature)
- Sparklines and micro-charts inline with text
- Color-coded positive/negative (green/red with symbols, not color alone)
- Dense grid with clear column/row hierarchy
- Sticky headers, frozen columns

---

## Direction 4: Editorial

**Philosophy:** Design like a magazine editor, not a UI designer. Content is king. Typography carries emotion. Every page tells a story with a beginning, middle, and end.

**Reference brands:** The Information, Monocle, Apple Newsroom, Stripe Press, Readymag

**Risk:** Can feel pretentious or slow. Needs enough interactive elements to feel like a product, not a PDF.

**Who it's for:** Content platforms, blogs, newsletters, luxury brands, agencies, portfolios, documentation.

**Provisional tokens:**

```typescript
const editorial = {
  fonts: {
    display: "Playfair Display", // or Spectral, Newsreader, Crimson Pro
    body: "Source Sans Pro", // or Public Sans, Karla
    mono: "Source Code Pro", // or Inconsolata
  },
  colors: {
    background: "#171412", // warm near-black with brown
    surface: "rgba(255,248,240,0.03)", // warm surface
    border: "rgba(255,248,240,0.06)",
    text: {
      primary: "#f5f0eb", // warm off-white
      secondary: "#a39e96",
      muted: "#5c5650",
    },
    accent: "#c2410c", // burnt orange — editorial warmth
  },
  shape: {
    radius: "2px", // sharp — editorial crispness
    borderWidth: "1px",
    shadow: "none", // flat, content-focused
  },
  spacing: {
    base: "4px",
    density: "generous", // Perfect Fourth scale (1.333)
  },
  motion: {
    duration: "400ms",
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    philosophy: "slow, considered, page-turn-like",
  },
} as const;
```

**Signature moves:**

- Large serif headlines with tight negative tracking (-0.03em)
- max-w-2xl body text (65-75 characters per line — optimal readability)
- Pull quotes and drop caps as visual punctuation
- Full-bleed images breaking the content column
- Alternating background rhythm (transparent → muted/40 → transparent)

---

## Direction 5: Alive & Ambient

**Philosophy:** The interface is alive. Subtle gradients shift. Particles drift. Hover states reveal hidden depth. Technology feels magical, not mechanical.

**Reference brands:** Arc Browser, Mercury, Liveblocks, Framer, Rive

**Risk:** Performance and accessibility. Animations must respect `prefers-reduced-motion`. GPU-heavy effects drain mobile batteries. Every animation must have a functional purpose.

**Who it's for:** Creative tools, collaboration platforms, next-gen products, startups wanting to signal "we're different."

**Provisional tokens:**

```typescript
const aliveAmbient = {
  fonts: {
    display: "Cabinet Grotesk", // or Clash Display, Space Grotesk
    body: "Satoshi", // or General Sans, Outfit
    mono: "Commit Mono", // or Fragment Mono
  },
  colors: {
    background: "#0f0f12", // deep blue-black
    surface: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
    text: {
      primary: "#f0eef5", // cool off-white
      secondary: "#8b89a0",
      muted: "#4a4860",
    },
    accent: "#a855f7", // vivid purple
    glow: "rgba(168,85,247,0.15)", // ambient glow color
    gradient: {
      from: "#6366f1", // indigo
      to: "#a855f7", // purple
    },
  },
  shape: {
    radius: "12px", // softer — feels modern
    borderWidth: "1px",
    shadow: "0 0 40px rgba(168,85,247,0.08)", // ambient glow
  },
  spacing: {
    base: "4px",
    density: "relaxed", // Minor Third scale (1.200)
  },
  motion: {
    duration: "500ms",
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // bounce
    philosophy: "everything breathes — but always with purpose",
  },
} as const;
```

**Signature moves:**

- Gradient borders that shift on hover (conic-gradient rotation)
- Ambient glow behind key elements (box-shadow with brand color at 8-15%)
- Particle backgrounds (canvas/WebGL, behind content, never blocking)
- Glassmorphism on cards (backdrop-blur + rgba background)
- Cursor trails, magnetic buttons, spring physics

---

## Decision Framework

When presenting to the client/stakeholder, use this scoring:

| Factor        | Clean Engineering | Warm Intelligence | Data-Forward | Editorial | Alive & Ambient |
| ------------- | :---------------: | :---------------: | :----------: | :-------: | :-------------: |
| Trust         |       ★★★★★       |       ★★★★        |    ★★★★★     |   ★★★★    |       ★★★       |
| Warmth        |        ★★         |       ★★★★★       |      ★       |   ★★★★    |       ★★★       |
| Density       |       ★★★★        |        ★★★        |    ★★★★★     |    ★★     |       ★★★       |
| Personality   |        ★★         |       ★★★★        |      ★★      |   ★★★★★   |      ★★★★★      |
| Accessibility |       ★★★★★       |       ★★★★        |     ★★★      |   ★★★★    |       ★★★       |
| Performance   |       ★★★★★       |       ★★★★        |     ★★★★     |   ★★★★★   |       ★★★       |

## Killing Alternatives

When the client picks a direction, document the killed alternatives:

```markdown
## Killed Alternatives

### Direction 2: Warm Intelligence — KILLED

**Why:** Client's audience is institutional investors. Warmth reads as "consumer app."
The serif display font was appealing but undermines credibility with this audience.

### Direction 5: Alive & Ambient — KILLED

**Why:** Data-heavy product. Animations would distract from the numbers.
Ambient glow effects compete with chart highlighting for attention.

[etc.]
```

This record prevents scope creep ("can we add just a little animation from Direction 5?"). The answer is no — we killed it for a reason.
