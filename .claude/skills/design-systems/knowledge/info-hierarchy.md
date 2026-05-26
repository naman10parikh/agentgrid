# Information Hierarchy — The Foundation Before Any Code

**Source:** Axieomatic (Juice) — designer who built Jarvis.tax. Discord feedback March 18, 2026. Validated by NN/G visual hierarchy research, Nathan Curtis (EightShapes), and optimo.microlink.io design narrative analysis.

**Core principle:** Define what the user's eyes see FIRST, SECOND, and THIRD in every section BEFORE writing any code. If you skip this, you're decorating, not designing.

---

## The Cohesive Narrative Rule

Font weight, size, element elevation, alignment, and spacing are NOT independent variables. They form a **single cohesive narrative**. Changing one without adjusting others breaks the system.

**The chain:** `font-weight → font-size → element-elevation → alignment → spacing`

Each link in this chain must reinforce the same message:

| Link      | What it controls | Example (primary CTA) | Example (tertiary text) |
| --------- | ---------------- | --------------------- | ----------------------- |
| Weight    | Importance       | 600-700 (semibold)    | 400 (regular)           |
| Size      | Visual scale     | 18-20px               | 13-14px                 |
| Elevation | Depth/emphasis   | Shadow layer 2-3      | No shadow, flat         |
| Alignment | Reading flow     | Left-aligned, leading | Left-aligned, following |
| Spacing   | Breathing room   | 24-32px margin above  | 8-12px margin above     |

**Anti-pattern:** Changing weight to bold but keeping size small. The narrative is broken — the element says "important" in one dimension and "minor" in another.

---

## Per-Section Eye-Tracking Map

Before coding ANY section, write this map:

```markdown
### Section: Hero

- FIRST (0-1s): Headline — "Find every deduction you're missing" (48px, 700 weight, left-aligned)
- SECOND (1-2s): Supporting stat — "$2,847 average found" (24px, 500 weight, amber accent)
- THIRD (2-3s): CTA button — "Start free scan" (16px, 600 weight, high elevation)
- AMBIENT: Background texture, trust badges, secondary copy (14px, 400 weight, muted)
```

Rules:

1. **Maximum 3 priority levels per section.** If everything is important, nothing is.
2. **The FIRST element gets: largest size, heaviest weight, most contrast, most spacing.**
3. **Each subsequent level drops by at least 1 step in the type scale.**
4. **Alignment should guide the eye path** — left-to-right for Western audiences, top-to-bottom for scanning.

---

## Anti-Centering Rule

**Default: left-align.** Center alignment only with explicit justification.

When centering IS appropriate:

- Single-line headlines in hero sections (above the fold only)
- CTA buttons (centered within their container, not the page)
- Testimonial quotes
- Final CTA sections (single conversion focus)

When centering is WRONG:

- Body text (destroys reading rhythm)
- Multi-line headings (ragged centering is worse than ragged right)
- Navigation items
- Data/metrics (loses scanability)
- Card contents (makes cards feel generic)
- Section sub-headings (breaks the hierarchy narrative)

**Why LLMs over-center:** Training data contains a disproportionate number of marketing templates (Webflow, Squarespace) that center everything. Centering feels "safe" because it's symmetrical. But professional design is 80%+ left-aligned because reading flows left-to-right.

---

## Anti-Card Obsession

**Cards are a tool, not a layout strategy.** LLMs default to cards because they're the most common container pattern in training data.

**Container variety (use at least 3 per page):**

| Container        | When to use                                    | Visual effect        |
| ---------------- | ---------------------------------------------- | -------------------- |
| Flush section    | Full-width content, hero, features             | Expansive, confident |
| Inset panel      | Highlighted content, callouts                  | Focused attention    |
| Full-bleed       | Images, data visualizations, gradients         | Immersive            |
| Card             | Comparable items (pricing tiers, team members) | Scanable grid        |
| Inline highlight | Key stats, pull quotes                         | Editorial emphasis   |
| Split section    | Before/after, comparison, dual narrative       | Contrast             |

**Rule:** If more than 40% of your sections use cards, you're in card-obsession territory. Vary the containers.

---

## Typography Scale for Hierarchy

Use a modular scale (Major Third ratio 1.25 recommended):

```
Display:  40-48px / 700 weight / tight tracking (-0.02em)
H1:       32-36px / 600 weight / tight tracking (-0.015em)
H2:       24-28px / 600 weight / normal tracking
H3:       20-22px / 500 weight / normal tracking
Body:     16px    / 400 weight / normal tracking / 1.6 line-height
Small:    14px    / 400 weight / wide tracking (+0.01em)
Caption:  12-13px / 400-500 weight / wide tracking (+0.02em)
```

**Nathan Curtis finding:** You can achieve hierarchy by increasing type SIZE instead of adding font-weights. Fewer weights = cleaner system.

**Line-height:** 1.4-1.7x font size. Use 1.5x as default. Headings can be tighter (1.1-1.3x).

---

## Grid Strategy: Hierarchical, Not Modular

Use a **hierarchical grid** — layout based on content importance, not uniform modules.

- **Primary content:** 60-70% of horizontal space
- **Secondary content:** 30-40% of horizontal space
- **Rule of thirds:** Place key elements at 1/3 and 2/3 intersection points
- **Asymmetric splits:** 60/40, 70/30, NOT 50/50 (50/50 = AI default)

**Bento grid anti-pattern:** Don't make all cells the same size. The largest cell should contain the most important content. Vary cell heights.

---

## Spacing Tokens

8px base grid:

```
--space-xs:  4px   — micro-spacing (icon gaps, inline elements)
--space-sm:  8px   — element padding, compact lists
--space-md:  16px  — card padding, paragraph spacing
--space-lg:  24px  — section padding, form groups
--space-xl:  32px  — major section breaks
--space-2xl: 48px  — hero padding, page sections
--space-3xl: 64px  — full page section separators
```

**Spacing and hierarchy:** More important sections get MORE spacing around them. Hero gets `--space-3xl` top/bottom. Feature items get `--space-lg`. Footer links get `--space-sm`.

---

## Optimo Reference Patterns

From optimo.microlink.io (cited by Axieomatic as "good design narrative"):

1. **Monospace + sans-serif duality** — technical content in monospace, narrative in sans-serif. Mirrors how developers actually work.
2. **Generous whitespace** — `py-24` between sections, `gap-10-12` in grids. Confidence through restraint.
3. **Functional color** — each element type gets its own hue. Colors serve scanning, not decoration.
4. **Offset shadows** — `shadow-[8px_8px_0_0_var(...)]` creates deliberate asymmetry in elevation.
5. **Personality hover** — `hover:-translate-y-2 hover:-rotate-1` — slight rotation adds human character.
6. **High-contrast borders** — `border-4 border-foreground` — bold borders over subtle shadows.

---

## Checklist (Run Before Coding ANY Section)

- [ ] Info hierarchy map written for this section (FIRST/SECOND/THIRD)
- [ ] Font chain consistent (weight → size → elevation → alignment → spacing tell same story)
- [ ] Left-aligned by default (centering only with justification)
- [ ] Container type chosen (NOT defaulting to card)
- [ ] Type scale step assigned to each text element
- [ ] Spacing tokens assigned (higher hierarchy = more spacing)
- [ ] Grid position based on content importance (not uniform)
