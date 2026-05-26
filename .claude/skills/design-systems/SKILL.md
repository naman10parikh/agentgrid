---
name: design-systems
description: V3 design harness — discovery brief gate, DFS pipeline, 12-dimension binary audit, OKLCH colors, jakub.kr micro-details. Produces world-class designs for any vertical.
trigger: When designing UI, generating wireframes, creating brand identity, reviewing visual design, building landing pages, or producing design tokens.
globs:
  [
    "*.tsx",
    "*.css",
    "BRAND.md",
    "theme-tokens*",
    "tailwind.config*",
    "tokens/*",
  ]
---

# Design Systems V3 — DFS Pipeline with Discovery Gate

Transforms any design request into a premium, vertical-appropriate visual system. V3 changes: discovery brief is a HARD GATE (no brief = no design), DFS methodology (one component to 100% before scaling), 12-dimension binary audit (pass/fail, not vague scores), OKLCH color system, jakub.kr micro-details.

**Quality bar:** $100M agency output. Every step produces opinionated choices. Safe, generic options are not options.

**Core philosophy:** "What would a highly opinionated designer build to make this ICP resonate deeply with this vision?" — If you can't answer this, you haven't done Step 1.

## The 12-Step V3 Pipeline

Each step: decisions made, options presented, what gets killed and why, what gets locked, output format. Decisions LOCK at each step and never get revisited.

**NEW in V3.1:** Step 1.5 (Information Hierarchy Map) added between Discovery Brief and Leading Questions. Based on Axieomatic design feedback. See `knowledge/info-hierarchy.md` for full rules.

**NEW in V3.2:** Visual Minimalism rules enforced. 70% visual, 30% text. Every section needs animation. Whitespace IS content. See `knowledge/visual-minimalism.md`. Also read `knowledge/frontend-bible-2026.md` (700-source research) before every design task.

---

### Step 1: DISCOVERY BRIEF (Gate — No Brief = No Design)

**HARD GATE.** This step must produce a complete brief before ANY visual work begins. If the brief is incomplete, the pipeline stops. No exceptions. This is the #1 lesson from V2: jumping to visuals without strategy produces generic output.

**Questions the brief MUST answer (Socratic self-interrogation):**

1. How much time was spent building the **ethos** of what we're building?
2. What's the **ICP** — specific person, not demographic? Name, age, role, company size, daily frustrations.
3. Is it for the **upper end** of the market? Mid market? Mass consumer?
4. What's the **goal** of this page? Convert to sign-up? Book a call? Download? Purchase?
5. What **feeling** should the user have within 3 seconds of landing?
6. What are 3 products this ICP already uses and loves? (Design must feel native to that ecosystem)
7. What would make this ICP say "finally, someone gets it"?

**Process:**

1. Parse the request into structured brief fields
2. Detect vertical from context clues (fintech, health, creative, devtools, consumer, enterprise, education, ecommerce)
3. Define the target user as a SPECIFIC person — "Marcus, 42, portfolio manager at a mid-size hedge fund" not "finance professionals"
4. Establish 3-word brand voice
5. Identify 3 competitors and state how we DIFFER (not just who they are)
6. Define the single conversion goal
7. Define the target emotion (3-second test)

**Gate check:** If any of the 7 questions above is unanswered or vague, STOP. Do not proceed to Step 2. Ask the questions or research the answers.

**What gets locked:** Audience, voice, positioning, goal, emotion. These cannot change in later steps.

**Output:**

```markdown
## Discovery Brief

- **Vertical:** fintech
- **Target user:** Marcus, 42, portfolio manager at a mid-size hedge fund. Uses Bloomberg Terminal daily. Frustrated by noisy consumer apps that waste his time.
- **Market position:** Upper-end institutional. NOT consumer, NOT mass-market.
- **Brand voice:** precise, confident, unhurried
- **Not this:** NOT Robinhood (gamified), NOT Bloomberg (overwhelming), NOT Webull (noisy)
- **Page goal:** Book a demo call
- **Target emotion:** "This is serious software built by people who understand my work"
- **ICP's beloved products:** Bloomberg Terminal, Notion, Linear
- **Value prop:** "Institutional-grade analytics that respects your attention"
```

---

### Step 1.5: INFORMATION HIERARCHY MAP (Gate — No Map = No Code)

**HARD GATE.** Before ANY visual work, map the eye-tracking path for every section. See `knowledge/info-hierarchy.md` for full rules.

**For each section, write:**

```markdown
### Section: [Name]

- FIRST (0-1s): [Element] — [text] (size, weight, alignment)
- SECOND (1-2s): [Element] — [text] (size, weight, color)
- THIRD (2-3s): [Element] — [text] (size, weight, elevation)
- AMBIENT: [Supporting elements] (smallest size, lightest weight, muted)
```

**Rules:**

1. Maximum 3 priority levels per section
2. Font weight → size → elevation → alignment → spacing must tell the SAME story
3. Left-align by default. Center only with explicit justification.
4. Vary container types: flush, inset, full-bleed, card, inline highlight, split. Cards for max 40% of sections.
5. Use modular type scale (Major Third 1.25 ratio: 48→36→28→22→18→16→14→12px)

**What gets locked:** Per-section hierarchy map. This map becomes the blueprint for CSS — every `font-size`, `font-weight`, `text-align`, `margin`, and `box-shadow` decision references it.

**Gate check:** If ANY section lacks a FIRST/SECOND/THIRD map, STOP. Complete the map before writing code.

---

### Step 2: Leading Questions (Sonnet)

**Socratic self-interrogation before touching pixels.** The designing agent argues with itself to sharpen the brief into visual direction.

**Questions to ask and answer:**

1. If I had to describe this brand as a physical space, what would it look like?
2. What's the ONE thing this page must communicate that no competitor does?
3. If I remove all color and imagery, does the typography alone convey the brand?
4. What's the most common mistake designs in this vertical make? How do I avoid it?
5. What would a user who HATES this product say? How does the design preemptively address their objection?

**Process:**

1. Answer each question in writing (minimum 2-3 sentences per answer)
2. Identify contradictions between answers
3. Resolve contradictions by choosing the stronger position
4. Extract 3-5 visual principles from the answers

**What gets locked:** Visual principles (e.g., "density signals competence," "whitespace signals premium," "serif signals authority").

**Output:** 5 answered questions + 3-5 extracted visual principles.

---

### Step 3: Visual Direction (Sonnet)

**5 opinionated options, kill 4.** Present visual directions from `knowledge/visual-directions.md` with provisional tokens. Pick ONE. No blending.

**Process:**

1. Load `knowledge/visual-directions.md`
2. Present all 5 directions with:
   - One-paragraph pitch tailored to the discovery brief
   - 3 reference brands
   - Risk assessment for this specific vertical
   - Provisional token preview (fonts, colors, shape, motion)
3. Score each direction against the brief's visual principles from Step 2
4. Recommend ONE direction with rationale
5. If autonomous, pick the strongest match. If interactive, present and wait.

**What gets killed:** 4 directions. Record why each was killed.
**What gets locked:** The surviving direction's philosophy, reference brands, and provisional tokens.

---

### Step 4: DFS Hero Component (Sonnet)

**Pick ONE component. Iterate to 100%. Document every decision.**

This is the core V3 change. Instead of designing all components at 85% (BFS), pick the single component that carries 60% of the page's emotional weight and perfect it.

**Process:**

1. Load `knowledge/dfs-methodology.md`
2. Identify the hero component based on ICP type:
   - Enterprise buyer → social proof / logo bar
   - Developer → code example / terminal demo
   - Consumer → hero headline + CTA
   - Investor → metrics dashboard
   - Creative → visual showcase
   - Finance → data table / chart
3. Iterate the hero component through ALL decisions:
   - Typography (size, weight, tracking, line-height)
   - Color (brand moment, surface, text contrast)
   - Spacing (padding, margins, gaps — on 4px grid)
   - Border radius (concentric rule applied)
   - Shadows (multi-layer, OKLCH colors)
   - Animation (hover, active, enter, exit)
   - States (default, hover, active, focus, disabled, loading, error, empty)
   - Responsive (mobile, tablet, desktop)
   - Micro-details (from `knowledge/micro-details.md`)
4. For EACH decision: try 3-5 options, pick one, kill the rest with reasons
5. Write the complete decision log

**What gets locked:** The hero component's complete specification.
**What gets killed:** All rejected alternatives for every decision.

**Output:** Decision log (see `knowledge/dfs-methodology.md` for format) + hero component code.

---

### Step 5: Decision Log (Sonnet)

**Document WHY, record killed alternatives.** This step formalizes the hero component's decisions into scalable rules.

**Process:**

1. Extract every decision from Step 4's iteration
2. For each decision, record:
   - The choice made (exact value)
   - 3+ alternatives tried
   - Why each alternative was killed
   - The rule extracted for scaling
3. Organize into categories: typography, color, spacing, shape, animation, micro-details

**What gets locked:** The complete decision log. This is the design system's constitution.

**Output:**

```markdown
## Decision Log

### Category: Shape

#### Border Radius: 8px (cards)

- Tried: 4px (too sharp), 6px (close, lacked warmth), 12px (bubbly), 16px (cartoon)
- Winner: 8px — professional warmth without consumer-app feel
- Scaling rule: cards=8px, buttons=6px, inputs=6px, modals=12px, tooltips=4px

### Category: Shadow

#### Elevation: 4-layer system

- Tried: 1-layer (flat), 2-layer (better but CGI), border+shadow (dated)
- Winner: 4-layer (outline + contact + ambient + far) using OKLCH
- Scaling rule: All elevated elements use the 4-layer token
```

---

### Step 6: Typography System (Sonnet)

**12-level scale, OKLCH-aware, negative tracking on headings.**

**Process:**

1. Load `knowledge/typography-systems.md`
2. Match vertical to recommended pairings (2-3 candidates)
3. Present candidates with the full 12-level scale
4. Select the pairing that best matches the visual direction
5. Lock EXACT values — no "approximately 14-16px" ranges
6. Apply tracking rules: negative on headings, positive on small text

**12-level scale:**

| Level   | Use            | Size    | Weight  | Tracking | Line-height |
| ------- | -------------- | ------- | ------- | -------- | ----------- |
| display | Hero headline  | 56-72px | 400-500 | -0.03em  | 1.05-1.1    |
| h1      | Page title     | 40-48px | 500-600 | -0.025em | 1.1-1.15    |
| h2      | Section title  | 30-36px | 500-600 | -0.02em  | 1.15-1.2    |
| h3      | Card title     | 24-28px | 500-600 | -0.01em  | 1.2-1.25    |
| body    | Main text      | 16px    | 400     | 0em      | 1.5-1.6     |
| bodySm  | Secondary text | 14px    | 400     | 0.01em   | 1.5         |
| caption | Metadata       | 12px    | 400-500 | 0.02em   | 1.4         |
| label   | Form labels    | 12px    | 500-600 | 0.04em   | 1.3         |
| monoLg  | Code blocks    | 15px    | 400     | 0em      | 1.6         |
| monoMd  | Inline code    | 14px    | 400     | 0em      | inherit     |
| monoSm  | Terminal       | 13px    | 400     | 0em      | 1.5         |
| monoXs  | Badges/tags    | 11px    | 500     | 0.02em   | 1.3         |

**What gets locked:** Complete 12-level scale with exact values + font loading code.

---

### Step 7: Color System (Sonnet)

**OKLCH palette, enforcement rules, ONE brand moment per page.**

V3 replaces hex/HSL with OKLCH for perceptually uniform color. See `knowledge/oklch-color-system.md`.

**Process:**

1. Load `knowledge/oklch-color-system.md` and `knowledge/color-theory.md`
2. Define brand color in OKLCH: `oklch(L% C H)` — anchor at the 500 shade
3. Generate 11-shade scale using the OKLCH generator (keep H+C constant, vary L)
4. Define surface elevation system in OKLCH
5. Validate contrast using OKLCH L-difference (body text: 60%+ L difference)
6. Define enforcement rules:
   - ONE brand-colored moment per page (not per viewport — per PAGE)
   - Brand color budget: max 3 elements per viewport
   - Never use brand accent for success states (green reserved)
   - Dark mode: flip L values (+25%), keep H+C identical

**What gets locked:** Full OKLCH palette + surface system + enforcement rules.

**Output:** TypeScript tokens with OKLCH values.

---

### Step 8: Shape Language (Sonnet)

**4px base, concentric radius, multi-layer shadows.**

**Process:**

1. Load `knowledge/layout-patterns.md` + `knowledge/micro-details.md`
2. Apply visual direction's shape preferences
3. Lock radius per element type (concentric rule: outer = inner + padding)
4. Define 4-layer shadow hierarchy using OKLCH
5. Generate complete spacing scale (4px base, 12 values: 4-96px)

**Shadow hierarchy (OKLCH):**

```css
--shadow-sm: 0 0 0 1px oklch(20% 0.01 60 / 0.3), 0 1px 2px oklch(0% 0 0 / 0.15);
--shadow-md:
  0 0 0 1px oklch(20% 0.01 60 / 0.3), 0 1px 2px oklch(0% 0 0 / 0.1),
  0 4px 8px oklch(0% 0 0 / 0.08);
--shadow-lg:
  0 0 0 1px oklch(20% 0.01 60 / 0.3), 0 1px 2px oklch(0% 0 0 / 0.1),
  0 4px 8px oklch(0% 0 0 / 0.08), 0 12px 24px oklch(0% 0 0 / 0.05);
--shadow-glow: 0 0 40px
  oklch(var(--brand-H) var(--brand-C) var(--brand-L) / 0.08);
```

**What gets locked:** All shape values — radius, borders, shadows, spacing.

---

### Step 9: Component Scaling (Sonnet)

**Scale the hero component's decisions to ALL variants.**

This is where DFS pays off. The hero component's decision log becomes the system.

**Process:**

1. List all remaining components needed (from discovery brief)
2. For each component, apply the hero's extracted rules:
   - Radius from decision log
   - Shadow from decision log
   - Animation timing from decision log
   - Typography level from scale
   - Color application from enforcement rules
3. Verify each component against the decision log's rules
4. Document any component-specific exceptions (with reasons)
5. Apply micro-details from `knowledge/micro-details.md`:
   - text-wrap: balance on headings
   - tabular-nums on numbers
   - Concentric border radius on nested elements
   - Multi-layer shadows on elevated elements
   - Image outlines on dark backgrounds
   - Stagger animations on groups

**What gets locked:** Component manifest with token application spec.

---

### Step 10: Page Composition (Sonnet)

**Emotional arc, background rhythm, max-w-2xl for text.**

**Process:**

1. Load `knowledge/page-composition.md`
2. Map sections to 6-beat emotional arc:
   - Recognition (hero) → Awe (social proof) → Trust (features) → Continuity (testimonials) → Conviction (pricing) → Action (CTA)
3. Apply section cutting rules:
   - Restates hero → CUT
   - No data → CUT or add metrics
   - Breaks arc order → MOVE or CUT
   - Could be a tooltip → MERGE
4. Assign background rhythm (alternating transparent + muted)
5. Designate the ONE brand moment section
6. Set content widths: text=max-w-2xl, grids=max-w-5xl, layout=max-w-7xl
7. Define scroll animations: `opacity 0→1, y 16→0, 0.4s, ease-out, stagger 0.06s`

**What gets locked:** Section list, beat mapping, spatial composition.

---

### Step 11: 12-Dimension Audit (Binary Pass/Fail)

**Replace vague scoring with binary pass/fail on specific metrics.**

Each dimension is PASS or FAIL with a SPECIFIC measurement. No "7/10." No "could be better." Either it meets the bar or it doesn't, and if it fails, the FIX is explicit.

See `council/scoring-rubric.md` for the complete 12-dimension rubric.

**Process:**

1. Load `council/scoring-rubric.md`
2. Evaluate the output against all 12 dimensions
3. For each FAIL: document the specific violation and the exact fix
4. If 3+ dimensions fail: go back to the failing step and re-iterate
5. If 0-2 dimensions fail: apply fixes and ship

**Ship criteria:** 10+ PASS out of 12 dimensions. Zero red flags.

---

## Knowledge Base

| File                                | Purpose                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `knowledge/visual-directions.md`    | 5 opinionated visual directions with provisional tokens                |
| `knowledge/typography-systems.md`   | 15 type pairings with full 12-level scales                             |
| `knowledge/color-theory.md`         | Color psychology, signal rules, enforcement, dark mode                 |
| `knowledge/oklch-color-system.md`   | **V3** OKLCH palette generation, dark mode flipping, contrast checking |
| `knowledge/micro-details.md`        | **V3** 12 jakub.kr micro-details that separate premium from generic    |
| `knowledge/dfs-methodology.md`      | **V3** Depth-first design: hero to 100%, then scale                    |
| `knowledge/layout-patterns.md`      | 4px grid, shape language, bento grids, content widths                  |
| `knowledge/page-composition.md`     | Emotional arc, background rhythm, scroll animations                    |
| `knowledge/anti-patterns.md`        | 26-pattern diagnostic checklist with remediations                      |
| `knowledge/ux-principles.md`        | Design heuristics for agent interfaces                                 |
| `knowledge/animation-philosophy.md` | Motion design principles and timing specs                              |

## Vertical Profiles

| File                      | Domain                               |
| ------------------------- | ------------------------------------ |
| `verticals/fintech.md`    | Financial services, trading, banking |
| `verticals/health.md`     | Healthcare, wellness, fitness        |
| `verticals/creative.md`   | Creator tools, design, music, video  |
| `verticals/devtools.md`   | Developer tools, CLIs, IDEs, APIs    |
| `verticals/consumer.md`   | Consumer apps, social, lifestyle     |
| `verticals/enterprise.md` | B2B SaaS, admin panels, CRMs         |
| `verticals/education.md`  | EdTech, LMS, learning platforms      |
| `verticals/ecommerce.md`  | Retail, marketplaces, storefronts    |

## Integration Points

- **Energy design rules** (`.claude/rules/design.md`): Warm black, Instrument Serif + Poppins, bento grids, shadcn + 21st.dev
- **Agent UX spec** (`docs/design/AGENT-UX-DESIGN-SYSTEM.md`): State machine, tool timeline, generative UI cards
- **React patterns** (`.claude/rules/react.md`): RSC, Tailwind, shadcn/ui, Zustand
- **Anti-pattern enforcement** (`knowledge/anti-patterns.md`): 26-pattern checklist, must score 0-2 to ship

## Quick Start

```bash
# Full V3 pipeline for a fintech dashboard
# Invoke: /design-systems
# Input: "Build a portfolio analytics dashboard for institutional investors"
# → Discovery brief (GATE) → Leading questions → Visual direction → DFS hero →
#   Decision log → Typography → Color (OKLCH) → Shape → Scaling → Composition → Audit

# Quick audit of an existing design
# Load council/scoring-rubric.md → 12-dimension binary pass/fail → Fix failures

# Generate OKLCH palette for a brand color
# Load knowledge/oklch-color-system.md → generateScale(hue, chroma) → tokens
```
