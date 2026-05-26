/**
 * Swarm Topology Engine — Message routing, consensus, and conflict detection.
 *
 * Enforces communication patterns per topology:
 *   hierarchical: queen → workers (CEO model), workers → queen only
 *   mesh: all-to-all, any pane can message any pane
 *   ring: sequential pipeline A→B→C→D→A
 *   star: hub coordinates all spokes, spokes → hub only
 */

import type {
  SwarmTopology,
  ConsensusMode,
  TopologyConfig,
  ConflictAlert,
  AgentMessage,
  PaneConfig,
  AntiDriftConfig,
  GridLayout,
} from "../shared/types";
import { TOPOLOGY_DEFAULTS } from "../shared/types";

// ─── Message Routing ───

export interface RouteResult {
  allowed: boolean;
  reason?: string;
  suggestedTarget?: string;
}

/**
 * Check if a message is allowed under the current topology.
 */
export function routeMessage(
  config: TopologyConfig,
  panes: PaneConfig[],
  from: string,
  to: string,
): RouteResult {
  const { topology, queenPaneId } = config;
  const paneIds = panes.map((p) => p.id);

  // Broadcast ("all") is always allowed from queen/hub
  if (to === "all") {
    if (topology === "hierarchical" || topology === "star") {
      if (from === queenPaneId) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Only the queen/hub can broadcast in ${topology} topology`,
        suggestedTarget: queenPaneId,
      };
    }
    return { allowed: true }; // mesh and ring allow broadcast
  }

  // Validate panes exist
  if (!paneIds.includes(from) || !paneIds.includes(to)) {
    return { allowed: false, reason: "Source or target pane not found in grid" };
  }

  switch (topology) {
    case "hierarchical": {
      // Queen can message anyone. Workers can only message queen.
      if (from === queenPaneId) return { allowed: true };
      if (to === queenPaneId) return { allowed: true };
      return {
        allowed: false,
        reason: "Workers can only message the queen in hierarchical topology",
        suggestedTarget: queenPaneId,
      };
    }

    case "mesh": {
      // All-to-all — always allowed
      return { allowed: true };
    }

    case "ring": {
      // Sequential pipeline: A→B→C→D→A
      const fromIdx = paneIds.indexOf(from);
      const toIdx = paneIds.indexOf(to);
      const nextIdx = (fromIdx + 1) % paneIds.length;
      if (toIdx === nextIdx) return { allowed: true };
      // Allow reverse for acks
      const prevIdx = (fromIdx - 1 + paneIds.length) % paneIds.length;
      if (toIdx === prevIdx) return { allowed: true };
      return {
        allowed: false,
        reason: `Ring topology: ${panes[fromIdx]?.label} can only message next/prev neighbor`,
        suggestedTarget: paneIds[nextIdx],
      };
    }

    case "star": {
      // Hub can message anyone. Spokes can only message hub.
      if (from === queenPaneId) return { allowed: true };
      if (to === queenPaneId) return { allowed: true };
      return {
        allowed: false,
        reason: "Spokes can only message the hub in star topology",
        suggestedTarget: queenPaneId,
      };
    }

    default:
      return { allowed: true };
  }
}

/**
 * Get valid message targets for a given pane under the current topology.
 */
export function getValidTargets(
  config: TopologyConfig,
  panes: PaneConfig[],
  fromPaneId: string,
): string[] {
  const paneIds = panes.map((p) => p.id);
  const { topology, queenPaneId } = config;

  switch (topology) {
    case "hierarchical":
    case "star": {
      if (fromPaneId === queenPaneId) return paneIds.filter((id) => id !== fromPaneId);
      return queenPaneId ? [queenPaneId] : [];
    }

    case "mesh":
      return paneIds.filter((id) => id !== fromPaneId);

    case "ring": {
      const idx = paneIds.indexOf(fromPaneId);
      if (idx === -1) return [];
      const next = paneIds[(idx + 1) % paneIds.length];
      const prev = paneIds[(idx - 1 + paneIds.length) % paneIds.length];
      return [next, prev].filter((id) => id !== fromPaneId);
    }

    default:
      return paneIds.filter((id) => id !== fromPaneId);
  }
}

// ─── Consensus Engine ───

export interface ConsensusSession {
  id: string;
  topic: string;
  mode: ConsensusMode;
  participants: string[];
  votes: Map<string, "approve" | "reject" | "abstain">;
  startedAt: number;
  resolvedAt?: number;
  result?: "approved" | "rejected" | "undecided";
}

const activeSessions = new Map<string, ConsensusSession>();

/**
 * Start a consensus vote.
 */
export function startConsensus(
  id: string,
  topic: string,
  mode: ConsensusMode,
  participants: string[],
): ConsensusSession {
  const session: ConsensusSession = {
    id,
    topic,
    mode,
    participants,
    votes: new Map(),
    startedAt: Date.now(),
  };
  activeSessions.set(id, session);
  return session;
}

/**
 * Cast a vote in a consensus session.
 */
export function castVote(
  sessionId: string,
  paneId: string,
  vote: "approve" | "reject" | "abstain",
): ConsensusSession | null {
  const session = activeSessions.get(sessionId);
  if (!session) return null;
  if (!session.participants.includes(paneId)) return null;
  if (session.resolvedAt) return session; // Already resolved

  session.votes.set(paneId, vote);

  // Check if all votes are in
  if (session.votes.size >= session.participants.length) {
    session.result = resolveConsensus(session);
    session.resolvedAt = Date.now();
  }

  return session;
}

function resolveConsensus(session: ConsensusSession): "approved" | "rejected" | "undecided" {
  const votes = Array.from(session.votes.values());
  const approvals = votes.filter((v) => v === "approve").length;
  const rejections = votes.filter((v) => v === "reject").length;
  const total = votes.length;

  switch (session.mode) {
    case "majority":
      if (approvals > total / 2) return "approved";
      if (rejections > total / 2) return "rejected";
      return "undecided";

    case "unanimous":
      if (approvals === total) return "approved";
      if (rejections > 0) return "rejected";
      return "undecided";

    case "queen-decides":
      // First vote wins (queen votes first)
      if (votes.length > 0) {
        return votes[0] === "approve" ? "approved" : "rejected";
      }
      return "undecided";

    case "none":
    default:
      return "approved"; // No consensus needed
  }
}

export function getConsensusSession(sessionId: string): ConsensusSession | undefined {
  return activeSessions.get(sessionId);
}

// ─── Conflict Detection ───

const fileAccessLog = new Map<string, { paneId: string; timestamp: number }[]>();
const activeConflicts: ConflictAlert[] = [];

/**
 * Record a file access and check for conflicts.
 * Call this when a pane reads/writes a file.
 */
export function recordFileAccess(
  paneId: string,
  filePath: string,
  windowMs: number = 30000,
): ConflictAlert | null {
  const now = Date.now();
  const accesses = fileAccessLog.get(filePath) ?? [];

  // Clean old entries
  const recent = accesses.filter((a) => now - a.timestamp < windowMs);
  recent.push({ paneId, timestamp: now });
  fileAccessLog.set(filePath, recent);

  // Check if multiple panes accessed this file recently
  const uniquePanes = [...new Set(recent.map((a) => a.paneId))];
  if (uniquePanes.length >= 2) {
    // Check if conflict already exists for this file
    const existing = activeConflicts.find((c) => c.filePath === filePath && !c.resolved);
    if (existing) {
      // Update pane list
      existing.paneIds = uniquePanes;
      return existing;
    }

    const conflict: ConflictAlert = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      paneIds: uniquePanes,
      filePath,
      detectedAt: now,
      resolved: false,
    };
    activeConflicts.push(conflict);
    return conflict;
  }

  return null;
}

export function getActiveConflicts(): ConflictAlert[] {
  return activeConflicts.filter((c) => !c.resolved);
}

export function resolveConflict(conflictId: string): void {
  const conflict = activeConflicts.find((c) => c.id === conflictId);
  if (conflict) conflict.resolved = true;
}

// ─── Topology Templates for Presets ───

export interface TopologyTemplate {
  name: string;
  topology: SwarmTopology;
  description: string;
  asciiDiagram: string;
  defaultPaneCount: number;
  defaultConsensus: ConsensusMode;
  antiDrift: AntiDriftConfig;
}

export const TOPOLOGY_TEMPLATES: TopologyTemplate[] = [
  {
    name: "CEO Company",
    topology: "hierarchical",
    description: "Queen pane delegates to workers. Workers report up only.",
    asciiDiagram: [
      "        ┌─────┐        ",
      "        │ CEO │        ",
      "        └──┬──┘        ",
      "     ┌─────┼─────┐    ",
      "  ┌──┴──┐┌─┴─┐┌──┴──┐",
      "  │ W-1 ││W-2││ W-3 │",
      "  └─────┘└───┘└─────┘",
    ].join("\n"),
    defaultPaneCount: 4,
    defaultConsensus: "queen-decides",
    antiDrift: {
      maxWorkers: 12,
      checkpointFrequencyMinutes: 15,
      autoRebalance: true,
      maxIdleMinutes: 10,
    },
  },
  {
    name: "Full Mesh",
    topology: "mesh",
    description: "All-to-all messaging. Every pane can communicate with every other.",
    asciiDiagram: [
      "  ┌───┐   ┌───┐  ",
      "  │ A │───│ B │  ",
      "  └─┬─┘╲ ╱└─┬─┘  ",
      "    │   ╳    │    ",
      "  ┌─┴─┐╱ ╲┌─┴─┐  ",
      "  │ D │───│ C │  ",
      "  └───┘   └───┘  ",
    ].join("\n"),
    defaultPaneCount: 4,
    defaultConsensus: "majority",
    antiDrift: {
      maxWorkers: 8,
      checkpointFrequencyMinutes: 10,
      autoRebalance: true,
      maxIdleMinutes: 10,
    },
  },
  {
    name: "Pipeline Ring",
    topology: "ring",
    description: "Sequential pipeline. A→B→C→D→A. Each stage feeds the next.",
    asciiDiagram: [
      "      ┌───┐      ",
      "  ┌──→│ A │──┐   ",
      "  │   └───┘  │   ",
      "  │          ▼   ",
      "┌─┴─┐      ┌───┐",
      "│ D │      │ B │",
      "└───┘      └─┬─┘",
      "  ▲          │   ",
      "  │   ┌───┐  │   ",
      "  └───│ C │←─┘   ",
      "      └───┘      ",
    ].join("\n"),
    defaultPaneCount: 4,
    defaultConsensus: "majority",
    antiDrift: {
      maxWorkers: 8,
      checkpointFrequencyMinutes: 10,
      autoRebalance: false,
      maxIdleMinutes: 15,
    },
  },
  {
    name: "Hub & Spoke",
    topology: "star",
    description: "Central hub coordinates all spokes. Spokes only talk to hub.",
    asciiDiagram: [
      "      ┌───┐      ",
      "      │ S1│      ",
      "      └─┬─┘      ",
      "  ┌───┐ │ ┌───┐  ",
      "  │ S4├─┼─┤ S2│  ",
      "  └───┘ │ └───┘  ",
      "     ┌──┴──┐     ",
      "     │ HUB │     ",
      "     └──┬──┘     ",
      "      ┌─┴─┐      ",
      "      │ S3│      ",
      "      └───┘      ",
    ].join("\n"),
    defaultPaneCount: 5,
    defaultConsensus: "queen-decides",
    antiDrift: {
      maxWorkers: 10,
      checkpointFrequencyMinutes: 12,
      autoRebalance: true,
      maxIdleMinutes: 10,
    },
  },
];

// ─── Factory ───

/**
 * Create a TopologyConfig from a SwarmTopology name, optionally overriding defaults.
 */
export function createTopologyConfig(
  topology: SwarmTopology,
  queenPaneId?: string,
  overrides?: Partial<AntiDriftConfig>,
): TopologyConfig {
  const defaults = TOPOLOGY_DEFAULTS[topology];
  return {
    ...defaults,
    queenPaneId,
    antiDrift: {
      ...defaults.antiDrift,
      ...overrides,
    },
  };
}

/**
 * Get the topology layout name that AgentGraph understands.
 * Maps SwarmTopology → AgentGraph Topology.
 */
export function toGraphTopology(swarm: SwarmTopology): "force" | "hierarchical" | "ring" | "star" {
  switch (swarm) {
    case "hierarchical":
      return "hierarchical";
    case "mesh":
      return "force"; // Force-directed best represents mesh
    case "ring":
      return "ring";
    case "star":
      return "star";
    default:
      return "force";
  }
}

/**
 * Validate grid against anti-drift config.
 */
export function validateAntiDrift(
  grid: GridLayout,
  config: AntiDriftConfig,
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (grid.panes.length > config.maxWorkers) {
    warnings.push(`Grid has ${grid.panes.length} panes but max is ${config.maxWorkers}`);
  }

  const now = Date.now();
  for (const pane of grid.panes) {
    if (pane.metrics?.lastActivityAt) {
      const idleMin = (now - pane.metrics.lastActivityAt) / 60000;
      if (idleMin > config.maxIdleMinutes) {
        warnings.push(
          `Pane "${pane.label}" idle for ${Math.round(idleMin)}min (max: ${config.maxIdleMinutes}min)`,
        );
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}
