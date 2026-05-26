import { useState, useCallback, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, FastForward } from "lucide-react";

interface ReplayEntry {
  timestamp: number;
  paneId: string;
  action: "input" | "output" | "status" | "spawn" | "kill";
  data: string;
}

interface SessionReplayProps {
  sessionName?: string;
  entries?: ReplayEntry[];
}

const SPEED_OPTIONS = [1, 2, 4] as const;

export function SessionReplay({ sessionName, entries: externalEntries }: SessionReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [entries] = useState<ReplayEntry[]>(externalEntries ?? []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEED_OPTIONS)[number]>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-advance playback
  useEffect(() => {
    if (!isPlaying || entries.length === 0 || currentIndex >= entries.length - 1) {
      if (isPlaying && currentIndex >= entries.length - 1) {
        setIsPlaying(false);
      }
      return;
    }

    const currentTs = entries[currentIndex].timestamp;
    const nextTs = entries[currentIndex + 1].timestamp;
    const delay = Math.max(50, (nextTs - currentTs) / speed);

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, entries, speed]);

  // Auto-scroll to current entry
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector("[data-active='true']");
      activeEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentIndex]);

  const handlePlay = useCallback(() => {
    if (currentIndex >= entries.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying((v) => !v);
  }, [currentIndex, entries.length]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  const handleSpeedCycle = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  }, []);

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setCurrentIndex(val);
    setIsPlaying(false);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-grid-border px-3 py-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-grid-fg-muted">
          Session Replay
        </span>
        <div className="flex gap-1">
          <button
            onClick={handleSpeedCycle}
            className="rounded px-1.5 py-0.5 font-mono text-[10px] text-grid-fg-muted hover:text-grid-fg-secondary"
            title={`Speed: ${speed}x`}
          >
            <FastForward size={10} className="mr-0.5 inline" />
            {speed}x
          </button>
          <button
            onClick={handlePlay}
            className="rounded p-1 text-grid-fg-muted hover:text-grid-fg-secondary"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            onClick={handleReset}
            className="rounded p-1 text-grid-fg-muted hover:text-grid-fg-secondary"
            title="Reset"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3" ref={containerRef}>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Clock size={24} className="text-grid-fg-muted" />
            <p className="font-mono text-xs text-grid-fg-muted">
              {sessionName ? `No replay data for "${sessionName}"` : "Select a session to replay"}
            </p>
            <p className="font-mono text-[10px] text-grid-fg-muted">
              Session recording captures all terminal I/O for deterministic replay
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {entries.slice(0, currentIndex + 1).map((entry, i) => {
              const isActive = i === currentIndex;
              return (
                <div
                  key={i}
                  data-active={isActive}
                  className={`flex items-start gap-2 rounded px-2 py-1 font-mono text-[10px] ${
                    isActive ? "bg-grid-accent/10 text-grid-fg" : "text-grid-fg-muted"
                  }`}
                >
                  <span className="shrink-0 text-grid-fg-muted">
                    {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                      hour12: false,
                    })}
                  </span>
                  <span className="shrink-0 text-grid-accent">{entry.action}</span>
                  <span className="truncate">{entry.data.slice(0, 80)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {entries.length > 0 && (
        <div className="border-t border-grid-border px-3 py-1.5">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={entries.length - 1}
              value={currentIndex}
              onChange={handleScrub}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-grid-border [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-grid-accent"
            />
            <span className="font-mono text-[10px] text-grid-fg-muted">
              {currentIndex + 1}/{entries.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
