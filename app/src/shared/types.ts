/**
 * AgentGrid App — Shared Types
 * Used by main process, preload, and renderer.
 */

// ─── Status ───

export type PaneStatus = "idle" | "working" | "waiting" | "done" | "error";

export const STATUS_COLORS: Record<PaneStatus, string> = {
  idle: "#6b7280",
  working: "#3b82f6",
  waiting: "#eab308",
  done: "#22c55e",
  error: "#ef4444",
};

export const STATUS_LABELS: Record<PaneStatus, string> = {
  idle: "Idle",
  working: "Working",
  waiting: "Waiting",
  done: "Done",
  error: "Error",
};

// ─── CLI Tool ───

export type CliTool =
  | "claude"
  | "codex"
  | "gemini"
  | "aider"
  | "goose"
  | "hermes"
  | "cline"
  | "custom";

export type EffortLevel = "low" | "medium" | "high" | "max";

export type TerminalThemeName = "dark" | "light" | "dracula" | "solarized-dark" | "nord";

export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export const TERMINAL_THEMES: Record<TerminalThemeName, TerminalTheme> = {
  dark: {
    background: "#141312",
    foreground: "#f5f4f1",
    cursor: "#8b5cf6",
    cursorAccent: "#141312",
    selectionBackground: "rgba(139, 92, 246, 0.3)",
    black: "#1c1b19",
    red: "#ef4444",
    green: "#22c55e",
    yellow: "#eab308",
    blue: "#3b82f6",
    magenta: "#8b5cf6",
    cyan: "#06b6d4",
    white: "#f5f4f1",
    brightBlack: "#6e6b66",
    brightRed: "#f87171",
    brightGreen: "#4ade80",
    brightYellow: "#fbbf24",
    brightBlue: "#60a5fa",
    brightMagenta: "#a78bfa",
    brightCyan: "#22d3ee",
    brightWhite: "#ffffff",
  },
  light: {
    background: "#fafaf9",
    foreground: "#1c1b19",
    cursor: "#6b21a8",
    cursorAccent: "#fafaf9",
    selectionBackground: "rgba(107, 33, 168, 0.15)",
    black: "#1c1b19",
    red: "#dc2626",
    green: "#16a34a",
    yellow: "#ca8a04",
    blue: "#2563eb",
    magenta: "#7c3aed",
    cyan: "#0891b2",
    white: "#f5f4f1",
    brightBlack: "#a8a29e",
    brightRed: "#ef4444",
    brightGreen: "#22c55e",
    brightYellow: "#eab308",
    brightBlue: "#3b82f6",
    brightMagenta: "#8b5cf6",
    brightCyan: "#06b6d4",
    brightWhite: "#ffffff",
  },
  dracula: {
    background: "#282a36",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    cursorAccent: "#282a36",
    selectionBackground: "rgba(68, 71, 90, 0.5)",
    black: "#21222c",
    red: "#ff5555",
    green: "#50fa7b",
    yellow: "#f1fa8c",
    blue: "#bd93f9",
    magenta: "#ff79c6",
    cyan: "#8be9fd",
    white: "#f8f8f2",
    brightBlack: "#6272a4",
    brightRed: "#ff6e6e",
    brightGreen: "#69ff94",
    brightYellow: "#ffffa5",
    brightBlue: "#d6acff",
    brightMagenta: "#ff92df",
    brightCyan: "#a4ffff",
    brightWhite: "#ffffff",
  },
  "solarized-dark": {
    background: "#002b36",
    foreground: "#839496",
    cursor: "#839496",
    cursorAccent: "#002b36",
    selectionBackground: "rgba(7, 54, 66, 0.5)",
    black: "#073642",
    red: "#dc322f",
    green: "#859900",
    yellow: "#b58900",
    blue: "#268bd2",
    magenta: "#d33682",
    cyan: "#2aa198",
    white: "#eee8d5",
    brightBlack: "#586e75",
    brightRed: "#cb4b16",
    brightGreen: "#586e75",
    brightYellow: "#657b83",
    brightBlue: "#839496",
    brightMagenta: "#6c71c4",
    brightCyan: "#93a1a1",
    brightWhite: "#fdf6e3",
  },
  nord: {
    background: "#2e3440",
    foreground: "#d8dee9",
    cursor: "#d8dee9",
    cursorAccent: "#2e3440",
    selectionBackground: "rgba(67, 76, 94, 0.5)",
    black: "#3b4252",
    red: "#bf616a",
    green: "#a3be8c",
    yellow: "#ebcb8b",
    blue: "#81a1c1",
    magenta: "#b48ead",
    cyan: "#88c0d0",
    white: "#e5e9f0",
    brightBlack: "#4c566a",
    brightRed: "#bf616a",
    brightGreen: "#a3be8c",
    brightYellow: "#ebcb8b",
    brightBlue: "#81a1c1",
    brightMagenta: "#b48ead",
    brightCyan: "#8fbcbb",
    brightWhite: "#eceff4",
  },
};

// ─── Swarm Topology ───

export type SwarmTopology = "hierarchical" | "mesh" | "ring" | "star";

export type ConsensusMode = "none" | "majority" | "unanimous" | "queen-decides";

export interface AntiDriftConfig {
  maxWorkers: number;
  checkpointFrequencyMinutes: number;
  autoRebalance: boolean;
  maxIdleMinutes: number;
}

export interface ConflictAlert {
  id: string;
  paneIds: string[];
  filePath: string;
  detectedAt: number;
  resolved: boolean;
}

export interface TopologyConfig {
  topology: SwarmTopology;
  consensus: ConsensusMode;
  antiDrift: AntiDriftConfig;
  queenPaneId?: string; // For hierarchical/star: the hub pane
}

export const TOPOLOGY_DEFAULTS: Record<SwarmTopology, Omit<TopologyConfig, "queenPaneId">> = {
  hierarchical: {
    topology: "hierarchical",
    consensus: "queen-decides",
    antiDrift: {
      maxWorkers: 12,
      checkpointFrequencyMinutes: 15,
      autoRebalance: true,
      maxIdleMinutes: 10,
    },
  },
  mesh: {
    topology: "mesh",
    consensus: "majority",
    antiDrift: {
      maxWorkers: 8,
      checkpointFrequencyMinutes: 10,
      autoRebalance: true,
      maxIdleMinutes: 10,
    },
  },
  ring: {
    topology: "ring",
    consensus: "majority",
    antiDrift: {
      maxWorkers: 8,
      checkpointFrequencyMinutes: 10,
      autoRebalance: false,
      maxIdleMinutes: 15,
    },
  },
  star: {
    topology: "star",
    consensus: "queen-decides",
    antiDrift: {
      maxWorkers: 10,
      checkpointFrequencyMinutes: 12,
      autoRebalance: true,
      maxIdleMinutes: 10,
    },
  },
};

// ─── Pane ───

export interface PaneConfig {
  id: string;
  label: string;
  status: PaneStatus;
  agent: CliTool;
  cwd: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  model?: string;
  effort?: EffortLevel;
  contextWindow?: number;
  customFlags?: string[];
  env?: Record<string, string>;
  persona?: AgentPersona;
  pid?: number;
  metrics?: PaneMetrics;
}

export interface PaneMetrics {
  bytesReceived: number;
  startedAt: number;
  lastActivityAt: number;
  estimatedTokens: number;
  estimatedCostUsd: number;
}

// ─── Grid ───

export interface GridLayout {
  rows: number;
  cols: number;
  panes: PaneConfig[];
  topologyConfig?: TopologyConfig;
  depth?: number;
  maxDepth?: number;
  parentGridId?: string;
  companyId?: string;
  subGrids?: GridLayout[];
}

// ─── Preset ───

export interface Preset {
  name: string;
  description?: string;
  grid: GridLayout;
  category?: PresetCategory;
  missions?: Record<string, string>; // paneLabel → mission text
  createdAt: string;
  updatedAt: string;
}

/** Legacy preset format used in built-in JSON files */
export interface LegacyPresetPane {
  name: string;
  agent: CliTool | string;
  role?: string;
  focus?: string;
  phase?: number;
  depends_on?: string[];
}

export interface LegacyPreset {
  description?: string;
  topology?: string;
  consensus?: string;
  max_agents?: number;
  strategy?: string;
  anti_drift?: boolean;
  checkpoint_interval_minutes?: number;
  phase_gating?: boolean;
  category?: PresetCategory;
  missions?: Record<string, string>;
  panes: LegacyPresetPane[];
}

// ─── Session ───

export interface SessionState {
  id: string;
  grid: GridLayout;
  workingDirectory: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Terminal data flowing over IPC ───

export interface TerminalData {
  paneId: string;
  data: string; // raw terminal output bytes
}

export interface TerminalResize {
  paneId: string;
  cols: number;
  rows: number;
}

export interface TerminalInput {
  paneId: string;
  data: string;
}

// ─── Tool Management ───

export type ToolScope = "global" | "workspace" | "pane";
export type ScopeLevel = ToolScope; // alias for architecture compatibility

export type HookEvent =
  | "SessionStart"
  | "SessionEnd"
  | "PreToolUse"
  | "PostToolUse"
  | "PreCompact"
  | "PostCompact"
  | "Stop"
  | "SubagentStop"
  | "Notification";

export type PresetCategory =
  | "engineering"
  | "design"
  | "research"
  | "content"
  | "oss-launch"
  | "earning"
  | "custom";

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  scope: ToolScope;
  enabled: boolean;
}

export interface SkillConfig {
  name: string;
  path: string;
  scope: ToolScope;
  enabled: boolean;
}

export interface HookConfig {
  event: string;
  command: string;
  matcher?: string;
  scope: ToolScope;
  enabled: boolean;
}

export interface ToolInjection {
  agent: string;
  flags: string[];
  mcps: string[];
  skills: string[];
  model?: string;
  effort?: string;
}

// ─── Agent Messages (inter-pane communication) ───

export interface AgentMessage {
  id: string;
  from: string; // pane ID
  to: string | "all"; // pane ID or broadcast
  type: "text" | "task" | "signal" | "context";
  content: string;
  timestamp: number;
}

// ─── Tool Config (returned by getConfig) ───

export interface ToolConfig {
  agent: string;
  flags: string[];
  mcps: string[];
  skills: string[];
  model?: string;
  effort?: string;
  contextWindow?: number;
}

// ─── CEO Log ───

export type LogLevel = "info" | "warning" | "error" | "decision" | "experiment";

export interface CEOLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  paneId?: string;
  agentAction?: string;
}

// ─── Agent Persona ───

export interface AgentPersona {
  name: string;
  systemPrompt: string;
  traits: string[];
  color?: string;
  icon?: string;
}

export const BUILT_IN_PERSONAS: Record<string, AgentPersona> = {
  ceo: {
    name: "CEO",
    systemPrompt: "You are the CEO orchestrating a team. Delegate, monitor, and ensure quality.",
    traits: ["strategic", "decisive", "quality-focused"],
    color: "#8b5cf6",
    icon: "crown",
  },
  architect: {
    name: "Architect",
    systemPrompt: "You are a systems architect. Design clean, scalable solutions.",
    traits: ["analytical", "thorough", "pattern-aware"],
    color: "#3b82f6",
    icon: "drafting-compass",
  },
  builder: {
    name: "Builder",
    systemPrompt: "You are a senior developer. Write clean, tested, production-ready code.",
    traits: ["productive", "pragmatic", "detail-oriented"],
    color: "#22c55e",
    icon: "hammer",
  },
  researcher: {
    name: "Researcher",
    systemPrompt: "You are a research analyst. Explore deeply, compare options, cite sources.",
    traits: ["curious", "methodical", "comprehensive"],
    color: "#eab308",
    icon: "search",
  },
  qa: {
    name: "QA Engineer",
    systemPrompt:
      "You are a QA engineer. Test everything as a user. Find edge cases. Zero tolerance for bugs.",
    traits: ["meticulous", "skeptical", "user-focused"],
    color: "#ef4444",
    icon: "shield-check",
  },
};

// ─── Agent Activity ───

export interface AgentActivityEntry {
  paneId: string;
  label: string;
  event: "spawned" | "working" | "idle" | "done" | "error" | "restarted" | "signal";
  timestamp: number;
  detail?: string;
}

// ─── LLM Council ───

export type CouncilPosition = "approve" | "reject" | "abstain" | "modify";

export interface CouncilVote {
  paneId: string;
  label: string;
  position: CouncilPosition;
  reasoning: string;
  isDevilsAdvocate?: boolean;
  timestamp: number;
}

export interface CouncilSession {
  id: string;
  topic: string;
  participants: string[]; // pane IDs
  votes: CouncilVote[];
  status: "deliberating" | "debating" | "decided" | "cancelled";
  decision?: string;
  summary?: string;
  devilsAdvocateId?: string; // pane assigned to argue against majority
  mode: "parallel" | "debate"; // parallel = all at once, debate = sequential
  startedAt: number;
  decidedAt?: number;
}

// ─── Team Workspace ───

export interface TeamWorkspace {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  gridId?: string;
  sharedPresets: string[];
  createdAt: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: number;
  isOnline: boolean;
}

// ─── Message Templates ───

export interface MessageTemplate {
  id: string;
  label: string;
  message: string;
  category: "control" | "query" | "mission" | "custom";
}

export const BUILT_IN_TEMPLATES: MessageTemplate[] = [
  {
    id: "status",
    label: "Status Check",
    message: "What is your current status? Report progress.",
    category: "query",
  },
  {
    id: "focus",
    label: "Focus",
    message: "Focus on completing your current task. Don't start new work.",
    category: "control",
  },
  {
    id: "hurry",
    label: "Speed Up",
    message: "The deadline is approaching. Prioritize and ship.",
    category: "control",
  },
  {
    id: "test",
    label: "Run Tests",
    message: "Run all tests and report results.",
    category: "control",
  },
  { id: "commit", label: "Commit Work", message: "/commit", category: "control" },
  {
    id: "review",
    label: "Self-Review",
    message: "Review your work for quality, security, and completeness.",
    category: "query",
  },
  {
    id: "signal-done",
    label: "Signal Done",
    message: "If your work is complete, signal .done now.",
    category: "control",
  },
  { id: "effort-max", label: "Max Effort", message: "/effort max", category: "control" },
];

// ─── IPC Channel names ───

export const IPC = {
  // Grid
  GRID_CREATE: "grid:create",
  GRID_GET: "grid:get",
  GRID_SAVE: "grid:save",
  GRID_RESTORE: "grid:restore",
  GRID_SUB_CREATE: "grid:sub:create",
  GRID_SUB_LIST: "grid:sub:list",
  GRID_UNDO: "grid:undo",
  GRID_REDO: "grid:redo",

  // Pane
  PANE_ADD: "pane:add",
  PANE_REMOVE: "pane:remove",
  PANE_RENAME: "pane:rename",
  PANE_SET_MODEL: "pane:setModel",
  PANE_SET_EFFORT: "pane:setEffort",
  PANE_SET_CWD: "pane:setCwd",
  PANE_PICK_CWD: "pane:pickCwd",
  PANE_STATUS: "pane:status",
  PANE_SWAP: "pane:swap",
  PANE_FOCUS: "pane:focus",
  PANE_BROADCAST: "pane:broadcast",
  PANE_BROADCAST_SUBSET: "pane:broadcastSubset",
  PANE_RESTART: "pane:restart",
  GRID_EQUALIZE: "grid:equalize",

  // Terminal
  TERMINAL_DATA: "terminal:data",
  TERMINAL_INPUT: "terminal:input",
  TERMINAL_RESIZE: "terminal:resize",
  TERMINAL_SPAWN: "terminal:spawn",
  TERMINAL_KILL: "terminal:kill",
  TERMINAL_INJECT_FILE: "terminal:injectFile",
  TERMINAL_AUTO_APPROVE: "terminal:autoApprove",
  TERMINAL_STATS: "terminal:stats",
  TERMINAL_STATS_ALL: "terminal:statsAll",
  TERMINAL_SAVE_SCROLLBACK: "terminal:saveScrollback",
  TERMINAL_RESTORE_SCROLLBACK: "terminal:restoreScrollback",
  TERMINAL_RESTART_WITH_CONTEXT: "terminal:restartWithContext",
  TERMINAL_MIGRATE_PANE: "terminal:migratePane",
  TERMINAL_COMPACTION_DETECTED: "terminal:compactionDetected",
  TERMINAL_MEMORY_WARNING: "terminal:memoryWarning",

  // Cost tracking
  COST_GET_TOTAL: "cost:getTotal",
  COST_GET_PANE: "cost:getPane",
  COST_GET_TIMELINE: "cost:getTimeline",
  COST_GET_COMPARISON: "cost:getComparison",
  COST_EXPORT_CSV: "cost:exportCsv",
  COST_GET_BUDGET: "cost:getBudget",
  COST_SET_BUDGET: "cost:setBudget",

  // Harness
  HARNESS_LIST: "harness:list",
  HARNESS_LOAD: "harness:load",
  HARNESS_GENERATE: "harness:generate",

  // Presets
  PRESET_LIST: "preset:list",
  PRESET_SAVE: "preset:save",
  PRESET_LOAD: "preset:load",
  PRESET_DELETE: "preset:delete",
  PRESET_EXPORT: "preset:export",
  PRESET_IMPORT: "preset:import",
  PRESET_INFO: "preset:info",
  PRESET_HISTORY: "preset:history",
  PRESET_VALIDATE: "preset:validate",
  PRESET_FROM_HARNESS: "preset:fromHarness",

  // Tasks (shared task list between agents)
  TASK_LIST: "task:list",
  TASK_CREATE: "task:create",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",

  // Agent Messages
  MSG_SEND: "msg:send",
  MSG_LIST: "msg:list",

  // Session
  SESSION_SAVE: "session:save",
  SESSION_RESTORE: "session:restore",

  // Tools
  TOOLS_GET_CONFIG: "tools:getConfig",
  TOOLS_SET_CONFIG: "tools:setConfig",
  TOOLS_LIST: "tools:list",
  TOOLS_ADD_MCP: "tools:addMcp",
  TOOLS_REMOVE_MCP: "tools:removeMcp",
  TOOLS_ADD_SKILL: "tools:addSkill",
  TOOLS_REMOVE_SKILL: "tools:removeSkill",
  TOOLS_DETECT: "tools:detect",
  // Team Workspaces
  TEAM_CREATE: "team:create",
  TEAM_JOIN: "team:join",
  TEAM_LEAVE: "team:leave",
  TEAM_LIST: "team:list",
  TEAM_SYNC: "team:sync",
  WORKSPACE_CREATE: "workspace:create",
  WORKSPACE_LIST: "workspace:list",
  WORKSPACE_GET: "workspace:get",
  WORKSPACE_DELETE: "workspace:delete",
  WORKSPACE_SWITCH: "workspace:switch",
  WORKSPACE_EXPORT: "workspace:export",
  WORKSPACE_IMPORT: "workspace:import",
  WORKSPACE_GET_ACTIVE: "workspace:getActive",
  WORKSPACE_GET_RECENT: "workspace:getRecent",

  // Voice
  VOICE_TRANSCRIBE: "voice:transcribe",
  VOICE_BROADCAST: "voice:broadcast",

  // CEO Log
  CEO_LOG_ENTRY: "ceo:log:entry",
  CEO_LOG_GET: "ceo:log:get",

  // Health
  HEALTH_GET: "health:get",
  HEALTH_GET_ALL: "health:getAll",

  // GitHub
  GITHUB_CREATE_PR: "github:createPr",
  GITHUB_STATUS: "github:status",
  GITHUB_LIST_PRS: "github:listPrs",
  GITHUB_CREATE_ISSUE: "github:createIssue",
  GITHUB_REPO_INFO: "github:repoInfo",
  GITHUB_PR_STATUS: "github:prStatus",
  GITHUB_ACTIONS_STATUS: "github:actionsStatus",
  GITHUB_GIT_INFO: "github:gitInfo",

  // Swarm Topology
  TOPOLOGY_SET: "topology:set",
  TOPOLOGY_GET: "topology:get",
  TOPOLOGY_ROUTE_MESSAGE: "topology:routeMessage",
  TOPOLOGY_CONSENSUS_START: "topology:consensus:start",
  TOPOLOGY_CONSENSUS_VOTE: "topology:consensus:vote",
  TOPOLOGY_CONSENSUS_RESULT: "topology:consensus:result",
  TOPOLOGY_CONFLICT_CHECK: "topology:conflict:check",
  TOPOLOGY_CONFLICT_LIST: "topology:conflict:list",

  // Council (LLM debate/discussion before acting)
  COUNCIL_START: "council:start",
  COUNCIL_VOTE: "council:vote",
  COUNCIL_RESULT: "council:result",
  COUNCIL_LIST: "council:list",
  COUNCIL_DEBATE: "council:debate",
  COUNCIL_DEVILS_ADVOCATE: "council:devilsAdvocate",
  COUNCIL_SUMMARY: "council:summary",
  COUNCIL_HISTORY: "council:history",

  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SETTINGS_GET_ALL: "settings:getAll",

  // Onboarding & License
  ONBOARDING_GET_STATE: "onboarding:getState",
  ONBOARDING_COMPLETE: "onboarding:complete",
  LICENSE_VALIDATE: "license:validate",
  LICENSE_GET: "license:get",
  LICENSE_SET: "license:set",

  // App
  APP_GET_INFO: "app:getInfo",
  APP_COMMAND_PALETTE: "app:commandPalette",

  // Persona
  PERSONA_LIST: "persona:list",
  PERSONA_GET: "persona:get",
  PERSONA_GROUPED: "persona:grouped",
  PERSONA_REGISTER: "persona:register",
  PERSONA_DELETE: "persona:delete",
  PERSONA_EXPORT: "persona:export",
  PERSONA_IMPORT: "persona:import",
  PERSONA_SET_PANE: "persona:setPane",

  // Security
  SECURITY_SCAN: "security:scan",
  SECURITY_GET_CONFIG: "security:getConfig",
  SECURITY_SET_CONFIG: "security:setConfig",
  SECURITY_GET_STATS: "security:getStats",
  SECURITY_GET_LOG: "security:getLog",
  SECURITY_REDACT: "security:redact",
  SECURITY_CLEAR: "security:clear",
} as const;
