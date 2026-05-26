/**
 * CouncilPanel — LLM Council debate/voting UI.
 * Shows side-by-side responses, vote buttons, majority highlight,
 * devil's advocate indicator, and council history.
 */

import { useState, useEffect, useCallback } from "react";
import { Scale, Skull, ClipboardList, Check, X, Minus, Zap, MessageCircle } from "lucide-react";
import type { GridLayout, CouncilPosition, CouncilVote, CouncilSession } from "../types";

interface CouncilPanelProps {
  isOpen: boolean;
  onClose: () => void;
  grid: GridLayout | null;
}

const POSITION_COLORS: Record<string, string> = {
  approve: "#22c55e",
  reject: "#ef4444",
  modify: "#eab308",
  abstain: "#6b7280",
};

const POSITION_ICONS: Record<string, React.ReactNode> = {
  approve: <Check size={14} />,
  reject: <X size={14} />,
  modify: <Minus size={14} />,
  abstain: <Minus size={14} strokeDasharray="2 2" />,
};

export function CouncilPanel({ isOpen, onClose, grid }: CouncilPanelProps) {
  const [activeSession, setActiveSession] = useState<CouncilSession | null>(null);
  const [sessions, setSessions] = useState<CouncilSession[]>([]);
  const [history, setHistory] = useState<CouncilSession[]>([]);
  const [tab, setTab] = useState<"active" | "history">("active");
  const [topic, setTopic] = useState("");
  const [selectedPanes, setSelectedPanes] = useState<string[]>([]);
  const [mode, setMode] = useState<"parallel" | "debate">("parallel");

  // Listen for council updates
  useEffect(() => {
    const unsub = window.api?.council?.onUpdated?.((session: unknown) => {
      const s = session as CouncilSession;
      setActiveSession(s);
      setSessions((prev) => {
        const idx = prev.findIndex((p) => p.id === s.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = s;
          return next;
        }
        return [...prev, s];
      });
    });
    return () => {
      unsub?.();
    };
  }, []);

  // Load active sessions and history on open
  useEffect(() => {
    if (!isOpen) return;
    window.api?.council?.list?.().then((list: unknown) => {
      if (Array.isArray(list)) setSessions(list as CouncilSession[]);
    });
    window.api?.council?.history?.().then((h: unknown) => {
      if (Array.isArray(h)) setHistory(h as CouncilSession[]);
    });
  }, [isOpen]);

  const startCouncil = useCallback(async () => {
    if (!topic.trim() || selectedPanes.length < 2) return;
    const session = await window.api?.council?.start?.(topic, selectedPanes, mode);
    if (session) {
      setActiveSession(session as CouncilSession);
      setTopic("");
      setSelectedPanes([]);
    }
  }, [topic, selectedPanes, mode]);

  const castVote = useCallback(
    async (paneId: string, position: CouncilPosition) => {
      if (!activeSession) return;
      await window.api?.council?.vote?.(activeSession.id, paneId, position, "Manual vote from UI");
    },
    [activeSession],
  );

  const triggerDevilsAdvocate = useCallback(async () => {
    if (!activeSession) return;
    await window.api?.council?.devilsAdvocate?.(activeSession.id);
  }, [activeSession]);

  const getSummary = useCallback(async () => {
    if (!activeSession) return;
    const sessionId = activeSession.id;
    const summary = await window.api?.council?.summary?.(sessionId);
    if (summary) {
      setActiveSession((prev) => (prev ? { ...prev, summary: summary as string } : prev));
    }
  }, [activeSession]);

  const togglePane = (paneId: string) => {
    setSelectedPanes((prev) =>
      prev.includes(paneId) ? prev.filter((p) => p !== paneId) : [...prev, paneId],
    );
  };

  // Find majority position
  const getMajority = (votes: CouncilVote[]): string | null => {
    if (votes.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const v of votes) counts[v.position] = (counts[v.position] ?? 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[1] > votes.length / 2 ? sorted[0][0] : null;
  };

  if (!isOpen) return null;

  const majority = activeSession ? getMajority(activeSession.votes) : null;

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 998 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          maxHeight: "85vh",
          background: "var(--grid-bg-elevated, #242320)",
          border: "1px solid var(--grid-border, #2e2d2a)",
          borderRadius: 12,
          overflow: "hidden",
          zIndex: 999,
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--grid-border, #2e2d2a)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Scale size={16} style={{ color: "var(--grid-accent, #8b5cf6)" }} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                color: "var(--grid-fg, #e8e4de)",
              }}
            >
              LLM Council
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setTab("active")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                background: tab === "active" ? "var(--grid-accent, #8b5cf6)" : "transparent",
                color:
                  tab === "active"
                    ? "var(--color-grid-fg, #f5f4f1)"
                    : "var(--grid-fg-muted, #9c9689)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              Active
            </button>
            <button
              onClick={() => setTab("history")}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "none",
                background: tab === "history" ? "var(--grid-accent, #8b5cf6)" : "transparent",
                color:
                  tab === "history"
                    ? "var(--color-grid-fg, #f5f4f1)"
                    : "var(--grid-fg-muted, #9c9689)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
              }}
            >
              History ({history.length})
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--grid-fg-dim, #6b665c)",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {tab === "active" && (
            <>
              {/* Session switcher — show when multiple active sessions exist */}
              {sessions.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--grid-fg-dim, #6b665c)",
                      fontFamily: "var(--font-mono)",
                      alignSelf: "center",
                    }}
                  >
                    Sessions:
                  </span>
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSession(s)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor:
                          activeSession?.id === s.id
                            ? "var(--grid-accent, #8b5cf6)"
                            : "var(--grid-border, #2e2d2a)",
                        background:
                          activeSession?.id === s.id ? "rgba(139,92,246,0.15)" : "transparent",
                        color:
                          activeSession?.id === s.id
                            ? "var(--grid-accent, #8b5cf6)"
                            : "var(--grid-fg-muted, #9c9689)",
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        cursor: "pointer",
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.topic.slice(0, 30)}
                      {s.topic.length > 30 ? "..." : ""}
                    </button>
                  ))}
                </div>
              )}

              {/* New Council Form */}
              {!activeSession && (
                <div style={{ marginBottom: 16 }}>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter question or decision for the council..."
                    onKeyDown={(e) => e.key === "Enter" && startCouncil()}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "var(--grid-bg, #141312)",
                      border: "1px solid var(--grid-border, #2e2d2a)",
                      borderRadius: 8,
                      color: "var(--grid-fg, #e8e4de)",
                      fontSize: 13,
                      fontFamily: "var(--font-mono)",
                      outline: "none",
                      marginBottom: 12,
                    }}
                  />

                  {/* Mode selector */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 12,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--grid-fg-dim, #6b665c)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Mode:
                    </span>
                    {(["parallel", "debate"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          border: "1px solid",
                          borderColor:
                            mode === m
                              ? "var(--grid-accent, #8b5cf6)"
                              : "var(--grid-border, #2e2d2a)",
                          background: mode === m ? "rgba(139,92,246,0.15)" : "transparent",
                          color:
                            mode === m
                              ? "var(--grid-accent, #8b5cf6)"
                              : "var(--grid-fg-muted, #9c9689)",
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          cursor: "pointer",
                          transition: "all 150ms ease",
                        }}
                      >
                        {m === "parallel" ? (
                          <>
                            <Zap size={11} className="mr-1 inline" /> Parallel
                          </>
                        ) : (
                          <>
                            <MessageCircle size={11} className="mr-1 inline" /> Debate
                          </>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Pane selector */}
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--grid-fg-dim)",
                      marginBottom: 6,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Select 2+ members:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {grid?.panes.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => togglePane(p.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid",
                          borderColor: selectedPanes.includes(p.id)
                            ? "var(--grid-accent, #8b5cf6)"
                            : "var(--grid-border, #2e2d2a)",
                          background: selectedPanes.includes(p.id)
                            ? "rgba(139,92,246,0.15)"
                            : "transparent",
                          color: selectedPanes.includes(p.id)
                            ? "var(--grid-accent, #8b5cf6)"
                            : "var(--grid-fg-muted, #9c9689)",
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          cursor: "pointer",
                        }}
                      >
                        {selectedPanes.includes(p.id) && (
                          <Check size={11} style={{ display: "inline", marginRight: 4 }} />
                        )}
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={startCouncil}
                    disabled={!topic.trim() || selectedPanes.length < 2}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 6,
                      border: "none",
                      background:
                        topic.trim() && selectedPanes.length >= 2
                          ? "var(--grid-accent, #8b5cf6)"
                          : "var(--grid-bg, #141312)",
                      color:
                        topic.trim() && selectedPanes.length >= 2
                          ? "var(--color-grid-fg, #f5f4f1)"
                          : "var(--grid-fg-dim, #6b665c)",
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      cursor: topic.trim() && selectedPanes.length >= 2 ? "pointer" : "default",
                    }}
                  >
                    Start Council ({selectedPanes.length} members, {mode} mode)
                  </button>
                </div>
              )}

              {/* Active Session */}
              {activeSession && (
                <div>
                  {/* Topic */}
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "var(--grid-bg, #141312)",
                      borderRadius: 8,
                      marginBottom: 12,
                      borderLeft: "3px solid var(--grid-accent, #8b5cf6)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--grid-fg-dim, #6b665c)",
                        fontFamily: "var(--font-mono)",
                        marginBottom: 4,
                      }}
                    >
                      {activeSession.mode.toUpperCase()} • {activeSession.status.toUpperCase()}
                      {activeSession.decision && ` • ${activeSession.decision}`}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--grid-fg, #e8e4de)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {activeSession.topic}
                    </div>
                  </div>

                  {/* Votes */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}
                  >
                    {activeSession.votes.map((v) => {
                      const isMajority = v.position === majority;
                      return (
                        <div
                          key={v.paneId}
                          style={{
                            padding: "10px 14px",
                            background: isMajority
                              ? `${POSITION_COLORS[v.position]}11`
                              : "var(--grid-bg, #141312)",
                            border: `1px solid ${isMajority ? (POSITION_COLORS[v.position] ?? "#2e2d2a") : "var(--grid-border, #2e2d2a)"}`,
                            borderRadius: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 4,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                style={{
                                  color: POSITION_COLORS[v.position] ?? "#6b7280",
                                  fontWeight: "bold",
                                  fontSize: 14,
                                }}
                              >
                                {POSITION_ICONS[v.position] ?? "?"}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontFamily: "var(--font-mono)",
                                  color: "var(--grid-fg, #e8e4de)",
                                }}
                              >
                                {v.label}
                              </span>
                              {v.isDevilsAdvocate && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    padding: "1px 6px",
                                    background: "rgba(239,68,68,0.15)",
                                    color: "#ef4444",
                                    borderRadius: 4,
                                    fontFamily: "var(--font-mono)",
                                  }}
                                >
                                  <Skull size={11} style={{ display: "inline", marginRight: 4 }} />
                                  Devil's Advocate
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontFamily: "var(--font-mono)",
                                color: POSITION_COLORS[v.position] ?? "#6b7280",
                                fontWeight: isMajority ? "bold" : "normal",
                              }}
                            >
                              {v.position.toUpperCase()}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--grid-fg-muted, #9c9689)",
                              fontFamily: "var(--font-mono)",
                              lineHeight: 1.5,
                            }}
                          >
                            {v.reasoning}
                          </div>
                        </div>
                      );
                    })}

                    {/* Pending votes — only show for active sessions, not decided/cancelled */}
                    {activeSession.status !== "decided" &&
                      activeSession.status !== "cancelled" &&
                      activeSession.participants
                        .filter((pid) => !activeSession.votes.find((v) => v.paneId === pid))
                        .map((pid) => {
                          const pane = grid?.panes.find((p) => p.id === pid);
                          return (
                            <div
                              key={pid}
                              style={{
                                padding: "10px 14px",
                                background: "var(--grid-bg, #141312)",
                                border: "1px dashed var(--grid-border, #2e2d2a)",
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  fontFamily: "var(--font-mono)",
                                  color: "var(--grid-fg-dim, #6b665c)",
                                }}
                              >
                                {pane?.label ?? pid} — awaiting response...
                              </span>
                              <div style={{ display: "flex", gap: 4 }}>
                                {(["approve", "reject", "modify"] as CouncilPosition[]).map(
                                  (pos) => (
                                    <button
                                      key={pos}
                                      onClick={() => castVote(pid, pos)}
                                      style={{
                                        padding: "4px 10px",
                                        borderRadius: 4,
                                        border: `1px solid ${POSITION_COLORS[pos]}`,
                                        background: "transparent",
                                        color: POSITION_COLORS[pos],
                                        fontSize: 10,
                                        fontFamily: "var(--font-mono)",
                                        cursor: "pointer",
                                        transition: "all 150ms ease",
                                      }}
                                    >
                                      {pos}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          );
                        })}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {activeSession.status === "decided" && !activeSession.devilsAdvocateId && (
                      <button
                        onClick={triggerDevilsAdvocate}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #ef4444",
                          background: "rgba(239,68,68,0.1)",
                          color: "#ef4444",
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          cursor: "pointer",
                        }}
                      >
                        <Skull size={11} style={{ display: "inline", marginRight: 4 }} />
                        Devil's Advocate
                      </button>
                    )}
                    <button
                      onClick={getSummary}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "1px solid var(--grid-border, #2e2d2a)",
                        background: "transparent",
                        color: "var(--grid-fg-muted, #9c9689)",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        cursor: "pointer",
                      }}
                    >
                      <ClipboardList size={11} style={{ display: "inline", marginRight: 4 }} />{" "}
                      Summary
                    </button>
                    <button
                      onClick={() => setActiveSession(null)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "1px solid var(--grid-border, #2e2d2a)",
                        background: "transparent",
                        color: "var(--grid-fg-muted, #9c9689)",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        cursor: "pointer",
                      }}
                    >
                      + New Council
                    </button>
                  </div>

                  {/* Summary display */}
                  {activeSession.summary && (
                    <pre
                      style={{
                        marginTop: 12,
                        padding: 12,
                        background: "var(--grid-bg, #141312)",
                        borderRadius: 8,
                        fontSize: 11,
                        color: "var(--grid-fg-muted, #9c9689)",
                        fontFamily: "var(--font-mono)",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                        maxHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      {activeSession.summary}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}

          {/* History tab */}
          {tab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 20,
                    color: "var(--grid-fg-dim, #6b665c)",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  No council history yet
                </div>
              )}
              {history.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSession(s);
                    setTab("active");
                  }}
                  style={{
                    padding: "10px 14px",
                    background: "var(--grid-bg, #141312)",
                    border: "1px solid var(--grid-border, #2e2d2a)",
                    borderRadius: 8,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--grid-fg, #e8e4de)",
                        fontFamily: "var(--font-mono)",
                        marginBottom: 2,
                      }}
                    >
                      {s.topic}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--grid-fg-dim, #6b665c)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {s.votes.length} votes • {new Date(s.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: s.decision?.startsWith("APPROVED")
                        ? "rgba(34,197,94,0.15)"
                        : s.decision?.startsWith("REJECTED")
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(234,179,8,0.15)",
                      color: s.decision?.startsWith("APPROVED")
                        ? "#22c55e"
                        : s.decision?.startsWith("REJECTED")
                          ? "#ef4444"
                          : "#eab308",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {s.decision ?? "pending"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
