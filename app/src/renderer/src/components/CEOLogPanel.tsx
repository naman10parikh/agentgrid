import { useState, useEffect, useRef, useCallback } from "react";
import {
  Info,
  AlertTriangle,
  XCircle,
  Lightbulb,
  FlaskConical,
  Filter,
  Download,
  Trash2,
  ArrowDown,
} from "lucide-react";
import type { LogLevel } from "../types";

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  paneId?: string;
  agentAction?: string;
}

const LEVEL_CONFIG: Record<LogLevel, { icon: typeof Info; color: string; label: string }> = {
  info: { icon: Info, color: "#3b82f6", label: "Info" },
  warning: { icon: AlertTriangle, color: "#eab308", label: "Warning" },
  error: { icon: XCircle, color: "#ef4444", label: "Error" },
  decision: { icon: Lightbulb, color: "#22c55e", label: "Decision" },
  experiment: { icon: FlaskConical, color: "#a78bfa", label: "Experiment" },
};

const MOCK_ENTRIES: LogEntry[] = [
  {
    timestamp: Date.now() - 120000,
    level: "info",
    message: "Grid 2x3 created with 6 Claude agents",
  },
  {
    timestamp: Date.now() - 90000,
    level: "info",
    message: "All 6 panes spawned successfully",
    paneId: "all",
  },
  {
    timestamp: Date.now() - 60000,
    level: "decision",
    message: "Assigned VP-ARCHITECT to pane 1, VP-RESEARCHER to pane 2",
  },
  {
    timestamp: Date.now() - 45000,
    level: "info",
    message: "Mission briefs injected into all panes",
    agentAction: "inject-task",
  },
  {
    timestamp: Date.now() - 30000,
    level: "warning",
    message: "Pane 3 (VP-CLI) output idle for 30s — monitoring",
    paneId: "pane-3",
  },
  {
    timestamp: Date.now() - 15000,
    level: "info",
    message: "Signal received: architect.done",
    agentAction: "signal-watch",
  },
  {
    timestamp: Date.now() - 5000,
    level: "experiment",
    message: "Testing recursive sub-grid spawn from VP-FRONTEND",
    paneId: "pane-5",
  },
];

export function CEOLogPanel() {
  const [entries, setEntries] = useState<LogEntry[]>(MOCK_ENTRIES);
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  // Subscribe to IPC log events
  useEffect(() => {
    if (!window.api?.ceoLog) return;

    let unsubscribe: (() => void) | undefined;

    try {
      // Load existing entries
      window.api.ceoLog
        .getAll()
        .then(
          (
            existing: Array<{
              timestamp: number;
              level: string;
              message: string;
              paneId?: string;
              agentAction?: string;
            }>,
          ) => {
            if (Array.isArray(existing) && existing.length)
              setEntries(existing.map((e) => ({ ...e, level: e.level as LogLevel })));
          },
        )
        .catch(() => {
          /* no-op if not available */
        });

      // Subscribe to new entries
      if (typeof window.api.ceoLog.onEntry === "function") {
        const result = window.api.ceoLog.onEntry(
          (entry: {
            timestamp: number;
            level: string;
            message: string;
            paneId?: string;
            agentAction?: string;
          }) => {
            setEntries((prev) => [...prev, { ...entry, level: entry.level as LogLevel }]);
          },
        );
        if (typeof result === "function") {
          unsubscribe = result;
        }
      }
    } catch {
      // IPC not available — use mock data
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const filteredEntries = entries.filter((e) => levelFilter === "all" || e.level === levelFilter);

  const handleClear = useCallback(() => {
    setEntries([]);
  }, []);

  const handleExport = useCallback(() => {
    const text = entries
      .map(
        (e) =>
          `[${new Date(e.timestamp).toLocaleTimeString()}] [${e.level.toUpperCase()}] ${e.message}`,
      )
      .join("\n");
    navigator.clipboard.writeText(text);
  }, [entries]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div style={styles.container}>
      {/* Header controls */}
      <div style={styles.header}>
        {/* Level filter */}
        <div style={styles.filterBar}>
          <Filter size={11} style={{ color: "var(--grid-fg-dim)" }} />
          <button
            onClick={() => setLevelFilter("all")}
            style={{
              ...styles.filterChip,
              ...(levelFilter === "all" ? styles.filterChipActive : {}),
            }}
          >
            All
          </button>
          {(Object.keys(LEVEL_CONFIG) as LogLevel[]).map((level) => {
            const config = LEVEL_CONFIG[level];
            return (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                style={{
                  ...styles.filterChip,
                  ...(levelFilter === level
                    ? {
                        ...styles.filterChipActive,
                        borderColor: config.color,
                        color: config.color,
                      }
                    : {}),
                }}
                title={config.label}
              >
                <config.icon size={9} />
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={handleExport} style={styles.actionButton} title="Copy log to clipboard">
            <Download size={11} />
          </button>
          <button onClick={handleClear} style={styles.actionButton} title="Clear log">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        style={styles.logList}
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
          setAutoScroll(atBottom);
        }}
      >
        {filteredEntries.length === 0 && (
          <div style={styles.emptyState}>
            No log entries{levelFilter !== "all" ? ` (${levelFilter})` : ""}
          </div>
        )}
        {filteredEntries.map((entry, i) => {
          const config = LEVEL_CONFIG[entry.level] ?? LEVEL_CONFIG.info;
          const Icon = config.icon;

          return (
            <div key={i} style={styles.logEntry}>
              <div style={styles.logTime}>{formatTime(entry.timestamp)}</div>
              <div
                style={{
                  ...styles.logLevel,
                  color: config.color,
                }}
              >
                <Icon size={11} />
              </div>
              <div style={styles.logMessage}>
                {entry.message}
                {entry.paneId && <span style={styles.logPane}>{entry.paneId}</span>}
                {entry.agentAction && <span style={styles.logAction}>{entry.agentAction}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
          style={styles.scrollButton}
        >
          <ArrowDown size={11} />
          <span>Scroll to bottom</span>
        </button>
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
    position: "relative",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 8px 6px",
    borderBottom: "1px solid var(--grid-border-subtle)",
    flexShrink: 0,
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    padding: "2px 5px",
    background: "none",
    border: "1px solid transparent",
    borderRadius: 4,
    color: "var(--grid-fg-dim)",
    fontSize: 10,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    transition: "all var(--duration-fast)",
  },
  filterChipActive: {
    background: "var(--grid-accent-muted)",
    borderColor: "var(--grid-accent)",
    color: "var(--grid-accent)",
  },
  actions: {
    display: "flex",
    gap: 2,
  },
  actionButton: {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    color: "var(--grid-fg-dim)",
    cursor: "pointer",
    borderRadius: 4,
    transition: "color var(--duration-fast)",
  },
  logList: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0",
  },
  emptyState: {
    color: "var(--grid-fg-dim)",
    fontSize: 12,
    textAlign: "center",
    padding: 24,
  },
  logEntry: {
    display: "flex",
    alignItems: "flex-start",
    gap: 6,
    padding: "3px 8px",
    fontSize: 11,
    lineHeight: 1.4,
    transition: "background var(--duration-fast)",
  },
  logTime: {
    color: "var(--grid-fg-dim)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    flexShrink: 0,
    marginTop: 1,
    minWidth: 56,
  },
  logLevel: {
    flexShrink: 0,
    marginTop: 1,
    display: "flex",
    alignItems: "center",
  },
  logMessage: {
    color: "var(--grid-fg-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    lineHeight: 1.4,
    flex: 1,
    wordBreak: "break-word",
  },
  logPane: {
    marginLeft: 4,
    padding: "0 4px",
    background: "var(--grid-bg-elevated)",
    borderRadius: 3,
    fontSize: 9,
    color: "var(--grid-fg-dim)",
    fontFamily: "var(--font-mono)",
  },
  logAction: {
    marginLeft: 4,
    padding: "0 4px",
    background: "rgba(139, 92, 246, 0.1)",
    borderRadius: 3,
    fontSize: 9,
    color: "var(--grid-accent)",
    fontFamily: "var(--font-mono)",
  },
  scrollButton: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    background: "var(--grid-bg-elevated)",
    border: "1px solid var(--grid-border)",
    borderRadius: 12,
    color: "var(--grid-fg-muted)",
    fontSize: 10,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  },
};
