/**
 * Status configuration utilities for pane status rendering.
 */
import type { PaneStatus } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../types";

export interface StatusConfig {
  color: string;
  label: string;
  pulse: boolean;
  blink: boolean;
}

export function getStatusConfig(status: PaneStatus): StatusConfig {
  return {
    color: STATUS_COLORS[status] ?? "#6b7280",
    label: STATUS_LABELS[status] ?? status,
    pulse: status === "working",
    blink: status === "error",
  };
}
