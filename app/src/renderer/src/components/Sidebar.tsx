import {
  useState,
  useCallback,
  Component,
  type ReactNode,
  type ErrorInfo,
  Suspense,
  lazy,
} from "react";
import {
  FolderOpen,
  LayoutGrid,
  Wrench,
  ScrollText,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// ─── Lazy-load tab content to isolate import-time errors ───
const PresetBrowser = lazy(() =>
  import("./PresetBrowser").then((m) => ({ default: m.PresetBrowser })),
);
const ToolManager = lazy(() => import("./ToolManager").then((m) => ({ default: m.ToolManager })));
const CEOLogPanel = lazy(() => import("./CEOLogPanel").then((m) => ({ default: m.CEOLogPanel })));
const WorkspaceList = lazy(() =>
  import("./WorkspaceList").then((m) => ({ default: m.WorkspaceList })),
);

// ─── Per-tab error boundary (compact, doesn't kill sidebar) ───

interface TabErrorState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends Component<{ children: ReactNode; tabName: string }, TabErrorState> {
  constructor(props: { children: ReactNode; tabName: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TabErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[Sidebar/${this.props.tabName}]`, error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={tabErrorStyles.container}>
          <AlertTriangle size={18} style={{ color: "#ef4444", opacity: 0.7 }} />
          <span style={tabErrorStyles.title}>{this.props.tabName} failed to load</span>
          <span style={tabErrorStyles.message}>{this.state.error?.message ?? "Unknown error"}</span>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={tabErrorStyles.retryButton}
          >
            <RefreshCw size={11} />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const tabErrorStyles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "32px 16px",
    height: "100%",
  },
  title: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--grid-fg-muted)",
    fontFamily: "var(--font-body)",
  },
  message: {
    fontSize: 10,
    color: "var(--grid-fg-dim)",
    fontFamily: "var(--font-mono)",
    textAlign: "center",
    maxWidth: 200,
    wordBreak: "break-word",
  },
  retryButton: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 12px",
    background: "var(--grid-bg-elevated)",
    border: "1px solid var(--grid-border)",
    borderRadius: 6,
    color: "var(--grid-fg-muted)",
    fontSize: 11,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    marginTop: 4,
  },
};

// ─── Loading fallback ───

function TabLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "var(--grid-fg-dim)",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
      }}
    >
      Loading...
    </div>
  );
}

type SidebarTab = "workspaces" | "presets" | "tools" | "ceo-log";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onLoadPreset?: (presetName: string) => void;
  onSwitchWorkspace?: (path: string) => void;
}

const TAB_CONFIG: Array<{
  id: SidebarTab;
  label: string;
  icon: typeof FolderOpen;
}> = [
  { id: "workspaces", label: "Workspaces", icon: FolderOpen },
  { id: "presets", label: "Presets", icon: LayoutGrid },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "ceo-log", label: "CEO Log", icon: ScrollText },
];

export function Sidebar({ isOpen, onToggle, onLoadPreset, onSwitchWorkspace }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("workspaces");

  const handleTabClick = useCallback((tab: SidebarTab) => {
    setActiveTab(tab);
  }, []);

  if (!isOpen) {
    return (
      <div style={styles.collapsed}>
        <button onClick={onToggle} style={styles.collapseButton} title="Open sidebar">
          <ChevronRight size={16} />
        </button>
        <div style={styles.collapsedIcons}>
          {TAB_CONFIG.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className="sidebar-icon-btn"
              onClick={() => {
                setActiveTab(id);
                onToggle();
              }}
              style={{
                ...styles.collapsedIconButton,
                color: activeTab === id ? "var(--grid-accent)" : "var(--grid-fg-dim)",
              }}
              title={label}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Tab bar */}
      <div style={styles.tabBar} role="tablist" aria-label="Sidebar navigation">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`sidebar-panel-${id}`}
            id={`sidebar-tab-${id}`}
            onClick={() => handleTabClick(id)}
            style={{
              ...styles.tab,
              ...(activeTab === id ? styles.tabActive : {}),
            }}
            title={label}
          >
            <Icon size={14} />
            <span style={styles.tabLabel}>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content — each tab isolated by its own error boundary */}
      <div
        style={styles.content}
        role="tabpanel"
        id={`sidebar-panel-${activeTab}`}
        aria-labelledby={`sidebar-tab-${activeTab}`}
      >
        <Suspense fallback={<TabLoading />}>
          {activeTab === "workspaces" && (
            <TabErrorBoundary tabName="Workspaces">
              <WorkspaceList onSwitch={onSwitchWorkspace} />
            </TabErrorBoundary>
          )}
          {activeTab === "presets" && (
            <TabErrorBoundary tabName="Presets">
              <PresetBrowser onLoad={onLoadPreset} />
            </TabErrorBoundary>
          )}
          {activeTab === "tools" && (
            <TabErrorBoundary tabName="Tools">
              <ToolManager />
            </TabErrorBoundary>
          )}
          {activeTab === "ceo-log" && (
            <TabErrorBoundary tabName="CEO Log">
              <CEOLogPanel />
            </TabErrorBoundary>
          )}
        </Suspense>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "var(--sidebar-width)",
    minWidth: "var(--sidebar-width)",
    height: "100%",
    background: "var(--grid-bg-raised)",
    borderRight: "1px solid var(--grid-border)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  collapsed: {
    width: 44,
    minWidth: 44,
    height: "100%",
    background: "var(--grid-bg-raised)",
    borderRight: "1px solid var(--grid-border)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 8,
    gap: 4,
  },
  collapseButton: {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    color: "var(--grid-fg-dim)",
    cursor: "pointer",
    borderRadius: 4,
  },
  collapsedIcons: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginTop: 8,
  },
  collapsedIconButton: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    borderRadius: 6,
    transition: "background var(--duration-fast) var(--ease-out), color var(--duration-fast)",
  },
  tabBar: {
    display: "flex",
    gap: 0,
    borderBottom: "1px solid var(--grid-border)",
    padding: "0 4px",
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "8px 4px",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "var(--grid-fg-dim)",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 500,
    fontFamily: "var(--font-display, 'Instrument Serif'), serif",
    transition: "color var(--duration-fast), border-color var(--duration-fast)",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  tabActive: {
    color: "var(--grid-fg)",
    borderBottomColor: "var(--grid-accent)",
  },
  tabLabel: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
};
