import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";

interface UseTerminalOptions {
  paneId: string;
  cwd: string;
  agent: string;
  onReady?: () => void;
}

export function useTerminal({ paneId, cwd, agent, onReady }: UseTerminalOptions) {
  const termRef = useRef<HTMLDivElement | null>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const spawnedRef = useRef(false);

  const attach = useCallback(
    (container: HTMLDivElement | null) => {
      // Cleanup previous
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      spawnedRef.current = false;

      if (!container) {
        termRef.current = null;
        return;
      }

      termRef.current = container;

      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: "bar",
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: 1.4,
        theme: {
          background: "#141312",
          foreground: "#e8e4de",
          cursor: "#8b5cf6",
          cursorAccent: "#141312",
          selectionBackground: "rgba(139, 92, 246, 0.3)",
          black: "#1c1b19",
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#eab308",
          blue: "#3b82f6",
          magenta: "#a78bfa",
          cyan: "#06b6d4",
          white: "#e8e4de",
          brightBlack: "#6b665c",
          brightRed: "#f87171",
          brightGreen: "#4ade80",
          brightYellow: "#facc15",
          brightBlue: "#60a5fa",
          brightMagenta: "#c4b5fd",
          brightCyan: "#22d3ee",
          brightWhite: "#fafaf9",
        },
        allowProposedApi: true,
        scrollback: 10000,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(container);

      // Try WebGL, fall back to canvas
      try {
        const webglAddon = new WebglAddon();
        webglAddon.onContextLoss(() => webglAddon.dispose());
        term.loadAddon(webglAddon);
      } catch {
        // WebGL not available, canvas renderer is fine
      }

      // Fit after open
      requestAnimationFrame(() => {
        fitAddon.fit();
        onReady?.();
      });

      // Send user input to PTY
      term.onData((data) => {
        window.api?.terminal?.write(paneId, data);
      });

      // Receive PTY output
      const unsubscribe = window.api?.terminal?.onData(
        (payload: { paneId: string; data: string }) => {
          if (payload.paneId === paneId) {
            term.write(payload.data);
          }
        },
      );

      // Spawn terminal in main process
      if (!spawnedRef.current) {
        spawnedRef.current = true;
        window.api?.terminal?.spawn(paneId, cwd, agent as import("../types").CliTool);
      }

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
      cleanupRef.current = unsubscribe ?? null;
    },
    [paneId, cwd, agent, onReady],
  );

  // Handle resize
  const fit = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      fitAddonRef.current.fit();
      const { cols, rows } = xtermRef.current;
      window.api?.terminal?.resize(paneId, cols, rows);
    }
  }, [paneId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return { attach, fit, termRef, xtermRef };
}
