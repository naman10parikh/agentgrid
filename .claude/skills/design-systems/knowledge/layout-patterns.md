# Layout Patterns

Grid systems, whitespace strategy, visual hierarchy formulas, responsive breakpoints, shape language, and page-level composition patterns.

## The 4px Base Grid

All spacing derives from a base unit of 4px. This creates tighter, more precise control than the common 8px grid while still producing consistent rhythm.

**Why 4px, not 8px?** The 8px grid is the industry default (Material Design, etc.). But 4px gives finer control for dense UIs (dashboards, data tables) without losing consistency. Stripe, Linear, and Vercel all use 4px internally. You can still hit 8, 16, 24, etc. — but you also get 4, 12, 20 when you need tighter spacing.

**Spacing Scale:**

| Token      | Value | Tailwind | Usage                                    |
| ---------- | ----- | -------- | ---------------------------------------- |
| `space-1`  | 4px   | `p-1`    | Tight gaps (icon + label, badge padding) |
| `space-2`  | 8px   | `p-2`    | Inline element spacing, tight padding    |
| `space-3`  | 12px  | `p-3`    | Input padding, small card gaps           |
| `space-4`  | 16px  | `p-4`    | Standard component padding               |
| `space-5`  | 20px  | `p-5`    | Comfortable card padding                 |
| `space-6`  | 24px  | `p-6`    | Section gaps, generous card padding      |
| `space-8`  | 32px  | `p-8`    | Major component gaps                     |
| `space-10` | 40px  | `p-10`   | Section transitions                      |
| `space-12` | 48px  | `p-12`   | Section spacing                          |
| `space-16` | 64px  | `p-16`   | Page section breaks                      |
| `space-20` | 80px  | `p-20`   | Hero breathing room                      |
| `space-24` | 96px  | `p-24`   | Major landmarks                          |

**Rule:** If you need a value not on the scale, your design has an alignment issue. Exceptions: 1px (borders), 2px (focus rings, dividers).

## Shape Language

The shape of UI elements communicates brand personality. These are locked values — never freestyle.

### Border Radius

| Element        | Radius | Tailwind       | Why                                                   |
| -------------- | ------ | -------------- | ----------------------------------------------------- |
| Buttons        | 6px    | `rounded-md`   | Stripe sweet spot — not pill (12px+), not sharp (2px) |
| Cards          | 6px    | `rounded-md`   | Matches buttons — consistent language                 |
| Inputs         | 6px    | `rounded-md`   | Matches everything else                               |
| Modals/Dialogs | 8px    | `rounded-lg`   | Slightly softer for overlay elements                  |
| Avatars        | 9999px | `rounded-full` | Always circular                                       |
| Badges/Pills   | 9999px | `rounded-full` | Always pill-shaped                                    |
| Tooltips       | 4px    | `rounded`      | Tight, unobtrusive                                    |

**Why 6px, not 12px?** 12px+ radius looks "bubbly" and "app-like" — it signals consumer/casual. 6px is the sweet spot used by Stripe, Linear, and Vercel. It's rounded enough to feel modern, sharp enough to feel professional.

```tsx
// BAD: Bubbly, consumer-app feel
<Card className="rounded-2xl">      // 16px radius
<Button className="rounded-full">   // pill button

// GOOD: Professional, considered
<Card className="rounded-md">       // 6px radius
<Button className="rounded-md">     // 6px radius
```

### Border Width

| Element                   | Width | Usage                          |
| ------------------------- | ----- | ------------------------------ |
| Cards, inputs, containers | 1px   | `border border-white/[0.06]`   |
| Dividers                  | 1px   | `border-t border-white/[0.06]` |
| Focus rings               | 2px   | `ring-2 ring-brand-500/50`     |
| Active/selected           | 1px   | `border border-brand-500/30`   |

**Never use 2px borders on cards or containers.** They look heavy and drawn-on. 1px borders with low opacity create structure without visual weight.

### Shadow Hierarchy

| Level   | Shadow                                       | Usage                            |
| ------- | -------------------------------------------- | -------------------------------- |
| None    | `shadow-none`                                | Most elements — flat by default  |
| Subtle  | `shadow-sm` = `0 1px 2px rgba(0,0,0,0.3)`    | Cards on hover                   |
| Medium  | `shadow-md` = `0 4px 6px rgba(0,0,0,0.2)`    | Dropdowns, popovers              |
| Large   | `shadow-lg` = `0 10px 15px rgba(0,0,0,0.15)` | Modals                           |
| Ambient | `0 0 40px rgba(brand,0.08)`                  | Brand glow effect (ONE per page) |

**Default to flat (no shadow).** Shadows in dark mode are subtle — they work by creating depth between surface layers, not by casting visible shadows.

## Bento Grid System

Asymmetric grid layouts that break the "AI-generated" symmetric pattern.

### 3+2 Column Split (Primary)

```
+---------------------------+------------------+
|                           |                  |
|     Large Feature         |   Small Card A   |
|     Card (spans 3)        |   (spans 2)      |
|                           +------------------+
|                           |                  |
+---------------------------+   Small Card B   |
|          |        |       |   (spans 2)      |
| Card C   | Card D | Card E|                  |
| (1 col)  | (1 col)|(1col) +------------------+
+----------+--------+------+
```

**CSS Implementation:**

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: auto;
  gap: 16px; /* 4 * base unit */
}
.bento-large {
  grid-column: span 3;
  grid-row: span 2;
}
.bento-side {
  grid-column: span 2;
}
.bento-third {
  grid-column: span 1;
}
```

### 2+3 Reverse Split

```
+------------------+---------------------------+
|                  |                           |
|   Tall Card A    |     Wide Feature          |
|   (2 cols)       |     (3 cols)              |
|                  +---------------------------+
|                  |     |          |          |
+------------------+ B   |    C     |    D     |
                   |(1)  |   (1)    |   (1)    |
                   +-----+----------+----------+
```

### Responsive Collapse

| Breakpoint | Columns   | Behavior                  |
| ---------- | --------- | ------------------------- |
| >= 1280px  | 5 columns | Full bento layout         |
| 768-1279px | 3 columns | Collapse to 3-column grid |
| 640-767px  | 2 columns | Simple 2-column stack     |
| < 640px    | 1 column  | Single column, full width |

## Visual Hierarchy Formulas

### The 4 Hierarchy Levers

1. **Size** — Minimum 2:1 ratio between heading and body. Display (48px) vs body (15px) = 3.2:1.
2. **Weight** — Use weight contrast within a family. 600 vs 400 creates hierarchy without size change.
3. **Color** — Primary text (#e5e5e5) vs secondary (#a3a3a3) vs muted (rgba 0.3). Three levels maximum.
4. **Position** — Top-left gets seen first (F-pattern for text, Z-pattern for images).

### Hierarchy Scoring

| Importance     | Size       | Weight  | Color          | Position        |
| -------------- | ---------- | ------- | -------------- | --------------- |
| 5 (Primary)    | Display/H1 | 600-700 | text-primary   | Top, above fold |
| 4 (Secondary)  | H2/H3      | 500-600 | text-primary   | Near primary    |
| 3 (Supporting) | Body+      | 400-500 | text-secondary | Below primary   |
| 2 (Tertiary)   | Body       | 400     | text-secondary | Middle/bottom   |
| 1 (Meta)       | Caption    | 400     | text-muted     | Footer, sidebar |

### Information Density

| Vertical       | Density     | Approach                                          |
| -------------- | ----------- | ------------------------------------------------- |
| Dashboard      | High        | Dense 4px spacing, small text, compact cards      |
| Landing page   | Low         | Generous 48-96px sections, large type, whitespace |
| Documentation  | Medium      | 32px sections, readable body, sidebar nav         |
| Chat interface | Medium      | 16px message gaps, compact tools, readable text   |
| Ecommerce      | Medium-High | Grid of products, filters sidebar, compact cards  |

## Content Width Rules

| Content Type      | Max Width | Tailwind    | Why                                    |
| ----------------- | --------- | ----------- | -------------------------------------- |
| Body text / prose | 672px     | `max-w-2xl` | 65-75 chars per line (optimal measure) |
| Hero headline     | 672px     | `max-w-2xl` | Headlines shouldn't stretch to 1280px  |
| Feature grids     | 1024px    | `max-w-5xl` | Room for 3-column layouts              |
| Full layouts      | 1280px    | `max-w-7xl` | Dashboard, admin, full-bleed           |
| Pricing tables    | 896px     | `max-w-4xl` | 3 cards with comfortable spacing       |
| Navigation        | 1280px    | `max-w-7xl` | Full width with edge padding           |

**The cardinal rule:** If it's text a human reads linearly, it's `max-w-2xl`. Period.

## Background Rhythm

Alternating section backgrounds create visual rhythm. See `knowledge/page-composition.md` for full spec.

**Pattern:** transparent → muted/40 → transparent → muted/40 → transparent → brand/10 (ONE brand moment) → muted/40

**Rules:**

- Never two transparent sections in a row (no rhythm)
- Never two brand-colored sections (dilutes the brand moment)
- Maximum ONE brand-colored section per page
- Muted backgrounds use `bg-muted/40` (NOT full opacity)

## Emotional Arc Section Ordering

Every page tells a story. Sections follow the 6-beat emotional arc:

1. **Recognition** — "This is for me" (Hero)
2. **Awe** — "These people are serious" (Social proof / visual showcase)
3. **Trust** — "I believe them" (Features / How it works)
4. **Continuity** — "Others have succeeded" (Testimonials / case studies)
5. **Conviction** — "I need this" (Pricing / comparison)
6. **Action** — "Let me start" (Final CTA)

See `knowledge/page-composition.md` for complete emotional arc rules, cutting rules, and templates.

## Responsive Breakpoints

Aligned with Tailwind CSS defaults:

| Name  | Breakpoint | Typical Device                     | Grid                          |
| ----- | ---------- | ---------------------------------- | ----------------------------- |
| `xs`  | < 375px    | Small phones (SE)                  | 1 col, edge-to-edge           |
| `sm`  | >= 640px   | Large phones, small tablets        | 1-2 cols                      |
| `md`  | >= 768px   | Tablets (portrait)                 | 2-3 cols                      |
| `lg`  | >= 1024px  | Tablets (landscape), small laptops | 3-4 cols                      |
| `xl`  | >= 1280px  | Laptops, desktops                  | Full layout                   |
| `2xl` | >= 1536px  | Large desktops                     | Full layout + more whitespace |

## Page Composition Patterns

### Landing Page Structure

```
1. Navigation (sticky, 64px height)
2. Hero Section (min-h-[80vh])
   - Headline (Display font, max-w-2xl)
   - Subheadline (Body font, text-secondary, max-w-xl)
   - CTA Button (Primary) + Secondary CTA (Ghost)
   - Social proof (logos, stats, or testimonial)
3. Feature Grid (Bento layout, 3+2 or 2+3, max-w-5xl)
4. How It Works (3-step horizontal or vertical)
5. Testimonials (Asymmetric card layout)
6. Pricing (if applicable, max-w-4xl)
7. FAQ (Accordion)
8. Footer CTA (Full-width, accent background — THE brand moment)
9. Footer (Links, legal, social)
```

### Dashboard Structure

```
+------+----------------------------------------+
| Side | Breadcrumb / Page Title                 |
| bar  +----------------------------------------+
|      | Metric Tiles (4-col grid)               |
| Nav  |                                         |
|      +----------------------------+-----------+
|      | Primary Content            | Activity  |
|      | (Charts, Tables, Cards)    | Feed /    |
|      |                            | Sidebar   |
+------+----------------------------+-----------+
```

**Sidebar:** 240px expanded, 64px icons-only. Transition: 200ms ease-out.

## Whitespace Principles

1. **More whitespace = higher perceived quality.** When in doubt, add space.
2. **Group related items tightly, separate unrelated items widely.** Proximity = relationship (Gestalt).
3. **Padding inside > margin outside.** Cards with generous internal padding look better than cards with lots of margin.
4. **Vertical rhythm matters more than horizontal.** Inconsistent vertical spacing is more noticeable.
5. **Use whitespace as a hierarchy signal.** More whitespace around an element = more importance.

## Reference Sites

| Site                                   | What to Learn                                    |
| -------------------------------------- | ------------------------------------------------ |
| [Linear](https://linear.app)           | Gold standard SaaS UI. Density + typography.     |
| [Stripe](https://stripe.com)           | Gold standard fintech landing pages. 6px radius. |
| [Vercel](https://vercel.com)           | Gold standard developer design. Geist type.      |
| [MOBBIN.ai](https://mobbin.com)        | Real-world mobile and web patterns.              |
| [Refero.design](https://refero.design) | Curated web design references by industry.       |
