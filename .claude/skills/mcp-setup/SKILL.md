---
name: mcp-setup
description: Self-install MCP servers to expand Claude's capabilities. Read the catalog, install the server, wire it into .mcp.json, and test.
---

## When to Use

- User says "install the [X] MCP server" or "set up [X] MCP"
- You need a capability that an MCP server provides (database access, API, browser, etc.)
- During resource integration when an article mentions a useful MCP server

## Process

### 1. Find the Server

Check these sources in order:

- `resources/awesome-repos.md` (our local catalog)
- https://github.com/punkpeye/awesome-mcp-servers (82K+ stars, 2,500+ servers)
- npm registry: `npm search mcp-server-[name]`
- GitHub search: `mcp server [name]`

### 2. Evaluate Before Installing

- Does it duplicate an existing capability? (Check current .mcp.json first)
- Is it actively maintained? (Last commit < 3 months ago)
- Does it have security concerns? (Never install servers that require write access to system files)
- Is it worth the token overhead? (~4,200 tokens per MCP server vs ~70 for a skill)

**Rule: If a skill can do the job, prefer the skill. MCPs are for external integrations only.**

### 3. Install

#### For npx-based servers (most common):

```bash
# Test it works first
npx -y @modelcontextprotocol/server-[name] --help
```

Then update `.mcp.json`:

```json
{
  "mcpServers": {
    "[name]": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-[name]"],
      "env": {}
    }
  }
}
```

#### For pip-based servers:

```bash
pip install mcp-server-[name]
```

Then update `.mcp.json`:

```json
{
  "mcpServers": {
    "[name]": {
      "command": "python",
      "args": ["-m", "mcp_server_[name]"],
      "env": {}
    }
  }
}
```

#### For Docker-based servers:

```bash
docker pull mcp/[name]
```

Then update `.mcp.json`:

```json
{
  "mcpServers": {
    "[name]": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/[name]"],
      "env": {}
    }
  }
}
```

### 4. Wire Into Settings

Read the current `.mcp.json`:

```bash
cat $PROJECT_ROOT/.mcp.json
```

Add the new server entry. Preserve all existing entries.

### 5. Verify

- Restart Claude Code session (or the server auto-discovers on next tool call)
- Test by invoking one of the server's tools
- If it fails: check logs, verify env vars, try `npx` directly

### 6. Document

Add the new server to `resources/awesome-repos.md` under a "Currently Installed" section.

## Common MCP Servers Worth Having

| Server     | What It Does                       | Install                                             |
| ---------- | ---------------------------------- | --------------------------------------------------- |
| filesystem | Read/write files with permissions  | `npx -y @modelcontextprotocol/server-filesystem`    |
| github     | GitHub API (PRs, issues, repos)    | `npx -y @modelcontextprotocol/server-github`        |
| postgres   | Query PostgreSQL databases         | `npx -y @modelcontextprotocol/server-postgres`      |
| fetch      | HTTP requests with smart rendering | `npx -y @modelcontextprotocol/server-fetch`         |
| memory     | Key-value persistent memory        | `npx -y @modelcontextprotocol/server-memory`        |
| puppeteer  | Browser automation                 | `npx -y @modelcontextprotocol/server-puppeteer`     |
| firecrawl  | Web scraping and crawling          | `npx -y firecrawl-mcp` (requires FIRECRAWL_API_KEY) |

## Security Rules

- NEVER install servers that require `sudo` or root access
- NEVER pass secrets directly in args — use env vars
- NEVER install from untrusted sources (verify GitHub stars, maintainer)
- Always test in isolation before wiring into the main config
