import { useState, useRef, useCallback, useEffect } from "react";
import { TerminalPane } from "./TerminalPane";
import { ErrorBoundary } from "./ErrorBoundary";
import type { GridLayout } from "../types";

interface GridViewProps {
  grid: GridLayout;
  focusedPaneId: string | null;
  zoomedPaneId?: string | null;
  equalize?: boolean;
  onPaneFocus: (paneId: string) => void;
  onPaneZoom?: (paneId: string) => void;
  onPaneClose: (paneId: string) => void;
  onPaneRename: (paneId: string, label: string) => void;
  onPaneSwap?: (paneIdA: string, paneIdB: string) => void;
  onPaneModelChange?: (paneId: string, model: string) => void;
  onPaneEffortChange?: (paneId: string, effort: string) => void;
  onPaneSplit?: (paneId: string, direction: "horizontal" | "vertical") => void;
  onEqualizeHandled?: () => void;
}

export function GridView({
  grid,
  focusedPaneId,
  zoomedPaneId,
  onPaneFocus,
  onPaneZoom,
  onPaneClose,
  onPaneRename,
  onPaneSwap,
  onPaneModelChange,
  onPaneEffortChange,
  onPaneSplit,
  equalize,
  onEqualizeHandled,
}: GridViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isZoomed = !!zoomedPaneId;
  const visiblePanes = isZoomed ? grid.panes.filter((p) => p.id === zoomedPaneId) : grid.panes;

  const [colSizes, setColSizes] = useState<number[]>(() => Array(grid.cols).fill(1) as number[]);
  const [rowSizes, setRowSizes] = useState<number[]>(() => Array(grid.rows).fill(1) as number[]);

  // Drag-to-reorder state
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    paneId: string;
  } | null>(null);

  useEffect(() => {
    if (equalize) {
      setColSizes(Array(grid.cols).fill(1) as number[]);
      setRowSizes(Array(grid.rows).fill(1) as number[]);
      onEqualizeHandled?.();
    }
  }, [equalize, grid.cols, grid.rows, onEqualizeHandled]);

  // Sync sizes when grid dimensions change
  useEffect(() => {
    setColSizes((prev) =>
      prev.length === grid.cols ? prev : (Array(grid.cols).fill(1) as number[]),
    );
    setRowSizes((prev) =>
      prev.length === grid.rows ? prev : (Array(grid.rows).fill(1) as number[]),
    );
  }, [grid.cols, grid.rows]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu]);

  // Resize handles
  const dragRef = useRef<{
    type: "col" | "row";
    index: number;
    startPos: number;
    startSizes: number[];
    containerSize: number;
  } | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Cleanup stale drag listeners on unmount (H17 fix)
  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  const handleResizeStart = useCallback(
    (type: "col" | "row", index: number, e: React.MouseEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const sizes = type === "col" ? [...colSizes] : [...rowSizes];
      const containerSize = type === "col" ? rect.width : rect.height;

      dragRef.current = {
        type,
        index,
        startPos: type === "col" ? e.clientX : e.clientY,
        startSizes: sizes,
        containerSize,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const d = dragRef.current;
        const currentPos = d.type === "col" ? ev.clientX : ev.clientY;
        const delta = currentPos - d.startPos;
        const totalFr = d.startSizes.reduce((a, b) => a + b, 0);
        const pxPerFr = d.containerSize / totalFr;
        const frDelta = delta / pxPerFr;
        const newSizes = [...d.startSizes];
        const minFr = 0.2;
        newSizes[d.index] = Math.max(minFr, d.startSizes[d.index] + frDelta);
        newSizes[d.index + 1] = Math.max(minFr, d.startSizes[d.index + 1] - frDelta);
        if (d.type === "col") setColSizes(newSizes);
        else setRowSizes(newSizes);
      };

      const handleUp = () => {
        dragRef.current = null;
        dragCleanupRef.current = null;
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
      // Store cleanup so unmount can remove listeners (H17 fix)
      dragCleanupRef.current = handleUp;
      document.body.style.cursor = type === "col" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [colSizes, rowSizes],
  );

  // Drag-to-reorder
  const handlePaneDragStart = useCallback((paneId: string) => {
    setDragSourceId(paneId);
  }, []);

  const handlePaneDragOver = useCallback((paneId: string) => {
    setDragOverId(paneId);
  }, []);

  const handlePaneDrop = useCallback(
    (targetId: string) => {
      if (dragSourceId && dragSourceId !== targetId && onPaneSwap) {
        onPaneSwap(dragSourceId, targetId);
      }
      setDragSourceId(null);
      setDragOverId(null);
    },
    [dragSourceId, onPaneSwap],
  );

  const handlePaneDragEnd = useCallback(() => {
    setDragSourceId(null);
    setDragOverId(null);
  }, []);

  const handleContextMenu = useCallback((paneId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, paneId });
  }, []);

  const colTemplate = isZoomed ? "1fr" : colSizes.map((s) => `${s}fr`).join(" ");
  const rowTemplate = isZoomed ? "1fr" : rowSizes.map((s) => `${s}fr`).join(" ");

  const minPaneHeight = 200;

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateRows: rowTemplate,
          gridTemplateColumns: colTemplate,
          gap: 1,
          padding: 0,
          height: "100%",
          width: "100%",
          overflow: "auto",
          backgroundColor: "var(--grid-border)",
        }}
      >
        {visiblePanes.map((pane) => (
          <div
            key={pane.id}
            style={
              isZoomed
                ? { overflow: "hidden" }
                : {
                    gridRow: `${pane.row + 1} / span ${pane.rowSpan}`,
                    gridColumn: `${pane.col + 1} / span ${pane.colSpan}`,
                    overflow: "hidden",
                    minHeight: `${minPaneHeight}px`,
                    opacity: dragSourceId === pane.id ? 0.5 : 1,
                    outline:
                      dragOverId === pane.id ? "2px solid var(--grid-accent, #8b5cf6)" : "none",
                    outlineOffset: -2,
                    transition: "opacity 150ms, outline 150ms",
                  }
            }
            onContextMenu={(e) => handleContextMenu(pane.id, e)}
          >
            <ErrorBoundary
              fallback={
                <div className="flex h-full items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5">
                  <span className="font-mono text-xs text-red-400">
                    Pane crashed — click to retry
                  </span>
                </div>
              }
            >
              <TerminalPane
                pane={pane}
                isFocused={focusedPaneId === pane.id}
                isZoomed={isZoomed}
                onFocus={() => onPaneFocus(pane.id)}
                onZoom={() => onPaneZoom?.(pane.id)}
                onClose={() => onPaneClose(pane.id)}
                onRename={(label) => onPaneRename(pane.id, label)}
                onModelChange={(model) => onPaneModelChange?.(pane.id, model)}
                onEffortChange={(effort) => onPaneEffortChange?.(pane.id, effort)}
                draggable
                onDragStart={() => handlePaneDragStart(pane.id)}
                onDragOver={() => handlePaneDragOver(pane.id)}
                onDrop={() => handlePaneDrop(pane.id)}
                onDragEnd={handlePaneDragEnd}
              />
            </ErrorBoundary>
          </div>
        ))}

        {/* Column resize handles */}
        {!isZoomed &&
          Array.from({ length: grid.cols - 1 }, (_, i) => (
            <div
              key={`col-handle-${i}`}
              onMouseDown={(e) => handleResizeStart("col", i, e)}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${(colSizes.slice(0, i + 1).reduce((a, b) => a + b, 0) / colSizes.reduce((a, b) => a + b, 0)) * 100}%`,
                width: 6,
                transform: "translateX(-3px)",
                cursor: "col-resize",
                zIndex: 10,
              }}
            />
          ))}

        {/* Row resize handles */}
        {!isZoomed &&
          Array.from({ length: grid.rows - 1 }, (_, i) => (
            <div
              key={`row-handle-${i}`}
              onMouseDown={(e) => handleResizeStart("row", i, e)}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${(rowSizes.slice(0, i + 1).reduce((a, b) => a + b, 0) / rowSizes.reduce((a, b) => a + b, 0)) * 100}%`,
                height: 6,
                transform: "translateY(-3px)",
                cursor: "row-resize",
                zIndex: 10,
              }}
            />
          ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          role="menu"
          aria-label="Pane actions"
          tabIndex={-1}
          ref={(el) => el?.focus()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setContextMenu(null);
              return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const items = e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]');
              const current = Array.from(items).indexOf(document.activeElement as HTMLElement);
              const next =
                e.key === "ArrowDown"
                  ? (current + 1) % items.length
                  : (current - 1 + items.length) % items.length;
              items[next]?.focus();
            }
          }}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 100,
            background: "var(--grid-bg-elevated, #242320)",
            border: "1px solid var(--grid-border, #2e2d2a)",
            borderRadius: 6,
            padding: 4,
            minWidth: 160,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            outline: "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onPaneSplit && (
            <>
              <button
                role="menuitem"
                tabIndex={0}
                onClick={() => {
                  onPaneSplit(contextMenu.paneId, "vertical");
                  setContextMenu(null);
                }}
                className="block w-full rounded px-3 py-1.5 text-left font-mono text-[11px] text-grid-fg hover:bg-grid-bg focus:bg-grid-bg focus:outline-none"
              >
                Split Right
              </button>
              <button
                role="menuitem"
                tabIndex={0}
                onClick={() => {
                  onPaneSplit(contextMenu.paneId, "horizontal");
                  setContextMenu(null);
                }}
                className="block w-full rounded px-3 py-1.5 text-left font-mono text-[11px] text-grid-fg hover:bg-grid-bg focus:bg-grid-bg focus:outline-none"
              >
                Split Down
              </button>
            </>
          )}
          {onPaneZoom && (
            <button
              role="menuitem"
              tabIndex={0}
              onClick={() => {
                onPaneZoom(contextMenu.paneId);
                setContextMenu(null);
              }}
              className="block w-full rounded px-3 py-1.5 text-left font-mono text-[11px] text-grid-fg hover:bg-grid-bg focus:bg-grid-bg focus:outline-none"
            >
              {zoomedPaneId === contextMenu.paneId ? "Restore" : "Fullscreen"}
            </button>
          )}
          <div className="my-1 h-px bg-grid-border" role="separator" />
          <button
            role="menuitem"
            tabIndex={0}
            onClick={() => {
              // Trigger tab bar inline rename instead of prompt() (broken in Electron)
              const tab = document.querySelector<HTMLElement>(
                `[data-pane-tab="${contextMenu.paneId}"]`,
              );
              if (tab) tab.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
              setContextMenu(null);
            }}
            className="block w-full rounded px-3 py-1.5 text-left font-mono text-[11px] text-grid-fg hover:bg-grid-bg focus:bg-grid-bg focus:outline-none"
          >
            Rename
          </button>
          <button
            role="menuitem"
            tabIndex={0}
            onClick={() => {
              onPaneClose(contextMenu.paneId);
              setContextMenu(null);
            }}
            className="block w-full rounded px-3 py-1.5 text-left font-mono text-[11px] text-red-400 hover:bg-grid-bg focus:bg-grid-bg focus:outline-none"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
