# Animation Philosophy

Motion design principles for professional UI. Animation serves function, not decoration.

## Three Purposes of Animation

Every animation must serve at least one purpose. If it serves none, remove it.

### 1. Guide Attention

Direct the user's eye to what changed or what matters next.

- New tool step appearing: slides up from below, drawing eye to progress.
- Error shake: rapid horizontal movement on the error element, impossible to miss.
- Notification entry: slides in from edge, persists until acknowledged.

### 2. Provide Feedback

Confirm that an action was received and is being processed.

- Button press: subtle scale-down (0.97) on click, spring back on release.
- Form submit: button transitions to loading state with spinner.
- Checkmark animation: scales from 0 to 1 with spring, confirms completion.

### 3. Establish Spatial Relationships

Help users build a mental model of where things are in the interface.

- Sidebar collapse: width animates from 240px to 64px, content slides with it.
- Modal appearance: fades in with slight scale-up, suggesting it's "above" the page.
- Panel switch: content slides left/right, implying horizontal spatial arrangement.

## Timing Reference

| Category          | Duration  | Use Case                                       |
| ----------------- | --------- | ---------------------------------------------- |
| Micro-interaction | 100-200ms | Hover, press, toggle, focus                    |
| Feedback          | 200-300ms | Checkmarks, status changes, small reveals      |
| Transition        | 200-500ms | Page changes, panel opens, major state changes |
| Entrance          | 300-500ms | First-load animations, hero reveals            |
| Stagger delay     | 50ms      | Between list items, card grid items            |
| Breathing/ambient | 2-4s      | Idle state indicators, loading pulses          |

**Rule of thumb:** If the user initiated the action, respond in 100-200ms. If the system initiated, take 200-500ms (users expect to "see" system events).

## Easing Functions

### For Entrances: ease-out (Decelerate)

Element arrives quickly, settles into place. Feels natural and responsive.

```css
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
/* Tailwind: ease-out */
```

### For Exits: ease-in (Accelerate)

Element starts slow, accelerates away. Feels like it's leaving with purpose.

```css
transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
/* Tailwind: ease-in */
```

### For Interactive Elements: Spring

Spring physics feel alive and responsive. Best for buttons, toggles, draggable items.

```typescript
// Framer Motion spring config
const spring = {
  type: "spring",
  stiffness: 300,
  damping: 20,
  mass: 0.8,
};

// For checkmarks and confirmations (more bounce)
const bouncySpring = {
  type: "spring",
  stiffness: 400,
  damping: 15,
};

// For layouts and containers (less bounce)
const gentleSpring = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};
```

### For Continuous Loops: ease-in-out

Smooth back-and-forth for ambient animations (breathing, pulsing).

```css
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
/* Tailwind: ease-in-out */
```

## Animation Patterns for Agent UIs

### Tool Step Appear

New step slides up and fades in. Draws attention to progress.

```typescript
const stepVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
};
```

### Checkmark Confirmation

Scales from 0 with spring physics. Feels satisfying and definitive.

```typescript
const checkmarkVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring", stiffness: 400, damping: 15, delay: 0.1 },
};
```

### Error Shake

Rapid horizontal translation. Unmissable without being alarming.

```typescript
const shakeVariants = {
  animate: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.15, ease: "easeInOut" },
  },
};
```

### Card Expand/Collapse

Height animates to reveal or hide content. Smooth reveal of information.

```typescript
const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
  transition: { duration: 0.2, ease: "easeOut" },
};
```

### Staggered List

Children appear one by one with 50ms delay. Creates a cascade effect.

```typescript
const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};
```

### Page Transition

Subtle y-axis movement with fade. Pages feel like they're sliding into place.

```typescript
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};
```

### Shimmer Loading

Gradient sweep across skeleton elements. Indicates activity without specifics.

```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(139, 92, 246, 0.05) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}
```

### Agent Avatar Breathing

Subtle scale pulse on idle state. Indicates the agent is "alive" and ready.

```typescript
const breatheVariants = {
  animate: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};
```

### Status Dot Pulse

Scale pulse on active status indicators. Draws attention to live state.

```typescript
const pulseVariants = {
  animate: {
    scale: [1, 1.3, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};
```

## Reduced Motion (Non-Negotiable)

All animations MUST respect `prefers-reduced-motion`. This is not optional.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```typescript
// Framer Motion: use useReducedMotion() hook
import { useReducedMotion } from "framer-motion";

function Component() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      animate={{ opacity: 1, y: shouldReduceMotion ? 0 : 8 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
    />
  );
}
```

## Animation Budget

Every page has a "motion budget." Exceeding it creates visual noise.

| Page Type      | Max Concurrent Animations          | Max Stagger Items |
| -------------- | ---------------------------------- | ----------------- |
| Dashboard      | 3                                  | 8                 |
| Chat interface | 2 (tool step + streaming)          | 5                 |
| Landing page   | 4 (hero + features + CTA + scroll) | 12                |
| Settings       | 1                                  | 3                 |
| Modal/Dialog   | 1 (entrance)                       | 0                 |

**Rule:** If two animations compete for attention simultaneously, one of them is wrong. Sequence them or remove the less important one.

## Restraint Principles

1. **No animation for animation's sake.** If removing it doesn't hurt usability, remove it.
2. **No entrance animations on repeated content.** Tool steps animate in the first time, not on re-render.
3. **No looping animations except for active states.** A pulsing button that isn't loading is distracting.
4. **Duration cap: 500ms for transitions, 4s for ambient.** Anything longer feels sluggish or forgotten.
5. **Performance: never animate layout properties.** Animate `transform` and `opacity` only. Never `width`, `height`, `margin`, `padding` directly (use `scaleX`/`scaleY` or `max-height` workarounds).
