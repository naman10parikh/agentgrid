---
globs: ["*.ts", "*.tsx"]
---

- Strict TypeScript — no `any`, no `as unknown`, no non-null assertions unless proven safe
- Prefer `interface` over `type` for object shapes
- Use Zod for runtime validation at API boundaries
- Error handling: use Result<T, E> pattern, never try-catch-swallow. Every catch block must `console.warn("[module] context:", err.message)` or comment `// Intentionally silent: [reason]`.
- Async: always handle rejections, never fire-and-forget
- Files under 400 lines. Break into modules when exceeded.
- Named exports only. No default exports.
- Const over let. No var.
- NEVER use `new Map()` for cross-request state in Vercel API routes (`app/api/`). Each request may hit a cold Lambda with empty state. Use external stores (Supabase, Upstash) or pass IDs from client.
