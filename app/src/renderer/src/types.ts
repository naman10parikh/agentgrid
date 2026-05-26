/**
 * Re-export shared types for cleaner imports within renderer.
 * Components import from "@/types" instead of deep relative paths.
 */
export type {
  PaneStatus,
  CliTool,
  EffortLevel,
  GridLayout,
  PaneConfig,
  Preset,
  SessionState,
  TerminalData,
  TerminalResize,
  TerminalInput,
  ToolConfig,
  ToolInjection,
  ToolScope,
  MCPServerConfig,
  SkillConfig,
  HookConfig,
  CEOLogEntry,
  LogLevel,
  ScopeLevel,
  HookEvent,
  PresetCategory,
  TerminalThemeName,
  TerminalTheme,
  PaneMetrics,
  SwarmTopology,
  ConsensusMode,
  TopologyConfig,
  AgentPersona,
  CouncilPosition,
  CouncilVote,
  CouncilSession,
} from "../../shared/types";

export {
  STATUS_COLORS,
  STATUS_LABELS,
  IPC,
  TERMINAL_THEMES,
  TOPOLOGY_DEFAULTS,
  BUILT_IN_PERSONAS,
} from "../../shared/types";
