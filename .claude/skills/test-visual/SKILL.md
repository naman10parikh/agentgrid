---
name: test-visual
description: Browser-based visual testing of UI changes. Requires Chrome integration (--chrome flag or /chrome command).
---

## Prerequisites

- Dev server running (`pnpm dev`)
- Chrome integration enabled (`/chrome` or launched with `--chrome`)

## Steps

1. Navigate to the target URL (e.g., `http://localhost:3000`)
2. Take a full-page screenshot
3. Analyze against these criteria:
   - **Layout** — elements positioned correctly, no overflow, responsive
   - **Dark mode** — proper contrast, no white flashes, readable text
   - **Typography** — Poppins font loaded, proper hierarchy (h1 > h2 > p)
   - **Color scheme** — purple #6b21a8 primary, proper dark backgrounds
   - **Interactive** — hover states work, buttons clickable, inputs focusable
   - **Streaming** — if chat UI, verify real-time text streaming works
4. Report findings with specific CSS/component fixes
5. Take a "fixed" screenshot to verify the fix

## Common Issues

- Font not loading → check `next/font` import or Google Fonts link
- White flash on load → add `class="dark"` to `<html>` element
- Streaming broken → check WebSocket connection in Network tab
- Purple too bright → use #6b21a8 (dark), not #8B5CF6 (light)
