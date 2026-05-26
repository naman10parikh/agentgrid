Performance analysis of the Energy platform.

1. **Bundle size**: Run `pnpm --filter @energy/web build` and check output sizes
2. **TypeScript compilation**: Time `pnpm --filter @energy/web exec tsc --noEmit`
3. **Import analysis**: Find circular imports and large import chains
4. **API route analysis**: Check for N+1 queries, missing caching, unbounded loops
5. **Component render analysis**: Look for unnecessary re-renders, missing memoization, large component trees
6. **SSE/streaming**: Check keepalive intervals, timeout handling, memory leaks in streams
7. **Sandbox lifecycle**: Check E2B sandbox creation time, cleanup patterns, resource leaks

Focus on the critical path: user opens app → sends message → sees response in sandbox.

Output findings ranked by impact (highest first) with specific fix suggestions.

Do NOT modify any files. Analyze only.
