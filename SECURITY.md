# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public GitHub issue**
2. Report it privately through GitHub: on this repository's **Security** tab, choose **Report a vulnerability**. If that
   button is not shown, open an issue titled "Security contact" with no details, and the maintainer will reply with a
   private channel.
3. Include: description, steps to reproduce, potential impact

We will respond within 48 hours and work with you on a fix before public disclosure.

## Scope

agentgrid is a shell script that drives tmux, with a small TypeScript build for its MCP server and per-pane commands. It:

- Does NOT run a network server or a daemon (the MCP server speaks over stdio and exits with its client)
- Does NOT collect or transmit any data
- Uses the network only when you ask: `agentgrid update` (GitHub) and `agentgrid sandbox-run` (E2B, with your own key)
- Stores config locally at `~/.agentgrid/` and its run log at `logs/runs.jsonl` beside the script
- Passes MCP tool input to commands as argument arrays, never through a shell
- Installs hooks to `~/.claude/settings.json` only through `install.sh` (with user consent during install)

## Dependencies

- tmux (system package)
- bash (system shell)
- python3 (for JSON config parsing only)
