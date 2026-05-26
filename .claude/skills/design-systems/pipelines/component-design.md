# Pipeline: Individual Component Design

Design individual UI components with full state coverage, visual specification, interaction patterns, accessibility, and code skeletons.

---

## Pipeline Steps

```
1. Purpose + Context Analysis → 2. State Mapping → 3. Visual Specification
                                                          ↓
4. Interaction Specification → 5. Accessibility Spec → 6. Code Template
```

---

## Step 1: Component Purpose + Context Analysis

### Prompt Template

```
Analyze this component request:

COMPONENT: "{component name or description}"
CONTEXT: "{where it lives — page, section, parent component}"
DESIGN SYSTEM: "{existing theme-tokens.json or BRAND.md if available}"

Determine:
1. COMPONENT TYPE: Display (read-only) | Interactive (user input) | Composite (contains sub-components)
2. DATA SHAPE: What props/data does this component accept?
3. CONTEXT: Where in the page hierarchy (hero, sidebar, card, modal, inline)
4. FREQUENCY: How often does the user interact with this? (always visible / on-demand / rare)
5. CRITICALITY: What happens if this component fails? (app-breaking / degraded / cosmetic)
6. SIMILAR COMPONENTS: Any existing shadcn/ui or 21st.dev components to extend?

Output the analysis as a structured spec that feeds into the remaining steps.
```

---

## Step 2: State Mapping

Every component needs explicit design for EVERY state it can be in.

### Prompt Template

```
Map all states for the "{COMPONENT}" component.

REQUIRED STATES (design every one that applies):

### Visual States
- **Default** — Resting state, no interaction
- **Hover** — Mouse enters (desktop only, not touch)
- **Active/Pressed** — Mouse down or touch start
- **Focus** — Keyboard focus (Tab navigation)
- **Disabled** — Component is non-interactive
- **Selected** — Chosen from a set (toggles, tabs, radio)

### Data States
- **Empty** — No data to display (first load, no results)
- **Loading** — Data is being fetched
- **Loaded** — Data is present and displayed
- **Error** — Data fetch or validation failed
- **Partial** — Some data loaded, some pending
- **Stale** — Data exists but may be outdated (show refresh option)

### Contextual States
- **Expanded** — Collapsed content revealed (accordions, details)
- **Collapsed** — Content hidden, summary shown
- **Entering** — Component is mounting/animating in
- **Exiting** — Component is unmounting/animating out

For each applicable state, specify:
1. Visual change (what looks different)
2. Transition (how it gets there — duration, easing)
3. User expectation (what the user expects to see/do)
4. Accessibility announcement (what screen readers say)

STATE MAP FORMAT:
| State    | Visual Change              | Transition        | A11y Announcement           |
| -------- | -------------------------- | ----------------- | --------------------------- |
| default  | bg-surface, text-primary   | —                 | —                           |
| hover    | bg-surface-hover           | 150ms ease        | —                           |
| active   | scale-[0.98], bg-surface   | 100ms ease        | —                           |
| focus    | ring-2 ring-brand-500/50   | instant           | "Focused: {label}"         |
| disabled | opacity-50, cursor-default | —                 | "Disabled: {label}"        |
| loading  | skeleton pulse             | fade 200ms        | "Loading {component}..."   |
| error    | border-red-500, shake      | 150ms ease-in-out | "Error: {message}"         |
| empty    | illustration + help text   | fade 200ms        | "{component} is empty. {help}" |
```

---

## Step 3: Visual Specification

### Prompt Template

```
Create the complete visual specification for "{COMPONENT}" in its DEFAULT state.

DESIGN SYSTEM TOKENS:
{theme-tokens.json or brand context}

ENERGY DESIGN RULES:
- Warm black (#141312) backgrounds
- No pure white text (use zinc-100/200)
- No emoji as functional icons (use Lucide)
- Touch targets >= 44px
- Dark mode default

Specify for the default state:

### Layout
- Display: {flex | grid | block | inline-flex}
- Direction: {row | column}
- Alignment: {items-center, justify-between, etc.}
- Width: {fixed | fluid | min/max constraints}
- Height: {fixed | auto | min/max constraints}

### Spacing
- Padding: {top right bottom left in px, using 8px grid}
- Margin: {relationship to siblings}
- Gap: {between child elements}

### Typography
- Font family: {from design system — display / body / code}
- Font size: {px value}
- Font weight: {numeric weight}
- Line height: {unitless ratio}
- Letter spacing: {em or px, if non-default}
- Color: {token name + hex fallback}
- Text transform: {none | uppercase | capitalize}

### Colors
- Background: {token + value}
- Text: {token + value}
- Border: {token + value + width + style}
- Icon: {token + value + size}

### Effects
- Border radius: {token + px}
- Box shadow: {token or custom value}
- Backdrop filter: {blur amount if glass effect}
- Opacity: {if not 1}

### Overflow
- Overflow behavior: {hidden | scroll | visible}
- Text overflow: {ellipsis | wrap | clamp to N lines}

Then specify DELTA from default for each active state:
- hover: {only what changes from default}
- active: {only what changes}
- focus: {only what changes}
- disabled: {only what changes}
```

---

## Step 4: Interaction Specification

### Prompt Template

```
Define all interactions for "{COMPONENT}".

### Cursor
- Default: {pointer | default | text | grab | not-allowed}
- Per-state override: {e.g., disabled → not-allowed}

### Animations
| Trigger          | Property         | Duration | Easing          | Delay |
| ---------------- | ---------------- | -------- | --------------- | ----- |
| hover enter      | background-color | 150ms    | ease            | 0ms   |
| hover exit       | background-color | 150ms    | ease            | 0ms   |
| active (press)   | transform        | 100ms    | ease            | 0ms   |
| focus (tab)      | box-shadow       | 0ms      | instant         | 0ms   |
| mount            | opacity + y      | 200ms    | ease-out        | 0ms   |
| unmount          | opacity          | 150ms    | ease-in         | 0ms   |
| loading start    | opacity          | 200ms    | ease            | 0ms   |
| error            | transform (x)    | 150ms    | ease-in-out (3) | 0ms   |

### Gesture Support (Touch)
- Tap: {same as click}
- Long press: {action, if any}
- Swipe: {action, if applicable — cards, carousels}
- Pinch: {action, if applicable — images, maps}

### Keyboard
- Enter/Space: {activate / toggle}
- Escape: {close / cancel / deselect}
- Arrow keys: {navigate within component, if applicable}
- Tab: {move focus to next focusable element}

### Reduced Motion
All animations must respect prefers-reduced-motion:
- Replace: slide/scale → opacity-only fade (200ms → 0ms duration)
- Keep: color transitions (instantaneous is fine)
- Remove: continuous animations (pulse, shimmer, breathing)
```

---

## Step 5: Accessibility Specification

### Prompt Template

```
Define the accessibility specification for "{COMPONENT}".

### Semantic HTML
- Root element: {button | a | div | section | article | aside | nav | dialog}
- Reason: {why this element — semantic meaning}

### ARIA Attributes
| Attribute          | Value                    | When                        |
| ------------------ | ------------------------ | --------------------------- |
| role               | {role if custom element} | Always (if not native)      |
| aria-label         | {descriptive label}      | Always (if no visible text) |
| aria-labelledby    | {id of label element}    | If label is separate        |
| aria-describedby   | {id of description}      | If extra context needed     |
| aria-expanded      | {true/false}             | Collapsible content         |
| aria-selected      | {true/false}             | Selectable items            |
| aria-disabled      | {true/false}             | Disabled state              |
| aria-live          | {polite/assertive}       | Dynamic content changes     |
| aria-busy          | {true/false}             | Loading state               |

### Focus Management
- Tab order: {natural | tabindex="0" | tabindex="-1" for programmatic}
- Focus trap: {yes/no — for modals/dialogs}
- Return focus: {where focus goes when component closes}
- Focus visible: ring-2 ring-brand-500/50 (always visible on keyboard focus)

### Screen Reader Behavior
- Component announced as: "{role}: {label}"
- State changes announced: "{label} is now {state}"
- Dynamic content: aria-live region for status updates

### Color Independence
- State indicator: {icon + text + color, never color alone}
- Error indicator: {red border + error icon + error text}
- Success indicator: {green border + check icon + success text}

### Touch Targets
- Minimum size: 44x44px
- If visual size is smaller, expand tap area with padding or ::after pseudo-element
```

---

## Step 6: Code Template

### Prompt Template

````
Generate a React + Tailwind code skeleton for "{COMPONENT}".

Requirements:
- Functional component (no class components)
- TypeScript strict mode (no any)
- Named export only (no default export)
- Props defined as interface
- All states handled
- Accessibility attributes included
- Framer Motion for animations (if needed)
- cn() utility for conditional classes (from shadcn/ui)

Template:

```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
// import { motion } from 'framer-motion' // if animations needed

interface {Component}Props {
  /** Primary content or label */
  children: React.ReactNode
  /** Visual variant */
  variant?: 'default' | 'secondary' | 'ghost'
  /** Size preset */
  size?: 'sm' | 'md' | 'lg'
  /** Disabled state */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Additional class names */
  className?: string
  /** Click handler */
  onClick?: () => void
}

const {Component} = forwardRef<HTMLDivElement, {Component}Props>(
  ({ children, variant = 'default', size = 'md', disabled, loading, className, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="{appropriate role}"
        aria-disabled={disabled}
        aria-busy={loading}
        className={cn(
          // Base styles
          'relative rounded-lg border transition-colors',
          // Variant styles
          variant === 'default' && 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]',
          variant === 'secondary' && 'bg-brand-500/10 border-brand-500/20',
          variant === 'ghost' && 'border-transparent hover:bg-white/[0.03]',
          // Size styles
          size === 'sm' && 'p-3 text-sm',
          size === 'md' && 'p-4 text-base',
          size === 'lg' && 'p-6 text-lg',
          // State styles
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          loading && 'animate-pulse',
          // Focus styles (keyboard navigation)
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
          className
        )}
        onClick={disabled || loading ? undefined : onClick}
        {...props}
      >
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ) : (
          children
        )}
      </div>
    )
  }
)

{Component}.displayName = '{Component}'

export { {Component} }
export type { {Component}Props }
````

```

---

## Output Package

The complete component design pipeline produces:

```

1. component-spec.md — Full specification (all 6 steps)
2. state-map.md — State matrix with visual deltas
3. interaction-spec.md — Animations, gestures, keyboard
4. accessibility-spec.md — ARIA, focus management, screen reader
5. {component}.tsx — Code skeleton ready for implementation
6. {component}.stories.tsx — Storybook stories for each state (optional)

```

### Council Integration

Individual components can be reviewed by specific personas:
- Typographer: text-heavy components (cards, labels, navigation)
- Color Theorist: colored components (badges, alerts, status indicators)
- UX Purist: ALL interactive components (mandatory)
- Brand Guardian: brand-facing components (hero, CTA, logo)
- Layout Architect: layout components (grids, sidebars, sections)
```
