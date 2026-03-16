# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public GitHub issue**
2. Email: naman10parikh@gmail.com
3. Include: description, steps to reproduce, potential impact

We will respond within 48 hours and work with you on a fix before public disclosure.

## Scope

agentgrid is a shell script that configures tmux. It:
- Does NOT run a server or daemon
- Does NOT collect or transmit any data
- Does NOT require network access
- Stores config locally at `~/.agentgrid/`
- Installs hooks to `~/.claude/settings.json` (with user consent during install)

## Dependencies

- tmux (system package)
- bash (system shell)
- python3 (for JSON config parsing only)
