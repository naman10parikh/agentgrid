# Pipeline: Full Landing Page Design

Complete pipeline from "I need a landing page for X" to production-ready design specification with theme-tokens.json, component manifest, and responsive annotations.

---

## Pipeline Overview

```
1. Brief + Vertical Detection
2. Hero Section (3 variants)
3. Feature Section (bento / timeline / comparison)
4. Social Proof (testimonials / logos / metrics)
5. Pricing Section (if applicable)
6. CTA Placement Strategy
7. Footer Design
8. theme-tokens.json Output
9. Component Manifest
10. Responsive Breakpoint Annotations
```

---

## Step 1: Brief Extraction + Vertical Detection

### Prompt Template

```
Analyze this landing page request and produce a structured brief:

REQUEST: "{user's input}"

Extract:
- PRODUCT NAME: What is being launched
- ONE-LINE VALUE PROP: The core promise in <10 words
- VERTICAL: Auto-detect industry (SaaS, AI/ML, healthcare, fintech, creative, e-commerce, education, etc.)
- TARGET AUDIENCE: Primary user persona (technical level, age range, intent)
- KEY FEATURES: 3-6 features to highlight (from request or inferred)
- CONVERSION GOAL: What should the visitor do? (sign up, buy, download, join waitlist, book demo)
- COMPETITORS: If mentioned, note for differentiation
- BRAND ASSETS: Existing BRAND.md, logo, colors (or "none — generate")
- CONTENT AVAILABLE: Testimonials, metrics, logos, case studies (or "generate placeholders")

VERTICAL DNA (auto-load):
{Load vertical profile from design-systems/verticals/ if available}

Output as structured spec for the remaining pipeline steps.
```

---

## Step 2: Hero Section Design (3 Variants)

Generate 3 hero approaches. The council will score them via the iteration protocol.

### Variant A: Centered Hero

```
Prompt: Generate a centered hero section for "{PRODUCT}".

Structure:
+================================================================+
|                                                                  |
|                    [BADGE] "New: Feature X"                     |
|                                                                  |
|               [HEADLINE — Display, 48-64px]                     |
|               {One-line value prop, max 8 words}                |
|                                                                  |
|               [SUBHEADLINE — Body, 18-20px]                     |
|               {2-line expansion, max 25 words}                  |
|                                                                  |
|          >>> [PRIMARY CTA] <<<    [SECONDARY CTA]               |
|                                                                  |
|               [HERO IMAGE / PRODUCT SCREENSHOT]                 |
|               {Asymmetric frame, soft shadow}                   |
|                                                                  |
+------------------------------------------------------------------+

Specifications:
- Headline: Instrument Serif, 48-64px, font-weight 400, text-primary
- Subheadline: Poppins, 18-20px, font-weight 400, text-secondary
- Badge: Poppins 12px, brand-500/10 bg, brand-400 text, rounded-full, px-3 py-1
- Primary CTA: brand-500 bg, white text, rounded-lg, px-6 py-3, hover:brand-600
- Secondary CTA: ghost, text-secondary, hover:text-primary, underline
- Image: rounded-xl, shadow-2xl, border border-white/[0.06], max-w-4xl
- Section: min-h-[90vh], flex items-center justify-center, py-24
- Background: --bg-primary (#141312) with optional radial gradient (brand-500/5 center)
```

### Variant B: Split Hero

```
Prompt: Generate a split hero section for "{PRODUCT}".

Structure:
+================================================================+
|                                                                  |
|  +-------- 50% --------+  +--------- 50% ---------+            |
|  |                      |  |                        |            |
|  | [HEADLINE]           |  | [HERO IMAGE]           |            |
|  | Display, 48px        |  | Product screenshot     |            |
|  |                      |  | or illustration        |            |
|  | [SUBHEADLINE]        |  | Bleeds to right edge   |            |
|  | Body, 18px           |  |                        |            |
|  |                      |  |                        |            |
|  | >>> [CTA] <<<        |  |                        |            |
|  | [TRUST METRIC]       |  |                        |            |
|  | "10K+ users"         |  |                        |            |
|  +----------------------+  +------------------------+            |
|                                                                  |
+------------------------------------------------------------------+

Specifications:
- Left panel: max-w-lg, pr-16
- Right panel: relative, image extends past right padding
- Trust metric: flex items-center gap-2, avatar stack + text-sm text-secondary
- Mobile: stack vertically, text first, image second (full width)
```

### Variant C: Asymmetric Hero

```
Prompt: Generate an asymmetric editorial hero for "{PRODUCT}".

Structure:
+================================================================+
|                                                                  |
|  +----------- 60% -----------+  +------ 40% ------+            |
|  |                            |  |                  |            |
|  | [OVERLINE]                 |  | [FLOATING CARD]  |            |
|  | Category / vertical        |  | Live demo or     |            |
|  |                            |  | key metric       |            |
|  | [HEADLINE]                 |  |                  |            |
|  | Display, 56px              |  | Rotated 2deg     |            |
|  | Line breaks at rhythm      |  | shadow-2xl       |            |
|  |                            |  |                  |            |
|  | [SUBHEADLINE]              |  +------------------+            |
|  |                            |                                  |
|  | >>> [CTA] <<<  [LINK →]   |                                  |
|  +----------------------------+                                  |
|                                                                  |
|  [LOGO BAR] "Trusted by:" [logo] [logo] [logo] [logo]          |
|                                                                  |
+------------------------------------------------------------------+

Specifications:
- Overline: Poppins 12px uppercase tracking-widest text-brand-400
- Floating card: bg-surface, rounded-xl, p-6, shadow-2xl, transform rotate-2
- Logo bar: grayscale logos, opacity-50, hover:opacity-100, flex gap-8
- Asymmetry: 60/40 split, card offset from grid
```

---

## Step 3: Feature Section Design

Choose based on number of features and vertical:

### Option A: Bento Grid (Recommended for 4-6 features)

```
+================================================================+
|  [SECTION HEADING] "Why {PRODUCT}"                              |
|                                                                  |
|  +---- 2/3 ----+  +-- 1/3 --+                                  |
|  |              |  |          |                                  |
|  | [FEATURE_1]  |  | [FEAT_2] |                                  |
|  | Large card   |  | Small    |                                  |
|  | with visual  |  |          |                                  |
|  +--------------+  +----------+                                  |
|                                                                  |
|  +-- 1/3 --+  +-- 1/3 --+  +-- 1/3 --+                        |
|  |          |  |          |  |          |                        |
|  | [FEAT_3] |  | [FEAT_4] |  | [FEAT_5] |                        |
|  |          |  |          |  |          |                        |
|  +----------+  +----------+  +----------+                        |
+------------------------------------------------------------------+

Card spec:
- Background: bg-white/[0.03], hover:bg-white/[0.06]
- Border: border border-white/[0.06]
- Padding: p-6 (24px)
- Border radius: rounded-xl
- Icon: Lucide icon in brand-400, 24x24
- Title: Poppins 18px semibold
- Description: Poppins 14px text-secondary, max 2 lines
- Large card: includes illustration or screenshot
```

### Option B: Staggered Timeline (3-5 features, process-oriented)

```
+================================================================+
|  [SECTION HEADING] "How it works"                               |
|                                                                  |
|  01 ─── [FEATURE_1] ──────────── [IMAGE_1]                     |
|          Title + description       Visual                        |
|                                                                  |
|          [IMAGE_2] ──────────── [FEATURE_2] ─── 02              |
|          Visual                  Title + description             |
|                                                                  |
|  03 ─── [FEATURE_3] ──────────── [IMAGE_3]                     |
|          Title + description       Visual                        |
+------------------------------------------------------------------+

Alternating left/right layout for visual rhythm.
Vertical line connecting steps.
```

### Option C: Comparison Grid (2-3 features, "before/after" or "with/without")

```
+================================================================+
|  [SECTION HEADING] "Before {PRODUCT} vs. After"                 |
|                                                                  |
|  +------- Before -------+  +------- After --------+            |
|  | [PAIN_1] x            |  | [SOLUTION_1] check   |            |
|  | [PAIN_2] x            |  | [SOLUTION_2] check   |            |
|  | [PAIN_3] x            |  | [SOLUTION_3] check   |            |
|  | text-red-400          |  | text-emerald-400     |            |
|  +-----------------------+  +----------------------+            |
+------------------------------------------------------------------+
```

---

## Step 4: Social Proof Section

### Testimonials (if available)

```
+================================================================+
|  [SECTION HEADING] "What people are saying"                     |
|                                                                  |
|  +---- Card 1 ----+  +---- Card 2 ----+  +---- Card 3 ----+   |
|  | "Quote text..." |  | "Quote text..." |  | "Quote text..." |   |
|  |                 |  |                 |  |                 |   |
|  | [Avatar] Name   |  | [Avatar] Name   |  | [Avatar] Name   |   |
|  | Title, Company  |  | Title, Company  |  | Title, Company  |   |
|  +-----------------+  +-----------------+  +-----------------+   |
+------------------------------------------------------------------+

Card spec:
- Background: bg-white/[0.02]
- Border: border border-white/[0.06]
- Quote: Poppins 16px italic text-primary
- Name: Poppins 14px semibold
- Title: Poppins 12px text-secondary
- Avatar: 40x40 rounded-full
```

### Logo Bar (if companies known)

```
+================================================================+
| "Trusted by teams at"                                           |
| [logo] [logo] [logo] [logo] [logo] [logo]                     |
+------------------------------------------------------------------+

Spec: grayscale, opacity-40, hover:opacity-100, transition-opacity 200ms
Mobile: horizontal scroll or 2-row grid
```

### Metrics Bar (always available — generate if needed)

```
+================================================================+
|  [10K+]          [42%]           [150ms]         [99.9%]        |
|  Active users    Performance     Cold start       Uptime        |
|                  improvement                                     |
+------------------------------------------------------------------+

Spec:
- Number: Display, 32px, text-primary
- Label: Poppins 14px, text-secondary
- Layout: 4-col grid, gap-8, text-center
- Mobile: 2x2 grid
```

---

## Step 5: Pricing Section (If Applicable)

### Prompt Template

```
Generate a pricing section for "{PRODUCT}" with {N} tiers.

PRICING DATA: {tiers from brief, or generate sensible defaults}

Structure:
+================================================================+
|  [SECTION HEADING] "Simple pricing"                             |
|  [TOGGLE] Monthly / Annual (save 20%)                          |
|                                                                  |
|  +--- Free ---+  +-- Pro (popular) --+  +--- Enterprise ---+   |
|  | $0/mo      |  | $29/mo            |  | Custom            |   |
|  |            |  | >>> Start <<<     |  |                   |   |
|  | feature 1  |  | Everything in Free|  | Everything in Pro |   |
|  | feature 2  |  | + feature 3       |  | + feature 5       |   |
|  |            |  | + feature 4       |  | + feature 6       |   |
|  | [Start]    |  |                   |  | [Contact Sales]   |   |
|  +------------+  +-------------------+  +-------------------+   |
+------------------------------------------------------------------+

Popular tier:
- border-brand-500 (2px)
- "Most Popular" badge: bg-brand-500/10, text-brand-400, rounded-full
- Scale: scale-105 or shadow-xl for visual emphasis
```

---

## Step 6: CTA Placement Strategy

### Prompt Template

```
Define the CTA placement strategy for this landing page.

CONVERSION GOAL: {from brief — sign up, buy, download, waitlist, book demo}

CTA PLACEMENT RULES:
1. PRIMARY CTA in hero (above the fold — always)
2. SECONDARY CTA after features section (user has seen value)
3. FINAL CTA before footer (last chance)
4. STICKY CTA on mobile (bottom bar, appears after scrolling past hero)
5. INLINE CTAs within feature cards for specific feature-driven conversions

CTA VARIANTS:
- Primary: brand-500 bg, white text, rounded-lg, px-6 py-3, shadow-lg
- Secondary: ghost border, text-primary, hover:bg-white/[0.06]
- Inline: text-brand-400, underline, hover:text-brand-300
- Sticky mobile: fixed bottom-0, w-full, bg-surface/80 backdrop-blur-md, py-3, z-50

CTA COPY RULES:
- Action verb + value ("Start building" not "Sign up")
- Max 3 words for primary ("Get Started", "Try Free", "Start Building")
- Max 5 words for secondary ("See how it works", "View pricing")
- No "Submit", "Click here", "Learn more" — these are anti-conversion
```

---

## Step 7: Footer Design

### Prompt Template

```
Generate footer design for "{PRODUCT}".

Structure:
+================================================================+
|  +---- Brand ----+  +-- Product --+  +-- Company --+  +- Legal -+ |
|  | [LOGO]        |  | Features    |  | About       |  | Privacy  | |
|  | Tagline       |  | Pricing     |  | Blog        |  | Terms    | |
|  | [Social icons]|  | Docs        |  | Careers     |  | Contact  | |
|  |               |  | Changelog   |  | Press       |  |          | |
|  +---------------+  +-------------+  +-------------+  +----------+ |
|                                                                     |
|  -----------------------------------------------------------       |
|  (c) 2026 {Company}. All rights reserved.                          |
+---------------------------------------------------------------------+

Spec:
- Background: bg-[#0a0a0a] (darker than main bg for separation)
- Border top: border-t border-white/[0.06]
- Padding: py-16 px-8
- Columns: 4-col on desktop, 2x2 on tablet, stack on mobile
- Social icons: Lucide icons, 20x20, text-secondary, hover:text-primary
- Copyright: Poppins 12px text-muted
```

---

## Step 8: theme-tokens.json Output

### Prompt Template

```
Generate the complete theme-tokens.json for this landing page design.

Based on all design decisions made in steps 1-7, output:

{
  "name": "{PRODUCT}",
  "colors": {
    "brand": {
      "50": "#...", "100": "#...", "200": "#...", "300": "#...",
      "400": "#...", "500": "#...", "600": "#...", "700": "#...",
      "800": "#...", "900": "#...", "950": "#..."
    },
    "surface": {
      "primary": "#141312",
      "secondary": "#0a0a0a",
      "card": "rgba(255,255,255,0.03)",
      "cardHover": "rgba(255,255,255,0.06)",
      "border": "rgba(255,255,255,0.06)",
      "borderActive": "rgba({brand-rgb},0.3)"
    },
    "text": {
      "primary": "#e5e5e5",
      "secondary": "#a3a3a3",
      "muted": "rgba(255,255,255,0.3)",
      "brand": "{brand-400}"
    },
    "semantic": {
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6"
    }
  },
  "typography": {
    "display": { "family": "{serif}", "weight": 400, "lineHeight": 1.2 },
    "heading": { "family": "{sans}", "weight": 600, "lineHeight": 1.3 },
    "body": { "family": "{sans}", "weight": 400, "lineHeight": 1.6 },
    "code": { "family": "{mono}", "weight": 400, "lineHeight": 1.5 }
  },
  "spacing": {
    "sectionGap": "80px",
    "componentGap": "32px",
    "elementGap": "16px",
    "cardPadding": "24px"
  },
  "borderRadius": {
    "sm": "6px", "md": "8px", "lg": "12px", "xl": "16px", "2xl": "20px", "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px rgba(0,0,0,0.3)",
    "md": "0 4px 6px rgba(0,0,0,0.3)",
    "lg": "0 10px 15px rgba(0,0,0,0.3)",
    "xl": "0 20px 25px rgba(0,0,0,0.3)",
    "2xl": "0 25px 50px rgba(0,0,0,0.4)"
  }
}
```

---

## Step 9: Component Manifest

### Prompt Template

```
List every component needed for this landing page, categorized by source.

FORMAT:
## shadcn/ui (base layer)
- Button (primary, secondary, ghost variants)
- Badge (for pricing "popular" tag, hero announcement)
- Toggle (for pricing monthly/annual)
- Card (for features, testimonials)
- Separator (for footer)
- NavigationMenu (for navbar)

## 21st.dev (elevated layer)
- AnimatedBeam (for hero background)
- BentoGrid (for feature section)
- Marquee (for logo bar)
- NumberTicker (for metrics animation)
- ShinyButton (for primary CTA)

## Custom Components (build these)
- HeroSection — {variant A/B/C} with specific layout
- FeatureCard — icon + title + description + optional visual
- TestimonialCard — quote + avatar + name + title
- PricingCard — tier + price + features + CTA
- StickyMobileCTA — fixed bottom CTA bar
- MetricsBar — animated counter + label

For each custom component, note:
- Props interface
- States (default, hover, loading, mobile)
- Accessibility requirements
- Animation on scroll-in (IntersectionObserver)
```

---

## Step 10: Responsive Breakpoint Annotations

### Prompt Template

```
Document the responsive behavior at each breakpoint for every section.

BREAKPOINTS:
- 320px (small mobile)
- 375px (standard mobile)
- 768px (tablet)
- 1024px (small desktop)
- 1440px (standard desktop)
- 1920px (large desktop)

FORMAT per section:

### Hero Section
| Property     | 320-767px          | 768-1023px         | 1024-1439px        | 1440px+            |
| ------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| Layout       | Stack, text-center | Stack, text-left   | Split 50/50        | Split 55/45        |
| Headline     | 32px               | 40px               | 48px               | 56px               |
| CTA          | Full width, sticky | Full width         | Inline, auto-width | Inline, auto-width |
| Image        | Hidden or below    | Below text, 100%   | Right panel        | Right panel, bleed |
| Padding      | px-4 py-16         | px-8 py-20         | px-12 py-24        | px-16 py-32        |

Cover every section. Flag any components that HIDE at certain breakpoints.
Note any mobile-specific additions (hamburger menu, sticky CTA, bottom sheets).
```

---

## Output Package

The complete landing page pipeline produces:

```
1. landing-page-spec.md          — Full design specification (all 10 steps)
2. theme-tokens.json             — Complete token file for Tailwind
3. component-manifest.md         — Every component with source and props
4. responsive-annotations.md     — Breakpoint behavior for every section
5. hero-variants/                — 3 hero approaches for council review
6. wireframe-desktop.txt         — ASCII wireframe at 1440px
7. wireframe-mobile.txt          — ASCII wireframe at 375px
```

### Council Integration

After generating the full spec, submit to the Design Council (council/personas.md) via the iteration protocol (council/iteration-protocol.md). The landing page must score 38+/50 before shipping.
