Audit all dependencies for the Energy platform.

1. **Vulnerability scan**: Run `pnpm audit` across all packages
2. **Outdated packages**: Run `pnpm outdated -r` to find stale dependencies
3. **Unused dependencies**: Check package.json files for imports that aren't used in source code
4. **Duplicate dependencies**: Look for packages installed at multiple versions
5. **License compliance**: Check for GPL/AGPL licenses that conflict with our MIT/proprietary plans
6. **Size impact**: Identify the largest dependencies and whether lighter alternatives exist

Output a structured report with:

- Critical vulnerabilities (fix immediately)
- Outdated packages (update candidates)
- Unused packages (remove candidates)
- License concerns (review needed)

Do NOT modify package.json or install anything. Audit only.
