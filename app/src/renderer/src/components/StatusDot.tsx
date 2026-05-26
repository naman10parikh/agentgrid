import type { PaneStatus } from "../types";
import { getStatusConfig } from "../lib/status";

interface StatusDotProps {
  status: PaneStatus;
  size?: number;
}

export function StatusDot({ status, size = 8 }: StatusDotProps) {
  const config = getStatusConfig(status);

  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: config.color,
        boxShadow: config.pulse ? `0 0 ${size}px ${config.color}` : undefined,
      }}
      title={config.label}
    >
      {config.pulse && (
        <style>{`
          @keyframes status-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      )}
      {config.pulse && (
        <span
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: config.color,
            animation: "status-pulse 2s ease-in-out infinite",
          }}
        />
      )}
    </span>
  );
}
