# Deploy & Verify First — Production Before Showing (Maintainer Prompts #6, #12, #20, #21, #25, #29b)

## The Rule

Nothing is "done" until it's deployed to production AND verified from a user's perspective. Local-only work is invisible work.

## Protocol

1. **Build** — `pnpm build` passes with 0 TypeScript errors
2. **Deploy** — Push to main (auto-deploys via GitHub Action) or `npx vercel --prod --token=$VERCEL_TOKEN --yes`
3. **Verify** — curl prod endpoints AND/OR screenshot the live URL
4. **Show** — Only THEN present to the maintainer
5. **Approve** — Maintainer confirms → mark as stable checkpoint

## Verification Checklist

- [ ] `curl -s https://prod-url/api/health` returns 200
- [ ] Browser screenshot of main user flow on prod (not localhost)
- [ ] Mobile responsive check (if UI)
- [ ] Error console clean (no red errors)
- [ ] Auth flow works on deployed URL (Clerk redirect URLs match)

## What NOT to Do

- Never show localhost screenshots as "proof"
- Never say "it works locally" without deploying
- Never deploy without verifying the deploy completed (check GitHub Actions or Vercel dashboard)
- Never work hours without pushing — verify production reflects changes
- Never skip post-push verification (PostToolUse hook handles this automatically)

## After Every `git push`

The PostToolUse hook automatically checks deploy status. If it fails:

1. Check GitHub Actions for workflow errors
2. Check Vercel dashboard for build errors
3. Fix and re-push — do not move to next feature until prod is green

## Evidence

Maintainer Prompt #6: "Checkpoint Wins for the Board" — show deployed, working product.
Maintainer Prompt #12: "Build → Show → Approval → Checkpoint → Next."
Maintainer Prompt #25: "Board demo quality — must work live on prod."
LEARNINGS.md: "Never work hours without verifying production reflects changes" (line 486).
