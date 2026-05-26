# DFS Methodology — Depth-First Design

The professional approach to design: pick ONE component, iterate to 100%, document every decision, then scale. This is how agencies that charge $500K+ work. It's the opposite of how AI agents default.

## Why BFS Fails

BFS (Breadth-First Search) = design everything at once to 85%.

> "1000 lines of code that don't run. Each line is 85% right." — Axieomatic

| BFS failure mode       | What happens                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Everything at 85%      | Looks "almost good" but nothing is excellent. Generic feel persists.               |
| No clear hero          | Every component gets equal attention. Nothing stands out. Page feels flat.         |
| Decisions are deferred | "We'll figure out the exact radius/shadow/spacing later" — and then you never do.  |
| Can't evaluate quality | With everything half-done, you can't tell if the system WORKS until it's too late. |
| Feedback is vague      | "It needs more polish" — but WHERE? Everything needs polish equally.               |

**BFS is the AI default** because LLMs generate breadth naturally. Producing "a hero, a features section, a pricing section, and a footer" feels productive. But each one is mediocre.

## How DFS Works

DFS (Depth-First Search) = pick ONE component, get it to 100%, document why, then apply the system.

### The Process

1. **Identify the hero component** — the ONE element that carries 60% of the page's emotional weight
2. **Iterate to 100%** — typography, color, spacing, shadows, animation, micro-details, responsive behavior, states (hover/active/focus/loading/error/disabled)
3. **Document every decision** — WHY this radius, WHY this shadow depth, WHY this animation timing
4. **Kill alternatives** — record what you tried and rejected, with reasons
5. **Extract the system** — the hero component's decisions become the design system
6. **Scale to variants** — apply the extracted system to secondary components
7. **Verify coherence** — do all components feel like they belong to the same brand?

### Identifying the Hero Component

The hero component depends on the ICP and page goal:

| ICP type         | Hero component               | Why                                     |
| ---------------- | ---------------------------- | --------------------------------------- |
| Enterprise buyer | Social proof / logo bar      | They need to see peers first            |
| Developer        | Code example / terminal demo | They want to see the product work       |
| Consumer         | Hero headline + CTA          | Emotional hook must be immediate        |
| Investor         | Metrics dashboard / traction | Numbers speak louder than words         |
| Creative         | Visual showcase / portfolio  | The work IS the pitch                   |
| Finance          | Data table / chart           | Precision and density signal competence |

**Rule:** If you can't identify the hero component, your discovery brief is incomplete. Go back to Step 1.

## The Decision Log Pattern

Every decision on the hero component gets logged. This is NOT documentation for documentation's sake — it's the raw material for scaling.

```markdown
## Decision Log: Hero Card

### Border Radius: 8px

- Tried: 4px (too sharp, felt clinical), 6px (close but lacked warmth),
  12px (too bubbly, consumer-app feel), 16px (cartoon)
- Winner: 8px — professional warmth without bubbly
- Rule extracted: Cards = 8px, buttons = 6px, inputs = 6px, modals = 12px

### Shadow: 4-layer

- Tried: 1-layer (flat, no depth), 2-layer (better but still CGI),
  box-shadow + border (dated, early 2020s)
- Winner: 4-layer (outline + contact + ambient + far)
- Rule extracted: All elevated elements use 4-layer shadow token

### Animation: 200ms ease-out on hover

- Tried: 150ms (too snappy, felt twitchy), 300ms (laggy on rapid hover),
  ease-in-out (bouncy, not professional), linear (robotic)
- Winner: 200ms ease-out — responsive but smooth
- Rule extracted: All hover transitions = 200ms ease-out

### Typography: 32px / -0.02em / weight 600

- Tried: 36px (too dominant for card context), 28px (lost hierarchy),
  weight 700 (too heavy on dark bg), weight 500 (not enough contrast)
- Winner: 32px / 600 — clear hierarchy without dominating
- Rule extracted: Card headings = h3 scale, weight 600
```

## Scaling from Hero to System

Once the hero component is at 100%, the system writes itself:

1. **Radius system** → extracted from hero's radius decision + concentric rule
2. **Shadow system** → extracted from hero's shadow layers
3. **Animation system** → extracted from hero's timing + easing
4. **Typography scale** → hero heading size anchors the h3 level, scale up/down from there
5. **Color application** → hero's brand moment defines the accent usage budget

This is why DFS produces better systems than BFS: every rule is battle-tested on a real component before being abstracted.

## DFS in the V3 Pipeline

| Pipeline step              | DFS application                               |
| -------------------------- | --------------------------------------------- |
| Step 4: DFS Hero Component | Pick the hero, iterate to 100%                |
| Step 5: Decision Log       | Document every decision + killed alternatives |
| Step 9: Component Scaling  | Scale hero's decisions to all variants        |

## Common DFS Mistakes

- **Picking the wrong hero** — the logo is NOT the hero. The hero is the component the user's eye hits first.
- **Iterating breadth within the hero** — if the hero is a card, don't do "radius, then color, then shadow" in parallel. Do radius to completion (try 5 values, pick one, document why), THEN shadow to completion, etc.
- **Not killing alternatives** — if you didn't reject at least 3 options per decision, you didn't explore enough.
- **Scaling too early** — if the hero doesn't feel right, the system won't either. Stay on the hero until it's undeniably excellent.
- **Confusing "done" with "I'm bored of iterating"** — 100% means every state designed (default, hover, active, focus, disabled, loading, error), responsive at all breakpoints, micro-details applied, contrast checked.
