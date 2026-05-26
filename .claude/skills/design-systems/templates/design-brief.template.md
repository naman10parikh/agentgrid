# Design Brief

## Project

- **Name:** {{PROJECT_NAME}}
- **Vertical:** {{VERTICAL}} (fintech | health | creative | devtools | consumer | enterprise | education | ecommerce)
- **Layout type:** {{LAYOUT_TYPE}} (landing-page | dashboard | chat | tool-picker | settings | auth | pricing)

## Audience

- **Primary user:** {{PRIMARY_USER}}
- **Technical literacy:** {{TECH_LITERACY}} (low | medium | high)
- **Device priority:** {{DEVICE_PRIORITY}} (mobile-first | desktop-first | equal)
- **Age range:** {{AGE_RANGE}}

## Purpose

- **Primary goal:** {{PRIMARY_GOAL}} (convert | onboard | inform | sell | manage | create)
- **Key action:** {{KEY_ACTION}} (what should the user DO after seeing this?)
- **Success metric:** {{SUCCESS_METRIC}} (signups | purchases | time-on-page | task completion)

## Tone & Personality

- **Emotional register:** {{EMOTIONAL_REGISTER}} (professional | playful | premium | minimal | bold | warm | clinical)
- **Brand personality (5 keywords):** {{KEYWORD_1}}, {{KEYWORD_2}}, {{KEYWORD_3}}, {{KEYWORD_4}}, {{KEYWORD_5}}
- **Voice:** {{VOICE}} (formal | conversational | technical | friendly | authoritative)

## Features & Sections

1. {{FEATURE_1}}
2. {{FEATURE_2}}
3. {{FEATURE_3}}
4. {{FEATURE_4}}
5. {{FEATURE_5}}
6. {{FEATURE_6}} (optional)
7. {{FEATURE_7}} (optional)

## Brand Context

- **Existing brand?** {{HAS_BRAND}} (yes | no — generate new)
- **Primary color:** {{PRIMARY_COLOR}} (hex or "auto-detect from vertical")
- **Display font:** {{DISPLAY_FONT}} (or "auto-select from vertical")
- **Body font:** {{BODY_FONT}} (or "auto-select from vertical")
- **Logo:** {{LOGO_STATUS}} (exists | needs generation | not applicable)

## Constraints

- **Must include:** {{MUST_INCLUDE}} (e.g., pricing table, testimonials, demo video)
- **Must avoid:** {{MUST_AVOID}} (e.g., no modals, no auto-play, no animations)
- **Accessibility target:** {{A11Y_TARGET}} (WCAG AA | WCAG AAA)
- **Performance budget:** {{PERF_BUDGET}} (e.g., < 3s LCP, < 200KB JS)

## Reference Sites

1. {{REFERENCE_1}} — what to learn from it
2. {{REFERENCE_2}} — what to learn from it
3. {{REFERENCE_3}} — what to learn from it

## Anti-Patterns to Avoid

Review `knowledge/anti-patterns.md` before designing. Key concerns for this brief:

- [ ] No symmetric card grids (use bento layout)
- [ ] No generic AI gradients (use vertical palette)
- [ ] No emoji as functional icons (use Lucide)
- [ ] No pure black backgrounds (use #141312)
- [ ] No single-font designs (serif + sans pairing)
- [ ] No random spacing (8px grid)

## Pipeline Routing

This brief feeds into the 8-step design pipeline:

1. Brief Extraction (this document) — complete
2. Vertical DNA Loading — `verticals/{{VERTICAL}}.md`
3. Token Generation — `templates/theme-tokens.template.json`
4. Wireframe — `pipelines/wireframe.md`
5. Component Selection — shadcn/ui + 21st.dev
6. Council Review — `council/personas.md`
7. Iteration — `council/iteration-protocol.md`
8. Output Package — theme-tokens.json + tailwind config + wireframes
