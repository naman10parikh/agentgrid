# AgentGrid Privacy Policy

**Last updated:** March 23, 2026

## What AgentGrid Does

AgentGrid is a desktop application that orchestrates AI coding agents (Claude Code, Codex, Gemini, etc.) in a visual grid. It runs entirely on your local machine.

## Data Collection

**AgentGrid collects no data.** Specifically:

- No telemetry, analytics, or usage tracking
- No personal information collected
- No data sent to our servers
- No account or login required
- No cookies or tracking pixels

## What Stays on Your Machine

- All terminal sessions run locally via node-pty
- Grid configurations saved to `~/.agentgrid/`
- Workspace settings saved to `.agentgrid.json` in your project
- Session history and presets stored locally
- CEO logs stored locally

## Third-Party Services

AgentGrid spawns CLI tools (Claude Code, Codex, etc.) that may communicate with their respective API providers. AgentGrid does not intercept, modify, or log this traffic. Refer to each tool's privacy policy:

- Claude Code: https://anthropic.com/privacy
- Codex: https://openai.com/privacy
- Gemini CLI: https://policies.google.com/privacy

## Auto-Updates

When enabled, AgentGrid checks GitHub Releases for new versions. This sends a request to `github.com` containing your platform and current version. No other data is sent.

## Open Source

AgentGrid is open source under the MIT License. You can audit the complete source code at https://github.com/naman10parikh/agentgrid.

## Contact

For privacy questions: https://github.com/naman10parikh/agentgrid/issues
