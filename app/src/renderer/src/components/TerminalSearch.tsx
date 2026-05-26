/**
 * TerminalSearch — Inline search bar for terminal panes.
 * Extracted from TerminalPane.tsx to reduce file complexity.
 */

import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import type { SearchAddon } from "@xterm/addon-search";
import type { Terminal } from "@xterm/xterm";

interface TerminalSearchProps {
  searchAddon: SearchAddon | null;
  terminal: Terminal | null;
  onClose: () => void;
}

export function TerminalSearch({ searchAddon, terminal, onClose }: TerminalSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Run search when query changes
  useEffect(() => {
    if (searchAddon && query) {
      searchAddon.findNext(query, {
        decorations: {
          activeMatchColorOverviewRuler: "#8b5cf6",
          matchOverviewRuler: "#6b665c",
        },
      });
    }
  }, [query, searchAddon]);

  function handleClose() {
    searchAddon?.clearDecorations();
    setQuery("");
    terminal?.focus();
    onClose();
  }

  return (
    <div className="flex h-8 shrink-0 items-center gap-2 border-b border-grid-border bg-grid-surface px-3">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            searchAddon?.findNext(query);
          }
          if (e.key === "Escape") {
            handleClose();
          }
        }}
        placeholder="Search terminal..."
        className="flex-1 bg-transparent font-mono text-xs text-grid-fg-secondary outline-none placeholder:text-grid-fg-muted"
      />
      <button
        onClick={() => searchAddon?.findPrevious(query)}
        className="cursor-pointer rounded px-1 text-grid-fg-muted hover:text-grid-fg-secondary"
        title="Previous"
      >
        <ChevronUp size={14} />
      </button>
      <button
        onClick={() => searchAddon?.findNext(query)}
        className="cursor-pointer rounded px-1 text-grid-fg-muted hover:text-grid-fg-secondary"
        title="Next"
      >
        <ChevronDown size={14} />
      </button>
      <button
        onClick={handleClose}
        className="cursor-pointer rounded px-1 text-grid-fg-muted hover:text-red-400"
        title="Close search"
      >
        <X size={14} />
      </button>
    </div>
  );
}
