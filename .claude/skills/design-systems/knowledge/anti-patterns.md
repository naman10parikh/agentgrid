# Anti-Patterns

What makes designs look "AI-generated" and specific remediation for each pattern. Use this as a diagnostic checklist. Updated V3 with DFS, OKLCH, discovery brief, and micro-detail patterns.

## The "Vibe-Coded Look" Checklist

Score each pattern 0 (absent) or 1 (present). If 3+ patterns are present, the design needs a rework.

| #   | Pattern                | Diagnostic Question                                              |
| --- | ---------------------- | ---------------------------------------------------------------- |
| 1   | Perfect symmetry       | Are all cards the same size in a uniform grid?                   |
| 2   | Generic gradient       | Is there a purple-to-pink or blue-to-purple gradient?            |
| 3   | Emoji icons            | Are emoji used as functional UI icons?                           |
| 4   | Pure black background  | Is the background #000000 or #09090b?                            |
| 5   | Stock photos           | Are there generic stock images or gray placeholders?             |
| 6   | Uniform cards          | Are all feature/pricing cards identical dimensions?              |
| 7   | Center-everything      | Is every text block center-aligned?                              |
| 8   | Default shadcn         | Is shadcn/ui used without any customization?                     |
| 9   | Single font            | Is only one font used for both display and body?                 |
| 10  | No whitespace strategy | Are spacing values random rather than on a scale?                |
| 11  | Inline font styles     | Is `style={{ fontFamily }}` used instead of next/font?           |
| 12  | Raw Tailwind colors    | Are raw classes like `bg-blue-600` used instead of tokens?       |
| 13  | 8px+ base spacing      | Is the spacing grid based on 8px instead of 4px?                 |
| 14  | 12px+ border radius    | Are cards/buttons using rounded-xl/2xl (12-16px)?                |
| 15  | No letter-spacing      | Are headings missing negative tracking?                          |
| 16  | Wide body text         | Is body text in max-w-6xl or wider containers?                   |
| 17  | No emotional arc       | Are sections just hero/features/pricing without narrative?       |
| 18  | JSON tokens            | Are design tokens in .json files instead of TypeScript?          |
| 19  | No killed alternatives | Is there no record of design decisions that were rejected?       |
| 20  | BFS approach           | Was everything designed at 85% instead of one thing at 100%?     |
| 21  | No discovery brief     | Did design start without ICP, emotion, and goal defined?         |
| 22  | Vague scoring          | Are evaluations "7/10" without specific fixes listed?            |
| 23  | Hex/HSL colors         | Are colors defined in hex/HSL instead of OKLCH?                  |
| 24  | Single-layer shadows   | Do elevated elements have only one box-shadow layer?             |
| 25  | No micro-interactions  | Are hover/active/loading/done states missing?                    |
| 26  | Geometric alignment    | Are elements centered mathematically without optical correction? |

**Score 0-2:** Design passes. Minor polish may help.
**Score 3-5:** Significant rework needed. Apply remediations below.
**Score 6-9:** Major rework. Start from vertical DNA profile.
**Score 10+:** Full redesign. Run the complete V3 pipeline.

---

## Pattern 1: Perfect Symmetry

**Problem:** Uniform card grids (3x equal columns, 4x equal cards) instantly read as template output.

**Remediation:**

- Switch to bento grid layout (3+2 or 2+3 column split)
- Vary card heights: hero card (2x height), standard cards, compact cards
- Use asymmetric column widths (3:2 ratio, not 1:1)

```tsx
// BAD: Symmetric grid
<div className="grid grid-cols-3 gap-4">
  <Card /><Card /><Card />
</div>

// GOOD: Bento layout
<div className="grid grid-cols-5 gap-4">
  <div className="col-span-3 row-span-2"><HeroCard /></div>
  <div className="col-span-2"><CompactCard /></div>
  <div className="col-span-2"><CompactCard /></div>
</div>
```

## Pattern 2: Generic Purple/Pink Gradient

**Problem:** AI tools default to purple/pink/blue gradients. They signal "auto-generated" instantly.

**Remediation:**

- Use solid colors from the vertical palette instead
- If gradients are needed, use subtle same-hue gradients (e.g., `from-zinc-900 to-zinc-800`)
- Gradient should be background texture, never the hero element
- Apply gradients to borders or overlays at very low opacity (5-10%)

```tsx
// BAD: Generic AI gradient
<div className="bg-gradient-to-r from-purple-500 to-pink-500">

// GOOD: Subtle surface gradient
<div className="bg-gradient-to-b from-zinc-900 to-zinc-800 border border-white/[0.06]">

// GOOD: Branded gradient used sparingly
<div className="bg-gradient-to-br from-purple-900/20 to-transparent">
```

## Pattern 3: Emoji as Functional Icons

**Problem:** Using emoji as UI icons looks unprofessional and inconsistent across platforms.

**Remediation:**

- Use Lucide icons for all functional UI elements
- Emoji is acceptable ONLY for decorative/personality elements (agent chat messages, brand taglines)
- Icon size: 16px for inline, 20px for buttons, 24px for navigation

```tsx
// BAD: Emoji as UI icon
<span>🔍 Search</span>;

// GOOD: Lucide icon
import { Search } from "lucide-react";
<span className="flex items-center gap-2">
  <Search className="h-4 w-4" />
  Search
</span>;
```

## Pattern 4: Pure Black Background

**Problem:** #000000 creates harsh contrast that causes eye strain and looks clinical/cold.

**Remediation:**

- Use warm black: `oklch(12% 0.01 60)` / `#141312` (subtle warm undertone)
- For secondary surfaces: `oklch(15% 0.01 60)` over warm black
- Never use #09090b (Tailwind's default zinc-950) as page background

```tsx
// BAD: Pure black
<div className="bg-black">
<div className="bg-zinc-950"> // #09090b

// GOOD: Warm black (OKLCH)
<div style={{ background: 'oklch(12% 0.01 60)' }}>
// Or via token: <div className="bg-surface-base">
```

## Pattern 5: Stock Photos and Placeholder Images

**Problem:** Generic stock images destroy authenticity. Gray placeholder boxes signal "unfinished."

**Remediation:**

- Use generated assets via Nano Banana for photorealistic images
- For missing images: use branded gradients or abstract patterns instead of gray boxes
- For user avatars: generate initials-based avatars with brand colors
- Icons/illustrations: use consistent icon set (Lucide) rather than mixed sources

## Pattern 6: Uniform Card Dimensions

**Problem:** Every card being the exact same size creates a monotonous, template-like grid.

**Remediation:**

- Mix card sizes: featured (large), standard (medium), compact (small)
- Vary aspect ratios: some cards tall and narrow, others wide and short
- Use spanning in grid: `col-span-2` for feature cards

## Pattern 7: Center-Everything Layout

**Problem:** Centering all text creates a formal, poster-like feel that lacks editorial quality.

**Remediation:**

- Use left-aligned text for body content and most headings
- Center-align is acceptable ONLY for: hero headline, CTA sections, footer
- Mix alignment: hero centered, features left-aligned, testimonials left-aligned

## Pattern 8: Default shadcn Without Customization

**Problem:** Raw shadcn/ui looks identical to thousands of other sites.

**Remediation:**

- Override default border-radius (shadcn uses rounded-md, ensure it matches your shape language)
- Replace default zinc colors with your vertical palette
- Add subtle gradients to card backgrounds
- Customize focus rings to use brand color
- Add transition animations to interactive components

## Pattern 9: Single Font for Everything

**Problem:** Using one font for both display and body eliminates typographic contrast.

**Remediation:**

- Adopt a pairing from `knowledge/typography-systems.md`
- Minimum: one serif for display + one sans-serif for body (or two weights with clear hierarchy)
- Use the full 12-level type scale, not just "big text" and "small text"

## Pattern 10: Random Spacing

**Problem:** Inconsistent spacing (13px here, 17px there) creates visual chaos.

**Remediation:**

- Use the 4px grid exclusively: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
- Map to Tailwind spacing scale: p-1 (4px) through p-24 (96px)
- Exception: 1px for borders, 2px for focus rings

---

## Frame-Discovered Anti-Patterns

These patterns were identified from studying Frame's brand system process and are specific to how AI agents generate design systems.

### Pattern 11: Inline Font Styles

**Problem:** `style={{ fontFamily: 'Poppins' }}` bypasses Next.js font optimization. No FOIT prevention, no font subsetting, no caching. Also makes the font decision invisible to the token system.

**Remediation:**

- ALWAYS use `next/font/google` or `next/font/local`
- Load fonts in a central `app/fonts.ts` file
- Apply via CSS custom properties: `--font-display`, `--font-body`, `--font-mono`
- Reference via Tailwind config: `fontFamily: { display: ['var(--font-display)'] }`

```tsx
// BAD: Inline font
<h1 style={{ fontFamily: "Instrument Serif, serif" }}>Title</h1>;

// GOOD: next/font
import { Instrument_Serif } from "next/font/google";
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
<h1 className="font-display">Title</h1>;
```

### Pattern 12: Raw Tailwind Color Classes

**Problem:** Using `bg-blue-600`, `text-purple-500`, etc. directly means colors are scattered across components with no central control. Changing the brand color requires a find-and-replace across the entire codebase.

**Remediation:**

- Define all colors in TypeScript tokens using OKLCH (NOT hex, NOT JSON)
- Reference via CSS custom properties or Tailwind theme extension
- Use semantic names: `bg-brand`, `text-brand-accent`, `bg-surface`, `border-default`
- Raw color values should appear ONLY in the token definition file

```tsx
// BAD: Raw Tailwind colors everywhere
<button className="bg-blue-600 hover:bg-blue-700 text-white">
<Card className="bg-zinc-900 border-zinc-800">

// GOOD: Semantic tokens
<button className="bg-brand hover:bg-brand-hover text-on-brand">
<Card className="bg-surface border-default">
```

### Pattern 13: 8px Base Spacing Grid

**Problem:** The 8px grid is the 2020s default (Material Design, etc.). It's not wrong, but it's the "Times New Roman of spacing" — it signals "I used the default." Also, it lacks the granularity needed for dense UIs.

**Remediation:**

- Switch to 4px base grid
- You still get 8px, 16px, 24px, etc. (they're all multiples of 4)
- But you also get 4px, 12px, 20px for tighter control
- See `knowledge/layout-patterns.md` for the full spacing scale

### Pattern 14: 12px+ Border Radius

**Problem:** rounded-xl (12px) and rounded-2xl (16px) look "bubbly" and "consumer app." They scream "designed by Figma Auto-Layout default."

**Remediation:**

- Default radius: 6px (`rounded-md`) for cards, buttons, inputs
- Modals: 8px (`rounded-lg`)
- Tooltips: 4px (`rounded`)
- Only avatars and badges use `rounded-full`
- This is the "Stripe sweet spot" — professional without being sharp

```tsx
// BAD: Bubbly radius
<Card className="rounded-2xl">     // 16px
<Button className="rounded-xl">    // 12px

// GOOD: Professional radius
<Card className="rounded-md">      // 6px
<Button className="rounded-md">    // 6px
```

### Pattern 15: No Letter-Spacing on Headings

**Problem:** Default letter-spacing on headings (tracking-normal, 0em) makes large text look loose and amateurish. Professional typography ALWAYS tightens headings.

**Remediation:**

- Display text: `-0.03em` tracking (TIGHT)
- H1: `-0.025em` tracking
- H2: `-0.02em` to `-0.01em`
- H3: `-0.01em` to `0`
- Body: `0` to `+0.01em`
- Caption/label: `+0.02em` to `+0.06em` (OPEN — improves small text readability)

```tsx
// BAD: No tracking
<h1 className="text-4xl font-bold">Welcome to Our Platform</h1>

// GOOD: Negative tracking on heading
<h1 className="text-4xl font-bold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
  Welcome to Our Platform
</h1>

// BEST: Token-driven (tracking defined in type scale)
<h1 className="font-display text-display">Welcome to Our Platform</h1>
```

### Pattern 16: Wide Body Text (max-w-6xl)

**Problem:** Body text stretching across 1152px (max-w-6xl) means 120+ characters per line. The human eye loses its place returning to the start of the next line. Optimal reading measure is 65-75 characters (max-w-2xl, 672px).

**Remediation:**

- Body text: `max-w-2xl` (672px)
- Hero headlines: `max-w-2xl` (672px)
- Feature grids: `max-w-5xl` (1024px)
- Full layouts: `max-w-7xl` (1280px)
- See `knowledge/page-composition.md` for complete content width rules

```tsx
// BAD: Way too wide
<section className="max-w-6xl mx-auto">
  <p>Long paragraph text that stretches impossibly wide...</p>
</section>

// GOOD: Constrained reading width
<section className="max-w-5xl mx-auto">
  <div className="max-w-2xl">
    <p>Long paragraph text comfortably contained.</p>
  </div>
</section>
```

### Pattern 17: No Emotional Arc in Sections

**Problem:** Sections ordered as hero → features → pricing → footer is a TEMPLATE, not a STORY. There's no narrative arc. The visitor feels like they're reading a checklist, not being persuaded.

**Remediation:**

- Every page follows the 6-beat emotional arc:
  1. Recognition → 2. Awe → 3. Trust → 4. Continuity → 5. Conviction → 6. Action
- Each section maps to ONE beat. If it serves no beat, cut it.
- Beats appear in order. You can repeat (two Trust sections) but never skip.
- See `knowledge/page-composition.md` for the full emotional arc spec

### Pattern 18: JSON Design Tokens

**Problem:** Storing design tokens in `theme-tokens.json` means no type safety, no autocompletion, no compile-time error checking. JSON also can't contain computed values, comments, or derived tokens.

**Remediation:**

- Use TypeScript files with `as const` assertions
- Export typed token objects
- Derive computed values programmatically (e.g., OKLCH color scales from a primary)
- JSON is acceptable only as a BUILD OUTPUT, never as the source of truth

```typescript
// BAD: theme-tokens.json
{
  "colors": { "brand": "#6b21a8" },
  "typography": { "display": { "size": "48px" } }
}

// GOOD: tokens/design.ts (V3 — OKLCH)
export const tokens = {
  colors: {
    brand: {
      500: 'oklch(45% 0.20 290)',
      50: 'oklch(97% 0.06 290)',
      900: 'oklch(20% 0.10 290)',
    },
  },
  typography: {
    display: {
      fontFamily: 'var(--font-display)',
      fontSize: '48px',
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
    },
  },
} as const;

export type DesignTokens = typeof tokens;
```

### Pattern 19: No Killed Alternatives Recorded

**Problem:** When a design system is produced without recording what was REJECTED, there's no defense against scope creep. Stakeholders will say "can we just add a little of X?" without knowing X was intentionally killed and why.

**Remediation:**

- Every design system doc must include a "Killed Alternatives" section
- Record: what was proposed, why it was killed, who made the decision
- This is part of Step 5 (Decision Log) in the V3 pipeline
- The killed alternatives section is the DEFENSE against "design by committee"

```markdown
## Killed Alternatives

### Warm Intelligence direction — KILLED

**Why:** Target audience is institutional investors. Serif display fonts
undermine credibility with this demographic. Warmth reads as "consumer app."

### 12px border radius — KILLED

**Why:** Bubbly appearance conflicts with professional positioning.
8px chosen instead. Tested with 4px, 6px, 12px, 16px alternatives.

### Fraunces display font — KILLED

**Why:** WONK axis personality was too strong for a financial product.
Playfair Display selected for its authority without playfulness.
```

---

## V3 Anti-Patterns (NEW)

Patterns discovered from axieomatic feedback, DFS methodology adoption, and OKLCH migration.

### Pattern 20: BFS Approach (Designing Everything at 85%)

**Problem:** The AI default — generate hero, features, pricing, footer all at once. Everything looks "almost good" but nothing is excellent. The design feels generic because no single component received deep iteration.

**Remediation:**

- Use DFS methodology (see `knowledge/dfs-methodology.md`)
- Pick the ONE hero component that carries 60% of the page's emotional weight
- Iterate that component to 100% with decision log before touching anything else
- Scale the hero's decisions to other components

```
BAD (BFS): Hero 85% → Features 85% → Pricing 85% → Footer 85%
→ "Nice template" feel. Nothing stands out.

GOOD (DFS): Hero 100% → Extract system → Features 95% → Pricing 95% → Footer 90%
→ "Clearly designed." Hero anchors the whole page.
```

### Pattern 21: No Discovery Brief (Jumping to Visuals Without Strategy)

**Problem:** Starting design work without defining ICP, target emotion, conversion goal, and market position. Results in designs that look good but don't RESONATE with the intended audience.

> "My intuition is that something about the context you're giving doesn't fully explain what you're building and why and for whom." — Axieomatic

**Remediation:**

- ALWAYS complete Step 1 (Discovery Brief) before any visual work
- Brief must include: specific person (name + role), target emotion, conversion goal, market position
- If the brief feels vague, it IS vague. Ask the 7 discovery questions again with more specificity.
- This is a HARD GATE in the V3 pipeline — no brief = no design

### Pattern 22: Vague Scoring ("7/10" Without Specific Fixes)

**Problem:** "The Typographer gives this a 7/10" — what does that MEAN? Which specific part failed? What's the exact fix? Vague scores let mediocrity pass because the feedback is unactionable.

**Remediation:**

- Use the V3 12-dimension binary rubric (see `council/scoring-rubric.md`)
- Every dimension is PASS or FAIL with a specific, measurable test
- Every FAIL includes the exact violation and the exact fix
- No numerical scores. No subjective "feels like a 7."

```
BAD: "Typography: 7/10. Could be better."
GOOD: "Typography Hierarchy: FAIL. H2 and H3 differ only in size (24px vs 20px).
Fix: Add weight differentiation (H2=600, H3=500) and tracking (-0.02em vs -0.01em)."
```

### Pattern 23: Hex/HSL Colors Instead of OKLCH

**Problem:** Hex and HSL are not perceptually uniform. Blue at HSL 50% lightness looks much darker than yellow at HSL 50% lightness. This means manually generated color scales always have uneven brightness, and dark mode flips are guesswork.

**Remediation:**

- Use OKLCH for ALL color definitions (see `knowledge/oklch-color-system.md`)
- Generate scales by varying L while keeping H+C constant
- Dark mode: flip L values (+25%), keep H+C identical
- Hex values only as CSS fallbacks for older browsers

```css
/* BAD: Hex — perceptually non-uniform */
--brand-500: #6b21a8;
--brand-300: #a855f7; /* Is this actually lighter? Hard to tell. */

/* GOOD: OKLCH — perceptually uniform */
--brand-500: oklch(45% 0.2 290);
--brand-300: oklch(65% 0.2 290); /* 20% lighter — guaranteed. */
```

### Pattern 24: Single-Layer Shadows

**Problem:** One `box-shadow` layer looks flat and CGI. Real-world light creates multiple shadow layers at different distances and opacities.

**Remediation:**

- Use 3-4 shadow layers minimum for elevated elements
- Each layer serves a purpose: outline (tight), contact (1-2px), ambient (4-8px), far (12-24px)
- Use OKLCH in shadow colors for consistency with the color system
- See `knowledge/micro-details.md` for the multi-layer shadow pattern

```css
/* BAD: Single-layer */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* GOOD: Multi-layer */
box-shadow:
  0 0 0 1px oklch(20% 0.01 60 / 0.3),
  0 1px 2px oklch(0% 0 0 / 0.15),
  0 4px 8px oklch(0% 0 0 / 0.08),
  0 12px 24px oklch(0% 0 0 / 0.05);
```

### Pattern 25: No Micro-Interactions (Missing States)

**Problem:** Interactive elements with only default and hover states. No active/pressed feedback, no focus ring, no loading state, no completion animation. The interface feels dead — click and nothing happens until the result appears.

**Remediation:**

- Every interactive element needs: default → hover → active → focus-visible → disabled
- Every async action needs: idle → loading (with context text) → success → error
- Apply micro-detail animations from `knowledge/micro-details.md`:
  - Contextual icon animations on hover
  - Stagger on entering groups
  - Subtle exit animations (50% of entry duration)
  - Interruptible transitions (not keyframes)

### Pattern 26: Geometric Alignment Without Optical Correction

**Problem:** Mathematically centered elements often look off-center. A play button (triangle) in a circle needs 1-2px right offset. Text with descenders needs different vertical centering. The eye doesn't agree with the math.

**Remediation:**

- After mechanical centering, squint test the result
- Apply 1-2px optical corrections with `transform: translate()`
- Common corrections:
  - Play icons: `translateX(1px)` right
  - All-caps text: `translateY(0.5px)` down
  - Arrow icons: `translateX(1px)` in direction of arrow
  - Down-pointing chevrons in circles: `translateY(-0.5px)` up
- Trust eyes over math. If it looks off, it IS off.

---

## Additional Anti-Patterns

### Thin, Low-Contrast Borders

**Problem:** Borders that are barely visible provide no visual structure.
**Fix:** Use `border-white/[0.06]` minimum. For active elements: `border-white/[0.12]`.

### Tooltip Overload

**Problem:** Tooltips on everything creates a "documentation in disguise" feel.
**Fix:** Tooltips only on icons without text labels. Never on text that explains itself.

### Loading Spinners Without Context

**Problem:** Generic spinner says nothing about what's happening.
**Fix:** Always include text: "Searching restaurants..." not just a spinner.

### Modals for Inline Actions

**Problem:** Modals interrupt flow and feel heavy for simple actions.
**Fix:** Use inline cards, toasts, or bottom sheets instead. Reserve modals for multi-step flows.

### Text Smaller Than 11px

**Problem:** Text below 11px is illegible on most screens and fails accessibility.
**Fix:** Minimum 11px (`text-[11px]`). Prefer 12px (`text-xs`) for small text.

### Missing Hover/Focus States

**Problem:** Clickable elements with no visual feedback feel broken.
**Fix:** Every interactive element needs: `cursor-pointer`, hover state, focus-visible ring.

```tsx
className="cursor-pointer hover:bg-white/[0.06]
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-brand-500/50 transition-colors"
```
