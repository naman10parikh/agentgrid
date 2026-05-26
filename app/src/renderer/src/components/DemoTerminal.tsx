/**
 * DemoTerminal — Simulated terminal for demos/screenshots.
 * Types text character by character with realistic timing.
 * Used in landing page interactive demo and WelcomeScreen.
 */

import { useState, useEffect, useRef } from "react";

interface DemoLine {
  type: "prompt" | "output" | "command";
  text: string;
  delay?: number; // ms before this line starts
}

interface DemoTerminalProps {
  lines: DemoLine[];
  title?: string;
  loop?: boolean;
  typingSpeed?: number; // ms per char
}

const DEFAULT_DEMO: DemoLine[] = [
  { type: "prompt", text: "$ " },
  { type: "command", text: "agentgrid 2x3 claude", delay: 500 },
  { type: "output", text: "\n✓ Created 2x3 grid with 6 Claude agents", delay: 800 },
  { type: "output", text: "  Agent 1 (CEO)        — claude-opus-4-6 max", delay: 100 },
  { type: "output", text: "  Agent 2 (Architect)  — claude-opus-4-6 max", delay: 100 },
  { type: "output", text: "  Agent 3 (Builder 1)  — claude-opus-4-6 max", delay: 100 },
  { type: "output", text: "  Agent 4 (Builder 2)  — claude-opus-4-6 max", delay: 100 },
  { type: "output", text: "  Agent 5 (QA)         — claude-opus-4-6 max", delay: 100 },
  { type: "output", text: "  Agent 6 (Docs)       — claude-opus-4-6 max", delay: 100 },
  { type: "output", text: "\n🚀 All agents spawned. Broadcasting mission...", delay: 600 },
  { type: "prompt", text: "\n$ ", delay: 400 },
  { type: "command", text: "agentgrid broadcast 'Build the feature'", delay: 800 },
  { type: "output", text: "\n✓ Broadcast sent to 6 panes", delay: 500 },
  { type: "prompt", text: "\n$ ", delay: 300 },
  { type: "command", text: "agentgrid status", delay: 600 },
  { type: "output", text: "\n┌─────────────┬───────────┬─────────┐", delay: 400 },
  { type: "output", text: "│ CEO         │ WORKING   │ claude  │", delay: 50 },
  { type: "output", text: "│ Architect   │ WORKING   │ claude  │", delay: 50 },
  { type: "output", text: "│ Builder 1   │ WORKING   │ claude  │", delay: 50 },
  { type: "output", text: "│ Builder 2   │ WORKING   │ claude  │", delay: 50 },
  { type: "output", text: "│ QA          │ IDLE      │ claude  │", delay: 50 },
  { type: "output", text: "│ Docs        │ IDLE      │ claude  │", delay: 50 },
  { type: "output", text: "└─────────────┴───────────┴─────────┘", delay: 50 },
];

export function DemoTerminal({
  lines = DEFAULT_DEMO,
  title = "AgentGrid Demo",
  loop = true,
  typingSpeed = 40,
}: DemoTerminalProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const animRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function animate() {
      setDisplayedText("");

      for (const line of lines) {
        if (cancelled) return;

        if (line.delay) {
          await sleep(line.delay);
        }

        if (line.type === "command") {
          // Type character by character
          for (const char of line.text) {
            if (cancelled) return;
            setDisplayedText((prev) => prev + char);
            await sleep(typingSpeed + Math.random() * 30);
          }
        } else {
          // Output appears instantly
          setDisplayedText((prev) => prev + line.text + "\n");
        }
      }

      if (loop && !cancelled) {
        await sleep(3000);
        if (!cancelled) animate();
      }
    }

    animate();

    return () => {
      cancelled = true;
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [lines, loop, typingSpeed]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: "#141312",
        border: "1px solid var(--grid-border, #2e2d2a)",
        borderRadius: 10,
        overflow: "hidden",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        lineHeight: 1.5,
        maxWidth: 600,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          background: "var(--grid-bg-raised, #1c1b19)",
          borderBottom: "1px solid var(--grid-border, #2e2d2a)",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#eab308" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "var(--grid-fg-dim, #6b665c)",
          }}
        >
          {title}
        </span>
        <span style={{ marginLeft: "auto", width: 30 }} />
      </div>

      {/* Terminal content */}
      <div
        style={{
          padding: "12px 16px",
          color: "var(--grid-fg, #e8e4de)",
          whiteSpace: "pre-wrap",
          minHeight: 200,
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        {displayedText}
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 14,
            background: cursorVisible ? "var(--grid-accent, #8b5cf6)" : "transparent",
            verticalAlign: "text-bottom",
          }}
        />
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
