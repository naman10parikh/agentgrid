import { useState, useEffect, useCallback, useRef, useId } from "react";

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void | Promise<unknown>;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const filtered = query
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) || (c.shortcut?.toLowerCase().includes(q) ?? false)
        );
      })
    : commands;

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation(); // Prevent bubbling to App-level Escape handler
        onClose();
      } else if (e.key === "Tab") {
        // Focus trap — keep focus within the dialog
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => {
          const next = Math.min(i + 1, Math.max(0, filtered.length - 1));
          listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => {
          const next = Math.max(i - 1, 0);
          listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "Enter" && filtered.length > 0 && filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    },
    [filtered, selectedIndex, onClose],
  );

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
        style={{
          position: "fixed",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 480,
          maxHeight: "60vh",
          background: "var(--grid-bg-elevated, #242320)",
          border: "1px solid var(--grid-border, #2e2d2a)",
          borderRadius: 12,
          overflow: "hidden",
          zIndex: 1000,
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={
            filtered[selectedIndex] ? `cmd-${filtered[selectedIndex].id}` : undefined
          }
          aria-autocomplete="list"
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--grid-border, #2e2d2a)",
            color: "var(--grid-fg, #e8e4de)",
            fontSize: 14,
            fontFamily: "var(--font-body)",
            outline: "none",
          }}
        />
        <div
          ref={listRef}
          role="listbox"
          id={listId}
          aria-label="Commands"
          style={{ maxHeight: 300, overflowY: "auto", padding: "4px 0" }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                padding: "20px 16px",
                textAlign: "center",
                color: "var(--grid-fg-dim, #6b665c)",
                fontSize: 13,
              }}
            >
              No commands found
            </div>
          )}
          {filtered.map((cmd, i) => (
            <div
              key={cmd.id}
              id={`cmd-${cmd.id}`}
              role="option"
              aria-selected={i === selectedIndex}
              onClick={() => {
                cmd.action();
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 16px",
                background:
                  i === selectedIndex
                    ? "var(--grid-accent-muted, rgba(139,92,246,0.15))"
                    : "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color:
                  i === selectedIndex
                    ? "var(--grid-accent, #8b5cf6)"
                    : "var(--grid-fg-muted, #9c9689)",
                transition: "background 50ms",
              }}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <span style={{ fontSize: 10, color: "var(--grid-fg-dim, #6b665c)" }}>
                  {cmd.shortcut}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
