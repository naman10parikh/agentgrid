# Color Theory

Color psychology, palette generation methods, dark mode architecture, contrast validation, and color-as-signal enforcement rules for professional UI design.

## Color as SIGNAL, Never Decoration

Color is information. Every colored element must answer: "what is this color TELLING the user?" If the answer is "nothing, it just looks nice" — remove the color.

### The ONE Brand Moment Rule

Every page gets exactly ONE section where the brand color appears as a background or dominant element. This is the visual climax of the page. If every section has brand-colored accents, no section stands out. Scarcity creates impact.

**Where to place it:** Usually the final CTA section. Sometimes social proof if the brand moment is logo showcase.

**Enforcement:**

- Count brand-colored backgrounds per page. More than 1 = violation.
- Brand accent on text/icons is fine (it's accent, not a "moment")
- The brand moment section should use `bg-brand-900/10` or `bg-brand-950` — never `bg-brand-500` (too loud)

### Color Enforcement Rules

| Rule                                      | Enforcement                                                                                                     | Why                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Never use brand accent for success states | Success = green, always. If brand is green, use a different green shade.                                        | Users have been trained: green = good, red = bad. Don't confuse them.        |
| Never use red for non-error UI            | Red buttons must be destructive actions only. Never "Sign up" in red.                                           | Red triggers anxiety. Even "exciting" brands shouldn't use red for CTAs.     |
| Two-green rule                            | If your palette has TWO greens (brand + success), they must differ by ≥30° on the hue wheel AND ≥20% lightness. | Two similar greens create confusion: "is this good news or brand identity?"  |
| Brand color budget                        | Maximum 3 elements per viewport can use brand color simultaneously.                                             | More than 3 creates "brand soup" — everything screams, nothing communicates. |
| Semantic colors are sacred                | success/warning/error/info colors are NEVER overridden for brand purposes.                                      | These are functional communication, not aesthetic choices.                   |

### Background Rhythm Color Rules

| Section Type               | Background   | Implementation                      |
| -------------------------- | ------------ | ----------------------------------- |
| Odd sections (1, 3, 5...)  | Transparent  | `bg-transparent`                    |
| Even sections (2, 4, 6...) | Muted band   | `bg-muted/40`                       |
| Brand moment (1 per page)  | Brand tinted | `bg-brand-900/10` or `bg-brand-950` |
| Footer                     | Muted        | `bg-muted/40`                       |

See `knowledge/page-composition.md` for the full background rhythm spec.

### Dark Mode Accent Flipping

In dark mode, brand colors need adjustment to maintain contrast:

| Context           | Light Mode                  | Dark Mode                 | Rule                                |
| ----------------- | --------------------------- | ------------------------- | ----------------------------------- |
| Text accent       | Deep shade (brand-700)      | Bright shade (brand-400)  | Flip to lighter for visibility      |
| Background accent | Light shade (brand-100)     | Deep shade (brand-900/10) | Flip to darker to avoid eye strain  |
| Border accent     | Medium shade (brand-500/30) | Stays the same            | Alpha transparency adapts naturally |
| Icon accent       | Deep shade (brand-600)      | Bright shade (brand-400)  | Flip to lighter for visibility      |

**The rule:** In dark mode, anything that was DEEP becomes BRIGHT (for contrast on dark backgrounds). Anything that was LIGHT becomes DEEP (to avoid glowing patches).

```tsx
// Light mode: deep purple text, light purple background
<div className="bg-purple-100 text-purple-800">

// Dark mode: deep purple background, bright purple text
<div className="dark:bg-purple-900/10 dark:text-purple-400">
```

## Color Psychology Matrix

| Hue               | Western Association               | East Asian            | Use When                             | Avoid When                                       |
| ----------------- | --------------------------------- | --------------------- | ------------------------------------ | ------------------------------------------------ |
| **Blue**          | Trust, stability, professionalism | Immortality, calm     | Fintech, enterprise, healthcare      | Wanting to stand out (overused)                  |
| **Purple**        | Creativity, luxury, wisdom        | Nobility, spiritual   | Creative tools, premium products     | Corporate/conservative contexts                  |
| **Green**         | Growth, health, success           | Prosperity, fertility | Health, finance (positive), eco      | Error-adjacent contexts (confusion with success) |
| **Red**           | Urgency, passion, danger          | Luck, prosperity      | CTAs, alerts, food/restaurant        | Primary brand color (fatigue, anxiety)           |
| **Orange**        | Energy, enthusiasm, warmth        | Sacred, courage       | Consumer, food, startup              | Enterprise, healthcare (feels unserious)         |
| **Yellow**        | Optimism, attention, caution      | Royalty, courage      | Accents, highlights, warnings        | Large surfaces (eye strain), dark mode           |
| **Teal**          | Sophistication, calm tech         | Healing, clarity      | Health-tech, modern SaaS, fintech    | Traditional/conservative brands                  |
| **Pink**          | Playful, modern, inclusive        | Youth, romance        | Consumer, social, lifestyle          | Fintech, enterprise, developer tools             |
| **Warm neutrals** | Grounded, editorial, premium      | Natural, humble       | Content platforms, editorial, luxury | Wanting to feel "techy" or "fast"                |
| **Cool neutrals** | Technical, clean, professional    | Modern, efficient     | Developer tools, enterprise          | Wanting warmth or personality                    |

## Palette Generation Methods

### Method 1: Monochromatic (Single Hue)

Generate a 10-shade scale from a single hue. Best for: minimal, focused brands.

**HSL Algorithm for 10-shade scale:**

```
Given primary HSL(h, s, l):
  50:  HSL(h, s * 0.3, 97)
  100: HSL(h, s * 0.5, 93)
  200: HSL(h, s * 0.7, 85)
  300: HSL(h, s * 0.85, 73)
  400: HSL(h, s * 0.95, 62)
  500: HSL(h, s, 50)         ← primary
  600: HSL(h, s * 1.05, 42)
  700: HSL(h, s * 1.1, 33)
  800: HSL(h, s * 1.05, 24)
  900: HSL(h, s * 0.95, 15)
```

### Method 2: Analogous (Adjacent Hues)

Pick primary hue, take +30 and -30 on the wheel. Best for: harmonious, nature-inspired palettes.

```
Primary:   HSL(h, s, l)
Secondary: HSL(h + 30, s * 0.9, l + 5)
Tertiary:  HSL(h - 30, s * 0.9, l + 5)
```

### Method 3: Complementary (Opposite Hues)

Primary hue + 180 degrees opposite. Best for: high-contrast, energetic designs.

```
Primary:      HSL(h, s, l)
Complement:   HSL(h + 180, s * 0.85, l)
```

Use complement sparingly (10-20% of palette) as accent. Never 50/50 split.

### Method 4: Split-Complementary

Primary + two hues adjacent to its complement. Best for: vibrant but balanced palettes.

```
Primary:  HSL(h, s, l)
Split A:  HSL(h + 150, s * 0.8, l)
Split B:  HSL(h + 210, s * 0.8, l)
```

### Method 5: Triadic (Three Equidistant)

Three hues at 120-degree intervals. Best for: playful, multi-brand, children's products.

```
Primary:   HSL(h, s, l)
Triadic A: HSL(h + 120, s * 0.85, l)
Triadic B: HSL(h + 240, s * 0.85, l)
```

## Dark Mode Architecture

Dark mode is not "invert the colors." It requires a distinct surface layering strategy.

### Surface Elevation System

| Layer | Name      | Value                    | Usage                        |
| ----- | --------- | ------------------------ | ---------------------------- |
| 0     | Base      | `#141312`                | Page background (warm black) |
| 1     | Surface   | `rgba(255,255,255,0.03)` | Cards, inputs, containers    |
| 2     | Elevated  | `rgba(255,255,255,0.06)` | Hover states, dropdowns      |
| 3     | Overlay   | `rgba(255,255,255,0.09)` | Modals, popovers             |
| 4     | Highlight | `rgba(255,255,255,0.12)` | Active states, selections    |

**Never use pure black (#000000).** It creates excessive contrast that causes eye strain. Warm black (#141312) has a subtle brown undertone that feels natural.

### Text Hierarchy in Dark Mode

| Level     | Value                   | Usage                            |
| --------- | ----------------------- | -------------------------------- |
| Primary   | `#e5e5e5` (zinc-200)    | Headings, primary content        |
| Secondary | `#a3a3a3` (zinc-400)    | Descriptions, secondary info     |
| Muted     | `rgba(255,255,255,0.3)` | Disabled, placeholder            |
| Inverse   | `#141312`               | Text on light/accent backgrounds |

**Never use pure white (#ffffff) for body text on dark backgrounds.** It causes halation (glow effect) and eye strain. Zinc-100 or zinc-200 are optimal.

### Border Strategy

- Default: `rgba(255,255,255,0.06)` — barely visible, structural only
- Active: `rgba(primary-color, 0.3)` — branded focus ring
- Error: `rgba(239, 68, 68, 0.3)` — red-tinted for error states
- Never use opaque borders in dark mode. They look like cuts in the surface.

### Dark Mode Color Adjustments

When converting a light-mode palette to dark mode:

1. **Reduce saturation by 10-20%.** Fully saturated colors glow on dark backgrounds.
2. **Increase lightness for text-on-dark.** Minimum L:45 for any text color.
3. **Use alpha transparency for surfaces.** `rgba(255,255,255,0.03)` adapts better than hardcoded grays.
4. **Accent colors stay close to original** but may need +5-10% lightness for contrast.

## WCAG Contrast Requirements

| Level      | Ratio | Applies To                                       |
| ---------- | ----- | ------------------------------------------------ |
| AA Normal  | 4.5:1 | Body text (< 18px regular, < 14px bold)          |
| AA Large   | 3:1   | Large text (>= 18px regular, >= 14px bold)       |
| AAA Normal | 7:1   | Enhanced accessibility (target for primary text) |
| AAA Large  | 4.5:1 | Enhanced large text                              |
| Non-text   | 3:1   | Icons, borders, form controls, focus indicators  |

**Quick validation:** `#e5e5e5` on `#141312` = ~12:1 (passes AAA). `#a3a3a3` on `#141312` = ~7.5:1 (passes AAA). `#8B5CF6` on `#141312` = ~4.2:1 (passes AA Large, fails AA Normal — use for headings/buttons only, not body text).

## Semantic Color System

These semantic colors are universal across all verticals:

| Token     | Hex       | HSL                | Usage                          |
| --------- | --------- | ------------------ | ------------------------------ |
| `success` | `#10B981` | HSL(160, 84%, 39%) | Completion, positive, active   |
| `warning` | `#F59E0B` | HSL(38, 92%, 50%)  | Caution, pending, attention    |
| `error`   | `#EF4444` | HSL(0, 84%, 60%)   | Failure, destructive, blocking |
| `info`    | `#3B82F6` | HSL(217, 91%, 60%) | Informational, neutral action  |

Semantic colors should be used at reduced opacity on dark backgrounds:

- Background fill: `{color}/10` (10% opacity)
- Border: `{color}/20` (20% opacity)
- Text/icon: full opacity
- Hover: `{color}/15`

## Per-Vertical Palette Profiles

| Vertical   | Primary Hue         | Secondary Hue         | Accent Hue    | Mood                  |
| ---------- | ------------------- | --------------------- | ------------- | --------------------- |
| Fintech    | Blue (215)          | Slate (220)           | Emerald (160) | Trust + growth        |
| Health     | Teal (175)          | Sage (150)            | Warm white    | Calm + care           |
| Creative   | Purple (270)        | Pink (330)            | Amber (38)    | Expression + energy   |
| DevTools   | Neutral (0, s:0)    | Blue (215)            | Green (145)   | Focus + function      |
| Consumer   | Energy purple (271) | Warm neutral          | Coral (12)    | Warmth + personality  |
| Enterprise | Blue (215)          | Cool gray (215, s:10) | Indigo (240)  | Professional + stable |
| Education  | Indigo (240)        | Amber (38)            | Teal (175)    | Learning + progress   |
| Ecommerce  | Brand-dependent     | Warm neutral          | Success green | Trust + conversion    |

## Brand Color Derivation Algorithm

Given a single primary hex value, generate a complete 10-shade scale:

```
Input: #6b21a8 (Energy purple)

1. Convert to HSL: H:271, S:67%, L:40%
2. Generate scale using Method 1 (Monochromatic)
3. Adjust extremes:
   - 50 should be barely tinted (L:97, S:30%)
   - 900 should be near-black (L:15, S reduced)
4. Validate: 50-100 readable as bg with dark text
              400-600 readable as text on dark bg
              700-900 usable as dark mode accents
```

Result for Energy purple (#6b21a8):

```
50:  #faf5ff
100: #f3e8ff
200: #e9d5ff
300: #d8b4fe
400: #c084fc
500: #a855f7
600: #9333ea
700: #7e22ce  (closest to primary)
800: #6b21a8  (primary)
900: #581c87
```
