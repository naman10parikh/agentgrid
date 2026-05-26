# Pipeline: SVG Logo Generation

Generate clean, scalable SVG logos for Energy agents. Outputs logo mark, wordmark variants, favicon, and both light-on-dark and dark-on-light versions.

---

## Pipeline Steps

```
1. Symbolic Extraction → 2. SVG Generation (5 concepts) → 3. Quality Check
                                                                   ↓
                           4. Variant Generation → Output Package
```

---

## Step 1: Symbolic Extraction

From the agent's name and purpose, generate 5 symbolic concepts with rationale.

### Prompt Template

```
Generate 5 logo concepts for agent "{AGENT_NAME}".

AGENT PURPOSE: {one-sentence from SOUL.md}
SYMBOLIC MEANING: {from brand-generation pipeline step 2}
VISUAL METAPHORS: {3-5 from brand-generation}
BRAND COLOR: {primary hex from theme-tokens.json}
MOVEMENT QUALITY: {flowing/precise/explosive/organic}
MATERIAL QUALITY: {metallic/organic/ethereal/geometric}

LOGO CONSTRAINTS:
- Abstract > literal (a compass agent should NOT be a literal compass icon)
- Maximum 8 path elements (simplicity = recognizability)
- Must work at 16x16px AND 512x512px
- Must work in monochrome (single color)
- ViewBox: 0 0 64 64
- No text in SVG (logo mark only — wordmark is separate)
- Geometric/abstract forms preferred

Generate 5 concepts:

CONCEPT 1: {name}
- Visual: {1-sentence description of the abstract form}
- Rationale: {how it connects to the agent's purpose and name}
- Geometric basis: {circle / triangle / square / hexagon / organic curve}
- Complexity: {N path elements}

CONCEPT 2: {name}
...

CONCEPT 3: {name}
...

CONCEPT 4: {name}
...

CONCEPT 5: {name}
...

For each concept, prioritize:
1. Does it FEEL like the agent's personality? (warm/precise/playful/powerful)
2. Is it unique enough to be recognizable? (not a generic icon)
3. Is it simple enough for 16x16 favicon? (the squint test)
4. Does it avoid vertical cliches? (no stethoscope for health, no chart for finance)
```

---

## Step 2: SVG Generation

For each selected concept (top 3 from step 1), generate clean SVG code.

### SVG Constraints

```xml
<!-- Template structure -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <!-- Maximum 8 path/shape elements -->
  <!-- Use currentColor for brand color (enables CSS color override) -->
  <!-- Prefer <path> over <circle>, <rect> for complex shapes -->
  <!-- Simple shapes OK: <circle>, <rect>, <line> when appropriate -->
  <!-- No <text>, <image>, <foreignObject> -->
  <!-- No gradients in the mark itself (add in variant step) -->
  <!-- Stroke-based OR fill-based, not mixed (pick one per concept) -->
</svg>
```

### Prompt Template

```
Generate clean SVG code for logo concept "{CONCEPT_NAME}".

DESCRIPTION: {visual description from step 1}
BRAND COLOR: {hex}
GEOMETRIC BASIS: {from step 1}
COMPLEXITY TARGET: {N path elements}

SVG REQUIREMENTS:
- viewBox="0 0 64 64"
- fill="none" on root SVG
- Use "{BRAND_COLOR}" for the primary color
- Maximum 8 path/shape elements
- All paths must be optimized (no redundant points)
- Center the mark in the viewBox with ~4px padding on each side
- Paths should be smooth (use cubic beziers for curves)

OUTPUT: Complete SVG code, validated and renderable.
```

### Example SVG Logos (Quality Bar Reference)

**Example 1: "Spark" — Ignition/energy concept**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <!-- Radiating diamond burst — 4 rotated diamonds around center -->
  <path d="M32 8 L36 28 L32 32 L28 28 Z" fill="#E11D48"/>
  <path d="M56 32 L36 36 L32 32 L36 28 Z" fill="#E11D48"/>
  <path d="M32 56 L28 36 L32 32 L36 36 Z" fill="#E11D48"/>
  <path d="M8 32 L28 28 L32 32 L28 36 Z" fill="#E11D48"/>
  <!-- Inner glow circle -->
  <circle cx="32" cy="32" r="6" fill="#E11D48" opacity="0.6"/>
</svg>
```

5 elements. Radiating energy. Works at any size. Monochrome-safe.

**Example 2: "Compass" — Abstract directional mark**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <!-- Asymmetric arrow/direction indicator -->
  <path d="M32 6 L44 32 L32 26 L20 32 Z" fill="#0EA5E9"/>
  <path d="M32 58 L20 32 L32 38 L44 32 Z" fill="#0EA5E9" opacity="0.4"/>
  <!-- Orbit ring -->
  <circle cx="32" cy="32" r="24" stroke="#0EA5E9" stroke-width="1.5" opacity="0.3"/>
  <!-- Center dot -->
  <circle cx="32" cy="32" r="3" fill="#0EA5E9"/>
</svg>
```

4 elements. Directional without being a literal compass. North arrow is prominent, south is faded.

**Example 3: "Ribbon" — Flowing continuity mark**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <!-- Flowing ribbon form — single continuous path with two loops -->
  <path
    d="M12 20 C12 20 24 16 32 28 C40 40 52 36 52 36"
    stroke="#8B5CF6"
    stroke-width="4"
    stroke-linecap="round"
  />
  <path
    d="M12 44 C12 44 24 40 32 28 C40 16 52 20 52 20"
    stroke="#8B5CF6"
    stroke-width="4"
    stroke-linecap="round"
    opacity="0.5"
  />
  <!-- Intersection accent -->
  <circle cx="32" cy="28" r="3" fill="#8B5CF6"/>
</svg>
```

3 elements. Flowing, connected, gift-like. Two paths crossing create a knot/bow feeling.

---

## Step 3: Quality Check

The Brand Guardian persona evaluates each generated logo against these criteria.

### Quality Checklist

```
LOGO: {concept name}
AGENT: {agent name}

[ ] SYMBOLISM: Logo relates to agent purpose without being literal
    - Does the mark FEEL like the agent? (personality match)
    - Does it avoid cliche? (no literal object icons)

[ ] SCALABILITY: Recognizable at 16x16 AND 512x512
    - Squint test: can you tell what it is at arm's length?
    - Favicon test: does it work as a browser tab icon?
    - Does it hold shape when scaled down? (no details that collapse)

[ ] MONOCHROME: Works as single color on any background
    - Remove all opacity variations — does the structure hold?
    - Render in pure white on black, pure black on white — both work?

[ ] SIMPLICITY: 8 or fewer path elements
    - Count: {N} elements
    - Could any element be removed without losing the concept?
    - Is every element load-bearing?

[ ] VERTICAL NEUTRALITY: Avoids industry cliches
    - Not a literal representation of the agent's function
    - Could be respected in adjacent verticals
    - Feels premium, not clip-art

[ ] TECHNICAL QUALITY: Clean SVG code
    - Valid SVG (parseable by browser)
    - No unnecessary attributes
    - Optimized paths (no redundant control points)
    - Correct viewBox (0 0 64 64)
    - No text elements

SCORE: {pass / needs revision / reject}
FEEDBACK: {specific changes if not passing}
```

---

## Step 4: Variant Generation

For the selected logo concept (highest scoring from step 3), generate all required variants.

### Variant A: Mark Only (Primary)

The base logo mark as designed. This is the master file.

```
Filename: logo-mark.svg
ViewBox: 0 0 64 64
Colors: Brand primary
Usage: Anywhere the logo appears alone
```

### Variant B: Mark + Wordmark (Horizontal)

```
Filename: logo-horizontal.svg
ViewBox: 0 0 200 64
Layout: [Mark 64x64] [16px gap] [Wordmark]

Wordmark specification:
- Font: Display font from theme-tokens.json (render as SVG paths, NOT as <text>)
- Weight: 400-600 (match brand personality)
- Size: Baseline-aligned with mark center
- Color: text-primary (#e5e5e5) or brand-500
- Letter-spacing: 0.02em for serif, -0.01em for tight sans
```

### Variant C: Mark + Wordmark (Stacked)

```
Filename: logo-stacked.svg
ViewBox: 0 0 120 96
Layout:
  [Mark 64x64, centered]
  [12px gap]
  [Wordmark, centered below]

Usage: Square-ish contexts (social media profile, splash screen)
```

### Variant D: Favicon (Simplified)

```
Filename: favicon.svg
ViewBox: 0 0 32 32
Changes from mark:
- Remove any elements that collapse at 16x16
- Increase stroke widths by 1.5x
- Simplify curves (fewer control points)
- Ensure 2px minimum padding from viewBox edge
- Maximum 4 path elements

Also generate:
- favicon-16.png (16x16)
- favicon-32.png (32x32)
- favicon-192.png (192x192, for Android)
- apple-touch-icon.png (180x180)
```

### Variant E: Dark-on-Light

```
Filename: logo-mark-light.svg
Changes: Invert colors
- Brand color paths → brand-800 or brand-900
- If background assumed: warm white (#fafaf9) or zinc-50
- Ensure contrast ratio >= 4.5:1
```

### Variant F: Light-on-Dark

```
Filename: logo-mark-dark.svg
Changes: Standard brand colors on dark background
- Same as primary mark
- Ensure contrast ratio >= 4.5:1 on #141312
```

### Variant G: Monochrome

```
Filename: logo-mark-mono.svg
Changes:
- All fills/strokes → currentColor
- Remove all opacity variations
- Structure must hold without color differentiation
- Test: render in pure white AND pure black
```

---

## Output Package

The complete logo pipeline produces:

```
logos/
  logo-mark.svg              — Primary mark (64x64)
  logo-horizontal.svg        — Mark + wordmark horizontal (200x64)
  logo-stacked.svg           — Mark + wordmark stacked (120x96)
  favicon.svg                — Simplified mark (32x32)
  logo-mark-light.svg        — Dark-on-light variant
  logo-mark-dark.svg         — Light-on-dark variant
  logo-mark-mono.svg         — Monochrome (currentColor)
  concepts/
    concept-1.svg            — All 5 initial concepts
    concept-2.svg
    concept-3.svg
    concept-4.svg
    concept-5.svg
  logo-spec.md               — Concept rationale + quality check results
```

### Integration Points

- **App Factory:** logo-mark.svg used in site header, favicon.svg for browser tab
- **BRAND.md:** Logo section references generated files
- **theme-tokens.json:** Logo colors align with brand scale
- **Social media:** logo-stacked.svg for profile images, logo-horizontal.svg for banners
