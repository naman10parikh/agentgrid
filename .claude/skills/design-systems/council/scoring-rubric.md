# 12-Dimension Binary Scoring Rubric (V3)

Replaces the V2 5-persona/50-point system. Each dimension is binary: PASS or FAIL with a SPECIFIC metric. No vague scores. No "7/10." Either the design meets the bar or it doesn't — and if it fails, the exact fix is stated.

## Why Binary

V2 problem: "The hero got 7/10 from the Typographer" — what does that mean? Which part is wrong? What's the fix? Vague scores let mediocrity pass.

V3 rule: Every dimension has a concrete, measurable test. You can verify it by looking at the output. No interpretation needed.

---

## The 12 Dimensions

### 1. Discovery Depth

**Test:** Does the brief name a specific person (name, age, role, company) and define the target emotion?

| PASS                                                                                                  | FAIL                                                         |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| "Marcus, 42, portfolio manager at a mid-size hedge fund. Target emotion: 'This is serious software.'" | "Finance professionals. Target emotion: 'modern and clean.'" |

**Fix on fail:** Return to Step 1. Answer all 7 discovery questions with specifics, not generics.

---

### 2. Typography Hierarchy

**Test:** Can you distinguish all heading levels (display, h1, h2, h3) at a glance WITHOUT reading the text? Each level must differ in at least 2 of: size, weight, tracking, font-family.

| PASS                                                                                                               | FAIL                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Display: 64px/serif/400/-0.03em. H1: 40px/sans/600/-0.025em. H2: 30px/sans/500/-0.02em. H3: 24px/sans/500/-0.01em. | H1: 32px/sans/600. H2: 24px/sans/600. H3: 20px/sans/600. (Only size differs — weight and tracking identical.) |

**Fix on fail:** Add tracking differentiation. Introduce weight variation. Consider serif/sans split at display level.

---

### 3. Color Discipline

**Test:** Count brand-colored elements in any viewport. Is it 3 or fewer? Is OKLCH used as the source of truth (not hex/HSL)?

| PASS                                                                               | FAIL                                                                                                        |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| One brand CTA button, one accent line, one highlighted stat. All defined in OKLCH. | Brand color on navbar, hero gradient, feature icons, CTA, footer links. Hex values scattered in components. |

**Fix on fail:** Reduce brand usage to max 3 per viewport. Migrate all hex to OKLCH in tokens file. One brand moment per page.

---

### 4. WCAG Contrast

**Test:** Does ALL body text have 60%+ OKLCH lightness difference from its background? Do secondary text and disabled states pass their thresholds?

| PASS                                                                                                        | FAIL                                                                  |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Body: L=90% on L=12% (78% diff). Secondary: L=65% on L=12% (53% diff). Disabled: L=38% on L=12% (26% diff). | Body: L=70% on L=25% (45% diff — below 60%). Disabled text invisible. |

**Fix on fail:** Increase text lightness or decrease background lightness until thresholds met. Use the OKLCH contrast checker.

---

### 5. Layout Asymmetry

**Test:** Is there at least ONE asymmetric layout (bento grid, varied card sizes, editorial composition) on the page? No section has all-equal-size cards.

| PASS                                                                 | FAIL                                                                        |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Features section uses 3+2 bento grid with hero card spanning 2 rows. | Features section is a 3-column uniform grid with identical card dimensions. |

**Fix on fail:** Replace uniform grid with bento layout. Vary card sizes: hero (2x), standard, compact. Use 3:2 or 2:3 column ratios.

---

### 6. Micro-Details (4+ of 12)

**Test:** Count applied micro-details from `knowledge/micro-details.md`. At least 4 must be present.

Checklist:

- [ ] `text-wrap: balance` on headings
- [ ] Concentric border radius on nested elements
- [ ] Contextual icon animations (not generic)
- [ ] `-webkit-font-smoothing: antialiased`
- [ ] `font-variant-numeric: tabular-nums` on numbers
- [ ] Interruptible animations (transitions, not keyframes for interactions)
- [ ] Stagger on entering element groups
- [ ] Exit animations (faster than enter)
- [ ] Optical alignment corrections (1-2px nudges)
- [ ] Multi-layer shadows (3+ layers)
- [ ] Image outlines (1px, 10% opacity)
- [ ] Overall "compound polish" feel

| PASS                                                                                             | FAIL                                                           |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| antialiased + tabular-nums + stagger animations + multi-layer shadows + text-balance = 5 details | Only antialiased applied. No other micro-details. Score: 1/12. |

**Fix on fail:** Apply the micro-details checklist. Each takes 1-15 minutes. See `knowledge/micro-details.md` for implementation.

---

### 7. DFS Evidence

**Test:** Is there a decision log for the hero component with 3+ killed alternatives per major decision (radius, shadow, animation, typography)?

| PASS                                                                                                                   | FAIL                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Decision log shows: "Radius: tried 4px, 6px, 12px, 16px. Winner: 8px because..." for radius, shadow, animation, color. | No decision log. Or: "Chose 8px radius" with no alternatives recorded. |

**Fix on fail:** Go back to Step 4. Iterate the hero component through all decisions. Try 3-5 options per decision. Record what was killed and why.

---

### 8. Dark Mode Quality

**Test:** Are there 3+ distinct surface elevation levels visible in dark mode? (Not just one flat dark background.)

| PASS                                                                                     | FAIL                                                                                |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Base (L=12%), raised (L=15%), elevated (L=18%), overlay (L=22%). Cards float above page. | Everything is #141312 or #000. Cards have border but no elevation difference. Flat. |

**Fix on fail:** Implement the OKLCH surface elevation system from `knowledge/oklch-color-system.md`. Minimum 3 levels: base, raised, elevated.

---

### 9. Emotional Arc

**Test:** Can you map each page section to one of the 6 beats (Recognition, Awe, Trust, Continuity, Conviction, Action)? Are the beats in order?

| PASS                                                                                                                     | FAIL                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Hero (Recognition) → Logo bar (Awe) → Features (Trust) → Testimonials (Continuity) → Pricing (Conviction) → CTA (Action) | Hero → Features → More Features → Pricing → Footer. No social proof, no testimonials. Two Trust sections with no Awe or Continuity. |

**Fix on fail:** Map existing sections to beats. Add missing beats. Remove duplicate-beat sections or reassign them. Beats must appear in order.

---

### 10. Interaction States

**Test:** Does EVERY interactive element have all 4 states: default, hover, active/pressed, focus-visible? Do async actions have loading + done states?

| PASS                                                                                                                                                                                                              | FAIL                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Button: default (bg-brand) → hover (bg-brand-hover, translateY(-1px)) → active (bg-brand-dark, translateY(0)) → focus (ring-2 ring-brand/50). Submit: loading spinner with "Booking..." text → success checkmark. | Button has hover state only. No active, no focus ring. Form submit shows no loading state — just jumps to success. |

**Fix on fail:** Add missing states. Every interactive element: cursor-pointer, hover, active, focus-visible. Every async action: loading with context text, success, error.

---

### 11. Font Loading

**Test:** Are all fonts loaded via `next/font` (not inline styles, not CDN links, not @import)? Is there a central `app/fonts.ts`?

| PASS                                                                                                                                              | FAIL                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `app/fonts.ts` exports all font variables. Components use `font-display`, `font-body`, `font-mono` classes. No `style={{ fontFamily }}` anywhere. | `<link href="https://fonts.googleapis.com/...">` in head. Components use `style={{ fontFamily: 'Poppins' }}`. |

**Fix on fail:** Create `app/fonts.ts` with `next/font/google` loaders. Replace all inline font styles with CSS variable classes. Remove CDN links.

---

### 12. Token Architecture

**Test:** Are ALL design values (colors, typography, spacing, shadows) defined in TypeScript token files with `as const`? Zero raw hex/px values in component files?

| PASS                                                                                                                                                | FAIL                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `tokens/colors.ts` (OKLCH), `tokens/typography.ts`, `tokens/shape.ts` — all `as const`. Components reference tokens via Tailwind theme or CSS vars. | Colors scattered as `bg-blue-600`, `text-gray-300` in components. No token files. Shadow values inline. |

**Fix on fail:** Create TypeScript token files. Define all values centrally. Wire through Tailwind config. Replace raw values in components with semantic references.

---

## Scoring Process

### Step 1: Evaluate All 12 Dimensions

For each dimension, mark PASS or FAIL based on the specific test.

### Step 2: Score Sheet

```
| #  | Dimension          | Result | Notes                              |
| -- | ------------------ | ------ | ---------------------------------- |
| 1  | Discovery Depth    | PASS/FAIL |                               |
| 2  | Typography Hierarchy | PASS/FAIL |                             |
| 3  | Color Discipline   | PASS/FAIL |                               |
| 4  | WCAG Contrast      | PASS/FAIL |                               |
| 5  | Layout Asymmetry   | PASS/FAIL |                               |
| 6  | Micro-Details      | PASS/FAIL |                               |
| 7  | DFS Evidence       | PASS/FAIL |                               |
| 8  | Dark Mode Quality  | PASS/FAIL |                               |
| 9  | Emotional Arc      | PASS/FAIL |                               |
| 10 | Interaction States | PASS/FAIL |                               |
| 11 | Font Loading       | PASS/FAIL |                               |
| 12 | Token Architecture | PASS/FAIL |                               |

TOTAL: X/12 PASS
```

### Step 3: Decision

| Outcome          | Criteria                             | Action                                                     |
| ---------------- | ------------------------------------ | ---------------------------------------------------------- |
| **SHIP**         | 10+ PASS, zero red flags             | Generate output files.                                     |
| **FIX AND SHIP** | 10+ PASS but with minor fixes needed | Apply specific fixes from FAIL notes, re-verify.           |
| **ITERATE**      | 7-9 PASS                             | Address failures, re-run audit on failed dimensions only.  |
| **RESTART**      | <7 PASS                              | Fundamental issues. Re-run pipeline from the failing step. |

---

## Red Flags (Automatic FAIL — Regardless of Score)

A single red flag = entire audit FAILS. Fix the red flag first.

### Critical Accessibility

- Body text WCAG AA contrast failure (< 4.5:1 ratio)
- No keyboard navigation path through interactive elements
- Color as sole state indicator (no text/icon backup)

### Critical Design System

- Pure black (#000000) background (must use warm black)
- Default system font with no custom type system
- Pure white (#FFFFFF) text on dark backgrounds

### Critical UX

- Modal for an inline action
- No loading state for any async operation
- Loading spinner with no context text

### Critical Brand

- Stock photography anywhere
- Emoji as functional icon (Lucide required)
- Design indistinguishable from unmodified shadcn/ui defaults

---

## Why This Replaced V2's 50-Point System

| V2 problem                                     | V3 fix                                                      |
| ---------------------------------------------- | ----------------------------------------------------------- |
| "7/10" from Typographer — which part failed?   | Binary: either headings are distinguishable or they're not  |
| 5 personas debating subjective scores          | 12 concrete tests with measurable criteria                  |
| Designs passed at 38/50 with hidden mediocrity | Each dimension is independently critical — can't compensate |
| No connection to the DFS methodology           | Dimension 7 (DFS Evidence) enforces the process             |
| No OKLCH enforcement                           | Dimension 3 (Color Discipline) requires OKLCH               |
| No micro-detail enforcement                    | Dimension 6 (Micro-Details) requires 4+ of 12               |
