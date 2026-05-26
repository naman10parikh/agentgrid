import { useState, useCallback } from "react";
import {
  Server,
  Zap,
  Anchor,
  Plus,
  Trash2,
  Globe,
  FolderOpen,
  Square,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Search,
} from "lucide-react";
import type { ScopeLevel, HookEvent } from "../types";

// ─── Local Types ───

interface MCPEntry {
  name: string;
  command: string;
  args: string[];
  scope: ScopeLevel;
  enabled: boolean;
}

interface SkillEntry {
  name: string;
  path: string;
  scope: ScopeLevel;
  triggers: string[];
}

interface HookEntry {
  event: HookEvent;
  command: string;
  matcher?: string;
  scope: ScopeLevel;
}

type ToolTab = "mcp" | "skills" | "hooks";

// ─── Scope Icons ───

const SCOPE_ICONS: Record<ScopeLevel, typeof Globe> = {
  global: Globe,
  workspace: FolderOpen,
  pane: Square,
};

const SCOPE_LABELS: Record<ScopeLevel, string> = {
  global: "Global",
  workspace: "Workspace",
  pane: "Pane",
};

const SCOPE_COLORS: Record<ScopeLevel, string> = {
  global: "#3b82f6",
  workspace: "#22c55e",
  pane: "#eab308",
};

// ─── Mock Data ───

const MOCK_MCPS: MCPEntry[] = [
  {
    name: "github",
    command: "npx -y @modelcontextprotocol/server-github",
    args: [],
    scope: "global",
    enabled: true,
  },
  {
    name: "context7",
    command: "npx -y @upstash/context7-mcp@latest",
    args: [],
    scope: "global",
    enabled: true,
  },
  {
    name: "memory",
    command: "npx -y server-memory",
    args: [],
    scope: "workspace",
    enabled: false,
  },
];

const MOCK_SKILLS: SkillEntry[] = [
  {
    name: "architect",
    path: ".claude/skills/architect/SKILL.md",
    scope: "workspace",
    triggers: ["architecture", "design"],
  },
  {
    name: "deep-think",
    path: ".claude/skills/deep-think/SKILL.md",
    scope: "workspace",
    triggers: ["complex", "debate"],
  },
];

const MOCK_HOOKS: HookEntry[] = [
  {
    event: "SessionStart",
    command: "./scripts/context-load.sh",
    scope: "workspace",
  },
  {
    event: "PreCompact",
    command: "./scripts/memory-flush.sh",
    scope: "workspace",
  },
  {
    event: "Stop",
    command: "./scripts/quality-gate.sh",
    matcher: "compaction",
    scope: "global",
  },
];

// ─── Component ───

export function ToolManager() {
  const [activeTab, setActiveTab] = useState<ToolTab>("mcp");
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeLevel | "all">("all");
  const [mcps, setMcps] = useState<MCPEntry[]>(MOCK_MCPS);
  const [skills] = useState<SkillEntry[]>(MOCK_SKILLS);
  const [hooks] = useState<HookEntry[]>(MOCK_HOOKS);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleMcp = useCallback((name: string) => {
    setMcps((prev) => prev.map((m) => (m.name === name ? { ...m, enabled: !m.enabled } : m)));
  }, []);

  const removeMcp = useCallback((name: string) => {
    setMcps((prev) => prev.filter((m) => m.name !== name));
  }, []);

  const cycleMcpScope = useCallback((name: string) => {
    const scopes: ScopeLevel[] = ["global", "workspace", "pane"];
    setMcps((prev) =>
      prev.map((m) => {
        if (m.name !== name) return m;
        const idx = scopes.indexOf(m.scope);
        return { ...m, scope: scopes[(idx + 1) % scopes.length] };
      }),
    );
  }, []);

  const tabs: Array<{
    id: ToolTab;
    label: string;
    icon: typeof Server;
    count: number;
  }> = [
    { id: "mcp", label: "MCP", icon: Server, count: mcps.length },
    { id: "skills", label: "Skills", icon: Zap, count: skills.length },
    { id: "hooks", label: "Hooks", icon: Anchor, count: hooks.length },
  ];

  const filterByScope = <T extends { scope: ScopeLevel }>(items: T[]) =>
    items.filter((i) => scopeFilter === "all" || i.scope === scopeFilter);

  const filterBySearch = <T extends { name?: string; event?: string; command?: string }>(
    items: T[],
  ) =>
    items.filter((i) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        i.name?.toLowerCase().includes(s) ||
        i.event?.toLowerCase().includes(s) ||
        i.command?.toLowerCase().includes(s)
      );
    });

  return (
    <div style={styles.container}>
      {/* Search bar */}
      <div style={styles.searchContainer}>
        <Search size={13} style={{ color: "var(--grid-fg-dim)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          style={styles.searchInput}
        />
      </div>

      {/* Tool tabs */}
      <div style={styles.toolTabs}>
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              ...styles.toolTab,
              ...(activeTab === id ? styles.toolTabActive : {}),
            }}
          >
            <Icon size={12} />
            <span>{label}</span>
            <span style={styles.toolCount}>{count}</span>
          </button>
        ))}
      </div>

      {/* Scope filter */}
      <div style={styles.scopeBar}>
        <button
          onClick={() => setScopeFilter("all")}
          style={{
            ...styles.scopeChip,
            ...(scopeFilter === "all" ? styles.scopeChipActive : {}),
          }}
        >
          All
        </button>
        {(["global", "workspace", "pane"] as ScopeLevel[]).map((s) => {
          const Icon = SCOPE_ICONS[s];
          return (
            <button
              key={s}
              onClick={() => setScopeFilter(s)}
              style={{
                ...styles.scopeChip,
                ...(scopeFilter === s ? styles.scopeChipActive : {}),
              }}
            >
              <Icon size={10} />
              <span>{SCOPE_LABELS[s]}</span>
            </button>
          );
        })}
      </div>

      {/* Tool list */}
      <div style={styles.toolList}>
        {activeTab === "mcp" &&
          filterBySearch(filterByScope(mcps)).map((mcp) => (
            <MCPCard
              key={mcp.name}
              mcp={mcp}
              expanded={expandedItems.has(`mcp:${mcp.name}`)}
              onToggleExpand={() => toggleExpand(`mcp:${mcp.name}`)}
              onToggleEnabled={() => toggleMcp(mcp.name)}
              onCycleScope={() => cycleMcpScope(mcp.name)}
              onRemove={() => removeMcp(mcp.name)}
            />
          ))}

        {activeTab === "skills" &&
          filterBySearch(filterByScope(skills)).map((skill) => (
            <SkillCard
              key={skill.name}
              skill={skill}
              expanded={expandedItems.has(`skill:${skill.name}`)}
              onToggleExpand={() => toggleExpand(`skill:${skill.name}`)}
            />
          ))}

        {activeTab === "hooks" &&
          filterBySearch(filterByScope(hooks)).map((hook, i) => (
            <HookCard
              key={`${hook.event}-${i}`}
              hook={hook}
              expanded={expandedItems.has(`hook:${hook.event}-${i}`)}
              onToggleExpand={() => toggleExpand(`hook:${hook.event}-${i}`)}
            />
          ))}
      </div>

      {/* Add button */}
      <div style={styles.footer}>
        <button style={styles.addButton}>
          <Plus size={13} />
          <span>
            Add {activeTab === "mcp" ? "MCP Server" : activeTab === "skills" ? "Skill" : "Hook"}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── MCP Card ───

function MCPCard({
  mcp,
  expanded,
  onToggleExpand,
  onToggleEnabled,
  onCycleScope,
  onRemove,
}: {
  mcp: MCPEntry;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onCycleScope: () => void;
  onRemove: () => void;
}) {
  const ScopeIcon = SCOPE_ICONS[mcp.scope];
  const scopeColor = SCOPE_COLORS[mcp.scope];

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader} onClick={onToggleExpand}>
        {expanded ? (
          <ChevronDown size={12} style={{ color: "var(--grid-fg-dim)" }} />
        ) : (
          <ChevronRight size={12} style={{ color: "var(--grid-fg-dim)" }} />
        )}
        <Server size={13} style={{ color: "var(--grid-fg-muted)" }} />
        <span
          style={{
            ...styles.cardName,
            opacity: mcp.enabled ? 1 : 0.5,
          }}
        >
          {mcp.name}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCycleScope();
          }}
          style={{
            ...styles.scopeBadge,
            color: scopeColor,
            background: `${scopeColor}15`,
          }}
          title={`Scope: ${SCOPE_LABELS[mcp.scope]} (click to change)`}
        >
          <ScopeIcon size={9} />
          <span>{SCOPE_LABELS[mcp.scope].slice(0, 4)}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleEnabled();
          }}
          style={styles.toggleButton}
          title={mcp.enabled ? "Disable" : "Enable"}
        >
          {mcp.enabled ? (
            <ToggleRight size={16} style={{ color: "var(--grid-accent)" }} />
          ) : (
            <ToggleLeft size={16} style={{ color: "var(--grid-fg-dim)" }} />
          )}
        </button>
      </div>
      {expanded && (
        <div style={styles.cardBody}>
          <div style={styles.cardDetail}>
            <span style={styles.detailLabel}>Command</span>
            <code style={styles.detailValue}>{mcp.command}</code>
          </div>
          {mcp.args.length > 0 && (
            <div style={styles.cardDetail}>
              <span style={styles.detailLabel}>Args</span>
              <code style={styles.detailValue}>{mcp.args.join(" ")}</code>
            </div>
          )}
          <button onClick={onRemove} style={styles.removeButton}>
            <Trash2 size={11} />
            <span>Remove</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Skill Card ───

function SkillCard({
  skill,
  expanded,
  onToggleExpand,
}: {
  skill: SkillEntry;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const ScopeIcon = SCOPE_ICONS[skill.scope];
  const scopeColor = SCOPE_COLORS[skill.scope];

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader} onClick={onToggleExpand}>
        {expanded ? (
          <ChevronDown size={12} style={{ color: "var(--grid-fg-dim)" }} />
        ) : (
          <ChevronRight size={12} style={{ color: "var(--grid-fg-dim)" }} />
        )}
        <Zap size={13} style={{ color: "#eab308" }} />
        <span style={styles.cardName}>{skill.name}</span>
        <div style={{ flex: 1 }} />
        <div
          style={{
            ...styles.scopeBadge,
            color: scopeColor,
            background: `${scopeColor}15`,
          }}
        >
          <ScopeIcon size={9} />
          <span>{SCOPE_LABELS[skill.scope].slice(0, 4)}</span>
        </div>
      </div>
      {expanded && (
        <div style={styles.cardBody}>
          <div style={styles.cardDetail}>
            <span style={styles.detailLabel}>Path</span>
            <code style={styles.detailValue}>{skill.path}</code>
          </div>
          {skill.triggers.length > 0 && (
            <div style={styles.cardDetail}>
              <span style={styles.detailLabel}>Triggers</span>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {skill.triggers.map((t) => (
                  <span key={t} style={styles.triggerTag}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hook Card ───

function HookCard({
  hook,
  expanded,
  onToggleExpand,
}: {
  hook: HookEntry;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const ScopeIcon = SCOPE_ICONS[hook.scope];
  const scopeColor = SCOPE_COLORS[hook.scope];

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader} onClick={onToggleExpand}>
        {expanded ? (
          <ChevronDown size={12} style={{ color: "var(--grid-fg-dim)" }} />
        ) : (
          <ChevronRight size={12} style={{ color: "var(--grid-fg-dim)" }} />
        )}
        <Anchor size={13} style={{ color: "#06b6d4" }} />
        <span style={styles.cardName}>{hook.event}</span>
        {hook.matcher && <span style={styles.matcherBadge}>{hook.matcher}</span>}
        <div style={{ flex: 1 }} />
        <div
          style={{
            ...styles.scopeBadge,
            color: scopeColor,
            background: `${scopeColor}15`,
          }}
        >
          <ScopeIcon size={9} />
          <span>{SCOPE_LABELS[hook.scope].slice(0, 4)}</span>
        </div>
      </div>
      {expanded && (
        <div style={styles.cardBody}>
          <div style={styles.cardDetail}>
            <span style={styles.detailLabel}>Command</span>
            <code style={styles.detailValue}>{hook.command}</code>
          </div>
          {hook.matcher && (
            <div style={styles.cardDetail}>
              <span style={styles.detailLabel}>Matcher</span>
              <code style={styles.detailValue}>{hook.matcher}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    margin: "8px 8px 0",
    padding: "6px 8px",
    background: "var(--grid-bg)",
    border: "1px solid var(--grid-border-subtle)",
    borderRadius: 6,
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    color: "var(--grid-fg)",
    fontSize: 12,
    fontFamily: "var(--font-body)",
    outline: "none",
  },
  toolTabs: {
    display: "flex",
    gap: 2,
    padding: "8px 8px 4px",
  },
  toolTab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "5px 4px",
    background: "none",
    border: "1px solid transparent",
    borderRadius: 6,
    color: "var(--grid-fg-dim)",
    fontSize: 11,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    transition: "all var(--duration-fast)",
  },
  toolTabActive: {
    background: "var(--grid-bg-elevated)",
    borderColor: "var(--grid-border-subtle)",
    color: "var(--grid-fg)",
  },
  toolCount: {
    fontSize: 10,
    color: "var(--grid-fg-dim)",
    background: "var(--grid-bg)",
    padding: "0 4px",
    borderRadius: 8,
    lineHeight: "16px",
  },
  scopeBar: {
    display: "flex",
    gap: 4,
    padding: "4px 8px",
    flexShrink: 0,
  },
  scopeChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "2px 7px",
    background: "none",
    border: "1px solid var(--grid-border-subtle)",
    borderRadius: 10,
    color: "var(--grid-fg-dim)",
    fontSize: 10,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    transition: "all var(--duration-fast)",
  },
  scopeChipActive: {
    background: "var(--grid-accent-muted)",
    borderColor: "var(--grid-accent)",
    color: "var(--grid-accent)",
  },
  toolList: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  card: {
    background: "var(--grid-bg)",
    border: "1px solid var(--grid-border-subtle)",
    borderRadius: 6,
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 8px",
    cursor: "pointer",
    transition: "background var(--duration-fast)",
  },
  cardName: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--grid-fg)",
    fontFamily: "var(--font-mono)",
  },
  scopeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "1px 5px",
    borderRadius: 4,
    fontSize: 9,
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
    transition: "opacity var(--duration-fast)",
  },
  toggleButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 0,
  },
  matcherBadge: {
    padding: "1px 5px",
    background: "var(--grid-bg-elevated)",
    borderRadius: 3,
    fontSize: 10,
    color: "var(--grid-fg-dim)",
    fontFamily: "var(--font-mono)",
  },
  cardBody: {
    padding: "0 8px 8px",
    borderTop: "1px solid var(--grid-border-subtle)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 0,
    paddingTop: 8,
  },
  cardDetail: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    color: "var(--grid-fg-dim)",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  detailValue: {
    fontSize: 11,
    color: "var(--grid-fg-muted)",
    fontFamily: "var(--font-mono)",
    background: "var(--grid-bg-elevated)",
    padding: "3px 6px",
    borderRadius: 3,
    wordBreak: "break-all",
  },
  triggerTag: {
    padding: "1px 5px",
    background: "var(--grid-bg-elevated)",
    borderRadius: 3,
    fontSize: 10,
    color: "var(--grid-fg-muted)",
    fontFamily: "var(--font-mono)",
  },
  removeButton: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    background: "none",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: 4,
    color: "#ef4444",
    fontSize: 10,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    alignSelf: "flex-start",
    transition: "background var(--duration-fast)",
  },
  footer: {
    padding: 8,
    borderTop: "1px solid var(--grid-border)",
    flexShrink: 0,
  },
  addButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "7px 0",
    background: "var(--grid-accent-muted)",
    border: "1px solid rgba(139, 92, 246, 0.2)",
    borderRadius: 6,
    color: "var(--grid-accent)",
    fontSize: 11,
    fontWeight: 500,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    transition: "background var(--duration-fast)",
  },
};
