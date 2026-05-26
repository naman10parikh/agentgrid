# Visual Minimalism — Less Text, More Emotion

**Core principle:** The page should be 70% visual, 30% text. If a section has more than 3 sentences, it has too many. The design itself communicates — words are the last resort.

---

## The Minimalism Rules

### 1. Text Budget Per Section

| Section      | Max text                                                 | What replaces text                                       |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------- |
| Hero         | 1 headline (5-8 words) + 1 subline (12-15 words) + 1 CTA | A visual: animated graphic, product screenshot, data viz |
| Social proof | Numbers only (3 metrics, no sentences)                   | Animated counters, logo bar                              |
| How it works | 3 steps, each 3-5 words                                  | Icons or illustrations per step                          |
| Features     | 3-4 features, title + 1 sentence each                    | Live demos, animated cards, screenshots                  |
| Pricing      | Price + 4-6 bullet features                              | Visual comparison, toggle animation                      |
| Final CTA    | 1 headline + 1 CTA                                       | Background gradient, texture, or animation               |

**Anti-pattern:** Paragraphs on landing pages. If you're explaining, you've failed to show.

### 2. Visual Assets That Replace Text

| Instead of...               | Use...                                      | How to build                            |
| --------------------------- | ------------------------------------------- | --------------------------------------- |
| "We scan your transactions" | Animated transaction feed scrolling         | CSS @keyframes infinite scroll          |
| "Found $2,847 in savings"   | Animated counter from $0 → $2,847           | Motion AnimateNumber or useSpring       |
| "3-step process"            | Animated flow diagram with connecting lines | SVG paths with drawSVG/stroke animation |
| "Trusted by 12,000+"        | Logo bar with subtle horizontal drift       | CSS infinite translate animation        |
| "Bank-level security"       | Lock icon with shield animation             | SVG + CSS transform                     |
| Feature descriptions        | Interactive cards that expand on hover      | Motion layout animations                |

### 3. Dynamic Graphics (No Stock Photos)

Generate visual interest without images:

- **Gradient meshes** — `background: conic-gradient(from 45deg, ...)` with subtle animation
- **SVG patterns** — geometric grids, dot patterns, topographic lines
- **Grain texture** — `feTurbulence` SVG filter at 2-4% opacity
- **Animated grid lines** — subtle pulsing grid background
- **Blur orbs** — large blurred circles (50-100vw) behind content with slow drift
- **Number animations** — counters, progress bars, percentage fills
- **Code blocks with syntax highlighting** — for dev tools (the code IS the visual)
- **Data visualizations** — bar charts, sparklines, donut charts built in SVG
- **Glassmorphism panels** — `backdrop-filter: blur(20px)` with border

### 4. Animation Replaces Description

Every section should have AT LEAST one animated element:

| Animation type    | When to use            | Duration                   |
| ----------------- | ---------------------- | -------------------------- |
| Fade-up reveal    | Section entry          | 400-600ms                  |
| Counter animation | Metrics/stats          | 1-2s ease-out              |
| Staggered list    | Feature items, steps   | 80-120ms per item          |
| Parallax depth    | Hero background        | Continuous (scroll-linked) |
| Hover expand      | Cards, buttons         | 200-300ms                  |
| Draw SVG          | Icons, logos on scroll | 800-1200ms                 |
| Typewriter        | Headlines, code blocks | 50-80ms per char           |
| Subtle float      | Background elements    | 3-6s infinite ease-in-out  |

### 5. Whitespace IS Content

Whitespace is not empty — it's a design element:

- **Hero section:** 120-160px top/bottom padding minimum
- **Between sections:** 80-120px padding
- **Around key metrics:** 40-60px margin
- **After headlines before body:** 24-32px
- **The rule:** If it doesn't feel "too much space," you don't have enough

### 6. The Emotion Test

Before shipping, ask: "Does this page make the ICP FEEL something in the first 3 seconds?"

| Vertical         | Target emotion                      | How the design achieves it                                 |
| ---------------- | ----------------------------------- | ---------------------------------------------------------- |
| Fintech (Ledger) | "My money is finally under control" | Calm colors, precise typography, real savings numbers      |
| Devtools (Forge) | "This is serious software"          | Dark terminal aesthetic, monospace, code-is-content        |
| Health (Pulse)   | "I trust this with my wellbeing"    | Warm organic palette, generous whitespace, human imagery   |
| Consumer         | "This is delightful"                | Playful animations, vibrant accents, personality in motion |

### 7. The 5-Second Rule

A stranger looking at your page for 5 seconds should understand:

1. **What it is** (from the headline — 5-8 words max)
2. **Who it's for** (from the visual language and ICP signals)
3. **What to do next** (from the single prominent CTA)

If they need to READ to understand, the design has failed.

---

## Checklist: Before Building ANY Section

- [ ] Text budget: under the max for this section type?
- [ ] Visual asset identified: what replaces the text?
- [ ] At least 1 animation per section?
- [ ] Whitespace: generous padding (not cramped)?
- [ ] Emotion test: does this section evoke the ICP's target feeling?
- [ ] 5-second rule: could a stranger understand without reading?
