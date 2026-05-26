# The Frontend Design Bible — 2026

**Source:** Claude.ai research agent, 700+ sources, March 2026. This is the biblical source of truth for all frontend design decisions. Read this before every design task.

**Original:** `resources/read/master_700_sources_research_claude_frontend_guide.md`

---

## The Stack (Settled, Non-Negotiable)

| Layer                 | Tool                                                                           | Why                               |
| --------------------- | ------------------------------------------------------------------------------ | --------------------------------- |
| Framework             | Next.js 15+ (App Router, RSC, Turbopack)                                       | 30-60% TTI reduction              |
| Styling               | Tailwind CSS v4 (OKLCH, Rust engine, 100x incremental)                         | Industry standard                 |
| Components            | shadcn/ui (copy-paste, Radix primitives, 57 components)                        | Code ownership > npm              |
| UI Animations         | Motion v12+ (formerly Framer Motion, 2.3KB core)                               | Declarative, hardware-accelerated |
| Scroll                | Lenis (~3KB) for smooth scroll + GSAP ScrollTrigger for effects                | The combo. No alternatives.       |
| Page Transitions      | View Transitions API (browser native, Baseline Oct 2025)                       | Zero JS                           |
| Scroll Animations     | CSS `animation-timeline: scroll()` where possible, Motion `useScroll` fallback | Compositor thread = no jank       |
| Interactive Animation | Rive (successor to Lottie, state machines, 120fps GPU)                         | For branded moments               |
| 3D                    | Three.js + React Three Fiber (WebGPU in r171+)                                 | When 3D is justified              |
| Icons                 | Lucide (default) + Phosphor (6 weight variants for hierarchy)                  | Phosphor for variation            |
| Colors                | OKLCH (93%+ support, Tailwind v4 default, perceptually uniform)                | Radix Colors 12-step scales       |
| Fonts                 | next/font self-hosting, zero layout shift                                      | Variable fonts preferred          |

## The Animation Stack (Layered)

```
Layer 1: CSS native — scroll-driven animations, View Transitions, :has(), container queries
Layer 2: Lenis — smooth scroll foundation (lerp interpolation, preserves sticky/snap)
Layer 3: GSAP ScrollTrigger — scroll-based triggers, pin, scrub, snap
Layer 4: Motion (Framer) — UI state animations, layout, exit, useScroll
Layer 5: Rive — interactive branded animations (state machines, not timeline)
Layer 6: Three.js — 3D scenes, WebGPU, spatial computing
```

**Use the lowest layer that solves the problem.** CSS native > Lenis > GSAP > Motion > Rive > Three.js.

## Agency Gold Standards

### Pentagram

- Research-driven, typography-forward
- "Consistency structurally embedded, not enforced"
- Animation with DELIBERATE RESTRAINT — motion serves brand, not decoration
- No defined aesthetic, but defined POINT OF VIEW

### Stripe (The Detail Standard)

- Spends **20x more time on design details** than typical companies
- CEO rewrote code to make typing delays RANDOM (not uniform 100ms — "too automatic")
- Custom CIELAB tooling for perceptually uniform accessible colors
- Every micro-interaction is intentional

### Linear (The SaaS Standard)

- Dark mode by default, Inter typeface, gradient sphere logo
- 8px spacing scale, Radix Primitives for accessibility
- "Professional to engineers" — no frivolity
- Spawned an entire aesthetic movement across SaaS

### Instrument (Design Systems as Core)

- 16-year Nike relationship, unified digital design system
- "Ingredients and recipe, not a prepared meal"
- Systems that scale across retail, brand, digital

## What Changed in 2026 (Things We May Be Missing)

1. **GSAP is fully FREE** — SplitText, MorphSVG, DrawSVG, ScrollSmoother, Flip all free (Webflow acquisition April 2025). Use ScrollTrigger.
2. **Lenis dominates smooth scrolling** — 3KB, lerp interpolation, preserves position:sticky and IntersectionObserver. Install it.
3. **Rive replaced Lottie** — Interactive state machines, GPU acceleration, 120fps. Spotify Wrapped used it (300M users).
4. **CSS scroll-driven animations are production-ready** — `animation-timeline: scroll()` and `view()` run on compositor thread. Zero JS.
5. **View Transitions API is Baseline** — Same-document transitions work everywhere. Cross-document in Chrome/Edge/Safari.
6. **shadcn/ui v4** — Preset system (Vega, Nova, Maia, Lyra, Mira), shadcn/skills for AI agents.
7. **Aceternity UI** — 200+ components: 3D card effects, parallax heroes, gibberish text reveals, aurora backgrounds.
8. **Magic UI** — 150+ animated components: bento grids, meteor backgrounds, shine borders, device mockups.
9. **Apple Liquid Glass** — Translucent UI with optical refraction, concentricity principle, bold left-aligned typography.
10. **M3 Expressive** — Explicit visual structure, spring-based motion. Users spot elements 4x faster.

## Timing & Performance Rules

- **200-500ms** is the animation sweet spot
- **Only animate `transform` and `opacity`** (GPU-composited)
- **60fps target** — use `will-change` sparingly
- **`prefers-reduced-motion`**: minimize non-essential motion, don't eliminate ALL
- **Fade-up reveals** (translateY + opacity) remain most effective scroll pattern
- **Parallax**: 20-30% speed difference between layers, auto-disable on mobile, hero only
- **Typing delays**: randomize (Stripe lesson) — fixed intervals feel robotic

## Component Libraries to Use

| Library       | Stars        | Components         | Use For                                         |
| ------------- | ------------ | ------------------ | ----------------------------------------------- |
| shadcn/ui     | 110K+        | 57                 | Base UI components                              |
| Magic UI      | 19K+         | 150+               | Landing page animations, bento grids            |
| Aceternity UI | —            | 200+               | 3D effects, parallax heroes, aurora backgrounds |
| Radix UI      | 130M+/mo npm | Primitives         | Accessibility foundation                        |
| React Aria    | —            | Hooks + components | Deepest a11y (30+ languages, 13 calendars)      |

## Color: OKLCH + Radix 12-Step

OKLCH confirmed as 2026 standard (93%+ support, Tailwind v4 default).

**Radix Colors 12-step scale** — each step has a specific purpose:

```
1-2:   Backgrounds (app, subtle)
3-5:   Interactive states (hover, active, selected)
6-8:   Borders (subtle, default, strong)
9-10:  Solids (default, hover)
11-12: Text (low contrast, high contrast)
```

## Typography Rules (Confirmed)

- Variable fonts preferred (weight axis for animation)
- **next/font** for zero layout shift self-hosting
- Notable 2026 UI fonts: Inter, Geist (Vercel), Plus Jakarta Sans, Satoshi, DM Sans
- **Anti-AI fonts**: Instrument Serif, Source Serif 4, Newsreader, Outfit, Sora
- Lucide default but risks "visual sameness" — use **Phosphor** (6 weight variants) for hierarchy

## The Copy-Paste Revolution

Components are no longer installed as npm dependencies. They're copied into your project:

- `npx shadcn@latest add button` — you OWN the code
- AI agents can modify components directly (no black-box deps)
- Registry-based distribution replacing npm packages
- shadcn/skills — AI coding agents get structured component knowledge

## MCP Integration Points

| MCP                | Purpose                           |
| ------------------ | --------------------------------- |
| Figma Dev Mode MCP | Design-to-code bidirectional      |
| shadcn MCP         | Component generation              |
| Magic UI MCP       | Animated component generation     |
| SVGMaker MCP       | AI SVG creation and editing       |
| Playwright MCP     | Browser automation + a11y testing |
| Context7 MCP       | Live framework docs               |

## Checklist: Before Any Design Task

- [ ] Read this file + knowledge/info-hierarchy.md
- [ ] Install: Lenis + GSAP (if not present)
- [ ] Check: using OKLCH colors (not hex/hsl)
- [ ] Check: using Radix-style 12-step color scales
- [ ] Check: animation timing 200-500ms
- [ ] Check: only animating transform + opacity
- [ ] Check: prefers-reduced-motion respected
- [ ] Check: Phosphor icons for hierarchy variation (not just Lucide)
- [ ] Check: font loaded via next/font (zero CLS)
- [ ] Check: smooth scroll via Lenis (not JS scroll listeners)
