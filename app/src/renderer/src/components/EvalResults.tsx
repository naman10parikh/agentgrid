import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface EvalDimension {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
}

interface EvalResultsProps {
  harnessName?: string;
  dimensions?: EvalDimension[];
  overallScore?: number;
}

const DEFAULT_DIMENSIONS: EvalDimension[] = [
  { name: "Completeness", score: 0, maxScore: 10, weight: 0.25 },
  { name: "Quality", score: 0, maxScore: 10, weight: 0.2 },
  { name: "Speed", score: 0, maxScore: 10, weight: 0.15 },
  { name: "Communication", score: 0, maxScore: 10, weight: 0.15 },
  { name: "Self-Testing", score: 0, maxScore: 10, weight: 0.15 },
  { name: "Innovation", score: 0, maxScore: 10, weight: 0.1 },
];

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#eab308" : pct >= 40 ? "#f97316" : "#ef4444";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-grid-border">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[10px]" style={{ color }}>
        {score}/{maxScore}
      </span>
    </div>
  );
}

export function EvalResults({
  harnessName,
  dimensions = DEFAULT_DIMENSIONS,
  overallScore,
}: EvalResultsProps) {
  const [viewMode, setViewMode] = useState<"radar" | "bars">("radar");
  const computed =
    overallScore ?? dimensions.reduce((sum, d) => sum + (d.score / d.maxScore) * d.weight, 0);
  const pct = Math.round(computed * 100);

  const radarData = dimensions.map((d) => ({
    dimension: d.name,
    score: d.score,
    fullMark: d.maxScore,
  }));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-grid-border px-3 py-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-grid-fg-muted">
          Eval Results {harnessName && `— ${harnessName}`}
        </span>
        <button
          onClick={() => setViewMode((v) => (v === "radar" ? "bars" : "radar"))}
          className="rounded border border-grid-border px-2 py-0.5 font-mono text-[10px] text-grid-fg-dim transition-colors hover:border-grid-accent/50 hover:text-grid-accent"
        >
          {viewMode === "radar" ? "bars" : "radar"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {/* Overall score */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-2"
            style={{
              borderColor: pct >= 80 ? "#22c55e" : pct >= 60 ? "#eab308" : "#ef4444",
            }}
          >
            <span className="font-mono text-lg font-bold text-grid-fg">{pct}%</span>
          </div>
          <div>
            <div className="font-mono text-xs font-medium text-grid-fg-secondary">
              Overall Score
            </div>
            <div className="font-mono text-[10px] text-grid-fg-muted">
              {pct >= 80
                ? "Excellent"
                : pct >= 60
                  ? "Good"
                  : pct >= 40
                    ? "Needs Improvement"
                    : "Not Started"}
            </div>
          </div>
        </div>

        {/* Radar chart view */}
        {viewMode === "radar" && (
          <div className="mb-4" style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--grid-border-subtle, #232220)" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{
                    fontSize: 9,
                    fill: "var(--grid-fg-muted, #a1a1aa)",
                    fontFamily: "var(--font-mono)",
                  }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 10]}
                  tick={{ fontSize: 8, fill: "var(--grid-fg-dim, #71717a)" }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: "#242320",
                    border: "1px solid var(--grid-border, #2e2d2a)",
                    borderRadius: 4,
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar view (fallback) */}
        {viewMode === "bars" && (
          <div className="space-y-3">
            {dimensions.map((dim) => (
              <div key={dim.name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-grid-fg-secondary">{dim.name}</span>
                  <span className="font-mono text-[10px] text-grid-fg-muted">
                    {Math.round(dim.weight * 100)}% weight
                  </span>
                </div>
                <ScoreBar score={dim.score} maxScore={dim.maxScore} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
