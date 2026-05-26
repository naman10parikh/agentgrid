# OKLCH Color System

OKLCH replaces hex/HSL for all color work in V3. Perceptually uniform — blue at 50% lightness LOOKS the same brightness as yellow at 50%. No more manual tweaking to make colors "feel" balanced.

## Why OKLCH

| Problem with hex/HSL                                                          | OKLCH fix                                                        |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| HSL 50% lightness varies wildly by hue (blue looks dark, yellow looks bright) | OKLCH L=50% is perceptually identical brightness across all hues |
| Generating scales requires manual per-color adjustment                        | Keep H+C constant, vary L — automatic perceptually uniform scale |
| Dark mode flipping is guesswork                                               | Flip L values mathematically: `L_dark = 100% - L_light + offset` |
| No native CSS support for perceptual uniformity                               | `oklch()` is CSS Color Level 4, supported in all modern browsers |

Reference: [oklch.fyi](https://oklch.fyi)

## CSS Syntax

```css
color: oklch(L% C H);
```

- **L** (Lightness): 0% = black, 100% = white. Perceptually uniform.
- **C** (Chroma): 0 = gray, ~0.4 = maximum saturation. Most usable range: 0.05–0.25.
- **H** (Hue): 0–360 degrees. Same wheel as HSL but perceptually corrected.

```css
/* Example: Energy brand purple */
--brand-500: oklch(45% 0.2 290);

/* Warm black background */
--surface-base: oklch(12% 0.01 60);

/* High-contrast text */
--text-primary: oklch(90% 0.01 60);
```

## Palette Generation (Monochromatic Scale)

Keep H and C constant. Vary L only. This guarantees perceptual uniformity across the scale.

```typescript
// tokens/colors.ts — V3 OKLCH palette generator
function generateScale(hue: number, chroma: number) {
  return {
    50: `oklch(97% ${chroma * 0.3} ${hue})`, // near white
    100: `oklch(93% ${chroma * 0.4} ${hue})`,
    200: `oklch(85% ${chroma * 0.6} ${hue})`,
    300: `oklch(75% ${chroma * 0.8} ${hue})`,
    400: `oklch(65% ${chroma * 0.9} ${hue})`,
    500: `oklch(55% ${chroma} ${hue})`, // brand anchor
    600: `oklch(48% ${chroma} ${hue})`,
    700: `oklch(40% ${chroma * 0.9} ${hue})`,
    800: `oklch(30% ${chroma * 0.7} ${hue})`,
    900: `oklch(20% ${chroma * 0.5} ${hue})`,
    950: `oklch(13% ${chroma * 0.3} ${hue})`,
  } as const;
}

// Usage: generate a full purple scale
export const brand = generateScale(290, 0.2);
```

**Rule:** Raw hex values appear ONLY as fallbacks for browsers without OKLCH support. The source of truth is always OKLCH.

## Dark Mode: Flip L Values

Light mode accents are deep (low L). Dark mode accents must be bright (high L) to maintain contrast against dark surfaces.

```css
/* Light mode: deep accent for contrast on white */
--brand-accent: oklch(40% 0.2 290);

/* Dark mode: bright accent for contrast on dark */
--brand-accent: oklch(65% 0.2 290);
```

**Formula:** `L_dark = L_light + 25%` (adjust by 20–30% based on surface lightness).

H and C stay identical — the color identity doesn't change, only its lightness.

## Surface Elevation (OKLCH)

Replace `rgba(255,255,255,0.0X)` overlays with OKLCH lightness steps:

```css
--surface-base: oklch(12% 0.01 60); /* warm black */
--surface-raised: oklch(15% 0.01 60); /* cards */
--surface-elevated: oklch(18% 0.01 60); /* modals, dropdowns */
--surface-overlay: oklch(22% 0.01 60); /* popovers */
--surface-highlight: oklch(25% 0.01 60); /* hover states */
```

The hue (60) adds warmth. Chroma (0.01) keeps surfaces nearly neutral while avoiding dead gray.

## WCAG Contrast Checking with OKLCH

OKLCH lightness difference correlates with perceived contrast. Rules of thumb:

| Use case                | Minimum L difference                |
| ----------------------- | ----------------------------------- |
| Body text on background | 60%+ (e.g., L=90% text on L=12% bg) |
| Secondary text          | 45%+                                |
| Decorative / disabled   | 25%+                                |
| Large headings (24px+)  | 50%+                                |

**Always verify:** Use the APCA (Advanced Perceptual Contrast Algorithm) for final checks. OKLCH L difference is a fast heuristic, not a replacement for WCAG compliance testing.

```typescript
// Quick contrast check
function hasAdequateContrast(
  textL: number,
  bgL: number,
  minDiff = 60,
): boolean {
  return Math.abs(textL - bgL) >= minDiff;
}
```

## Integration with Tailwind

```typescript
// tailwind.config.ts — V3 OKLCH integration
import { brand } from "./tokens/colors";

export default {
  theme: {
    extend: {
      colors: {
        brand, // oklch values from generator
        surface: {
          base: "oklch(12% 0.01 60)",
          raised: "oklch(15% 0.01 60)",
          elevated: "oklch(18% 0.01 60)",
        },
      },
    },
  },
} satisfies Config;
```

## Migration from Hex/HSL

1. Convert existing hex values to OKLCH using oklch.fyi or `culori` library
2. Replace all raw hex in token files with OKLCH equivalents
3. Keep hex as CSS fallback: `color: #6b21a8; color: oklch(45% 0.20 290);`
4. Test in Safari, Chrome, Firefox (all support oklch as of 2024)
5. Remove hex fallbacks once browser support threshold is met

## Anti-Patterns

- **Never mix hex and OKLCH in the same scale** — perceptual uniformity breaks
- **Never eyeball dark mode flips** — use the L-flip formula
- **Never use C > 0.3 for UI elements** — gamut clipping on sRGB displays
- **Never skip the warmth hue on neutrals** — pure gray (H=0, C=0) looks dead
