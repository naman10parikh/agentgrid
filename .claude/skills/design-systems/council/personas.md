# Design Council: 5 Review Personas

Every design artifact goes through 5 independent persona reviews before shipping. Each persona evaluates a different dimension of design quality. Minimum threshold: ALL 5 must score 7+/10, total must be 38+/50.

---

## Persona 1: The Typographer

**Focus:** Font choice, hierarchy, scale, readability, pairing harmony.

**Kills immediately:**

- Default system fonts (San Francisco, Arial, Roboto used without intention)
- Inconsistent font sizing across same hierarchy level
- Poor line-height (below 1.4 for body, below 1.2 for display)
- Orphans/widows in hero text
- Missing font fallback stack
- More than 3 font families in a single design

### Scoring (5 dimensions, 2pts each = 10pts)

**1. Type System Coherence (2pts)**

- 0pts: No defined type scale. Sizes are ad-hoc, inconsistent across pages.
- 1pt: Type scale exists but has gaps (e.g., heading sizes jump from 32px to 14px with nothing between).
- 2pts: Complete type scale with clear progression (e.g., 12/14/16/20/24/32). Every text element maps to a defined level. No orphan sizes.

**2. Hierarchy Clarity (2pts)**

- 0pts: Reader cannot distinguish heading from subheading from body at a glance. Weight/size differences are too subtle (<2px or <100 weight).
- 1pt: Primary heading is clear, but secondary and tertiary levels blur together. OR hierarchy relies solely on size with no weight/color variation.
- 2pts: Every hierarchy level is instantly distinguishable through a combination of size, weight, and/or color. Heading contrast ratio is 1.5x+ between adjacent levels.

**3. Readability at All Sizes (2pts)**

- 0pts: Body text below 14px, or line-height below 1.4. Text is unreadable on mobile. Line lengths exceed 80ch.
- 1pt: Body text is readable, but secondary/caption text is too small (<11px) or line-height is tight in long paragraphs.
- 2pts: All text levels are comfortable to read. Body: 14-16px, line-height 1.5-1.7. Max line length 65-75ch. Caption text >= 11px. Adequate letter-spacing on uppercase text.

**4. Pairing Quality (2pts)**

- 0pts: Fonts clash in mood (e.g., Comic Sans + Didot). No intentional pairing rationale.
- 1pt: Fonts are safe but generic (e.g., Roboto + Roboto). No personality. OR serif + sans-serif pair but with mismatched x-heights.
- 2pts: Intentional pairing with complementary characteristics. Serif display + sans-serif body (the anti-AI-look pairing). Matched x-heights. Shared geometric affinity or deliberate contrast.

**5. Vertical Appropriateness (2pts)**

- 0pts: Typography choice ignores the vertical entirely. A fintech product uses a playful handwriting font. A children's app uses a condensed corporate sans.
- 1pt: Font choice is safe/neutral for the vertical but doesn't enhance the brand story.
- 2pts: Typography actively reinforces the vertical's personality. Healthcare: clean, trustworthy, generous spacing. Creative: expressive display, editorial feel. Finance: precise, structured, confident.

### Example Evaluation

```
ARTIFACT: Landing page for "Compass" (travel planning agent)
---
Type System Coherence: 2/2 — Scale: 12/14/16/20/24/32/48. All text maps cleanly.
Hierarchy Clarity: 1/2 — H2 and H3 are only 2px apart (20 vs 18). Needs more contrast.
Readability: 2/2 — Body 16px, line-height 1.6, max-width 68ch. Captions at 12px.
Pairing Quality: 2/2 — Instrument Serif display + Poppins body. x-heights aligned.
Vertical Appropriateness: 2/2 — Serif display feels editorial/exploratory. Fits travel.
---
TOTAL: 9/10 PASS
ACTION: Increase H3 to 16px or H2 to 22px for clearer sub-hierarchy.
```

---

## Persona 2: The Color Theorist

**Focus:** Palette harmony, contrast ratios, emotional resonance, dark mode quality.

**Kills immediately:**

- Contrast ratio below WCAG AA (4.5:1 for body, 3:1 for large text)
- Color as the sole indicator of state (no icon or text backup)
- Generic AI purple/pink gradients (Energy rule: warm, editorial, grounded)
- More than 5 hues in the primary palette (excluding grays)
- Pure black (#000000) backgrounds (use warm black #141312)
- Pure white (#FFFFFF) text on dark backgrounds (use zinc-100/200)

### Scoring (5 dimensions, 2pts each = 10pts)

**1. Palette Coherence (2pts)**

- 0pts: Colors appear random. No shared undertone or harmony model. Palette looks like a random color picker sample.
- 1pt: Colors are related but lack a unifying principle (e.g., all warm but ranging from orange to magenta without purpose).
- 2pts: Palette follows a deliberate harmony model (complementary, analogous, split-complementary, or triadic). All colors share a consistent undertone. 10-shade scale with clear primary/accent/neutral separation.

**2. Contrast Compliance (2pts)**

- 0pts: Multiple text/background combos fail WCAG AA. Placeholder text is invisible. Borders vanish.
- 1pt: Body text passes AA, but secondary text, disabled states, or icon-only elements fail. OR passes in light mode but fails in dark mode.
- 2pts: All text passes WCAG AA (4.5:1 body, 3:1 large). Interactive element borders visible. Focus indicators have 3:1 contrast. Passes in BOTH light and dark mode.

**3. Emotional Fit (2pts)**

- 0pts: Colors contradict the product's purpose (e.g., aggressive red for a meditation app, sterile gray for a party planner).
- 1pt: Colors are neutral/safe but don't enhance emotional resonance. "It doesn't hurt, but it doesn't help."
- 2pts: Color palette actively reinforces the product's emotional register. A date planner feels warm and intimate (rose tones). A finance tool feels precise and trustworthy (deep blue/green). The user's first impression aligns with intended feeling.

**4. Dark Mode Quality (2pts)**

- 0pts: Dark mode is an afterthought. Text disappears. Borders are invisible. Cards have no visual separation from background.
- 1pt: Dark mode works but feels flat. Single background tone. No layered depth. Shadows are invisible.
- 2pts: Dark mode uses layered surfaces (#141312 base, rgba(255,255,255,0.03) cards, rgba(255,255,255,0.06) hover). Borders use alpha channels that work in both modes. Elevation is conveyed through surface lightness, not shadows.

**5. Brand Differentiation (2pts)**

- 0pts: The palette is indistinguishable from a default Tailwind/Material palette. No custom brand color.
- 1pt: Has a brand color but doesn't extend it into a full system (just primary, no 10-shade scale).
- 2pts: Full 10-shade brand scale (50-950). Brand color appears in accent elements, gradients, focus rings, and selection states. The palette is recognizable as THIS product, not a generic template.

### Example Evaluation

```
ARTIFACT: Component library for "Forge" (code automation agent)
---
Palette Coherence: 2/2 — Analogous amber/orange family. 10 shades. Gray neutrals with warm undertone.
Contrast Compliance: 1/2 — Body text passes (6.2:1). But disabled button label (amber-400 on amber-900) is 2.8:1. Fails AA.
Emotional Fit: 2/2 — Amber/forge colors = creation, heat, craftsmanship. Spot-on for a code tool.
Dark Mode Quality: 2/2 — Three surface layers. Alpha borders. Card elevation via surface lightness.
Brand Differentiation: 2/2 — Full amber scale. Focus rings are amber-500/50. Selection = amber-400/20.
---
TOTAL: 9/10 PASS
ACTION: Increase disabled label to amber-300 on amber-900 (4.7:1) to pass AA.
```

---

## Persona 3: The Layout Architect

**Focus:** Grid system, whitespace rhythm, visual hierarchy, responsive behavior, asymmetry.

**Kills immediately:**

- Perfectly symmetric card grids (3x3, 4x4 — signals AI-generated)
- Cramped spacing (less than 16px between major sections)
- CTAs buried below the fold with no visual emphasis
- Layout that breaks at any standard breakpoint (320, 768, 1024, 1440px)
- Consistent card sizes throughout (should vary for visual interest)

### Scoring (5 dimensions, 2pts each = 10pts)

**1. Grid Quality (2pts)**

- 0pts: No discernible grid. Elements are positioned arbitrarily. Alignment inconsistencies visible.
- 1pt: Uses a grid but it's the obvious default (12-column, equal gutters, centered). Functional but uninspired.
- 2pts: Intentional grid with purposeful column variation. Bento-style layouts (3+2 splits, asymmetric panels). Grid serves the content hierarchy, not the other way around.

**2. Whitespace Rhythm (2pts)**

- 0pts: Spacing is inconsistent. Some sections cramped, others swimming. No spatial system.
- 1pt: Uses consistent spacing but at a single scale (e.g., 24px everywhere). Monotonous rhythm.
- 2pts: Multi-scale spacing system (8px unit base). Section gaps > component gaps > element gaps. Breathing room around hero. Progressive density increase as user scrolls deeper.

**3. Visual Hierarchy (2pts)**

- 0pts: Everything competes for attention. No clear entry point. The eye bounces randomly.
- 1pt: Primary focal point exists (hero), but secondary and tertiary content lack clear ordering.
- 2pts: Clear Z-pattern or F-pattern reading flow. Hero dominates. CTAs are visually prominent. Supporting content is clearly subordinate. The eye follows the intended path.

**4. Responsiveness (2pts)**

- 0pts: Layout breaks below 768px. Content overflows. Touch targets overlap. Horizontal scroll appears.
- 1pt: Responsive but naive (everything stacks vertically on mobile). No adaptation to tablet middle ground.
- 2pts: Thoughtful adaptation at each breakpoint. Bento grid re-arranges (not just stacks). Navigation collapses gracefully. Images resize proportionally. Touch targets >= 44px. Content priority shifts for mobile (CTA moves up).

**5. Asymmetric Interest (2pts)**

- 0pts: Perfectly symmetric layout. Equal columns. Centered everything. "Template feel."
- 1pt: Some asymmetry exists but feels accidental rather than intentional.
- 2pts: Deliberate asymmetric compositions. Hero image bleeds to one side. Feature cards vary in size. Section backgrounds break the grid. MOBBIN-inspired editorial feel. Asymmetry creates visual tension and guides the eye.

### Example Evaluation

```
ARTIFACT: Landing page for "Ribbon" (gift planning agent)
---
Grid Quality: 2/2 — 3+2 bento split in features. Hero is full-width asymmetric.
Whitespace Rhythm: 1/2 — Section gaps are consistent (64px) but component gaps match (also 64px). Needs tighter component grouping.
Visual Hierarchy: 2/2 — Hero headline commands entry. CTA floats above fold. Features ladder down.
Responsiveness: 2/2 — Bento rearranges to 1+1 on mobile. CTA moves to sticky bottom bar.
Asymmetric Interest: 2/2 — Hero image bleeds right. Feature cards alternate large/small. Editorial feel.
---
TOTAL: 9/10 PASS
ACTION: Reduce component gaps to 32px while keeping section gaps at 64px for clearer rhythm.
```

---

## Persona 4: The UX Purist

**Focus:** Interactions, cognitive load, accessibility, trust signals, flow completeness.

**Kills immediately:**

- Modals for inline actions (use inline cards, toasts, or slide-ups)
- Missing loading states (no context about what's happening)
- Invisible focus indicators (keyboard users are stuck)
- Loading spinners without context ("Searching restaurants..." not just a spinner)
- Placeholder images (gray boxes instead of gradients or icons)
- Missing error states for any interactive element

### Scoring (5 dimensions, 2pts each = 10pts)

**1. Interaction Coherence (2pts)**

- 0pts: Interactions feel random. Some buttons have hover states, others don't. Click targets are inconsistent. No feedback on actions.
- 1pt: Interactions exist but are inconsistent. Primary buttons have states, but secondary elements (links, toggles, cards) lack corresponding treatment.
- 2pts: Every interactive element has consistent state progression: default -> hover -> active -> focus -> disabled. Cursor changes appropriately. Feedback is immediate (<100ms perceived). Transitions are smooth (200-300ms).

**2. Cognitive Simplicity (2pts)**

- 0pts: User faces choice overload. 10+ navigation items visible. Forms request unnecessary information. Features are not progressively disclosed.
- 1pt: Primary flow is clear, but secondary flows add confusion. Too many CTAs compete. Information density is high without visual hierarchy to compensate.
- 2pts: Primary action is obvious at every step. Navigation has 5-7 items maximum. Progressive disclosure hides complexity. Forms ask only what's needed NOW. One primary CTA per viewport.

**3. Accessibility (2pts)**

- 0pts: No ARIA labels. Tab order is broken. Screen reader gets garbage. Color is the only state indicator.
- 1pt: Basic ARIA labels exist. Tab order works. But landmark regions are missing, live regions don't announce dynamic content, and complex widgets lack proper roles.
- 2pts: Full ARIA implementation. Landmark regions (nav, main, aside). Live regions for dynamic content (aria-live="polite"). Proper roles for custom widgets. Skip-to-content link. All images have meaningful alt text. Screen reader testing passes.

**4. Trust Patterns (2pts)**

- 0pts: No explanation of what the agent is doing. Actions happen silently. User has no control or undo.
- 1pt: Agent explains actions after the fact, but there's no preview for high-stakes actions. Undo exists but is hard to find.
- 2pts: Intent preview for irreversible actions (booking, sending, spending). Audit log of all agent actions. Undo within 15 min for reversible actions. Explainable rationale ("I chose X because you said Y"). Autonomy dial visible.

**5. Flow Completeness (2pts)**

- 0pts: Happy path works but edge cases crash. Empty states are blank screens. Error states show raw error messages.
- 1pt: Happy path and one error path handled. But empty states are generic ("No results"). Loading states exist but are uninformative.
- 2pts: Every state is designed: empty (helpful guidance), loading (contextual messaging), error (friendly + retry), success (confirmation + next step), partial (graceful degradation). Edge cases handled: slow network, offline, session timeout, permission denied.

### Example Evaluation

```
ARTIFACT: Chat interface for "Spark" (date planning agent)
---
Interaction Coherence: 2/2 — All buttons: hover (bg-white/6), active (scale-95), focus (ring-2 ring-purple-500/50). 200ms transitions.
Cognitive Simplicity: 2/2 — Single input + 4 quick action buttons. Progressive disclosure of tools.
Accessibility: 1/2 — ARIA labels on buttons. Tab order correct. BUT tool timeline lacks role="list". Live region missing for tool status updates.
Trust Patterns: 2/2 — Confirmation gate before bookings. Audit log visible. Rationale after each decision.
Flow Completeness: 2/2 — Empty: "Tell Spark what kind of date you want." Loading: "Searching restaurants in Capitol Hill..." Error: friendly message + retry. Offline: cached results shown.
---
TOTAL: 9/10 PASS
ACTION: Add role="list" to ToolTimeline. Add aria-live="polite" region for tool status announcements.
```

---

## Persona 5: The Brand Guardian

**Focus:** Vertical fit, premium feel, anti-AI-look, emotional resonance, brand coherence.

**Kills immediately:**

- Output that looks like a default template (Tailwind defaults, shadcn defaults unmodified)
- Wrong emotional tone for the vertical (playful when it should be serious, corporate when it should be warm)
- Generic AI purple/pink gradient aesthetic
- Brand-visual disconnect (BRAND.md says "warm and intimate," design is cold and clinical)
- Stock photo usage (use generated/curated assets, gradients, or icons)

### Scoring (5 dimensions, 2pts each = 10pts)

**1. Vertical Fit (2pts)**

- 0pts: Design could belong to any product in any industry. No vertical-specific visual language.
- 1pt: Some vertical cues exist (e.g., medical cross for healthcare) but they're surface-level iconography rather than systemic design choices.
- 2pts: Design systemically reflects the vertical. Healthcare: generous whitespace, clean lines, trustworthy blue. Nightlife: high contrast, bold typography, energetic color. Finance: structured grid, precise alignment, muted palette. The vertical DNA permeates layout, color, typography, AND interaction patterns.

**2. Premium Feel (2pts)**

- 0pts: Looks like a free template or homework project. Default fonts. Default spacing. Unpolished.
- 1pt: Clean and functional but lacks the polish that separates "good" from "great." Missing micro-details: subtle gradients, refined shadows, custom illustrations.
- 2pts: Feels like a product people would pay for. Attention to micro-details: layered surfaces, subtle gradients on cards, refined border radii, custom icons or illustrations, thoughtful empty states. The "feel" tax has been paid.

**3. Anti-AI-Look (2pts)**

- 0pts: Screams "AI generated." Symmetric grids. Generic purple gradient hero. Default Tailwind colors. Sans-serif everything. Centered everything.
- 1pt: Some anti-AI signals (e.g., serif heading) but overall composition still feels template-generated.
- 2pts: Passes the "human designer" test. Serif + sans-serif pairing. Asymmetric layouts. Warm black (not pure black). Intentional imperfections in spacing. Editorial feel. Bento grids. MOBBIN-level composition. A human designer would nod, not wince.

**4. Emotional Resonance (2pts)**

- 0pts: The design is emotionally neutral. It doesn't make the user feel anything.
- 1pt: There's a mood, but it doesn't match the product's purpose. Or the mood is right but only surface-deep (color only, not reinforced by typography, spacing, imagery).
- 2pts: The design evokes the intended emotion through multiple channels. A date planner feels warm and exciting (warm colors, generous spacing, playful type). A security tool feels reassuring (structured, precise, cool palette). Emotion is conveyed through color + type + layout + imagery working together.

**5. Brand Coherence (2pts)**

- 0pts: BRAND.md says one thing, the design does another. Brand colors aren't used. Brand personality isn't reflected.
- 1pt: Brand colors appear but inconsistently. Brand voice is present in copy but not in visual design.
- 2pts: Every visual decision traces back to BRAND.md. Brand primary appears in CTAs, focus rings, accents, and selection states. Brand personality keywords manifest in typography, spacing, and imagery choices. The design IS the brand, not a container decorated with brand colors.

### Example Evaluation

```
ARTIFACT: Brand identity for "Quill" (writing assistant agent)
---
Vertical Fit: 2/2 — Editorial design language. Generous margins. Book-like proportions. Writing-centric layout.
Premium Feel: 2/2 — Custom serif display font. Subtle paper texture on cards. Refined hover states with ink-like transitions.
Anti-AI-Look: 2/2 — Serif display + sans body. Asymmetric hero. Warm black. Editorial bento grid.
Emotional Resonance: 2/2 — Feels like opening a beautiful notebook. Warm, thoughtful, inviting. Matches "creative, precise, inspiring" keywords.
Brand Coherence: 1/2 — Brand says "ink blue" (#1e3a5f) but CTA buttons use default purple. Focus rings use default blue.
---
TOTAL: 9/10 PASS
ACTION: Replace CTA background and focus rings with brand ink-blue. Ensure accent color flows through all interactive states.
```

---

## Council Process

1. Each persona scores the design artifact independently (no influence from other scores)
2. Scores are presented in a table for easy comparison
3. Actionable feedback is REQUIRED for any dimension scoring below 2
4. Feedback must be specific and measurable ("increase contrast from 3.2:1 to 4.5:1"), never vague ("make it pop")
5. The artifact passes only when ALL 5 personas score 7+/10 AND total is 38+/50

### Score Summary Template

```
| Persona            | D1 | D2 | D3 | D4 | D5 | Total | Pass? |
| ------------------ | -- | -- | -- | -- | -- | ----- | ----- |
| Typographer        |    |    |    |    |    |   /10 |       |
| Color Theorist     |    |    |    |    |    |   /10 |       |
| Layout Architect   |    |    |    |    |    |   /10 |       |
| UX Purist          |    |    |    |    |    |   /10 |       |
| Brand Guardian     |    |    |    |    |    |   /10 |       |
| **TOTAL**          |    |    |    |    |    |  /50  |       |

Threshold: Each >= 7/10, Total >= 38/50
Result: PASS / FAIL / NEEDS REVISION
```

### Red Flags (Automatic Rejection)

These trigger rejection regardless of score:

- Any WCAG AA contrast failure on body text
- Pure black (#000000) background
- Default system font with no custom type system
- Modal used for an inline action
- No loading state for any async operation
- Stock photo anywhere in the design
- Emoji used as a functional icon (decorative OK)
