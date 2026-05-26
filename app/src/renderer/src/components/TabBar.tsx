import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import type { PaneConfig } from "../types";
import { STATUS_COLORS } from "../types";

interface TabBarProps {
  panes: PaneConfig[];
  focusedPaneId: string | null;
  onFocus: (paneId: string) => void;
  onClose: (paneId: string) => void;
  onRename: (paneId: string, label: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function TabBar({
  panes,
  focusedPaneId,
  onFocus,
  onClose,
  onRename,
  onReorder,
}: TabBarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback((pane: PaneConfig) => {
    setEditingId(pane.id);
    setEditValue(pane.label);
    requestAnimationFrame(() => inputRef.current?.select());
  }, []);

  const handleEditSubmit = useCallback(
    (paneId: string) => {
      if (editValue.trim()) {
        onRename(paneId, editValue.trim());
      }
      setEditingId(null);
    },
    [editValue, onRename],
  );

  const handleTabKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      let targetIndex: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        targetIndex = (index + 1) % panes.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        targetIndex = (index - 1 + panes.length) % panes.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        targetIndex = panes.length - 1;
      }
      if (targetIndex !== null) {
        onFocus(panes[targetIndex].id);
        const tab = document.querySelector<HTMLElement>(
          `[data-pane-tab="${panes[targetIndex].id}"]`,
        );
        tab?.focus();
      }
    },
    [panes, onFocus],
  );

  return (
    <div
      className="flex h-9 shrink-0 items-end gap-0 overflow-x-auto border-b border-grid-border bg-grid-surface px-1"
      role="tablist"
      aria-label="Pane tabs"
    >
      {panes.map((pane, index) => {
        const isActive = focusedPaneId === pane.id;
        const isEditing = editingId === pane.id;
        const isDragOver = dropIndex === index && dragIndex !== index;

        return (
          <div
            key={pane.id}
            data-pane-tab={pane.id}
            role="tab"
            aria-selected={isActive}
            aria-label={`${pane.label} — ${pane.status}`}
            tabIndex={isActive ? 0 : -1}
            draggable={!isEditing}
            onKeyDown={(e) => handleTabKeyDown(e, index)}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              setDropIndex(index);
            }}
            onDragLeave={() => setDropIndex(null)}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== index) {
                onReorder?.(dragIndex, index);
              }
              setDragIndex(null);
              setDropIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setDropIndex(null);
            }}
            onClick={() => onFocus(pane.id)}
            onDoubleClick={() => handleDoubleClick(pane)}
            className={`group flex h-8 cursor-pointer items-center gap-2 rounded-t-md border-x border-t px-3 transition-colors ${
              isActive
                ? "border-grid-border bg-grid-bg text-grid-fg"
                : "border-transparent text-grid-fg-muted hover:bg-grid-bg/50 hover:text-grid-fg-secondary"
            } ${isDragOver ? "ring-1 ring-inset ring-grid-accent/40" : ""}`}
            style={{ minWidth: 100, maxWidth: 180 }}
          >
            {/* Status dot */}
            <span
              className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                pane.status === "working" ? "animate-pulse-dot" : ""
              }`}
              style={{ backgroundColor: STATUS_COLORS[pane.status] }}
            />

            {/* Label */}
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSubmit(pane.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={() => handleEditSubmit(pane.id)}
                className="w-full bg-transparent font-mono text-[11px] text-grid-fg outline-none"
                autoFocus
              />
            ) : (
              <span className="truncate font-mono text-[11px]">{pane.label}</span>
            )}

            {/* Close button — visible on hover or when active */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(pane.id);
              }}
              className={`ml-auto shrink-0 rounded p-0.5 transition-opacity ${
                isActive
                  ? "text-grid-fg-muted opacity-60 hover:text-red-400 hover:opacity-100"
                  : "opacity-0 group-hover:opacity-60 hover:!text-red-400 hover:!opacity-100"
              }`}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* Bottom fill line */}
      <div className="flex-1" />
    </div>
  );
}
