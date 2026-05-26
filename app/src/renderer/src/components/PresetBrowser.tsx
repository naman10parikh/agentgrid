import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Play, Plus, Trash2, Copy, ChevronRight, ChevronDown } from "lucide-react";
import type { PresetCategory } from "../types";

interface PresetEntry {
  name: string;
  description: string;
  category: PresetCategory;
  gridSize: string;
  roles: string[];
  panes: Array<{ name: string; role?: string }>;
  isBuiltIn: boolean;
  hasMissions: boolean;
}

interface PresetBrowserProps {
  onLoad?: (presetName: string) => void;
}

/** Infer category from preset metadata */
function inferCategory(data: Record<string, unknown>): PresetCategory {
  if (data.category && typeof data.category === "string") return data.category as PresetCategory;
  const desc = ((data.description as string) ?? "").toLowerCase();
  if (desc.includes("earning") || desc.includes("trading") || desc.includes("money"))
    return "earning";
  if (desc.includes("research") || desc.includes("swarm")) return "research";
  if (desc.includes("design") || desc.includes("ui")) return "design";
  if (desc.includes("content") || desc.includes("article")) return "content";
  if (desc.includes("oss") || desc.includes("launch")) return "oss-launch";
  if (
    desc.includes("sprint") ||
    desc.includes("dev") ||
    desc.includes("sparc") ||
    desc.includes("anti-drift")
  )
    return "engineering";
  return "custom";
}

/** Group label for display */
function categoryLabel(cat: string): string {
  if (cat === "oss-launch") return "OSS Launch";
  if (cat === "recent") return "Recent";
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export function PresetBrowser({ onLoad }: PresetBrowserProps) {
  const [search, setSearch] = useState("");
  const [presets, setPresets] = useState<PresetEntry[]>([]);
  const [recentPresets, setRecentPresets] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; name: string } | null>(
    null,
  );
  const [copiedPreset, setCopiedPreset] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllPresets();
    loadHistory();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  const loadHistory = useCallback(async () => {
    try {
      const history = await window.api?.preset?.history();
      if (history) setRecentPresets(history);
    } catch {
      /* noop */
    }
  }, []);

  const loadAllPresets = useCallback(async () => {
    try {
      const names = await window.api?.preset?.list();
      if (!names) return;
      const entries: PresetEntry[] = [];
      for (const name of names) {
        try {
          const raw = await window.api?.preset?.info(name);
          if (raw) {
            const panes =
              (raw.panes as Array<{ name: string; role?: string }>) ??
              ((raw.grid as Record<string, unknown>)?.panes as Array<{
                name: string;
                label?: string;
              }>) ??
              [];
            const paneNames = panes.map((p) => ({
              name: (p as Record<string, string>).label ?? p.name,
              role: p.role,
            }));
            const cols = panes.length <= 2 ? panes.length : panes.length <= 4 ? 2 : 3;
            const rows = Math.ceil(panes.length / cols);
            entries.push({
              name,
              description: (raw.description as string) ?? "",
              category: inferCategory(raw),
              gridSize: `${rows}x${cols}`,
              roles: paneNames.map((p) => p.name),
              panes: paneNames,
              isBuiltIn: true,
              hasMissions: !!raw.missions,
            });
          } else {
            entries.push({
              name,
              description: "",
              category: "custom",
              gridSize: "?x?",
              roles: [],
              panes: [],
              isBuiltIn: false,
              hasMissions: false,
            });
          }
        } catch {
          entries.push({
            name,
            description: "",
            category: "custom",
            gridSize: "?x?",
            roles: [],
            panes: [],
            isBuiltIn: false,
            hasMissions: false,
          });
        }
      }
      setPresets(entries);
    } catch {
      /* noop */
    }
  }, []);

  const filteredPresets = presets.filter((p) => {
    return (
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Group presets by category, with "recent" as a special group at top
  const grouped = (() => {
    const groups: Record<string, PresetEntry[]> = {};

    // Add recent group first (only when no search)
    if (!search && recentPresets.length > 0) {
      const recentEntries = recentPresets
        .map((name) => filteredPresets.find((p) => p.name === name))
        .filter(Boolean) as PresetEntry[];
      if (recentEntries.length > 0) {
        groups["recent"] = recentEntries;
      }
    }

    // Group remaining by category
    for (const preset of filteredPresets) {
      const cat = preset.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(preset);
    }

    return groups;
  })();

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const handleLoad = useCallback(
    (name: string) => {
      onLoad?.(name);
      setTimeout(loadHistory, 500);
    },
    [onLoad, loadHistory],
  );

  const handleDelete = useCallback(
    async (name: string) => {
      try {
        await window.api?.preset?.delete(name);
        await loadAllPresets();
      } catch {
        /* noop */
      }
    },
    [loadAllPresets],
  );

  const handleExport = useCallback(async (name: string) => {
    try {
      const json = await window.api?.preset?.export(name);
      if (json) {
        await navigator.clipboard.writeText(json);
        setCopiedPreset(name);
        setTimeout(() => setCopiedPreset(null), 2000);
      }
    } catch {
      /* noop */
    }
  }, []);

  const handleSave = useCallback(() => {
    const name = `preset-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-")}`;
    window.api?.preset?.save(name);
    loadAllPresets();
  }, [loadAllPresets]);

  return (
    <div style={styles.container}>
      {/* Search + Save header */}
      <div style={styles.searchHeader}>
        <Search size={13} style={{ color: "var(--grid-fg-dim)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search presets..."
          style={styles.searchInput}
        />
        <button onClick={handleSave} style={styles.saveIcon} title="Save current grid as preset">
          <Plus size={14} />
        </button>
      </div>

      {/* Grouped list */}
      <div style={styles.listContainer}>
        {Object.keys(grouped).length === 0 && <div style={styles.emptyState}>No presets found</div>}
        {Object.entries(grouped).map(([group, items]) => {
          const isCollapsed = collapsedGroups.has(group);
          return (
            <div key={group}>
              {/* Group header */}
              <button onClick={() => toggleGroup(group)} style={styles.groupHeader}>
                {isCollapsed ? (
                  <ChevronRight size={12} style={{ flexShrink: 0 }} />
                ) : (
                  <ChevronDown size={12} style={{ flexShrink: 0 }} />
                )}
                <span style={styles.groupLabel}>{categoryLabel(group)}</span>
                <span style={styles.groupCount}>({items.length})</span>
              </button>

              {/* Items */}
              {!isCollapsed &&
                items.map((preset) => {
                  const isHovered = hoveredPreset === preset.name;
                  return (
                    <div
                      key={`${group}-${preset.name}`}
                      style={{
                        ...styles.listItem,
                        ...(isHovered ? styles.listItemHover : {}),
                      }}
                      onMouseEnter={() => setHoveredPreset(preset.name)}
                      onMouseLeave={() => setHoveredPreset(null)}
                      onClick={() => handleLoad(preset.name)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, name: preset.name });
                      }}
                    >
                      <span style={styles.itemName}>{preset.name}</span>
                      <span style={styles.itemSize}>{preset.gridSize}</span>
                      {isHovered && (
                        <Play size={11} style={{ color: "var(--grid-accent)", flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setContextMenu(null)}
          />
          <div
            ref={contextMenuRef}
            style={{ ...styles.contextMenu, left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              style={styles.contextMenuItem}
              onClick={() => {
                handleExport(contextMenu.name);
                setContextMenu(null);
              }}
            >
              <Copy size={11} />
              <span>{copiedPreset === contextMenu.name ? "Copied!" : "Copy JSON"}</span>
            </button>
            {!presets.find((p) => p.name === contextMenu.name)?.isBuiltIn && (
              <button
                style={{ ...styles.contextMenuItem, color: "#ef4444" }}
                onClick={() => {
                  handleDelete(contextMenu.name);
                  setContextMenu(null);
                }}
              >
                <Trash2 size={11} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  searchHeader: {
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
  saveIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    background: "none",
    border: "1px solid var(--grid-border-subtle)",
    borderRadius: 4,
    color: "var(--grid-fg-dim)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "color var(--duration-fast), border-color var(--duration-fast)",
  },
  listContainer: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "4px 0",
  },
  emptyState: {
    color: "var(--grid-fg-dim)",
    fontSize: 12,
    textAlign: "center" as const,
    padding: 24,
  },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    width: "100%",
    padding: "6px 10px",
    background: "none",
    border: "none",
    color: "var(--grid-fg-dim)",
    fontSize: 11,
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    cursor: "pointer",
    textTransform: "capitalize" as const,
    letterSpacing: "0.3px",
  },
  groupLabel: {
    flex: 1,
    textAlign: "left" as const,
  },
  groupCount: {
    fontSize: 10,
    color: "var(--grid-fg-dim)",
    fontWeight: 400,
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 10px 5px 26px",
    cursor: "pointer",
    transition: "background var(--duration-fast)",
    borderRadius: 0,
  },
  listItemHover: {
    background: "var(--grid-bg-elevated)",
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    color: "var(--grid-fg)",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  itemSize: {
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    color: "var(--grid-fg-dim)",
    flexShrink: 0,
  },
  contextMenu: {
    position: "fixed" as const,
    zIndex: 50,
    minWidth: 140,
    padding: "4px 0",
    background: "var(--grid-surface, #1a1918)",
    border: "1px solid var(--grid-border)",
    borderRadius: 6,
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  },
  contextMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    padding: "6px 12px",
    background: "none",
    border: "none",
    color: "var(--grid-fg-secondary, #a8a29e)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    cursor: "pointer",
    textAlign: "left" as const,
  },
};
