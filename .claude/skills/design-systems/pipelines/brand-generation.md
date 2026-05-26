# Pipeline: BRAND.md to Visual Identity

Generate a complete visual identity from an agent's SOUL.md and name. Produces BRAND.md, theme-tokens.json, Nano Banana image prompt, and feeds into the logo-svg pipeline.

---

## Pipeline Steps

```
1. Read SOUL.md → 2. Extract Symbolic Meaning → 3. Select Typography
       ↓                                                   ↓
4. Generate Color Palette → 5. Create BRAND.md → 6. Generate theme-tokens.json
       ↓                                                   ↓
7. Nano Banana Hero Prompt → 8. Feed into logo-svg.md pipeline
```

---

## Step 1: Read Agent's SOUL.md

### Prompt Template

```
Read the agent's SOUL.md and extract the identity foundation:

SOUL.MD CONTENT:
{full SOUL.md text}

Extract:
1. CORE IDENTITY: What is this agent? (one sentence)
2. PERSONALITY KEYWORDS: 5 adjectives that define the agent's character
3. DOMAIN: What vertical/industry does this agent serve?
4. AUDIENCE: Who interacts with this agent?
5. TONE: How does the agent communicate? (formal/casual/playful/precise/warm)
6. VALUES: What principles guide the agent's behavior?
7. BOUNDARIES: What the agent won't do (implies what it WILL do)
8. EMOTIONAL REGISTER: What should the user FEEL when interacting?

Output as structured identity profile.
```

---

## Step 2: Extract Symbolic Meaning from Name

### Prompt Template

```
The agent is named "{AGENT_NAME}".

Analyze the symbolic meaning:

1. LITERAL MEANING: What does the word literally mean?
2. SYMBOLIC ASSOCIATIONS: What concepts/feelings does this word evoke? (list 5-7)
3. VISUAL METAPHORS: What visual elements does this name suggest? (list 3-5)
4. COLOR ASSOCIATIONS: What colors naturally associate with this name? (list 2-3)
5. MOVEMENT QUALITY: Is this name static, flowing, explosive, precise, organic?
6. MATERIAL QUALITY: Does this name feel metallic, organic, ethereal, geometric, textured?

EXAMPLES:
- "Spark" → ignition, energy, beginning, warm colors (amber/rose), explosive movement, fire/light
- "Ribbon" → flowing, gift, celebration, connection, soft colors (purple/pink), smooth movement, fabric
- "Compass" → direction, exploration, precision, trustworthy, cool colors (blue/teal), steady movement, metal
- "Forge" → creation, heat, craftsmanship, strength, warm colors (amber/orange), powerful movement, metal
- "Quill" → writing, precision, creativity, elegance, ink colors (indigo/navy), flowing movement, organic

Output the symbolic profile to inform typography and color decisions.
```

---

## Step 3: Select Vertical-Appropriate Typography System

### Prompt Template

```
Select typography for agent "{AGENT_NAME}" in the "{DOMAIN}" vertical.

PERSONALITY: {keywords from step 1}
SYMBOLIC QUALITY: {from step 2 — flowing/precise/explosive/organic}
TONE: {from step 1}

ENERGY DESIGN RULES:
- Serif + sans-serif pairing is MANDATORY (anti-AI-look)
- Display/headings: serif font
- Body/UI: sans-serif font
- Code: monospace (if applicable)

Select from these curated pairings (or propose alternatives with rationale):

EDITORIAL PAIRINGS:
| Display (Serif)        | Body (Sans)      | Vibe                        | Best For                   |
| ---------------------- | ---------------- | --------------------------- | -------------------------- |
| Instrument Serif       | Poppins          | Warm, modern editorial      | Default Energy brand       |
| Playfair Display       | Inter            | Elegant, classic            | Luxury, fashion, lifestyle |
| Fraunces               | DM Sans          | Playful editorial           | Creative, food, lifestyle  |
| Lora                   | Source Sans 3    | Academic, trustworthy       | Healthcare, education      |
| Cormorant Garamond     | Work Sans        | Refined, literary           | Writing, publishing        |
| Libre Baskerville      | Figtree          | Traditional + modern        | Finance, legal, editorial  |
| DM Serif Display       | Nunito Sans      | Bold, contemporary          | SaaS, tech, startups       |
| Crimson Pro            | Plus Jakarta Sans| Sophisticated, readable     | Media, journalism          |

For each selected font, specify:
- Google Fonts URL (or next/font import)
- Weights to load (minimize for performance)
- Recommended size scale (display, h1-h3, body, small, code)
- Letter-spacing adjustments (if any)
- Why this pairing fits the agent's personality
```

---

## Step 4: Generate Color Palette

### Prompt Template

```
Generate a complete color palette for agent "{AGENT_NAME}".

INPUTS:
- Personality keywords: {from step 1}
- Symbolic color associations: {from step 2}
- Domain: {from step 1}
- Emotional register: {from step 1}

CONSTRAINTS:
- Primary color must pass WCAG AA on warm black (#141312) background
- 10-shade scale (50-950) for primary brand color
- Warm neutrals (not pure gray — hint of brand undertone)
- Must work in dark mode (Energy is dark-mode-first)
- Avoid generic AI purple/pink (unless brand genuinely calls for it)
- No pure black or pure white

Generate:

### Brand Primary (10-shade scale)
| Shade | Hex     | Usage                                          |
| ----- | ------- | ---------------------------------------------- |
| 50    | #...    | Subtle backgrounds, hover states               |
| 100   | #...    | Light backgrounds, badge fills                 |
| 200   | #...    | Borders, dividers in light mode                |
| 300   | #...    | Disabled text on dark backgrounds              |
| 400   | #...    | Body text on dark bg, icon default             |
| 500   | #...    | PRIMARY — CTAs, links, accents                 |
| 600   | #...    | Hover state for primary buttons                |
| 700   | #...    | Active state, pressed buttons                  |
| 800   | #...    | Dark text on light backgrounds                 |
| 900   | #...    | Darkest shade for high-contrast text            |
| 950   | #...    | Near-black with brand undertone                |

### Accent Color
- Hex: #...
- Usage: Secondary CTAs, highlights, decorative elements
- Relationship to primary: {complementary / analogous / triadic}

### Surface Colors (Dark Mode)
| Token           | Value                    | Usage                    |
| --------------- | ------------------------ | ------------------------ |
| bg-primary      | #141312                  | Main background          |
| bg-secondary    | #0a0a0a                  | Panels, footer           |
| bg-surface      | rgba(255,255,255,0.03)   | Cards, inputs            |
| bg-surface-hover| rgba(255,255,255,0.06)   | Card hover               |
| bg-brand-subtle | rgba({brand-500},0.1)    | Brand-tinted sections    |

### Text Colors
| Token          | Value                    | Usage                    |
| -------------- | ------------------------ | ------------------------ |
| text-primary   | #e5e5e5                  | Main text                |
| text-secondary | #a3a3a3                  | Supporting text          |
| text-muted     | rgba(255,255,255,0.3)    | Placeholder, disabled    |
| text-brand     | {brand-400}              | Links, emphasis          |

### Semantic Colors
| Token   | Hex     | Usage              |
| ------- | ------- | ------------------ |
| success | #10B981 | Positive states    |
| warning | #F59E0B | Caution states     |
| error   | #EF4444 | Error states       |
| info    | #3B82F6 | Informational      |

VERIFY: Run contrast checks for:
- text-primary on bg-primary: must be >= 4.5:1
- text-secondary on bg-primary: must be >= 4.5:1
- text-brand on bg-primary: must be >= 4.5:1
- brand-500 (as button text bg) with white text: must be >= 4.5:1
```

---

## Step 5: Create Full BRAND.md

### Output Template

```markdown
# {Agent Name}

**Tagline:** {one-line value proposition}

**Description:** {2-3 sentence description of what the agent does and who it serves}

## Colors

- Primary: {brand-500} ({tailwind name})
- Secondary: {brand-300 or accent}
- Accent: {accent color}
- Background: #141312 (warm black)

### Full Brand Scale

| Shade | Hex  |
| ----- | ---- |
| 50    | #... |
| 100   | #... |
| 200   | #... |
| 300   | #... |
| 400   | #... |
| 500   | #... |
| 600   | #... |
| 700   | #... |
| 800   | #... |
| 900   | #... |
| 950   | #... |

## Typography

- Display: {serif font} (headings, hero text)
- Body: {sans font} (UI, paragraphs, navigation)
- Code: {mono font} (if applicable)

## Personality Keywords

{word1}, {word2}, {word3}, {word4}, {word5}

## Visual Identity

- **Symbolic Meaning:** {from step 2 — what the name represents}
- **Movement Quality:** {from step 2 — flowing/precise/explosive/organic}
- **Material Quality:** {from step 2 — metallic/organic/ethereal/geometric}
- **Visual Metaphors:** {from step 2 — 3-5 visual concepts for imagery}

## Logo

See logo-svg.md pipeline output. Logo mark + wordmark variants.

## Voice & Tone

- {Tone description from SOUL.md}
- {How the agent speaks to users}
- {What language it avoids}
```

---

## Step 6: Generate theme-tokens.json

### Prompt Template

```
Convert the BRAND.md into a machine-readable theme-tokens.json.

BRAND.MD:
{full content from step 5}

Output:

{
  "name": "{agent_name}",
  "version": "1.0.0",
  "colors": {
    "brand": {
      "50": "{hex}", "100": "{hex}", "200": "{hex}", "300": "{hex}",
      "400": "{hex}", "500": "{hex}", "600": "{hex}", "700": "{hex}",
      "800": "{hex}", "900": "{hex}", "950": "{hex}"
    },
    "accent": "{hex}",
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
    "display": {
      "family": "{serif font}",
      "fallback": "serif",
      "weights": [400, 700],
      "googleFontsUrl": "https://fonts.googleapis.com/css2?family=..."
    },
    "body": {
      "family": "{sans font}",
      "fallback": "sans-serif",
      "weights": [400, 500, 600],
      "googleFontsUrl": "https://fonts.googleapis.com/css2?family=..."
    },
    "code": {
      "family": "{mono font}",
      "fallback": "monospace",
      "weights": [400],
      "googleFontsUrl": "https://fonts.googleapis.com/css2?family=..."
    },
    "scale": {
      "display": { "size": "48px", "weight": 400, "lineHeight": 1.2, "letterSpacing": "-0.02em" },
      "h1": { "size": "32px", "weight": 600, "lineHeight": 1.3 },
      "h2": { "size": "24px", "weight": 600, "lineHeight": 1.4 },
      "h3": { "size": "20px", "weight": 500, "lineHeight": 1.4 },
      "body": { "size": "16px", "weight": 400, "lineHeight": 1.6 },
      "small": { "size": "14px", "weight": 400, "lineHeight": 1.5 },
      "caption": { "size": "12px", "weight": 400, "lineHeight": 1.5 },
      "code": { "size": "14px", "weight": 400, "lineHeight": 1.5 }
    }
  },
  "spacing": {
    "unit": 8,
    "scale": {
      "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px",
      "xl": "32px", "2xl": "48px", "3xl": "64px", "4xl": "80px", "5xl": "120px"
    }
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
  },
  "personality": {
    "keywords": ["{word1}", "{word2}", "{word3}", "{word4}", "{word5}"],
    "movement": "{flowing/precise/explosive/organic}",
    "material": "{metallic/organic/ethereal/geometric}",
    "symbolism": "{symbolic meaning of name}"
  }
}
```

---

## Step 7: Nano Banana Hero Image Prompt (Optional)

### Prompt Template

```
Generate a Nano Banana 2 image prompt for agent "{AGENT_NAME}".

SYMBOLIC MEANING: {from step 2}
VISUAL METAPHORS: {from step 2}
BRAND COLORS: {primary hex from step 4}
EMOTIONAL REGISTER: {from step 1}

Template:
[Conceptual illustration of {visual metaphor}].
Dark background with {brand color} gradient accents.
{Movement quality} composition. {Material quality} textures.
Modern editorial style. Professional, evocative.
No text overlay. 1200x675, 16:9 aspect ratio.

Generate 3 prompt variants:
1. Abstract/geometric interpretation
2. Organic/natural interpretation
3. Metaphorical/conceptual interpretation

Execute via:
gemini --yolo "/generate '{PROMPT}' --count=3 --aspect=16:9"
```

---

## Step 8: Feed into Logo Pipeline

After generating BRAND.md and theme-tokens.json, the outputs feed directly into `pipelines/logo-svg.md` for logo generation.

Pass forward:

- Agent name
- Personality keywords
- Symbolic meaning
- Primary brand color (hex)
- Movement quality
- Material quality
- Visual metaphors

---

## Output Package

The complete brand generation pipeline produces:

```
1. BRAND.md                  — Complete brand identity document
2. theme-tokens.json         — Machine-readable design tokens
3. hero-image-prompts.md     — 3 Nano Banana prompt variants
4. typography-rationale.md   — Font selection reasoning
5. color-rationale.md        — Palette generation reasoning
6. → feeds into logo-svg.md  — Logo generation pipeline
```

### Council Integration

Submit the brand identity to the Design Council for review. The Brand Guardian persona has primary authority, but all 5 personas evaluate the brand's visual expression across their dimensions.
