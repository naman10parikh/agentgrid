# TEST BEFORE BUILD — The Most Important Rule (Maintainer Directive — March 24, 2026)

## The Rule (HIGHEST PRIORITY — OVERRIDES ALL OTHER RULES)

**Do NOT develop new features until existing features are tested from the user's perspective with documented evidence.**

At every juncture, ask yourself:

1. What is the most important P0 functionality of this product?
2. Did I test it like the user would?
3. Did I document evidence (screenshots, test results)?
4. If NO to any of the above → keep working on it in a Ralph loop until it's done
5. Only THEN move to the next task

## Anti-Patterns (NEVER DO THESE)

- Building 400 tasks while the core feature (terminal) doesn't work
- Reporting "302 defects complete" without clicking a single button
- Moving to feature #2 before feature #1 is USER-verified
- Tests passing ≠ user-tested. Build passing ≠ working product.
- Delegating to workers without CEO verifying the output AS A USER

## The Test

Before marking ANY feature complete:

1. Launch the app (packaged .app, not dev mode)
2. Click the feature as a user would
3. Take a screenshot
4. If it doesn't work → fix it, don't move on
5. Document in a report with screenshot paths

## Evidence

Maintainer: "You're not rewarded for being busy. You're rewarded for having an impact."
Maintainer: "Do not develop anything until features already developed are tested from POV of the user."
Session 120: 400 tasks completed but terminal (THE core feature) didn't work in 4/5 panes.
