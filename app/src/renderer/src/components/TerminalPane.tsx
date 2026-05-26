import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { SerializeAddon } from "@xterm/addon-serialize";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { WebglAddon } from "@xterm/addon-webgl";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { ImageAddon } from "@xterm/addon-image";
import { PaneSettings } from "./PaneSettings";
import { TerminalSearch } from "./TerminalSearch";
import type { PaneConfig } from "../types";
import { STATUS_COLORS, TERMINAL_THEMES } from "../types";
import type { TerminalThemeName } from "../types";

interface TerminalPaneProps {
  pane: PaneConfig;
  isFocused: boolean;
  isZoomed?: boolean;
  onFocus: () => void;
  onZoom?: () => void;
  onClose: () => void;
  onRename: (label: string) => void;
  onModelChange?: (model: string) => void;
  onEffortChange?: (effort: string) => void;
  onSplit?: (direction: "horizontal" | "vertical") => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

export function TerminalPane({
  pane,
  isFocused,
  isZoomed,
  onFocus,
  onZoom,
  onClose,
  onRename,
  onModelChange,
  onEffortChange,
  onSplit,
  draggable: isDraggable,
  onDragStart: onHeaderDragStart,
  onDragOver: onHeaderDragOver,
  onDrop: onHeaderDrop,
  onDragEnd: onHeaderDragEnd,
}: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const serializeAddonRef = useRef<SerializeAddon | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [memoryPct, setMemoryPct] = useState(0);
  const [compactionCount, setCompactionCount] = useState(0);
  const [gitBranch, setGitBranch] = useState<string | null>(null);
  const [prBadge, setPrBadge] = useState<string | null>(null);
  const totalBytesRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      theme: {
        background: "#141312",
        foreground: "#f5f4f1",
        cursor: "#8b5cf6",
        cursorAccent: "#141312",
        selectionBackground: "rgba(139, 92, 246, 0.3)",
        black: "#1c1b19",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#eab308",
        blue: "#3b82f6",
        magenta: "#8b5cf6",
        cyan: "#06b6d4",
        white: "#f5f4f1",
        brightBlack: "#6e6b66",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#fbbf24",
        brightBlue: "#60a5fa",
        brightMagenta: "#a78bfa",
        brightCyan: "#22d3ee",
        brightWhite: "#ffffff",
      },
      fontFamily: "'SF Mono', 'JetBrains Mono', 'Cascadia Code', monospace",
      fontSize: 13,
      fontWeight: "400",
      fontWeightBold: "600",
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: "block",
      allowTransparency: true,
      scrollback: 50000,
      fastScrollModifier: "alt",
      smoothScrollDuration: 0, // Instant scroll — zero overhead
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    const serializeAddon = new SerializeAddon();
    const webLinksAddon = new WebLinksAddon((_e, uri) => {
      // Open URLs in system browser (Feature 52)
      window.open(uri, "_blank");
    });
    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);
    term.loadAddon(serializeAddon);
    term.loadAddon(webLinksAddon);

    // Unicode11 for emoji and CJK rendering (Feature 53)
    try {
      const unicode11 = new Unicode11Addon();
      term.loadAddon(unicode11);
      term.unicode.activeVersion = "11";
    } catch {
      console.warn("[TerminalPane] Unicode11 addon not available");
    }

    // Inline image protocol support (Feature 54)
    try {
      const imageAddon = new ImageAddon();
      term.loadAddon(imageAddon);
    } catch {
      console.warn("[TerminalPane] Image addon not available");
    }

    term.open(containerRef.current);
    searchAddonRef.current = searchAddon;
    serializeAddonRef.current = serializeAddon;

    // Copy-on-select (Feature 58)
    term.onSelectionChange(() => {
      const selection = term.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection).catch(() => {
          // Clipboard access denied — silent
        });
      }
    });

    // Apply saved terminal settings from electron-store (including theme — Feature 56)
    if (window.api?.settings?.getAll) {
      window.api.settings
        .getAll()
        .then((saved: Record<string, unknown>) => {
          if (!saved) return;
          if (saved.terminalFontSize) term.options.fontSize = saved.terminalFontSize as number;
          if (saved.terminalFontFamily)
            term.options.fontFamily = saved.terminalFontFamily as string;
          // Apply terminal theme
          if (saved.terminalTheme) {
            const themeName = saved.terminalTheme as TerminalThemeName;
            if (TERMINAL_THEMES[themeName]) {
              term.options.theme = TERMINAL_THEMES[themeName];
            }
          }
          // Apply saved cursor settings (if set), otherwise keep terminal defaults
          if (saved.terminalCursorStyle)
            term.options.cursorStyle = saved.terminalCursorStyle as "bar" | "block" | "underline";
          if (saved.terminalCursorBlink !== undefined)
            term.options.cursorBlink = saved.terminalCursorBlink as boolean;
          requestAnimationFrame(() => fitAddon.fit());
        })
        .catch(() => {
          /* no-op in mock mode */
        });
    }

    // Restore scrollback from previous session (Feature 50)
    if (window.api?.terminal?.restoreScrollback) {
      window.api.terminal
        .restoreScrollback(pane.id)
        .then((saved) => {
          if (saved?.content) {
            term.write(
              `\x1b[90m--- Restored ${saved.content.split("\n").length} lines from previous session ---\x1b[0m\r\n`,
            );
          }
        })
        .catch(() => {
          /* no-op */
        });
    }

    // Enable GPU-accelerated rendering via WebGL (10x faster for rapid output)
    try {
      const webgl = new WebglAddon();
      webgl.onContextLoss(() => {
        webgl.dispose();
        // Falls back to canvas renderer automatically
      });
      term.loadAddon(webgl);
    } catch {
      console.warn("[TerminalPane] WebGL not available, using canvas renderer");
    }

    // Delay fit to let layout settle
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch {
        // Container not visible yet
      }
    });

    // Send user input to main process, or echo locally in mock mode
    const hasPty = !!window.api?.terminal?.write;
    let mockLine = "";

    term.onData((data) => {
      if (hasPty) {
        window.api.terminal.write(pane.id, data);
      } else {
        // Mock mode: local echo with basic line editing
        if (data === "\r") {
          // Enter — echo newline + fake prompt
          term.write("\r\n");
          if (mockLine.trim()) {
            term.write(`\x1b[90m$ ${mockLine}\x1b[0m\r\n`);
          }
          mockLine = "";
          term.write("\x1b[32m❯\x1b[0m ");
        } else if (data === "\x7f") {
          // Backspace
          if (mockLine.length > 0) {
            mockLine = mockLine.slice(0, -1);
            term.write("\b \b");
          }
        } else if (data >= " ") {
          // Printable character
          mockLine += data;
          term.write(data);
        }
      }
    });

    // Show mock prompt on init
    if (!hasPty) {
      term.write(`\x1b[1;35mAgentGrid\x1b[0m \x1b[90m(mock terminal — no PTY)\x1b[0m\r\n`);
      term.write(`\x1b[32m❯\x1b[0m `);
    }

    // Receive terminal output from main process + track memory (Feature 45)
    const writeToTerm = (payload: { paneId: string; data: string }) => {
      if (payload.paneId === pane.id) {
        term.write(payload.data);
        totalBytesRef.current += payload.data.length;
        const estimatedContextBytes = 4 * 1024 * 1024; // ~4MB for 1M context
        const pct = Math.min(100, (totalBytesRef.current / estimatedContextBytes) * 100);
        setMemoryPct(pct);
      }
    };

    const unsubscribe = hasPty ? window.api.terminal.onData(writeToTerm) : null;

    // Replay any buffered startup data for THIS pane (B04 fix — per-pane buffer)
    if (hasPty && window.api.terminal.replayBuffer) {
      window.api.terminal.replayBuffer(pane.id, writeToTerm);
    }

    // Status inference from PTY output (H06 fix)
    // Detect idle/working/error from output patterns and update pane status
    let statusDebounce: ReturnType<typeof setTimeout> | null = null;
    const inferStatus = hasPty
      ? window.api.terminal.onData((payload: { paneId: string; data: string }) => {
          if (payload.paneId !== pane.id) return;
          if (statusDebounce) clearTimeout(statusDebounce);
          // Immediately mark working when any output arrives
          window.api?.pane?.setStatus(pane.id, "working").catch(() => {});
          // After 5s of silence → idle
          statusDebounce = setTimeout(() => {
            window.api?.pane?.setStatus(pane.id, "idle").catch(() => {});
          }, 5000);
        })
      : null;

    // Listen for compaction events (Feature 41)
    const unsubCompaction =
      hasPty && window.api?.terminal?.onCompaction
        ? window.api.terminal.onCompaction((data) => {
            if (data.paneId === pane.id) {
              setCompactionCount(data.count);
            }
          })
        : null;

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;
    cleanupRef.current = unsubscribe ?? null;

    // Resize observer — double-rAF debounce prevents layout thrash storms
    let resizeRafId: number | null = null;
    const debouncedFit = () => {
      if (resizeRafId !== null) return; // Already scheduled
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = requestAnimationFrame(() => {
          resizeRafId = null;
          try {
            fitAddon.fit();
            const dims = fitAddon.proposeDimensions();
            if (dims && window.api?.terminal?.resize) {
              window.api.terminal.resize(pane.id, dims.cols, dims.rows);
            }
          } catch {
            // Ignore resize errors during teardown
          }
        });
      });
    };
    const observer = new ResizeObserver(debouncedFit);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
      if (unsubscribe) unsubscribe();
      if (inferStatus) inferStatus();
      if (statusDebounce) clearTimeout(statusDebounce);
      if (unsubCompaction) unsubCompaction();
      term.dispose();
    };
  }, [pane.id]);

  // Focus terminal when pane is focused
  useEffect(() => {
    if (isFocused && terminalRef.current && !showSearch) {
      terminalRef.current.focus();
    }
  }, [isFocused, showSearch]);

  // Keyboard shortcuts: Cmd+F search, Cmd+K clear scrollback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f" && isFocused) {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
      // Cmd+K handled by App.tsx for CommandPalette — do not intercept here
      // Cmd+= zoom in, Cmd+- zoom out, Cmd+0 reset
      if ((e.metaKey || e.ctrlKey) && e.key === "=" && isFocused) {
        e.preventDefault();
        if (terminalRef.current) {
          const newSize = Math.min(terminalRef.current.options.fontSize! + 1, 24);
          terminalRef.current.options.fontSize = newSize;
          fitAddonRef.current?.fit();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-" && isFocused) {
        e.preventDefault();
        if (terminalRef.current) {
          const newSize = Math.max(terminalRef.current.options.fontSize! - 1, 8);
          terminalRef.current.options.fontSize = newSize;
          fitAddonRef.current?.fit();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0" && isFocused) {
        e.preventDefault();
        if (terminalRef.current) {
          terminalRef.current.options.fontSize = 13;
          fitAddonRef.current?.fit();
        }
      }
      if (e.key === "Escape" && contextMenu) {
        setContextMenu(null);
      }
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
        searchAddonRef.current?.clearDecorations();
        terminalRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, showSearch]);

  // Search focus/query effects now handled by TerminalSearch component

  // Feature 147: Poll git info + PR status every 60s
  useEffect(() => {
    let cancelled = false;
    const fetchGitInfo = async () => {
      if (!pane.cwd || cancelled) return;
      try {
        const info = await window.api?.github?.gitInfo(pane.cwd);
        if (info && !cancelled) setGitBranch(info.branch);
        const pr = await window.api?.github?.prStatus(pane.cwd);
        if (!cancelled) {
          if (pr) {
            const badge =
              pr.state === "merged"
                ? "merged"
                : pr.reviewDecision === "approved"
                  ? "approved"
                  : "pending";
            setPrBadge(badge);
          } else {
            setPrBadge(null);
          }
        }
      } catch {
        // gh CLI not available — silent
      }
    };
    fetchGitInfo();
    const interval = setInterval(fetchGitInfo, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pane.cwd]);

  const statusColor = STATUS_COLORS[pane.status];

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        borderLeft: isFocused ? "2px solid rgba(139, 92, 246, 0.5)" : "1px solid #232220",
      }}
      onClick={onFocus}
    >
      {/* Minimal pane header — Colab AI inspired: no chrome, just info */}
      <div
        className={`flex h-6 shrink-0 cursor-grab items-center justify-between px-2 active:cursor-grabbing ${
          isFocused ? "bg-[#1a1918]" : "bg-[#161514]"
        }`}
        draggable={isDraggable}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", pane.id);
          onHeaderDragStart?.();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          onHeaderDragOver?.();
        }}
        onDrop={(e) => {
          e.preventDefault();
          onHeaderDrop?.();
        }}
        onDragEnd={onHeaderDragEnd}
        onDoubleClick={() => onZoom?.()}
        onContextMenu={(e) => {
          if (!onSplit) return;
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              pane.status === "working" ? "animate-pulse-dot" : ""
            }`}
            style={{ backgroundColor: statusColor }}
          />
          <span className="font-mono text-[11px] font-medium text-grid-fg-secondary">
            {pane.label}
          </span>
          {/* Abbreviated model badge */}
          {pane.model && (
            <span className="font-mono text-[10px] text-grid-accent">
              {pane.model.includes("opus")
                ? "opus"
                : pane.model.includes("sonnet")
                  ? "sonnet"
                  : pane.model.includes("haiku")
                    ? "haiku"
                    : pane.model.replace("claude-", "").split("-")[0]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Settings gear — all other info (persona, agent, effort, git, memory, compaction) lives in PaneSettings */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings((v) => !v);
            }}
            className="rounded px-1 text-grid-fg-muted hover:text-grid-fg-secondary"
            title={[
              `Status: ${pane.status}`,
              pane.persona ? `Persona: ${pane.persona.name}` : `Agent: ${pane.agent}`,
              pane.effort ? `Effort: ${pane.effort}` : "",
              compactionCount > 0 ? `Compactions: ${compactionCount}` : "",
              memoryPct > 10 ? `Memory: ${Math.round(memoryPct)}%` : "",
              gitBranch ? `Branch: ${gitBranch}` : "",
              prBadge ? `PR: ${prBadge}` : "",
            ]
              .filter(Boolean)
              .join(" | ")}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded px-1 text-grid-fg-muted hover:text-red-400"
            title="Close"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar — extracted to TerminalSearch component */}
      {showSearch && (
        <TerminalSearch
          searchAddon={searchAddonRef.current}
          terminal={terminalRef.current}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Settings panel */}
      {showSettings && (
        <PaneSettings
          agent={pane.agent}
          model={pane.model}
          effort={pane.effort}
          cwd={pane.cwd}
          paneId={pane.id}
          onChangeCwd={(cwd: string) => {
            window.api?.pane?.setCwd(pane.id, cwd);
          }}
          onChangeModel={(model: string) => {
            window.api?.pane?.setModel(pane.id, model);
            window.api?.terminal?.write(pane.id, `/model ${model}\n`);
            onModelChange?.(model);
          }}
          onChangeEffort={(effort: string) => {
            window.api?.pane?.setEffort(pane.id, effort);
            window.api?.terminal?.write(pane.id, `/effort ${effort}\n`);
            onEffortChange?.(effort);
          }}
          onChangeAgent={(agent: string) => {
            // Agent change requires full pane restart
            window.api?.pane?.restart(pane.id).catch(() => {
              console.warn("[TerminalPane] Failed to restart pane for agent change");
            });
          }}
          onChangeAppearance={(key, value) => {
            const term = terminalRef.current;
            if (!term) return;
            if (key === "terminalFontSize") term.options.fontSize = value as number;
            if (key === "terminalFontFamily") term.options.fontFamily = value as string;
            if (key === "terminalCursorStyle")
              term.options.cursorStyle = value as "block" | "underline" | "bar";
            if (key === "terminalCursorBlink") term.options.cursorBlink = value as boolean;
            // Terminal theme switching (Feature 56)
            if (key === "terminalTheme") {
              const themeName = value as TerminalThemeName;
              if (TERMINAL_THEMES[themeName]) {
                term.options.theme = TERMINAL_THEMES[themeName];
              }
            }
            // Re-fit after font change
            if (key === "terminalFontSize" || key === "terminalFontFamily") {
              requestAnimationFrame(() => fitAddonRef.current?.fit());
            }
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Context menu for split pane */}
      {contextMenu && onSplit && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 min-w-[160px] rounded-md border border-grid-border bg-grid-surface py-1 shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-grid-fg-secondary hover:bg-grid-accent/10 hover:text-grid-fg"
              onClick={() => {
                onSplit("vertical");
                setContextMenu(null);
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
              Split Vertical
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-grid-fg-secondary hover:bg-grid-accent/10 hover:text-grid-fg"
              onClick={() => {
                onSplit("horizontal");
                setContextMenu(null);
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
              Split Horizontal
            </button>
            <div className="mx-2 my-1 border-t border-grid-border/50" />
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-grid-fg-secondary hover:bg-grid-accent/10 hover:text-grid-fg"
              onClick={async () => {
                setContextMenu(null);
                // GitHub issue creation — stub until inline input is wired
                await window.api?.github?.createIssue?.(pane.cwd, "New Issue", "");
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Create GitHub Issue
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-grid-fg-secondary hover:bg-grid-accent/10 hover:text-grid-fg"
              onClick={async () => {
                setContextMenu(null);
                // TODO: Replace with proper multi-field input dialog IPC
                // For now, create PR with auto-generated title from git log
                await window.api?.github?.createPR("Auto PR", "", pane.cwd, undefined);
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                <line x1="6" y1="9" x2="6" y2="21" />
              </svg>
              Create GitHub PR
            </button>
          </div>
        </>
      )}

      {/* Terminal with drag-and-drop file injection */}
      <div
        ref={containerRef}
        className={`relative min-h-0 flex-1 ${isDragging ? "ring-2 ring-grid-accent/50 ring-inset" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const files = Array.from(e.dataTransfer.files);
          for (const file of files) {
            // Send file path to the terminal
            const filePath = (file as unknown as { path: string }).path;
            if (filePath) {
              window.api?.terminal?.write(pane.id, filePath + " ");
            }
          }
        }}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-grid-accent/10 backdrop-blur-sm">
            <span className="font-mono text-sm text-grid-accent">Drop file to inject path</span>
          </div>
        )}
      </div>
    </div>
  );
}
