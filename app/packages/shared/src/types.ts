// AgentGrid App — Shared Data Model
// All interfaces used across main, preload, and renderer processes.

// ─── Core Identifiers ───

export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type GridId = string & { readonly __brand: "GridId" };
export type PaneId = string & { readonly __brand: "PaneId" };
export type PresetId = string & { readonly __brand: "PresetId" };
export type SessionId = string & { readonly __brand: "SessionId" };
export type PluginId = string & { readonly __brand: "PluginId" };

// ─── Enums ───

export type PaneStatus = "spawning" | "working" | "idle" | "done" | "error" | "stuck" | "migrating";
export type SessionState = "active" | "paused" | "completed" | "crashed";
export type CliTool =
  | "claude"
  | "codex"
  | "gemini"
  | "aider"
  | "opencode"
  | "goose"
  | "cline"
  | "hermes"
  | "copilot"
  | "cursor"
  | "shell";
export type Model =
  | "opus"
  | "sonnet"
  | "haiku"
  | "gpt-4.1"
  | "gpt-5.3"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | string;
export type EffortLevel = "low" | "medium" | "high" | "max";
export type LogLevel = "info" | "warning" | "error" | "decision" | "experiment";
export type ScopeLevel = "global" | "workspace" | "pane";
export type PresetCategory =
  | "engineering"
  | "design"
  | "research"
  | "content"
  | "oss-launch"
  | "earning"
  | "custom";

// ─── Workspace ───

export interface Workspace {
  id: WorkspaceId;
  name: string;
  path: string; // root directory
  grids: Grid[];
  presets: PresetId[];
  config: WorkspaceConfig;
  mcpServers: MCPServer[];
  skills: Skill[];
  hooks: Hook[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceConfig {
  defaultCliTool: CliTool;
  defaultModel: Model;
  defaultEffort: EffortLevel;
  defaultContextWindow: number; // tokens
  defaultShell: string; // e.g. '/bin/zsh'
  theme: TerminalTheme;
  autoApprovePermissions: boolean;
  maxRecursionDepth: number;
}

// ─── Grid ───

export interface Grid {
  id: GridId;
  workspaceId: WorkspaceId;
  rows: number;
  cols: number;
  panes: Pane[];
  recursive: boolean;
  parentGridId?: GridId;
  parentPaneId?: PaneId;
  depth: number; // CEO_DEPTH (0 = root)
  companyId?: string; // for signal directory isolation
  createdAt: number;
}

// ─── Pane ───

export interface Pane {
  id: PaneId;
  gridId: GridId;
  cliTool: CliTool;
  model: Model;
  effort: EffortLevel;
  contextWindow: number;
  status: PaneStatus;
  label: string;
  role?: string; // e.g. 'CEO', 'VP-ARCHITECT', 'ANVIL'
  sessionId?: SessionId;
  ptyProcessId?: number; // OS PID of the PTY child
  position: PanePosition;
  agentConfig: AgentConfig;
  metrics: PaneMetrics;
}

export interface PanePosition {
  row: number;
  col: number;
  widthPercent: number;
  heightPercent: number;
}

export interface PaneMetrics {
  tokensSent: number;
  tokensReceived: number;
  estimatedCostUsd: number;
  filesModified: string[];
  startedAt: number;
  lastActivityAt: number;
  compactionCount: number;
}

// ─── Agent Configuration ───

export interface AgentConfig {
  cliTool: CliTool;
  model: Model;
  effort: EffortLevel;
  contextWindow: number;
  flags: string[]; // e.g. ['--allowedTools', 'Bash(npm:*)']
  env: Record<string, string>; // environment variables injected
  skills: string[]; // skill paths to --add-skill
  mcps: string[]; // MCP server names to --add-mcp
  systemPrompt?: string; // injected via --system-prompt
  workingDirectory?: string;
}

// ─── Preset ───

export interface Preset {
  id: PresetId;
  name: string;
  description: string;
  category: PresetCategory;
  grids: GridTemplate[];
  roles: RoleDefinition[];
  skills: string[];
  mcps: string[];
  hooks: Hook[];
  evalCriteria?: EvalCriterion[];
  version: number;
  author?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface GridTemplate {
  rows: number;
  cols: number;
  paneDefaults: Partial<AgentConfig>;
  roleAssignments: Record<string, string>; // position key "r,c" → role name
}

export interface RoleDefinition {
  name: string;
  description: string;
  cliTool: CliTool;
  model: Model;
  effort: EffortLevel;
  systemPrompt?: string;
  skills: string[];
  mcps: string[];
  phase?: number; // execution order (0 = first wave)
  dependsOn?: string[]; // role names this waits for
}

export interface EvalCriterion {
  dimension: string; // e.g. 'code_quality', 'test_coverage', 'ux_polish'
  weight: number; // 0-1
  rubric: string; // evaluation instructions
}

// ─── Session ───

export interface Session {
  id: SessionId;
  workspaceId: WorkspaceId;
  gridId: GridId;
  startedAt: number;
  endedAt?: number;
  state: SessionState;
  memory: SessionMemory;
  compactionCount: number;
  handoffDoc?: string; // path to handoff.md if migrated
}

export interface SessionMemory {
  learnings: string[]; // key discoveries from this session
  decisionsLog: DecisionEntry[];
  filesChanged: string[];
  totalTokens: number;
  totalCostUsd: number;
}

export interface DecisionEntry {
  timestamp: number;
  decision: string;
  rationale: string;
  alternatives: string[];
  paneId?: PaneId;
}

// ─── CEO Log ───

export interface CEOLog {
  sessionId: SessionId;
  entries: CEOLogEntry[];
}

export interface CEOLogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  paneId?: PaneId;
  agentAction?: string; // what the agent did
  metadata?: Record<string, unknown>;
}

// ─── Tool Configuration ───

export interface ToolConfig {
  mcpServers: MCPServer[];
  skills: Skill[];
  hooks: Hook[];
  plugins: Plugin[];
}

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  scope: ScopeLevel;
  enabled: boolean;
}

export interface Skill {
  name: string;
  path: string;
  scope: ScopeLevel;
  triggers: string[]; // keywords or glob patterns that activate the skill
}

export interface Hook {
  event: HookEvent;
  command: string;
  matcher?: string; // glob pattern to filter which tools/events trigger
  scope: ScopeLevel;
  timeout?: number; // ms
}

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

export interface Plugin {
  id: PluginId;
  name: string;
  version: string;
  description: string;
  entryPoint: string; // path to plugin main
  contributes: PluginContributions;
  enabled: boolean;
}

export interface PluginContributions {
  commands?: PluginCommand[];
  views?: PluginView[];
  menus?: PluginMenuItem[];
  keybindings?: PluginKeybinding[];
}

export interface PluginCommand {
  id: string;
  title: string;
  handler: string; // function name
}

export interface PluginView {
  id: string;
  location: "sidebar" | "panel" | "statusbar";
  component: string; // React component path
}

export interface PluginMenuItem {
  command: string;
  group: string;
}

export interface PluginKeybinding {
  command: string;
  key: string; // e.g. 'Cmd+Shift+G'
  when?: string; // context condition
}

// ─── Terminal Theming ───

export interface TerminalTheme {
  name: string;
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
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

// ─── Signal Protocol ───

export interface Signal {
  type: SignalType;
  role: string;
  companyId: string;
  timestamp: number;
  payload?: string;
}

export type SignalType = "done" | "needs-qa" | "needs-help" | "migrating" | "bug-report";

// ─── IPC Channel Types ───
// These define the exact shape of messages between main ↔ renderer.

export interface IPCChannels {
  // Grid lifecycle
  "grid:create": {
    rows: number;
    cols: number;
    defaults?: Partial<AgentConfig>;
  };
  "grid:destroy": { gridId: GridId };
  "grid:resize": { gridId: GridId; rows: number; cols: number };

  // Pane management
  "pane:spawn": {
    gridId: GridId;
    config: AgentConfig;
    position: PanePosition;
    label?: string;
    role?: string;
  };
  "pane:kill": { paneId: PaneId };
  "pane:restart": { paneId: PaneId };
  "pane:send": { paneId: PaneId; data: string };
  "pane:broadcast": { gridId: GridId; data: string };
  "pane:resize": { paneId: PaneId; cols: number; rows: number };
  "pane:rename": { paneId: PaneId; label: string };

  // PTY data streaming (main → renderer, high frequency)
  "pty:data": { paneId: PaneId; data: string };
  "pty:exit": { paneId: PaneId; exitCode: number };

  // Status updates (main → renderer)
  "pane:status-update": {
    paneId: PaneId;
    status: PaneStatus;
    metrics?: Partial<PaneMetrics>;
  };
  "grid:status-update": {
    gridId: GridId;
    panes: Array<{ id: PaneId; status: PaneStatus }>;
  };

  // Workspace
  "workspace:load": { workspaceId: WorkspaceId };
  "workspace:save": { workspace: Workspace };
  "workspace:list": void;

  // Preset
  "preset:load": { presetId: PresetId };
  "preset:save": { preset: Preset };
  "preset:list": void;

  // Session
  "session:start": { workspaceId: WorkspaceId; gridId: GridId };
  "session:end": { sessionId: SessionId };
  "session:handoff": { sessionId: SessionId };

  // CEO log
  "ceo:log": CEOLogEntry;
  "ceo:log-stream": { sessionId: SessionId };

  // Signals
  "signal:emit": Signal;
  "signal:watch": { companyId: string };
  "signal:received": Signal;

  // Window management
  "window:detach-pane": { paneId: PaneId };
  "window:merge-pane": { paneId: PaneId; targetGridId: GridId };

  // Tool management
  "tools:add-mcp": { server: MCPServer; scope: ScopeLevel };
  "tools:remove-mcp": { name: string; scope: ScopeLevel };
  "tools:add-skill": { skill: Skill; scope: ScopeLevel };
  "tools:remove-skill": { name: string; scope: ScopeLevel };
  "tools:add-hook": { hook: Hook; scope: ScopeLevel };
  "tools:remove-hook": { event: HookEvent; scope: ScopeLevel };
  "tools:list": { scope?: ScopeLevel };
  "tools:scope": { name: string; from: ScopeLevel; to: ScopeLevel };

  // CEO monitoring
  "ceo:monitor": { gridId: GridId };

  // App lifecycle
  "app:get-installed-tools": void;
  "app:get-config": void;
  "app:set-config": Partial<WorkspaceConfig>;
}
