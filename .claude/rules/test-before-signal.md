# Test Before Signal — MANDATORY

## The Rule

Workers MUST pass ALL tests before signaling `.done` or `.needs-qa`. No exceptions.

## Checklist (run in order)

1. `pnpm build` — TypeScript compiles with 0 errors
2. `pnpm test` — All tests pass
3. Self-test — Run the primary command and verify output manually
4. `npm pack --dry-run` — Verify clean tarball (for npm packages)

Only after ALL 4 pass: `echo "COMPLETED $(date)" > .claude/vp-signals/{role}.done`

## What Happens If You Skip This

- ANVIL QA will catch it and file a BLOCKER
- You'll waste a round-trip fixing what should have been caught locally
- The company's velocity drops because QA becomes the bottleneck instead of the safety net

## Evidence

META-FORGE Session 110: builders who self-tested (FORGE-2, FORGE-4) shipped clean. The one who didn't (FORGE-1) was the only project ANVIL held back.
