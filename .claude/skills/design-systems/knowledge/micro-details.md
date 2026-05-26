# Micro-Details That Separate Premium from Generic

12 details from jakub.kr that compound into the difference between "nice template" and "clearly designed by a human." None are individually dramatic. Together they are unmistakable.

> "Great interfaces are a collection of small things that compound." — jakub.kr

Reference: [jakub.kr/writing/details-that-make-interfaces-feel-better](https://jakub.kr/writing/details-that-make-interfaces-feel-better)

---

## 1. text-wrap: balance

Prevents orphans (single word on the last line of a heading). CSS-native, no JS.

```css
h1,
h2,
h3 {
  text-wrap: balance;
}
```

**When:** All headings and short text blocks (< 6 lines). NOT on body paragraphs (performance cost on long text).

**Tailwind:** `text-balance` utility class.

---

## 2. Concentric Border Radius

Outer radius = inner radius + padding. Without this, nested rounded elements look misaligned.

```css
/* If inner card has 8px radius and 12px padding */
.outer {
  border-radius: 20px;
} /* 8 + 12 = 20 */
.inner {
  border-radius: 8px;
}
```

**Rule:** `outer_radius = inner_radius + gap_between_elements`

**When:** Any nested rounded containers — cards in cards, buttons in toolbars, inputs in forms.

---

## 3. Contextual Icon Animations

Icons that animate in context (not just spin or bounce generically). The animation communicates meaning.

```css
/* Trash icon tilts on hover — "about to fall" */
.icon-trash:hover {
  transform: rotate(-10deg);
}

/* Send icon slides right — "departing" */
.icon-send:hover {
  transform: translateX(2px);
}

/* Refresh icon rotates — "cycling" */
.icon-refresh:hover {
  transform: rotate(180deg);
}
```

**Rule:** Animation direction matches the icon's metaphor. Never apply the same animation to all icons.

**When:** Hover states on icon buttons. Keep duration 150-200ms, ease-out.

---

## 4. Font Smoothing: Antialiased

Crisper text rendering on macOS. Without it, text looks slightly thick/blurry on Retina displays.

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Tailwind:** `antialiased` class on body element.

**When:** Always. Apply globally. This is a baseline, not an option.

---

## 5. Tabular Numerals

Digits align vertically in tables, dashboards, and counters. Without this, numbers "dance" as they change because proportional figures have variable widths.

```css
.numbers,
.price,
.stat,
.table-cell {
  font-variant-numeric: tabular-nums;
}
```

**Tailwind:** `tabular-nums` utility class.

**When:** Prices, statistics, table columns, countdowns, any numeric data that updates or aligns vertically.

---

## 6. Interruptible Animations (Transitions > Keyframes)

CSS transitions can be interrupted mid-animation — the browser smoothly reverses from the current state. Keyframe animations cannot; they jump or restart.

```css
/* GOOD: Interruptible — user can hover/unhover rapidly */
.button {
  transition:
    transform 200ms ease-out,
    background 150ms ease;
}
.button:hover {
  transform: translateY(-1px);
}

/* BAD: Non-interruptible — jarring on rapid interaction */
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
  100% {
    transform: translateY(0);
  }
}
.button:hover {
  animation: bounce 300ms;
}
```

**Rule:** Use CSS transitions for ANY user-triggered state change (hover, focus, active). Reserve keyframes for autonomous animations (loading indicators, attention pulses, entrance animations).

---

## 7. Split + Stagger Entering Elements

When multiple elements enter the viewport, don't animate them all at once. Split and stagger with 50-80ms delays.

```tsx
// Framer Motion stagger pattern
<motion.div
  variants={{
    show: { transition: { staggerChildren: 0.06 } },
  }}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
    />
  ))}
</motion.div>
```

**Timing:** 50-80ms stagger. Total animation for a group of 4-6 items: 400-600ms. Never exceed 800ms total.

**When:** Feature grids, card lists, navigation items, any group of related elements entering together.

---

## 8. Subtle Exit Animations

Most AI-generated UIs have entrance animations but nothing on exit. Elements just vanish. Exits should be faster and simpler than entrances.

```css
/* Enter: 300ms ease-out (noticeable, welcoming) */
.element-enter {
  animation: fadeSlideIn 300ms ease-out;
}

/* Exit: 150ms ease-in (quick, not distracting) */
.element-exit {
  animation: fadeOut 150ms ease-in;
}
```

**Rule:** Exit duration = 50% of entrance duration. Exit easing = ease-in (accelerate out). Never use the same timing for enter and exit.

**When:** Toasts, modals, dropdowns, cards being removed, filter results changing.

---

## 9. Optical Alignment (Not Geometric)

Geometric center is not visual center. Triangular play buttons need 1-2px right offset to look centered. Text with descenders needs different vertical centering than text without.

```css
/* Play button in a circle — shift right to look centered */
.play-icon {
  transform: translateX(1px);
}

/* Text with no descenders (e.g., "HELLO") — shift down slightly */
.uppercase-label {
  transform: translateY(0.5px);
}
```

**Rule:** After mechanical centering, squint at the result. If it looks off, apply 1-2px optical correction. Trust your eyes over the math.

**When:** Icons in circles/squares, text in buttons, logos in containers, arrow icons.

---

## 10. Multi-Layer Shadows Instead of Borders

Single-layer `box-shadow` or solid borders look flat. Multiple shadow layers create depth that mimics real light.

```css
/* BAD: Single shadow + border */
.card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* GOOD: Multi-layer shadow, no border needed */
.card {
  box-shadow:
    0 0 0 1px oklch(20% 0.01 60 / 0.5),
    /* tight outline */ 0 1px 2px oklch(0% 0 0 / 0.2),
    /* contact shadow */ 0 4px 8px oklch(0% 0 0 / 0.12),
    /* ambient shadow */ 0 12px 24px oklch(0% 0 0 / 0.06); /* far shadow */
}
```

**Rule:** 3-4 shadow layers minimum for elevated elements. Each layer serves a purpose: outline, contact, ambient, far. Use OKLCH in shadow colors for consistency.

**When:** Cards, modals, dropdowns, floating elements. NOT on flat/inline elements.

---

## 11. Outline on Images

A subtle 1px outline at 10% opacity prevents images from "floating" on dark backgrounds. The outline creates a boundary without looking like a border.

```css
img,
.image-container {
  outline: 1px solid oklch(100% 0 0 / 0.1);
  outline-offset: -1px; /* inside the element */
}
```

**Rule:** Use `outline` not `border` (outline doesn't affect layout). Keep opacity at 8-12%. Use `outline-offset: -1px` to draw inside.

**When:** All images on dark backgrounds. Product photos, avatars, hero images, thumbnails.

---

## 12. The Compounding Effect

No single detail above is dramatic. A user won't consciously notice `text-wrap: balance` or `tabular-nums`. But together they create the gap between "this feels like a template" and "this feels designed."

**Implementation checklist:**

| Detail               | CSS/Tailwind              | Effort           |
| -------------------- | ------------------------- | ---------------- |
| text-wrap: balance   | `text-balance`            | 1 min            |
| Concentric radius    | Manual calc               | 5 min            |
| Contextual icon anim | Per icon                  | 15 min           |
| Antialiased text     | `antialiased` on body     | 1 min            |
| Tabular numerals     | `tabular-nums` on numbers | 2 min            |
| Interruptible anims  | Use transitions           | 0 (habit change) |
| Stagger enter        | Framer Motion variants    | 10 min           |
| Exit animations      | 50% duration of enter     | 5 min            |
| Optical alignment    | Manual 1-2px nudges       | 5 min            |
| Multi-layer shadows  | Shadow token              | 10 min           |
| Image outlines       | Global CSS rule           | 2 min            |

**Total:** ~56 minutes to apply all 12 to a page. ROI is enormous.

## Enforcement in V3 Pipeline

The 12-dimension audit (Step 11) checks for these micro-details. Any page missing 4+ of these details fails the "Premium Feel" dimension automatically.
