"""L1 structural eval: every surface a coding agent uses to install or call agentgrid is present and well formed.

  python3 eval/surfaces.py        exit 0 when every check passes, 1 otherwise

Checks the plugin, hooks, MCP config, skills, sub-agents, memory budget, llms.txt links and the DSIP contract. It reads
files only; the behaviour is tested by eval/golden.sh.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_FILES = ["package.json", ".mcp.json", ".claude/settings.json", "hooks/hooks.json", ".claude-plugin/plugin.json",
              ".claude-plugin/marketplace.json", "gemini-extension.json", ".well-known/agent-card.json", "dsip.json"]
REQUIRED = ["AGENTS.md", "CLAUDE.md", "GEMINI.md", "llms.txt", "identity/SOUL.md", "identity/BRAND.md",
            "identity/HEARTBEAT.md", "memory/MEMORY.md", "memory/LEARNINGS.md", "LICENSE", "SECURITY.md",
            "CONTRIBUTING.md", "CODE_OF_CONDUCT.md"]
SUBAGENTS = [".claude/agents/grid-operator.md", ".claude/agents/pane-doctor.md"]
results = []


def check(name, ok, detail=""):
    ok = bool(ok)
    results.append(ok)
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + ("" if ok else f": {detail}"))


def load(rel):
    return json.loads((ROOT / rel).read_text())


def frontmatter(path):
    m = re.match(r"^---\n(.*?)\n---\n", path.read_text(), re.S)
    return dict(re.findall(r"^(\w+):\s*(.+)$", m.group(1), re.M)) if m else {}


print("=== agentgrid surfaces eval (L1) ===")
for rel in REQUIRED:
    check(f"{rel} exists", (ROOT / rel).is_file())
for rel in JSON_FILES:
    try:
        load(rel)
        check(f"{rel} is valid JSON", True)
    except (OSError, ValueError) as e:
        check(f"{rel} is valid JSON", False, str(e))

check("no template slots in identity", not any("{{" in p.read_text() for p in (ROOT / "identity").glob("*.md")))
pkg = load("package.json")
check("bin agentgrid and agentgrid-mcp", {"agentgrid", "agentgrid-mcp"} <= set(pkg.get("bin", {})))
check("prepare builds dist for git installs", "prepare" in pkg.get("scripts", {}))

mcp = load(".mcp.json")["mcpServers"]
safe = all(not s.get("env") and not any(str(a).startswith(("./", "../")) for a in s.get("args", []))
           for s in mcp.values())
check(".mcp.json is safe for a stranger (no secrets, no relative paths)", safe and "agentgrid" in mcp)

plugin = load(".claude-plugin/plugin.json")
check("plugin.json names agentgrid", plugin.get("name") == "agentgrid")
check("plugin agents exist", all((ROOT / a).is_file() for a in plugin.get("agents", [])) and bool(plugin.get("agents")))
market = load(".claude-plugin/marketplace.json")
check("marketplace has one plugin from ./", [p.get("source") for p in market.get("plugins", [])] == ["./"])

for event, entries in load("hooks/hooks.json")["hooks"].items():
    for entry in entries:
        for hook in entry["hooks"]:
            script = re.search(r"\$\{CLAUDE_PLUGIN_ROOT\}/([\w./-]+)", hook["command"])
            check(f"plugin hook {event} script exists", bool(script) and (ROOT / script.group(1)).is_file())
for event, entries in load(".claude/settings.json")["hooks"].items():
    for entry in entries:
        for hook in entry["hooks"]:
            script = re.search(r"\$CLAUDE_PROJECT_DIR/([\w./-]+)", hook["command"])
            check(f"project hook {event} script exists", bool(script) and (ROOT / script.group(1)).is_file())

skills = sorted((ROOT / "skills").glob("*/SKILL.md"))
check("at least 3 skills", len(skills) >= 3, str(len(skills)))
for s in skills:
    fm, text = frontmatter(s), s.read_text()
    check(f"skill {s.parent.name}: name, description, steps, output",
          fm.get("name") == s.parent.name and len(fm.get("description", "")) > 40
          and "## Steps" in text and "## Output" in text)
for rel in SUBAGENTS:
    fm = frontmatter(ROOT / rel) if (ROOT / rel).is_file() else {}
    check(f"sub-agent {rel}: name and description", bool(fm.get("name")) and bool(fm.get("description")))

tokens = len((ROOT / "memory/MEMORY.md").read_text()) // 4
check(f"memory/MEMORY.md within 2,000 tokens (about {tokens})", tokens <= 2000)

llms = (ROOT / "llms.txt").read_text()
check("llms.txt starts with '# ' and a '>' summary", llms.startswith("# ") and "\n> " in llms)
links = [link for link in re.findall(r"\]\(([^)]+)\)", llms) if not link.startswith("http")]
missing = [link for link in links if not (ROOT / link.split("#")[0]).exists()]
check(f"llms.txt links resolve ({len(links)})", not missing, ", ".join(missing))

dsip = load("dsip.json")
check("dsip.json has the DSIP 0.1 shape",
      dsip.get("dsip") == "0.1" and dsip.get("product") and dsip.get("levels")
      and dsip.get("loop", {}).get("steps") and dsip.get("selection"))

passed = sum(results)
print(f"=== surfaces: {passed}/{len(results)} passed ===")
sys.exit(0 if passed == len(results) else 1)
