---
globs: ["*.tsx", "*.jsx"]
---

- Functional components only, no class components
- React Server Components where possible (Next.js 15 App Router)
- State: Zustand for global, useState for local, no Redux
- Styling: TailwindCSS utilities, no inline styles, no CSS modules
- Dark mode: use `dark:` prefix variants, test both modes
- shadcn/ui for all base components (Button, Dialog, Input, etc.)
- Poppins font family via next/font
- Purple theme: #6b21a8 primary, #581c87 hover, #8B5CF6 accent
