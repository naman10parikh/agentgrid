import { useState, useCallback, useRef } from "react";
import { Mic, MicOff, Plus, Save } from "lucide-react";
import type { GridLayout } from "../types";

interface ControlBarProps {
  grid: GridLayout;
  onBroadcast: (message: string) => void;
  onSave: () => void;
  onAddPane?: () => void;
  viewMode?: "grid" | "graph" | "dashboard";
  onToggleView?: () => void;
}

export function ControlBar({
  grid,
  onBroadcast,
  onSave,
  onAddPane,
  viewMode,
  onToggleView,
}: ControlBarProps) {
  const [broadcastText, setBroadcastText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);

  const handleVoiceInput = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setBroadcastText(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const handleSend = useCallback(() => {
    if (!broadcastText.trim()) return;
    onBroadcast(broadcastText);
    setBroadcastText("");
  }, [broadcastText, onBroadcast]);

  const workingCount = grid.panes.filter((p) => p.status === "working").length;
  const doneCount = grid.panes.filter((p) => p.status === "done").length;

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b border-grid-border bg-grid-surface px-3">
      {/* LEFT: Pane count badge */}
      <div className="flex shrink-0 items-center gap-1.5 font-mono text-[11px]">
        <span className="rounded bg-grid-bg px-1.5 py-0.5 text-grid-fg-muted">
          {grid.panes.length}
        </span>
        {workingCount > 0 && <span className="text-blue-400">{workingCount}w</span>}
        {doneCount > 0 && <span className="text-green-400">{doneCount}d</span>}
      </div>

      {/* CENTER: Broadcast input with voice icon inside */}
      <div className="relative flex min-w-0 flex-1 items-center">
        <input
          data-broadcast-input
          value={broadcastText}
          onChange={(e) => setBroadcastText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Broadcast to all panes..."
          className="w-full rounded border border-grid-border bg-grid-bg py-1 pl-3 pr-20 font-mono text-xs text-grid-fg-primary outline-none focus:border-grid-accent/50"
        />
        <div className="absolute right-1 flex items-center gap-1">
          <button
            onClick={handleVoiceInput}
            className={`rounded p-1 ${
              isListening
                ? "animate-pulse text-red-400"
                : "text-grid-fg-dim hover:text-grid-fg-muted"
            }`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff size={13} /> : <Mic size={13} />}
          </button>
          <button
            onClick={handleSend}
            disabled={!broadcastText.trim()}
            className="rounded bg-grid-accent px-2.5 py-0.5 font-mono text-[11px] font-medium text-grid-fg hover:bg-grid-accent-hover disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>

      {/* RIGHT: Add pane + view toggle + save */}
      <div className="flex shrink-0 items-center gap-1">
        {onAddPane && (
          <button
            onClick={onAddPane}
            className="rounded border border-grid-border p-1.5 text-grid-fg-muted hover:text-green-400"
            title="Add pane"
          >
            <Plus size={14} />
          </button>
        )}
        {onToggleView && (
          <button
            onClick={onToggleView}
            className="rounded border border-grid-border p-1.5 text-grid-fg-muted hover:text-grid-fg-secondary"
            title={`Switch to ${viewMode === "grid" ? "graph" : "grid"} view (⌘G)`}
          >
            {viewMode === "grid" ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="5" r="3" />
                <circle cx="5" cy="19" r="3" />
                <circle cx="19" cy="19" r="3" />
                <line x1="12" y1="8" x2="5" y2="16" />
                <line x1="12" y1="8" x2="19" y2="16" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            )}
          </button>
        )}
        <button
          onClick={onSave}
          className="rounded border border-grid-border p-1.5 text-grid-fg-muted hover:text-grid-fg-secondary"
          title="Save session"
        >
          <Save size={14} />
        </button>
      </div>
    </div>
  );
}
