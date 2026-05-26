---
description: Diagnose GitHub Actions failures. Fetches recent failed runs, reads logs, identifies root cause, suggests fixes.
---

# GitHub Actions Failure Diagnosis

Analyze failed GitHub Actions workflows for this repository.

## Steps

1. **List recent failed runs:**

   ```bash
   gh run list --status=failure --limit=5
   ```

2. **Get failure details** for the most recent (or specified) run:

   ```bash
   gh run view <run_id> --log-failed
   ```

3. **Identify root cause:**
   - Parse error messages from failed steps
   - Check if it's a flaky test, dependency issue, env var missing, or code error
   - Cross-reference with `.claude/learnings/errors.md` for known patterns

4. **Suggest fix:**
   - If code error → identify file and line, propose patch
   - If env var → check GitHub secrets vs `.env.example`
   - If flaky test → identify test, suggest retry or fix
   - If dependency → check lockfile, suggest resolution

5. **If `$ARGUMENTS` contains a run ID, analyze that specific run. Otherwise analyze the most recent failure.**

## Output Format

```
## GHA Failure: {workflow name} (Run #{id})

**Failed step:** {step name}
**Error:** {key error message}
**Root cause:** {diagnosis}
**Fix:** {specific action to take}
```
