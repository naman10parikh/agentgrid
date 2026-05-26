# Iteration Protocol: Select-and-Refine Loop

A Midjourney-inspired design iteration loop adapted for design system work. The key difference: confirmed decisions carry forward between iterations (fonts, colors, layout paradigm), so each round refines rather than restarts.

---

## Overview

```
Brief → Generate 3 Variants → Council Scores → User Selects Direction
                                                        ↓
                                          Merge + Refine → 3 New Variants
                                                        ↓
                                              Council Re-Scores
                                                        ↓
                                          Repeat until ALL 7+/10
                                          (max 4 iterations)
```

---

## Phase 1: Generate 3 Variants

From a single design brief, generate 3 distinct approaches that explore different design strategies.

### Variant Strategy

| Variant | Strategy      | Description                                                |
| ------- | ------------- | ---------------------------------------------------------- |
| V1      | **Minimal**   | Maximum whitespace. Restrained palette. Subtle typography. |
| V2      | **Bold**      | High contrast. Strong color. Dramatic type scale.          |
| V3      | **Editorial** | Magazine-inspired. Serif display. Asymmetric. Bento grid.  |

### Generation Prompt Template

```
You are generating design variant {N} of 3 for: {BRIEF}

APPROACH: {STRATEGY — Minimal / Bold / Editorial}
VERTICAL: {VERTICAL from brief or auto-detected}
BRAND CONTEXT: {BRAND.md content if available}

CONSTRAINTS (carry forward from previous iterations):
{LIST of confirmed decisions, e.g.:
  - Font: Instrument Serif (confirmed iteration 2)
  - Primary color: #E11D48 (confirmed iteration 1)
  - Layout: Bento grid (confirmed iteration 3)
}

ENERGY DESIGN RULES (always apply):
- Warm black (#141312) background, NOT pure black
- Serif + sans-serif pairing (anti-AI-look)
- Asymmetric > symmetric
- No emoji as functional icons
- No pure white text — use zinc-100/200
- All interactive elements: cursor-pointer
- Dark mode default
- Touch targets >= 44px

Generate a complete design specification including:
1. Color palette (full 10-shade scale)
2. Typography system (display, heading, body, code)
3. Layout structure (grid, spacing, responsive)
4. Component list with state definitions
5. Key visual decisions with rationale

Be SPECIFIC: exact hex codes, exact pixel values, exact font names.
```

### What Varies Between Variants

| Element      | V1 (Minimal)        | V2 (Bold)            | V3 (Editorial)           |
| ------------ | ------------------- | -------------------- | ------------------------ |
| Display font | Light sans-serif    | Heavy sans-serif     | Serif (Instrument Serif) |
| Color count  | 2-3 hues            | 4-5 hues             | 2-3 hues + rich neutrals |
| Hero layout  | Centered, airy      | Split, high-contrast | Asymmetric, bleeding     |
| Card style   | Ghost borders       | Filled, gradient     | Mixed: filled + ghost    |
| Spacing      | Generous (80-120px) | Tight (48-80px)      | Variable rhythm          |
| Animation    | Fade only           | Scale + slide        | Stagger + reveal         |

### What Stays Constant Across Variants

- Warm black base background (#141312)
- WCAG AA contrast compliance
- Mobile responsiveness
- shadcn/ui component base
- Accessibility requirements
- Brand name and core identity

---

## Phase 2: Council Scores All 3

Each of the 5 council personas scores each variant independently.

### Scoring Presentation Format

```
## Variant Comparison

| Persona            | V1 (Minimal) | V2 (Bold) | V3 (Editorial) |
| ------------------ | ------------ | --------- | --------------- |
| Typographer        |         /10  |      /10  |            /10  |
| Color Theorist     |         /10  |      /10  |            /10  |
| Layout Architect   |         /10  |      /10  |            /10  |
| UX Purist          |         /10  |      /10  |            /10  |
| Brand Guardian     |         /10  |      /10  |            /10  |
| **TOTAL**          |         /50  |      /50  |            /50  |

### Key Differences

- **Typography:** V1 uses Inter (clean), V2 uses Clash Display (bold), V3 uses Instrument Serif (editorial).
  Typographer recommends V3 — serif/sans pairing is highest-impact anti-AI signal.

- **Layout:** V1 centered hero, V2 split hero, V3 asymmetric bleed.
  Layout Architect recommends V3 — asymmetric breaks template feel.

- **Color:** V1 monochrome + accent, V2 full palette, V3 restrained + rich neutrals.
  Color Theorist recommends V1 — restraint reads as premium.

### Council Recommendation
Strongest variant: V{N} (score: XX/50)
Strongest elements from other variants: {list}
```

---

## Phase 3: Present Options to User

Show the user the scoring comparison, key differences, and council recommendation. Make it easy to cherry-pick.

### Presentation Prompt

```
Here are 3 design directions for {BRIEF}:

**V1 — Minimal** (Score: {X}/50)
{2-sentence summary of approach + strongest dimension}

**V2 — Bold** (Score: {X}/50)
{2-sentence summary of approach + strongest dimension}

**V3 — Editorial** (Score: {X}/50)
{2-sentence summary of approach + strongest dimension}

Council recommends V{N}. Key differentiators: {typography / layout / color}.

Which direction do you prefer? You can also cherry-pick:
"I like the typography of V3 and the layout of V2."
```

---

## Phase 4: User Selects Direction

The user provides direction in one of these formats:

| User Input                                      | Interpretation                                           |
| ----------------------------------------------- | -------------------------------------------------------- |
| "V2"                                            | Take V2 wholesale, refine weak dimensions                |
| "V3 with V1 colors"                             | Merge V3 base + V1 color system                          |
| "Typography from V3, layout from V2, colors V1" | Cherry-pick from all three                               |
| "More minimal than V1"                          | Push V1 further in its direction                         |
| "None of these, try X"                          | New direction, but carry forward any confirmed decisions |

### Confirmed Decisions

When the user approves a specific element, it becomes a **confirmed decision** that carries forward to ALL future iterations. Track these explicitly:

```
CONFIRMED DECISIONS (iteration 2):
- [x] Font: Instrument Serif for display (selected from V3, iteration 1)
- [x] Layout: Bento grid, 3+2 split (selected from V3, iteration 1)
- [ ] Color: TBD (user wants to see more options)
- [ ] Component style: TBD
- [ ] Animation approach: TBD
```

---

## Phase 5: Merge + Refine

Generate 3 new variants in the selected direction, incorporating confirmed decisions and addressing council feedback.

### Refinement Prompt Template

```
ITERATION {N} of 4. Refining design for: {BRIEF}

DIRECTION: {User's selection, e.g., "V3 base with V1 color restraint"}

CONFIRMED DECISIONS (do NOT change these):
{List of confirmed elements from all previous iterations}

COUNCIL FEEDBACK TO ADDRESS:
{Specific, actionable feedback from personas that scored below 7, e.g.:
  - Typographer: "H2/H3 contrast too low. Increase H2 to 22px or change H3 weight to 400."
  - UX Purist: "Missing loading state for venue search. Add skeleton card."
}

SCORES TO IMPROVE:
{List dimensions below 2pts with specific targets}

Generate 3 refined variants. Each must:
1. Keep all confirmed decisions unchanged
2. Address every piece of council feedback
3. Explore different solutions for unconfirmed elements
4. Score higher than the previous iteration's best variant
```

### What Changes in Refinement

- **Unconfirmed elements** get 3 new options each
- **Low-scoring dimensions** get targeted improvements
- **Confirmed elements** are locked — the design sharpens rather than drifts

---

## Phase 6: Re-Score

Council evaluates the refined variants using the same rubric. Scoring focuses on:

1. Did the feedback get addressed? (compare specific dimensions)
2. Did confirmed decisions hold? (no regression)
3. Did new variants score higher overall?

### Score Comparison Template

```
## Iteration {N} vs Iteration {N-1}

| Persona            | Best (iter N-1) | V1 (iter N) | V2 (iter N) | V3 (iter N) |
| ------------------ | --------------- | ----------- | ----------- | ----------- |
| Typographer        |            /10  |        /10  |        /10  |        /10  |
| Color Theorist     |            /10  |        /10  |        /10  |        /10  |
| Layout Architect   |            /10  |        /10  |        /10  |        /10  |
| UX Purist          |            /10  |        /10  |        /10  |        /10  |
| Brand Guardian     |            /10  |        /10  |        /10  |        /10  |
| **TOTAL**          |            /50  |        /50  |        /50  |        /50  |

Improvement: +{X} points over previous best
Feedback addressed: {Y}/{Z} items resolved
```

---

## Phase 7: Repeat or Finalize

### Continue Iterating If:

- Any persona scores below 7/10
- Total score below 38/50
- User requests changes
- Unresolved council feedback remains

### Finalize If:

- All 5 personas score 7+/10
- Total score is 38+/50
- User approves the direction
- All confirmed decisions are integrated

### Finalization Output

When the design passes, produce the complete specification:

```
## FINAL DESIGN SPECIFICATION

### Iterations: {N} of 4
### Final Score: {X}/50
### Score Breakdown:
| Persona | Score |
| ------- | ----- |
| ...     | ...   |

### Confirmed Decisions Log:
- Iteration 1: Font (Instrument Serif), Layout (Bento grid)
- Iteration 2: Color palette (#E11D48 primary, warm neutrals)
- Iteration 3: Component style (ghost borders + gradient CTAs), Animation (stagger)

### Output Files:
1. theme-tokens.json — Complete token file
2. tailwind-overrides.ts — Tailwind config extension
3. component-manifest.md — Which components to use + customizations
4. responsive-annotations.md — Breakpoint behavior
5. BRAND.md update — If brand identity was refined
```

---

## Phase 8: Convergence Failsafe

### Maximum 4 Iterations

If the design hasn't converged after 4 iterations (still below 38/50 or a persona stuck below 7):

1. **Flag for Opus intervention** — The design challenge may require deeper architectural reasoning
2. **Document the sticking point** — Which persona can't be satisfied? What's the fundamental tension?
3. **Present the best attempt** — Show the highest-scoring variant with its remaining issues
4. **Offer escape hatches:**
   - "Accept with known issues" (document what's below bar)
   - "Restart with different brief" (the brief may be conflicting)
   - "Escalate to manual design" (human designer takes over)

### Common Non-Convergence Patterns

| Pattern                          | Root Cause                                           | Resolution                                                                         |
| -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Typographer vs Brand Guardian    | Font choice appropriate for brand but poor hierarchy | Add weight/size variants within the chosen family                                  |
| Color Theorist vs UX Purist      | Beautiful palette but insufficient contrast          | Adjust specific shades (usually lighten text or darken surface)                    |
| Layout Architect vs UX Purist    | Asymmetry hurts scannability                         | Constrain asymmetry to hero/features, use consistent grid for interactive sections |
| Brand Guardian vs Color Theorist | Brand colors don't form a harmonious palette         | Extend brand color into full scale, add complementary neutrals                     |
| Everyone vs everyone             | Brief is fundamentally conflicting                   | Revisit brief — likely trying to serve too many audiences                          |

---

## Quick Reference: Iteration Cheat Sheet

```
Iteration 1: EXPLORE — 3 radically different approaches
Iteration 2: FOCUS — Selected direction, 3 refinements
Iteration 3: POLISH — Confirmed decisions locked, polish details
Iteration 4: FINAL — Last chance. If not converging, flag for escalation.
```

### Rules

1. Never start from scratch after iteration 1 — always carry forward confirmed decisions
2. Council feedback must be SPECIFIC and MEASURABLE — "increase contrast to 4.5:1" not "improve contrast"
3. User selection is sacred — never override what the user chose
4. Confirmed decisions can only be unlocked if the user explicitly requests it
5. Score comparison between iterations must be visible — show improvement trajectory
6. If a dimension drops between iterations, investigate why (regression = bug)
