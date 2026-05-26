# Pipeline: Brief to Wireframe

Generate annotated wireframes from structured design briefs. Outputs ASCII wireframes with component names, typography scale, color tokens, spacing values, and responsive variants.

---

## Pipeline Steps

```
1. Parse Brief → 2. Load Vertical DNA → 3. Select Layout → 4. Generate ASCII Wireframe
                                                                      ↓
                                              5. Annotate with Tokens → 6. Mobile Variant
```

---

## Step 1: Parse Structured Brief

Extract the core parameters from the user's request.

### Prompt Template

````
Parse the following design request into a structured brief:

REQUEST: "{user's request}"

Extract these fields (infer from context if not explicitly stated):

1. VERTICAL: The industry/domain (e.g., healthcare, fintech, dating, creative, e-commerce)
2. AUDIENCE: Who will use this (e.g., developers, consumers, enterprise teams)
3. PURPOSE: What the page/component does (e.g., convert visitors, onboard users, display data)
4. FEATURES: Key sections or capabilities to showcase (list 3-7)
5. TONE: Emotional register (e.g., professional, playful, premium, minimal, bold)
6. LAYOUT TYPE: One of: landing-page | dashboard | chat | tool-picker | settings | auth | pricing
7. BRAND CONTEXT: Any existing BRAND.md, colors, fonts (or "generate new")
8. RESPONSIVE PRIORITY: mobile-first | desktop-first | equal

Output as structured YAML:
```yaml
vertical: ""
audience: ""
purpose: ""
features:
  - ""
tone: ""
layout_type: ""
brand_context: ""
responsive_priority: ""
````

```

---

## Step 2: Load Vertical DNA Profile

If the design-systems skill has a vertical profile for the detected vertical, load it. Otherwise, generate a lightweight profile.

### Prompt Template

```

For the vertical "{VERTICAL}", define the design DNA:

1. TYPOGRAPHY TENDENCY: serif-heavy | sans-heavy | mixed-editorial | monospace-accent
2. COLOR TEMPERATURE: warm | cool | neutral | high-contrast
3. SPACING DENSITY: airy (80-120px sections) | balanced (48-80px) | dense (24-48px)
4. LAYOUT TENDENCY: centered | asymmetric | grid-heavy | full-bleed
5. TRUST SIGNALS: What builds trust in this vertical?
   (e.g., healthcare: certifications, clean lines, generous whitespace)
6. ANTI-PATTERNS: What visual cues signal "untrustworthy" in this vertical?
   (e.g., fintech: playful fonts, bright saturated colors, emoji)

Output as vertical DNA object.

```

---

## Step 3: Select Layout Paradigm

Map the layout type to a structural template.

### Layout Templates

**Landing Page:**
```

HERO (100vh) → SOCIAL PROOF (logos/metrics) → FEATURES (bento grid) →
HOW IT WORKS (timeline) → TESTIMONIALS → PRICING → CTA → FOOTER

```

**Dashboard:**
```

SIDEBAR (240px) + MAIN AREA:
HEADER (stats row) → CONTENT GRID (cards) → DETAIL PANEL (slide-over)

```

**Chat Interface:**
```

CONVERSATION PANEL (40%) + WORKSPACE PANEL (60%)
Chat: message list + input bar
Workspace: live view / results / canvas

```

**Tool Picker:**
```

HEADER (search + filters) → GRID (tool cards, 3-col bento) →
DETAIL (slide-over with preview + actions)

```

**Settings:**
```

SIDEBAR (nav sections) + MAIN:
SECTION HEADER → FORM GROUPS (card-based) → SAVE BAR (sticky bottom)

```

**Auth:**
```

SPLIT: BRAND PANEL (40%, gradient + logo + tagline) + FORM PANEL (60%):
LOGO → HEADING → FORM → SOCIAL LOGIN → FOOTER LINKS

```

**Pricing:**
```

HEADER (toggle monthly/annual) → PLAN CARDS (3-col, middle highlighted) →
FEATURE COMPARISON TABLE → FAQ → CTA

```

---

## Step 4: Generate ASCII Wireframe

### Prompt Template

```

Generate a detailed ASCII wireframe for this design:

BRIEF:
{YAML from step 1}

VERTICAL DNA:
{Output from step 2}

LAYOUT PARADIGM:
{Template from step 3}

ENERGY DESIGN RULES:

- Background: warm black (#141312)
- Asymmetric > symmetric (bento grids, varied card sizes)
- Serif display font + sans-serif body (anti-AI-look)
- No symmetric card grids
- Dark mode default

WIREFRAME REQUIREMENTS:

- Use box drawing characters (+-|) for structure
- Label every section with [COMPONENT_NAME]
- Show approximate proportions (percentage widths)
- Mark primary CTA with >>> CTA <<<
- Show hierarchy with indentation
- Include approximate heights in vh or px
- Mark responsive breakpoints with comments

Generate the wireframe at 1440px viewport width.

Example format:
+================================================================+
| [NAV_BAR] h:64px |
| LOGO [nav items...] >>> Sign Up <<< |
+================================================================+
| |
| [HERO_SECTION] h:90vh |
| |
| +------ 55% ------+ +-------- 45% --------+ |
| | | | | |
| | [HERO_HEADLINE] | | [HERO_IMAGE] | |
| | Display/48px | | Asymmetric, bleeds | |
| | | | to right edge | |
| | [HERO_SUBTEXT] | | | |
| | Body/16px | | | |
| | | | | |
| | >>> Get Started <<<| | | |
| +------------------+ +----------------------+ |
| |
+------------------------------------------------------------------+

```

---

## Step 5: Annotate with Design Tokens

Add concrete design values to every element in the wireframe.

### Prompt Template

```

Annotate the following wireframe with specific design tokens.

WIREFRAME:
{ASCII wireframe from step 4}

BRAND CONTEXT:
{BRAND.md content or "generate defaults"}

For EVERY labeled component, specify:

1. TYPOGRAPHY: font-family, font-size, font-weight, line-height, color token
2. COLORS: background, text, border (use CSS variable names from the design system)
3. SPACING: padding, margin, gap (use 8px grid units: 8, 16, 24, 32, 48, 64, 80, 96, 120)
4. DIMENSIONS: width (%, px, or max-w), height (px, vh, auto)
5. EFFECTS: border-radius, shadow, backdrop-blur, opacity

Output format (one block per component):

### [COMPONENT_NAME]

- **Type:** {Display 48px / Instrument Serif / 400 / 1.2 / text-primary}
- **Background:** {--bg-primary | --bg-surface | brand-500/10}
- **Spacing:** {p-8 (32px) | mt-16 (64px) | gap-6 (24px)}
- **Dimensions:** {w-full max-w-7xl | h-[90vh]}
- **Effects:** {rounded-2xl | shadow-lg | backdrop-blur-md}
- **Border:** {border border-white/[0.06]}

Include the full token reference at the bottom:

- Color tokens → hex values
- Spacing scale → px values
- Type scale → px + weight + family

```

---

## Step 6: Mobile Wireframe Variant

Generate the mobile (375px) version showing how the desktop layout adapts.

### Prompt Template

```

Generate the mobile wireframe (375px viewport) for this design.

DESKTOP WIREFRAME:
{Annotated wireframe from step 5}

RESPONSIVE RULES:

- Bento grids collapse to single column (largest card first)
- Navigation collapses to hamburger menu
- Hero splits stack vertically (text above image)
- CTAs become full-width or sticky bottom bar
- Side panels become bottom sheets or separate pages
- Touch targets minimum 44x44px
- Font sizes may decrease by 1 step (but body never below 14px)
- Section spacing decreases by ~33% (80px → 56px, 64px → 40px)

Show the mobile wireframe with:

1. Same box-drawing format
2. All components labeled
3. Any NEW mobile-specific components (hamburger, sticky CTA, bottom sheet)
4. Touch target annotations for interactive elements
5. Scroll depth estimate (how many "screens" of content)

Also note any components that HIDE on mobile vs just reflow.

```

---

## Output Package

The complete wireframe pipeline produces:

```

1. wireframe-desktop.txt — Annotated ASCII wireframe at 1440px
2. wireframe-mobile.txt — Annotated ASCII wireframe at 375px
3. token-annotations.md — Full token reference for every component
4. component-list.md — Which shadcn/21st.dev components to use
5. responsive-notes.md — Breakpoint behavior at 320/768/1024/1440px

```

### Handoff to Next Pipeline

The wireframe output feeds directly into:
- `landing-page.md` — Full landing page design pipeline (wireframe = step 1)
- `component-design.md` — Individual component specifications
- `brand-generation.md` — If "generate new" was selected for brand context
```
