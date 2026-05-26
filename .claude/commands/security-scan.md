Run a security scan on the codebase. Check for:

1. **OWASP Top 10**: SQL injection, XSS, CSRF, insecure deserialization, broken auth
2. **Secrets in code**: Scan for API keys, tokens, passwords in source files (not .env)
3. **Dependency vulnerabilities**: Run `pnpm audit` and report findings
4. **Permissions**: Check file permissions, directory traversal risks
5. **Environment variables**: Verify .env files are gitignored, no secrets in committed code

Use grep to search for patterns like:

- `password`, `secret`, `api_key`, `token` in source files (not .env)
- Hardcoded URLs with credentials
- `eval()`, `innerHTML`, `dangerouslySetInnerHTML` without sanitization
- SQL string concatenation (not parameterized queries)

Output a structured report with severity levels (Critical/High/Medium/Low) and fix suggestions.

Do NOT modify any files. Audit only.
