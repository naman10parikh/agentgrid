import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  Check,
  Plus,
  Clock,
  ChevronRight,
  Trash2,
  Download,
  Upload,
} from "lucide-react";

interface WorkspaceEntry {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{ id: string; name: string; role: string }>;
  sharedPresets: string[];
}

interface WorkspaceListProps {
  onSwitch?: (workspaceId: string) => void;
}

export function WorkspaceList({ onSwitch }: WorkspaceListProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  // Load workspaces on mount
  useEffect(() => {
    async function load() {
      try {
        const list = await window.api?.workspace?.list();
        if (Array.isArray(list)) setWorkspaces(list);
        const active = await window.api?.workspace?.getActive();
        if (active && typeof active === "object" && "workspace" in active && active.workspace) {
          setActiveId((active.workspace as { id: string }).id);
        }
      } catch {
        // IPC not available — show empty state
      }
    }
    load();
  }, []);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      const ws = await window.api?.workspace?.create(newName.trim());
      if (ws) {
        setWorkspaces((prev) => [ws, ...prev]);
        setActiveId(ws.id);
        onSwitch?.(ws.id);
      }
    } catch {
      // fallback
    }
    setNewName("");
    setCreating(false);
  }, [newName, onSwitch]);

  const handleSwitch = useCallback(
    async (id: string) => {
      try {
        const result = await window.api?.workspace?.switch(id);
        if (result) {
          setActiveId(id);
          onSwitch?.(id);
        }
      } catch {
        // fallback
      }
    },
    [onSwitch],
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await window.api?.workspace?.delete(id);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      setActiveId((prev) => (prev === id ? null : prev));
    } catch {
      // fallback
    }
  }, []);

  const handleExport = useCallback(async (id: string) => {
    try {
      const json = await window.api?.workspace?.export(id);
      if (!json) return;
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workspace-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback
    }
  }, []);

  const handleImport = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const ws = await window.api?.workspace?.import(text);
        if (ws) {
          setWorkspaces((prev) => [ws, ...prev]);
        }
      } catch {
        // invalid JSON
      }
    };
    input.click();
  }, []);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerLabel}>Workspaces</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={handleImport} style={styles.addButton} title="Import workspace">
            <Upload size={13} />
          </button>
          <button onClick={() => setCreating(true)} style={styles.addButton} title="New workspace">
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <div style={styles.createForm}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Workspace name..."
            style={styles.createInput}
          />
          <button onClick={handleCreate} style={styles.createBtn}>
            Create
          </button>
        </div>
      )}

      <div style={styles.list}>
        {workspaces.length === 0 && !creating && (
          <div style={styles.emptyState}>
            <FolderOpen size={24} style={{ color: "var(--grid-fg-dim)", opacity: 0.4 }} />
            <span style={{ fontSize: 11, color: "var(--grid-fg-dim)", marginTop: 8 }}>
              No workspaces yet
            </span>
            <button
              onClick={() => setCreating(true)}
              style={{
                ...styles.createBtn,
                marginTop: 8,
              }}
            >
              Create first workspace
            </button>
          </div>
        )}

        {workspaces.map((ws) => {
          const isActive = ws.id === activeId;
          const isHovered = ws.id === hoveredId;

          return (
            <button
              key={ws.id}
              onClick={() => handleSwitch(ws.id)}
              onMouseEnter={() => setHoveredId(ws.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                ...styles.workspaceItem,
                ...(isActive ? styles.workspaceActive : {}),
                ...(isHovered && !isActive ? styles.workspaceHover : {}),
              }}
            >
              <div style={styles.wsIcon}>
                <FolderOpen
                  size={14}
                  style={{
                    color: isActive ? "var(--grid-accent)" : "var(--grid-fg-dim)",
                  }}
                />
              </div>
              <div style={styles.wsInfo}>
                <div style={styles.wsName}>
                  {ws.name}
                  {isActive && (
                    <Check size={11} style={{ color: "var(--grid-accent)", marginLeft: 4 }} />
                  )}
                </div>
                {ws.description && <div style={styles.wsPath}>{ws.description}</div>}
                <div style={styles.wsPath}>
                  {ws.sharedPresets.length} presets · {ws.members.length} member
                  {ws.members.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div style={styles.wsRight}>
                <div style={styles.wsMeta}>
                  <Clock size={9} />
                  <span>{timeAgo(ws.updatedAt)}</span>
                </div>
                {isHovered && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(ws.id);
                      }}
                      style={styles.actionIcon}
                      title="Export"
                    >
                      <Download size={11} />
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ws.id);
                      }}
                      style={{ ...styles.actionIcon, color: "#ef4444" }}
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </span>
                  </div>
                )}
                {!isHovered && <ChevronRight size={12} style={{ color: "var(--grid-fg-dim)" }} />}
              </div>
            </button>
          );
        })}
      </div>
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
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px 6px",
    flexShrink: 0,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--grid-fg-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  addButton: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    color: "var(--grid-fg-dim)",
    cursor: "pointer",
    borderRadius: 4,
  },
  createForm: {
    display: "flex",
    gap: 4,
    padding: "4px 8px 8px",
    flexShrink: 0,
  },
  createInput: {
    flex: 1,
    padding: "4px 8px",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    background: "var(--grid-bg)",
    border: "1px solid var(--grid-border)",
    borderRadius: 4,
    color: "var(--grid-fg)",
    outline: "none",
  },
  createBtn: {
    padding: "4px 10px",
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    background: "var(--grid-accent)",
    border: "none",
    borderRadius: 4,
    color: "var(--color-grid-fg, #f5f4f1)",
    cursor: "pointer",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "0 8px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
  },
  workspaceItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 8px",
    background: "none",
    border: "1px solid transparent",
    borderRadius: 6,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    fontFamily: "var(--font-body)",
    transition: "background 100ms ease",
  },
  workspaceActive: {
    background: "var(--grid-accent-muted)",
    borderColor: "rgba(139, 92, 246, 0.15)",
  },
  workspaceHover: {
    background: "var(--grid-bg-elevated)",
  },
  wsIcon: {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--grid-bg)",
    borderRadius: 6,
    flexShrink: 0,
  },
  wsInfo: {
    flex: 1,
    minWidth: 0,
  },
  wsName: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--grid-fg)",
    display: "flex",
    alignItems: "center",
  },
  wsPath: {
    fontSize: 10,
    color: "var(--grid-fg-dim)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: 1,
    fontFamily: "var(--font-mono)",
  },
  wsRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
    flexShrink: 0,
  },
  wsMeta: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    fontSize: 10,
    color: "var(--grid-fg-dim)",
  },
  actionIcon: {
    cursor: "pointer",
    color: "var(--grid-fg-dim)",
    padding: 2,
  },
};
