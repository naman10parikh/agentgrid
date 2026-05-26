---
name: ux-audit
description: Systematic UX audit for Spark and Energy platform. Checks component consistency, accessibility, duplicate elements, responsive layout, and interaction patterns. Run before any demo or commit.
---

## When to Use

- After building or modifying any UI component
- Before presenting work to the user
- As part of /wrap-up session protocol
- When onboarding a new page to the platform

## UX Audit Checklist

### 1. Component Consistency

- [ ] No duplicate elements (avatars, indicators, icons showing twice)
- [ ] Consistent spacing (px-4/px-6 pattern, not mixed)
- [ ] Same border radius pattern (rounded-xl for cards, rounded-2xl for containers)
- [ ] Color tokens used everywhere (no hardcoded hex outside globals.css)
- [ ] All interactive elements have hover states with `hover-lift` or color change

### 2. Layout & Responsiveness

- [ ] Mobile-first: every page works on 375px width
- [ ] No horizontal scroll on any breakpoint
- [ ] Navigation accessible on mobile (hamburger or stack)
- [ ] Text readable without zoom (min 14px body, 11px smallest)
- [ ] Cards stack on mobile, grid on desktop

### 3. Loading & Streaming States

- [ ] Every async action shows loading state
- [ ] Streaming text has cursor indicator
- [ ] No flash of unstyled content (FOUC)
- [ ] Skeleton or shimmer for data-dependent areas
- [ ] Error states are user-friendly (not raw error messages)

### 4. Accessibility Basics

- [ ] All buttons have accessible names (text or aria-label)
- [ ] Links with icons have title attributes
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators visible on keyboard navigation
- [ ] Form inputs have labels or placeholders

### 5. Brand Consistency

- [ ] Warm black background (#141312), not pure black
- [ ] Instrument Serif for display text (font-display class)
- [ ] Poppins for body (font-sans)
- [ ] Rose-500/600 for Spark accent, purple for Energy platform
- [ ] Bento-style asymmetric grids (not uniform)

### 6. Interaction Patterns

- [ ] Enter key submits forms
- [ ] Escape key closes modals/menus
- [ ] Back navigation works (no dead ends)
- [ ] Empty states guide user to action
- [ ] Success feedback on mutations (save, delete, send)

## How to Execute

### Method A: Code Review (No Browser)

```
1. Grep for common UX antipatterns:
   - Duplicate components in same view
   - Missing loading states (isLoading without UI)
   - Hardcoded colors outside theme
   - Missing error boundaries
   - Non-responsive layouts (fixed widths)

2. Check component tree:
   - Each page has proper hierarchy
   - Shared components extracted (not copy-pasted)
   - State doesn't leak between routes

3. Review all pages systematically:
   /spark → landing
   /spark/chat → chat interface
   /spark/pricing → pricing
   /spark/history → date history
   /spark/settings → preferences
```

### Method B: Browser Testing (Preferred)

```
1. Start dev server: pnpm --filter @energy/web dev
2. Use Chrome extension or --chrome flag
3. Navigate each page in sequence
4. Check mobile view (375px) and desktop (1440px)
5. Test all interactive flows:
   - Onboarding → Chat → Save Plan → View History
   - Settings → Save → Return to Chat
   - Pricing → Checkout flow
6. Screenshot and report issues
```

### Method C: Automated Checks

```bash
# TypeScript compilation (catches missing props, wrong types)
pnpm --filter @energy/web exec tsc --noEmit

# Build check (catches import errors, SSR issues)
pnpm --filter @energy/web build

# Lint (catches code quality issues)
pnpm --filter @energy/web exec next lint
```

## Common UX Bugs to Watch For

| Bug                        | Cause                                      | Fix                               |
| -------------------------- | ------------------------------------------ | --------------------------------- |
| Duplicate avatar/icon      | Two components both rendering same element | Remove redundant one              |
| Flash of wrong content     | Client-side check without hasChecked guard | Add loading gate                  |
| Scroll jump on new message | Missing smooth scroll or wrong ref         | useEffect with scrollIntoView     |
| Input loses focus          | Component re-render replacing input        | Use controlled component with ref |
| Mobile nav overflow        | Too many items in row                      | Collapse to hamburger or hide     |
| Stale data after action    | Missing state refresh after mutation       | Re-fetch or update local state    |

## Output Format

```markdown
## UX Audit — [Page Name] — [Date]

### Issues Found

1. **[SEVERITY]** Description — File:line — Fix

### Passed Checks

- [x] Component consistency
- [x] Loading states
      ...

### Recommendations

- Consider adding...
```
