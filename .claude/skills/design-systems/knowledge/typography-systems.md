# Typography Systems

15 proven type pairings for professional UI design. Each pairing includes display, body, and monospace families with a complete 12-level type scale, letter-spacing rules, and font-specific constraints.

## Universal Rules

- **Never pair two serifs.** The contrast disappears and hierarchy collapses.
- **Never pair geometric sans + humanist sans.** Futura + Gill Sans fight each other.
- **Display font sets the mood.** Body font stays invisible (high readability, low personality).
- **Monospace is functional only.** Code blocks, data tables, terminal output. Never decorative.
- **Weight contrast > size contrast.** A 600-weight heading at 18px beats a 400-weight heading at 24px.
- **Maximum 3 fonts per project.** Display + body + mono. No exceptions without a strong rationale.
- **NEGATIVE tracking on headings.** Display and H1 MUST have negative letter-spacing (-0.03em to -0.01em). This is the difference between amateur and professional typography.
- **POSITIVE tracking on small text.** Caption and label text gets +0.02em to +0.04em for legibility.
- **Use next/font, NEVER inline styles.** `style={{ fontFamily: 'Poppins' }}` is banned. Load via `next/font/google` or `next/font/local`.

## The 12-Level Type Scale

Every pairing uses this 12-level system. No improvising, no skipping levels.

| Level     | Role                          | Typical Size Range | Tracking             | Weight Range |
| --------- | ----------------------------- | ------------------ | -------------------- | ------------ |
| `display` | Hero headlines, page titles   | 36-64px            | -0.03em to -0.02em   | 600-800      |
| `h1`      | Section headlines             | 28-36px            | -0.025em to -0.015em | 600-700      |
| `h2`      | Subsection headers            | 22-28px            | -0.02em to -0.01em   | 500-600      |
| `h3`      | Card titles, feature names    | 18-22px            | -0.01em to 0         | 500-600      |
| `body`    | Primary reading text          | 14-16px            | 0 to 0.01em          | 400          |
| `bodySm`  | Secondary reading text        | 13-14px            | 0.01em               | 400          |
| `caption` | Timestamps, metadata, helpers | 11-12px            | 0.02em to 0.03em     | 400-500      |
| `label`   | Form labels, navigation items | 12-13px            | 0.04em to 0.06em     | 500-600      |
| `monoLg`  | Code blocks, terminal output  | 14-15px            | 0                    | 400          |
| `monoMd`  | Inline code, data cells       | 13px               | 0                    | 400          |
| `monoSm`  | Status badges, small data     | 12px               | 0.01em               | 400          |
| `monoXs`  | Line numbers, timestamps      | 11px               | 0.02em               | 400          |

## Modular Scale Reference

| Ratio | Name             | Use Case                          |
| ----- | ---------------- | --------------------------------- |
| 1.125 | Major Second     | Dense UIs, dashboards, data-heavy |
| 1.200 | Minor Third      | General purpose, balanced         |
| 1.250 | Major Third      | Marketing, landing pages          |
| 1.333 | Perfect Fourth   | Editorial, long-form content      |
| 1.414 | Augmented Fourth | Bold statements, hero sections    |

## The 15 Pairings

### 1. Instrument Serif + Poppins + JetBrains Mono

**Mood:** Editorial warmth, approachable authority
**Vertical:** Energy default, consumer, lifestyle
**Scale:** 1.250 (Major Third)
**Source:** Google Fonts (all three)

| Level   | Font             | Weight | Size | Line Height | Letter Spacing |
| ------- | ---------------- | ------ | ---- | ----------- | -------------- |
| display | Instrument Serif | 400    | 48px | 1.1         | -0.03em        |
| h1      | Instrument Serif | 400    | 36px | 1.15        | -0.025em       |
| h2      | Poppins          | 600    | 28px | 1.3         | -0.02em        |
| h3      | Poppins          | 600    | 22px | 1.35        | -0.01em        |
| body    | Poppins          | 400    | 15px | 1.6         | 0.01em         |
| bodySm  | Poppins          | 400    | 13px | 1.5         | 0.01em         |
| caption | Poppins          | 400    | 11px | 1.4         | 0.02em         |
| label   | Poppins          | 500    | 12px | 1.4         | 0.04em         |
| monoLg  | JetBrains Mono   | 400    | 14px | 1.6         | 0              |
| monoMd  | JetBrains Mono   | 400    | 13px | 1.5         | 0              |
| monoSm  | JetBrains Mono   | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | JetBrains Mono   | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Instrument Serif only comes in weight 400. Never fake bold it.
- Instrument Serif below 24px loses its character — switch to Poppins for h3 and below.
- Poppins works at all sizes but looks best at 400 (body) and 600 (headings). Avoid 300 (too thin on screens).

**Why it works:** Serif display + sans body is the single highest-impact anti-AI-generated-look change. Instrument Serif has warmth without stuffiness. Poppins is geometric but friendly.

---

### 2. Inter + Inter Display + Fira Code

**Mood:** Maximum legibility, utilitarian precision
**Vertical:** Developer tools, dashboards, data-heavy UIs
**Scale:** 1.125 (Major Second)
**Source:** Google Fonts / system

| Level   | Font          | Weight | Size | Line Height | Letter Spacing |
| ------- | ------------- | ------ | ---- | ----------- | -------------- |
| display | Inter Display | 700    | 40px | 1.1         | -0.03em        |
| h1      | Inter Display | 600    | 30px | 1.2         | -0.025em       |
| h2      | Inter         | 600    | 24px | 1.3         | -0.02em        |
| h3      | Inter         | 600    | 20px | 1.35        | -0.01em        |
| body    | Inter         | 400    | 14px | 1.6         | 0              |
| bodySm  | Inter         | 400    | 13px | 1.5         | 0.01em         |
| caption | Inter         | 400    | 11px | 1.4         | 0.02em         |
| label   | Inter         | 500    | 12px | 1.4         | 0.05em         |
| monoLg  | Fira Code     | 400    | 14px | 1.6         | 0              |
| monoMd  | Fira Code     | 400    | 13px | 1.5         | 0              |
| monoSm  | Fira Code     | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Fira Code     | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Inter Display is optimized for large sizes (24px+). Use regular Inter below 24px.
- Enable optical sizing: `font-optical-sizing: auto`.
- Fira Code ligatures should be enabled for code: `font-variant-ligatures: contextual`.
- Inter is a system font on newer macOS/iOS — consider it as a free performance win.

**Why it works:** Inter was designed for screens. Variable font with optical sizing. Fira Code's ligatures improve code readability. Dense scale suits information-rich UIs.

---

### 3. Playfair Display + Source Sans Pro + Source Code Pro

**Mood:** Authority, tradition, trustworthiness
**Vertical:** Fintech, legal, insurance, wealth management
**Scale:** 1.250 (Major Third)
**Source:** Google Fonts

| Level   | Font             | Weight | Size | Line Height | Letter Spacing |
| ------- | ---------------- | ------ | ---- | ----------- | -------------- |
| display | Playfair Display | 700    | 48px | 1.1         | -0.03em        |
| h1      | Playfair Display | 600    | 36px | 1.15        | -0.025em       |
| h2      | Source Sans Pro  | 600    | 28px | 1.3         | -0.015em       |
| h3      | Source Sans Pro  | 600    | 22px | 1.35        | -0.01em        |
| body    | Source Sans Pro  | 400    | 15px | 1.6         | 0.01em         |
| bodySm  | Source Sans Pro  | 400    | 14px | 1.5         | 0.01em         |
| caption | Source Sans Pro  | 400    | 12px | 1.4         | 0.02em         |
| label   | Source Sans Pro  | 600    | 12px | 1.4         | 0.06em         |
| monoLg  | Source Code Pro  | 400    | 14px | 1.6         | 0              |
| monoMd  | Source Code Pro  | 400    | 13px | 1.5         | 0              |
| monoSm  | Source Code Pro  | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Source Code Pro  | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Playfair Display has HIGH stroke contrast — looks dramatic at large sizes, unreadable below 18px.
- Use uppercase `label` sparingly with Playfair — it reads as "law firm" which may or may not be desired.
- Source Sans Pro 600 weight is called "SemiBold" in some font managers.
- The Source family (Sans/Serif/Code) shares consistent x-height — safe to mix all three.

**Why it works:** Playfair's high contrast conveys luxury and heritage. Source Sans is Adobe's workhorse — invisible and professional.

---

### 4. DM Serif Display + DM Sans + IBM Plex Mono

**Mood:** Calming authority, clinical warmth
**Vertical:** Healthcare, wellness, therapy, fitness
**Scale:** 1.200 (Minor Third)
**Source:** Google Fonts

| Level   | Font             | Weight | Size | Line Height | Letter Spacing |
| ------- | ---------------- | ------ | ---- | ----------- | -------------- |
| display | DM Serif Display | 400    | 44px | 1.1         | -0.02em        |
| h1      | DM Serif Display | 400    | 34px | 1.15        | -0.015em       |
| h2      | DM Sans          | 600    | 26px | 1.3         | -0.01em        |
| h3      | DM Sans          | 500    | 20px | 1.35        | -0.005em       |
| body    | DM Sans          | 400    | 15px | 1.65        | 0.01em         |
| bodySm  | DM Sans          | 400    | 13px | 1.5         | 0.01em         |
| caption | DM Sans          | 400    | 11px | 1.4         | 0.02em         |
| label   | DM Sans          | 500    | 12px | 1.4         | 0.04em         |
| monoLg  | IBM Plex Mono    | 400    | 14px | 1.6         | 0              |
| monoMd  | IBM Plex Mono    | 400    | 13px | 1.5         | 0              |
| monoSm  | IBM Plex Mono    | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | IBM Plex Mono    | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- DM Serif Display only comes in weight 400 + 400 italic. No bold.
- DM Serif Display has soft terminals (rounded stroke endings) — this is what makes it calming. Don't pair with sharp/angular elements.
- DM Sans and DM Serif Display share the same x-height (they're from the same family). Mixing them mid-paragraph is acceptable.
- Below 16px, DM Sans at 400 weight can look light on some screens. Consider 450 if variable font is available.

**Why it works:** DM Serif Display has soft terminals (calming). DM Sans shares the DM family metrics. IBM Plex Mono is clean for medical data.

---

### 5. Space Grotesk + Space Grotesk + Space Mono

**Mood:** Geometric modernism, technical creativity
**Vertical:** Creative tools, design apps, architecture, 3D
**Scale:** 1.200 (Minor Third)
**Source:** Google Fonts

| Level   | Font          | Weight | Size | Line Height | Letter Spacing |
| ------- | ------------- | ------ | ---- | ----------- | -------------- |
| display | Space Grotesk | 700    | 44px | 1.05        | -0.03em        |
| h1      | Space Grotesk | 600    | 34px | 1.15        | -0.025em       |
| h2      | Space Grotesk | 500    | 26px | 1.25        | -0.015em       |
| h3      | Space Grotesk | 500    | 20px | 1.3         | -0.01em        |
| body    | Space Grotesk | 400    | 14px | 1.6         | 0.01em         |
| bodySm  | Space Grotesk | 400    | 13px | 1.5         | 0.01em         |
| caption | Space Grotesk | 400    | 11px | 1.4         | 0.02em         |
| label   | Space Grotesk | 500    | 12px | 1.4         | 0.05em         |
| monoLg  | Space Mono    | 400    | 14px | 1.6         | 0              |
| monoMd  | Space Mono    | 400    | 13px | 1.5         | 0              |
| monoSm  | Space Mono    | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Space Mono    | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Space Grotesk has distinct ink traps at small sizes — avoid below 11px.
- Space Mono is WIDE. Reduce code block font-size by 1px vs other mono fonts (13px → 12px if space is tight).
- All Space family fonts share proportional metrics — safe to mix freely.
- The tight tracking on display sizes (-0.03em) is critical for the geometric feel.

**Why it works:** Single-family system with geometric DNA. Tight letter-spacing on headings feels technical and precise.

---

### 6. Fraunces + Outfit + JetBrains Mono

**Mood:** Approachable luxury, personality with polish
**Vertical:** Consumer apps, lifestyle brands, premium products
**Scale:** 1.250 (Major Third)
**Source:** Google Fonts

| Level   | Font           | Weight | Size | Line Height | Letter Spacing |
| ------- | -------------- | ------ | ---- | ----------- | -------------- |
| display | Fraunces       | 600    | 48px | 1.1         | -0.03em        |
| h1      | Fraunces       | 500    | 36px | 1.15        | -0.02em        |
| h2      | Outfit         | 600    | 28px | 1.3         | -0.015em       |
| h3      | Outfit         | 500    | 22px | 1.35        | -0.01em        |
| body    | Outfit         | 400    | 15px | 1.6         | 0.01em         |
| bodySm  | Outfit         | 400    | 13px | 1.5         | 0.01em         |
| caption | Outfit         | 400    | 11px | 1.4         | 0.02em         |
| label   | Outfit         | 500    | 12px | 1.4         | 0.04em         |
| monoLg  | JetBrains Mono | 400    | 14px | 1.6         | 0              |
| monoMd  | JetBrains Mono | 400    | 13px | 1.5         | 0              |
| monoSm  | JetBrains Mono | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | JetBrains Mono | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Fraunces is a variable "wonky" serif — it has a `WONK` axis. Set `font-variation-settings: 'WONK' 1` for maximum personality, `0` for straighter.
- Fraunces at weight 600+ with WONK on is a STRONG personality. Use sparingly or it overwhelms.
- Fraunces below 20px loses its character — switch to Outfit.
- Outfit is geometric sans with softened corners — pairs naturally without clash.

**Why it works:** Fraunces has personality without being unreadable. Outfit has softened corners. The contrast is striking but harmonious.

---

### 7. Newsreader + Work Sans + Cascadia Code

**Mood:** Scholarly readability, structured learning
**Vertical:** Education, LMS, documentation, knowledge bases
**Scale:** 1.333 (Perfect Fourth)
**Source:** Google Fonts + Microsoft (Cascadia)

| Level   | Font          | Weight | Size | Line Height | Letter Spacing |
| ------- | ------------- | ------ | ---- | ----------- | -------------- |
| display | Newsreader    | 600    | 48px | 1.1         | -0.02em        |
| h1      | Newsreader    | 500    | 34px | 1.2         | -0.015em       |
| h2      | Work Sans     | 600    | 26px | 1.3         | -0.01em        |
| h3      | Work Sans     | 500    | 20px | 1.35        | -0.005em       |
| body    | Work Sans     | 400    | 16px | 1.75        | 0.01em         |
| bodySm  | Work Sans     | 400    | 14px | 1.6         | 0.01em         |
| caption | Work Sans     | 400    | 12px | 1.4         | 0.02em         |
| label   | Work Sans     | 500    | 12px | 1.4         | 0.04em         |
| monoLg  | Cascadia Code | 400    | 15px | 1.6         | 0              |
| monoMd  | Cascadia Code | 400    | 14px | 1.5         | 0              |
| monoSm  | Cascadia Code | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Cascadia Code | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Newsreader was designed for small screens and long reading. It works at display AND body sizes (rare for a serif).
- Work Sans is neutral enough to disappear. This is a feature, not a bug.
- Body text at 16px with 1.75 line height is optimized for extended reading sessions (textbook mode).
- Cascadia Code has ligatures — enable them for educational code examples.
- Perfect Fourth scale creates generous hierarchy — critical for educational content where scanning is key.

**Why it works:** Newsreader works at all sizes. Perfect Fourth scale creates generous hierarchy for educational content. 1.75 line height optimizes long-form readability.

---

### 8. PP Neue Montreal + PP Neue Montreal + Berkeley Mono

**Mood:** Swiss minimalism, premium SaaS
**Vertical:** B2B SaaS, enterprise dashboards, admin panels
**Scale:** 1.125 (Major Second)
**Source:** Pangram Pangram (paid) / fallback: General Sans (free)

| Level   | Font             | Weight | Size | Line Height | Letter Spacing |
| ------- | ---------------- | ------ | ---- | ----------- | -------------- |
| display | PP Neue Montreal | 700    | 40px | 1.05        | -0.03em        |
| h1      | PP Neue Montreal | 600    | 30px | 1.15        | -0.025em       |
| h2      | PP Neue Montreal | 500    | 24px | 1.25        | -0.015em       |
| h3      | PP Neue Montreal | 500    | 20px | 1.3         | -0.01em        |
| body    | PP Neue Montreal | 400    | 14px | 1.6         | 0.01em         |
| bodySm  | PP Neue Montreal | 400    | 13px | 1.5         | 0.01em         |
| caption | PP Neue Montreal | 400    | 11px | 1.4         | 0.02em         |
| label   | PP Neue Montreal | 500    | 12px | 1.4         | 0.06em         |
| monoLg  | Berkeley Mono    | 400    | 14px | 1.6         | 0              |
| monoMd  | Berkeley Mono    | 400    | 13px | 1.5         | 0              |
| monoSm  | Berkeley Mono    | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Berkeley Mono    | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- PP Neue Montreal is PAID ($25-75). Free alternative: General Sans on FontShare.
- Berkeley Mono is PAID ($75). Free alternative: Fira Code or JetBrains Mono.
- If using free alternatives, regenerate the type scale — General Sans has different metrics than PP Neue Montreal.
- The 0.06em tracking on labels gives them a "Swiss poster" feel — this is intentional. Reduce to 0.04em if it looks too spaced.

**Why it works:** Neue Montreal is the typeface behind Linear, Vercel, and Stripe. Dense scale suits data-rich SaaS. Berkeley Mono is premium.
**Free alternative:** General Sans (FontShare) + JetBrains Mono.

---

### 9. Crimson Pro + Public Sans + Inconsolata

**Mood:** Editorial sophistication, clean commerce
**Vertical:** Ecommerce, editorial, magazines, content platforms
**Scale:** 1.250 (Major Third)
**Source:** Google Fonts

| Level   | Font        | Weight | Size | Line Height | Letter Spacing |
| ------- | ----------- | ------ | ---- | ----------- | -------------- |
| display | Crimson Pro | 600    | 48px | 1.1         | -0.02em        |
| h1      | Crimson Pro | 500    | 36px | 1.15        | -0.015em       |
| h2      | Public Sans | 600    | 28px | 1.3         | -0.01em        |
| h3      | Public Sans | 500    | 22px | 1.35        | -0.005em       |
| body    | Public Sans | 400    | 15px | 1.6         | 0.01em         |
| bodySm  | Public Sans | 400    | 14px | 1.5         | 0.01em         |
| caption | Public Sans | 400    | 12px | 1.4         | 0.02em         |
| label   | Public Sans | 600    | 12px | 1.4         | 0.04em         |
| monoLg  | Inconsolata | 400    | 14px | 1.6         | 0              |
| monoMd  | Inconsolata | 400    | 13px | 1.5         | 0              |
| monoSm  | Inconsolata | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Inconsolata | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Crimson Pro is a refined serif that works at ALL sizes (unlike Playfair which fails small).
- Public Sans is the US Government's official typeface (USWDS). Extremely neutral, WCAG-tested.
- Crimson Pro + Public Sans pair has the same x-height, making vertical alignment natural.
- Inconsolata is narrower than most monospace fonts — good for dense tables.

**Why it works:** Crimson Pro is refined at all sizes. Public Sans is invisible and professional. The pairing reads as editorial without being pretentious.

---

### 10. Cabinet Grotesk + Satoshi + Commit Mono

**Mood:** Bold, friendly, startup energy
**Vertical:** Startups, landing pages, marketing sites
**Scale:** 1.333 (Perfect Fourth)
**Source:** FontShare (free)

| Level   | Font            | Weight | Size | Line Height | Letter Spacing |
| ------- | --------------- | ------ | ---- | ----------- | -------------- |
| display | Cabinet Grotesk | 800    | 56px | 1.0         | -0.03em        |
| h1      | Cabinet Grotesk | 700    | 40px | 1.1         | -0.025em       |
| h2      | Satoshi         | 700    | 28px | 1.25        | -0.015em       |
| h3      | Satoshi         | 500    | 22px | 1.3         | -0.01em        |
| body    | Satoshi         | 400    | 15px | 1.6         | 0.01em         |
| bodySm  | Satoshi         | 400    | 13px | 1.5         | 0.01em         |
| caption | Satoshi         | 400    | 11px | 1.4         | 0.02em         |
| label   | Satoshi         | 500    | 12px | 1.4         | 0.04em         |
| monoLg  | Commit Mono     | 400    | 14px | 1.6         | 0              |
| monoMd  | Commit Mono     | 400    | 13px | 1.5         | 0              |
| monoSm  | Commit Mono     | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Commit Mono     | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Cabinet Grotesk at 800 weight is a VISUAL EVENT. Use only for hero headlines. Never for subheadings.
- Cabinet Grotesk below 28px loses its impact — switch to Satoshi.
- Satoshi is the trending free alternative to PP Neue Montreal. Same geometric DNA, no license fee.
- Commit Mono is purpose-built for code. Has neutralized character ambiguity (0/O, 1/l/I).

**Why it works:** Cabinet Grotesk at 800 weight is a statement. Satoshi grounds the body. Large Perfect Fourth scale creates landing-page-ready hierarchy.

---

### 11. Geist + Geist + Geist Mono

**Mood:** Developer-first, Vercel ecosystem
**Vertical:** Developer tools, technical documentation, CLIs
**Scale:** 1.125 (Major Second)
**Source:** Vercel (free, installable via next/font)

| Level   | Font       | Weight | Size | Line Height | Letter Spacing |
| ------- | ---------- | ------ | ---- | ----------- | -------------- |
| display | Geist      | 700    | 40px | 1.05        | -0.03em        |
| h1      | Geist      | 600    | 30px | 1.15        | -0.025em       |
| h2      | Geist      | 500    | 24px | 1.25        | -0.015em       |
| h3      | Geist      | 500    | 20px | 1.3         | -0.01em        |
| body    | Geist      | 400    | 14px | 1.6         | 0              |
| bodySm  | Geist      | 400    | 13px | 1.5         | 0.01em         |
| caption | Geist      | 400    | 11px | 1.4         | 0.02em         |
| label   | Geist      | 500    | 12px | 1.4         | 0.05em         |
| monoLg  | Geist Mono | 400    | 14px | 1.6         | 0              |
| monoMd  | Geist Mono | 400    | 13px | 1.5         | 0              |
| monoSm  | Geist Mono | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Geist Mono | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Geist is optimized for Next.js via `next/font/local`. Use this loader for best performance.
- Single family = zero font conflict risk. Safe default for any developer tool.
- Geist at 400 looks slightly heavier than Inter 400 — adjust if migrating from Inter.
- Geist Mono has programming ligatures — enable them for code views.

**Why it works:** Single family means zero conflict. Optimized for Next.js. The Vercel ecosystem recognizes it instantly as "modern dev."

---

### 12. Manrope + Manrope + Fira Code

**Mood:** Neutral professionalism, enterprise trust
**Vertical:** Enterprise software, B2B, corporate
**Scale:** 1.200 (Minor Third)
**Source:** Google Fonts

| Level   | Font      | Weight | Size | Line Height | Letter Spacing |
| ------- | --------- | ------ | ---- | ----------- | -------------- |
| display | Manrope   | 700    | 44px | 1.1         | -0.03em        |
| h1      | Manrope   | 600    | 34px | 1.15        | -0.02em        |
| h2      | Manrope   | 500    | 26px | 1.25        | -0.015em       |
| h3      | Manrope   | 500    | 20px | 1.3         | -0.01em        |
| body    | Manrope   | 400    | 14px | 1.6         | 0.01em         |
| bodySm  | Manrope   | 400    | 13px | 1.5         | 0.01em         |
| caption | Manrope   | 400    | 11px | 1.4         | 0.02em         |
| label   | Manrope   | 500    | 12px | 1.4         | 0.04em         |
| monoLg  | Fira Code | 400    | 14px | 1.6         | 0              |
| monoMd  | Fira Code | 400    | 13px | 1.5         | 0              |
| monoSm  | Fira Code | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Fira Code | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Manrope is a variable font — use weight range 200-800 for maximum flexibility.
- Manrope works across light and dark modes without adjustment (well-tested contrast).
- At 700 weight, Manrope has slightly rounded terminals — this prevents it from feeling corporate/cold.

**Why it works:** Modern geometric sans with subtle personality. Works across light and dark modes. Variable font for optimal loading.

---

### 13. Bricolage Grotesque + Bricolage Grotesque + IBM Plex Mono

**Mood:** Playful SaaS, personality-driven products
**Vertical:** Productivity tools, collaboration, internal tools
**Scale:** 1.200 (Minor Third)
**Source:** Google Fonts

| Level   | Font                | Weight | Size | Line Height | Letter Spacing |
| ------- | ------------------- | ------ | ---- | ----------- | -------------- |
| display | Bricolage Grotesque | 700    | 44px | 1.05        | -0.03em        |
| h1      | Bricolage Grotesque | 600    | 34px | 1.15        | -0.025em       |
| h2      | Bricolage Grotesque | 500    | 26px | 1.25        | -0.015em       |
| h3      | Bricolage Grotesque | 500    | 20px | 1.3         | -0.01em        |
| body    | Bricolage Grotesque | 400    | 14px | 1.6         | 0.01em         |
| bodySm  | Bricolage Grotesque | 400    | 13px | 1.5         | 0.01em         |
| caption | Bricolage Grotesque | 400    | 11px | 1.4         | 0.02em         |
| label   | Bricolage Grotesque | 500    | 12px | 1.4         | 0.05em         |
| monoLg  | IBM Plex Mono       | 400    | 14px | 1.6         | 0              |
| monoMd  | IBM Plex Mono       | 400    | 13px | 1.5         | 0              |
| monoSm  | IBM Plex Mono       | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | IBM Plex Mono       | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Bricolage Grotesque has INK TRAPS (visible gaps at stroke junctions). These are a design feature, not a rendering bug.
- Ink traps become invisible below 12px. The personality of the font is at 20px+.
- Bricolage + IBM Plex Mono creates a "fun work" vibe — Bricolage is playful, Plex grounds it.
- Don't use Bricolage for serious/financial content — the ink traps read as "casual."

**Why it works:** Quirky details add personality without sacrificing readability. IBM Plex Mono grounds it with professionalism.

---

### 14. Spectral + Karla + Anonymous Pro

**Mood:** Literary, long-form content focus
**Vertical:** Content platforms, blogging, journalism, newsletters
**Scale:** 1.333 (Perfect Fourth)
**Source:** Google Fonts

| Level   | Font          | Weight | Size | Line Height | Letter Spacing |
| ------- | ------------- | ------ | ---- | ----------- | -------------- |
| display | Spectral      | 600    | 48px | 1.1         | -0.02em        |
| h1      | Spectral      | 500    | 36px | 1.15        | -0.015em       |
| h2      | Karla         | 600    | 26px | 1.3         | -0.01em        |
| h3      | Karla         | 500    | 20px | 1.35        | -0.005em       |
| body    | Karla         | 400    | 16px | 1.75        | 0.01em         |
| bodySm  | Karla         | 400    | 14px | 1.6         | 0.01em         |
| caption | Karla         | 400    | 12px | 1.4         | 0.02em         |
| label   | Karla         | 500    | 12px | 1.4         | 0.04em         |
| monoLg  | Anonymous Pro | 400    | 15px | 1.6         | 0              |
| monoMd  | Anonymous Pro | 400    | 14px | 1.5         | 0              |
| monoSm  | Anonymous Pro | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Anonymous Pro | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Spectral was designed by Google for long-form reading on screens. Works at both display AND body size.
- Karla is grotesque with warmth. Body at 16px with 1.75 line height = optimal reading flow.
- Anonymous Pro is deliberately "boring" — it won't distract from surrounding editorial content.
- Perfect Fourth scale creates generous hierarchy suited for "lean back" reading experiences.

**Why it works:** Spectral works at all sizes. 16px body + 1.75 line height optimizes extended reading.

---

### 15. Clash Display + General Sans + Fragment Mono

**Mood:** Bold creative, statement brand
**Vertical:** Agencies, portfolios, creative studios, art
**Scale:** 1.414 (Augmented Fourth)
**Source:** FontShare (free)

| Level   | Font          | Weight | Size | Line Height | Letter Spacing |
| ------- | ------------- | ------ | ---- | ----------- | -------------- |
| display | Clash Display | 700    | 64px | 0.95        | -0.03em        |
| h1      | Clash Display | 600    | 44px | 1.05        | -0.025em       |
| h2      | General Sans  | 600    | 28px | 1.2         | -0.015em       |
| h3      | General Sans  | 500    | 22px | 1.3         | -0.01em        |
| body    | General Sans  | 400    | 15px | 1.6         | 0.01em         |
| bodySm  | General Sans  | 400    | 13px | 1.5         | 0.01em         |
| caption | General Sans  | 400    | 11px | 1.4         | 0.02em         |
| label   | General Sans  | 500    | 12px | 1.4         | 0.04em         |
| monoLg  | Fragment Mono | 400    | 14px | 1.6         | 0              |
| monoMd  | Fragment Mono | 400    | 13px | 1.5         | 0              |
| monoSm  | Fragment Mono | 400    | 12px | 1.5         | 0.01em         |
| monoXs  | Fragment Mono | 400    | 11px | 1.4         | 0.02em         |

**Font-specific rules:**

- Clash Display at 64px with -0.03em tracking is a VISUAL EVENT. This is the biggest type on the page.
- Clash Display below 28px loses its drama — switch to General Sans.
- Line height 0.95 on display means OVERLAPPING ascenders/descenders. Only use for short, uppercase-ish headlines.
- Augmented Fourth scale (1.414) creates MAXIMUM hierarchy drama. Not for dense UIs — landing pages only.
- Fragment Mono has a "handmade" quality. Use for creative contexts, not enterprise.

**Why it works:** Clash Display at 64px is a visual event. Augmented Fourth scale maximizes hierarchy drama. General Sans keeps body content clean.

---

## Implementation Pattern (next/font)

```tsx
// app/fonts.ts — centralized font loading
import { Instrument_Serif, Poppins } from 'next/font/google';
import localFont from 'next/font/local';

export const displayFont = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
});

export const bodyFont = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-body',
});

export const monoFont = localFont({
  src: '../fonts/JetBrainsMono-Regular.woff2',
  variable: '--font-mono',
  display: 'swap',
});

// app/layout.tsx
<body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
```

```typescript
// tokens/typography.ts — TypeScript tokens (NOT JSON)
export const typography = {
  display: {
    fontFamily: "var(--font-display)",
    fontSize: "48px",
    fontWeight: 400,
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
  },
  h1: {
    fontFamily: "var(--font-display)",
    fontSize: "36px",
    fontWeight: 400,
    lineHeight: 1.15,
    letterSpacing: "-0.025em",
  },
  // ... all 12 levels
} as const;
```

## Anti-Pattern Notes

- **Two serifs together:** Playfair Display + Crimson Pro looks like a newspaper from 1890. Pick one serif, one sans.
- **Geometric + humanist clash:** Futura (geometric) + Gill Sans (humanist) have incompatible DNA.
- **Too many weights:** Using 300, 400, 500, 600, 700 within one page destroys hierarchy. Use 3 weights maximum.
- **Tiny letter-spacing on body:** Adding -0.02em to 14px body text reduces readability. Negative tracking is for display sizes (24px+) only.
- **System font laziness:** `-apple-system, sans-serif` is fine for prototypes but signals "I didn't think about typography" in production.
- **Inline font loading:** `style={{ fontFamily: 'Poppins' }}` bypasses font optimization. Always use `next/font`.
- **Missing font fallbacks:** Always specify fallback chain. `font-display: swap` prevents FOIT (Flash of Invisible Text).
