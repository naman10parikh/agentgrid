# Page Composition

How to compose a page that tells a story, not just displays information. Every page has an emotional arc. Every section earns its place or gets cut.

## The Emotional Arc (6 Beats Minimum)

Every landing page, marketing page, or product page follows a narrative arc. This is NOT optional — it's the difference between "$100M agency" and "AI slop."

| Beat           | Emotion                    | Section Type                   | Purpose                                                                     |
| -------------- | -------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| 1. Recognition | "This is for me"           | Hero                           | Visitor sees themselves in the headline. Problem acknowledged.              |
| 2. Awe         | "These people are serious" | Visual showcase / social proof | Credibility established through craft quality, not claims.                  |
| 3. Trust       | "I believe them"           | Features / How it works        | Concrete proof the product does what it promises. Data, demos, screenshots. |
| 4. Continuity  | "Others have succeeded"    | Testimonials / case studies    | Social validation. Real names, real numbers, real outcomes.                 |
| 5. Conviction  | "I need this"              | Pricing / comparison           | Urgency without manipulation. Clear value proposition with honest pricing.  |
| 6. Action      | "Let me start"             | Final CTA                      | Single, clear action. No friction. Reduce cognitive load to zero.           |

**Rules:**

- Every section must map to exactly ONE beat. If a section serves no beat, cut it.
- Beats must appear in order. You can repeat a beat (two Trust sections) but never skip one.
- If a section is redundant with the hero (restating the same value prop), cut it.
- Maximum 8-10 sections per page. More than 10 means you're repeating yourself.

## Background Rhythm

Alternating section backgrounds create visual rhythm that guides the eye down the page. This is the single easiest upgrade from "flat page" to "designed page."

### The Pattern

```
Section 1 (Hero):          bg-transparent
Section 2 (Social proof):  bg-muted/40        ← muted band
Section 3 (Features):      bg-transparent
Section 4 (Testimonials):  bg-muted/40        ← muted band
Section 5 (Pricing):       bg-transparent
Section 6 (CTA):           bg-brand/10        ← ONE brand moment
Section 7 (Footer):        bg-muted/40
```

### Implementation

```tsx
// Muted band
<section className="bg-muted/40 py-24">
  {/* content */}
</section>

// Transparent band
<section className="py-24">
  {/* content */}
</section>

// Brand moment (ONE per page only)
<section className="bg-brand-900/10 py-24 relative overflow-hidden">
  {/* Optional: subtle gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-950/20" />
  <div className="relative z-10">
    {/* content */}
  </div>
</section>
```

### Rules

- **Never** two transparent sections in a row (no rhythm)
- **Never** two brand-colored sections (dilutes the brand moment)
- **Maximum** ONE brand-colored section per page — this is the "moment" the visitor remembers
- Muted backgrounds use `bg-muted/40` (NOT `bg-muted` at full opacity — too heavy)
- The brand section is almost always the final CTA

## Content Width

Different content types have different optimal widths. Using max-w-6xl for everything is an anti-pattern.

| Content Type      | Max Width | Tailwind Class | Why                                                 |
| ----------------- | --------- | -------------- | --------------------------------------------------- |
| Body text / prose | 672px     | `max-w-2xl`    | 65-75 characters per line. Optimal reading measure. |
| Feature grids     | 1024px    | `max-w-5xl`    | Needs room for 3-column layouts                     |
| Full layouts      | 1280px    | `max-w-7xl`    | Dashboard, admin, full-bleed                        |
| Hero text         | 672px     | `max-w-2xl`    | Hero headlines should NOT stretch to 1280px         |
| Pricing tables    | 896px     | `max-w-4xl`    | 3 cards with comfortable spacing                    |
| Navigation        | 1280px    | `max-w-7xl`    | Full width with edge padding                        |

**The cardinal rule:** If it's text a human reads linearly, it's `max-w-2xl`. Period.

```tsx
// BAD: Body text stretching too wide
<div className="max-w-6xl mx-auto">
  <p className="text-secondary">Long paragraph of text that stretches
  across 120+ characters making it exhausting to read...</p>
</div>

// GOOD: Constrained reading width
<div className="max-w-2xl mx-auto">
  <p className="text-secondary">Long paragraph of text comfortably
  contained within the optimal reading measure.</p>
</div>

// GOOD: Full layout with constrained text inside
<div className="max-w-7xl mx-auto">
  <div className="grid grid-cols-2 gap-12">
    <div className="max-w-2xl">
      <h2>Feature Title</h2>
      <p>Description text stays readable.</p>
    </div>
    <div>{/* Visual/image/component */}</div>
  </div>
</div>
```

## Scroll Animations

Viewport-triggered reveal animations. Subtle, purposeful, never decorative.

### The Standard Animation

```tsx
// Default scroll reveal: fade up
const scrollReveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
};

// Usage with Framer Motion
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
>
  {/* content */}
</motion.div>;
```

### Stagger Pattern for Lists/Grids

```tsx
// Parent container
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={{
    visible: { transition: { staggerChildren: 0.1 } },
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
    >
      {/* card */}
    </motion.div>
  ))}
</motion.div>
```

### Rules

- **Always** use `viewport={{ once: true }}` — elements reveal once, never re-hide
- **Never** animate more than `y: 24` — larger values feel jarring
- **Never** use `x` animations for scroll reveals (horizontal movement on vertical scroll is disorienting)
- **Always** respect `prefers-reduced-motion`:

```tsx
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

// If reduced motion, skip animation
const animation = prefersReducedMotion
  ? {}
  : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 } };
```

- **Stagger delay:** 0.08-0.12s between items. More than 0.15s feels laggy.
- **Duration:** 0.4-0.6s for sections. 0.2-0.3s for individual elements.
- **Easing:** `[0.25, 0.46, 0.45, 0.94]` (ease-out-quad) for natural deceleration. Never linear.

## Section Cutting Rules

Sections earn their spot or get cut. This checklist determines whether a section belongs.

### Cut If:

1. **Restates the hero.** If a section says "we help you do X" and the hero already said "we help you do X" — cut it. The hero already did this job.
2. **Has no data.** A "Why us?" section with only subjective claims ("we're the best", "trusted by thousands") and no numbers — cut it or add real metrics.
3. **Breaks the arc.** If a Trust section appears after the Action section — cut it. It's too late to build trust after asking for money.
4. **Could be a tooltip.** If the entire section's content could fit in a tooltip or FAQ answer — it's not a section. Merge it into an existing section.
5. **Is a "just in case."** Sections added "in case someone needs it" without evidence of need — cut them. Add them back when data shows they're needed.

### Keep If:

1. **Serves a unique emotional beat** that no other section covers.
2. **Contains unique content** (real testimonial, real metric, real demo) not found elsewhere on the page.
3. **Breaks visual monotony** (image section between text sections, interactive demo, video).
4. **Is the ONE brand moment** — the section with the brand-colored background.

## The ONE Brand Moment Rule

Every page gets exactly ONE section where the brand color appears as a background or dominant element. This is the visual climax of the page.

**Why one?** If every section has brand-colored accents, no section stands out. Scarcity creates impact.

**Where to place it:** Usually the final CTA section (Beat 6: Action). Sometimes the social proof section (Beat 2: Awe) if the brand moment is "look at our client logos on this gorgeous background."

```tsx
// The ONE brand moment
<section className="relative overflow-hidden py-32">
  {/* Brand background */}
  <div className="absolute inset-0 bg-gradient-to-br from-brand-950 to-brand-900" />

  {/* Subtle texture */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.04),transparent)]" />

  <div className="relative z-10 max-w-2xl mx-auto text-center">
    <h2 className="font-display text-4xl text-white tracking-tight">
      Ready to start?
    </h2>
    <p className="mt-4 text-brand-200/80">
      Join thousands of teams already using our platform.
    </p>
    <Button
      size="lg"
      className="mt-8 bg-white text-brand-900 hover:bg-white/90"
    >
      Get started free
    </Button>
  </div>
</section>
```

## Full Page Template

Putting it all together:

```
┌─────────────────────────────────────────────┐
│ Nav (sticky, max-w-7xl)                     │  bg-transparent
├─────────────────────────────────────────────┤
│ HERO — Beat 1: Recognition                 │  bg-transparent
│ max-w-2xl headline, max-w-xl subheadline   │
│ CTA + secondary CTA                        │
├─────────────────────────────────────────────┤
│ SOCIAL PROOF — Beat 2: Awe                 │  bg-muted/40
│ Logo bar or metric tiles                    │
├─────────────────────────────────────────────┤
│ FEATURES — Beat 3: Trust                   │  bg-transparent
│ Bento grid, max-w-5xl                       │
│ 3+2 asymmetric layout                       │
├─────────────────────────────────────────────┤
│ HOW IT WORKS — Beat 3b: Trust (continued)  │  bg-muted/40
│ 3-step visual flow                          │
├─────────────────────────────────────────────┤
│ TESTIMONIALS — Beat 4: Continuity          │  bg-transparent
│ Asymmetric card layout, real photos         │
├─────────────────────────────────────────────┤
│ PRICING — Beat 5: Conviction               │  bg-muted/40
│ max-w-4xl, 3 tiers                          │
├─────────────────────────────────────────────┤
│ FINAL CTA — Beat 6: Action                 │  bg-brand-950
│ ★ THE ONE BRAND MOMENT ★                   │
│ max-w-2xl centered, single CTA             │
├─────────────────────────────────────────────┤
│ FOOTER                                      │  bg-muted/40
│ Links, legal, social                        │
└─────────────────────────────────────────────┘
```
