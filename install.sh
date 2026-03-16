#!/bin/bash
# agentgrid installer — one command, fully set up
# curl -fsSL https://raw.githubusercontent.com/naman10parikh/agentgrid/main/install.sh | bash

set -euo pipefail

PURPLE='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log() { echo -e "  ${PURPLE}▸${NC} $1"; }

# ─── Splash ───
echo ""
echo -e "${PURPLE}${BOLD}"
cat << 'SPLASH'
     ___                    __  ______     _     __
    /   | ____ ____  ____  / /_/ ____/____(_)___/ /
   / /| |/ __ `/ _ \/ __ \/ __/ / __/ ___/ / __  /
  / ___ / /_/ /  __/ / / / /_/ /_/ / /  / / /_/ /
 /_/  |_\__, /\___/_/ /_/\__/\____/_/  /_/\__,_/
       /____/                                v0.1.0
SPLASH
echo -e "${NC}"
echo -e "  ${DIM}Spawn a grid of AI coding agents in one command${NC}"
echo ""

# ─── 1. Check OS ───
OS="$(uname -s)"
case "$OS" in
    Darwin) PLATFORM="macos" ;;
    Linux)  PLATFORM="linux" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
    *) echo "Unsupported OS: $OS"; exit 1 ;;
esac
log "Platform: ${BOLD}$PLATFORM${NC}"

# ─── 2. Install tmux ───
if ! command -v tmux &>/dev/null; then
    log "Installing tmux..."
    case "$PLATFORM" in
        macos)
            if command -v brew &>/dev/null; then
                brew install tmux
            else
                echo -e "  ${YELLOW}Install Homebrew first: https://brew.sh${NC}"
                exit 1
            fi
            ;;
        linux)
            if command -v apt &>/dev/null; then
                sudo apt update -qq && sudo apt install -y tmux
            elif command -v dnf &>/dev/null; then
                sudo dnf install -y tmux
            elif command -v pacman &>/dev/null; then
                sudo pacman -S --noconfirm tmux
            fi
            ;;
        windows)
            log "Windows: install tmux via WSL (wsl --install, then sudo apt install tmux)"
            ;;
    esac
    log "tmux installed: ${GREEN}$(tmux -V)${NC}"
else
    log "tmux: ${GREEN}$(tmux -V)${NC}"
fi

# ─── 3. Install agentgrid CLI ───
INSTALL_DIR="${HOME}/.local/bin"
mkdir -p "$INSTALL_DIR"

log "Installing agentgrid CLI..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || SCRIPT_DIR=""

if [ -n "$SCRIPT_DIR" ] && [ -f "${SCRIPT_DIR}/agentgrid" ]; then
    cp "${SCRIPT_DIR}/agentgrid" "${INSTALL_DIR}/agentgrid"
    cp "${SCRIPT_DIR}/pane-status.sh" "${INSTALL_DIR}/agentgrid-pane-status" 2>/dev/null || true
else
    curl -fsSL "https://raw.githubusercontent.com/naman10parikh/agentgrid/main/agentgrid" -o "${INSTALL_DIR}/agentgrid"
    curl -fsSL "https://raw.githubusercontent.com/naman10parikh/agentgrid/main/pane-status.sh" -o "${INSTALL_DIR}/agentgrid-pane-status"
fi
chmod +x "${INSTALL_DIR}/agentgrid" "${INSTALL_DIR}/agentgrid-pane-status" 2>/dev/null

# ─── 4. PATH ───
SHELL_RC=""
[ -f "${HOME}/.zshrc" ] && SHELL_RC="${HOME}/.zshrc"
[ -z "$SHELL_RC" ] && [ -f "${HOME}/.bashrc" ] && SHELL_RC="${HOME}/.bashrc"

if [ -n "$SHELL_RC" ] && ! grep -q "\.local/bin" "$SHELL_RC" 2>/dev/null; then
    echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "$SHELL_RC"
    log "Added to PATH in $(basename "$SHELL_RC")"
fi
export PATH="${HOME}/.local/bin:${PATH}"

# ─── 5. Config ───
CONFIG_DIR="${HOME}/.agentgrid"
mkdir -p "${CONFIG_DIR}/sounds" "${CONFIG_DIR}/presets"

# Copy built-in presets
if [ -n "$SCRIPT_DIR" ] && [ -d "${SCRIPT_DIR}/presets" ]; then
    cp "${SCRIPT_DIR}"/presets/*.json "${CONFIG_DIR}/presets/" 2>/dev/null || true
    log "Presets installed: $(ls "${CONFIG_DIR}/presets/"*.json 2>/dev/null | wc -l | tr -d ' ') presets"
else
    for preset in dev-sprint mixed-agents research-swarm; do
        curl -fsSL "https://raw.githubusercontent.com/naman10parikh/agentgrid/main/presets/${preset}.json" -o "${CONFIG_DIR}/presets/${preset}.json" 2>/dev/null || true
    done
    log "Presets: $(ls "${CONFIG_DIR}/presets/"*.json 2>/dev/null | wc -l | tr -d ' ') installed"
fi

if [ ! -f "${CONFIG_DIR}/config.json" ]; then
    if [ "$PLATFORM" = "macos" ]; then
        cat > "${CONFIG_DIR}/config.json" << 'CONF'
{
  "default_agent": "claude",
  "sounds": {
    "done": "/System/Library/Sounds/Glass.aiff",
    "waiting": "/System/Library/Sounds/Tink.aiff",
    "sub_agent": "/System/Library/Sounds/Purr.aiff"
  }
}
CONF
    else
        cat > "${CONFIG_DIR}/config.json" << 'CONF'
{
  "default_agent": "claude",
  "sounds": {
    "done": "/usr/share/sounds/freedesktop/stereo/complete.oga",
    "waiting": "/usr/share/sounds/freedesktop/stereo/message.oga",
    "sub_agent": "/usr/share/sounds/freedesktop/stereo/bell.oga"
  }
}
CONF
    fi
    log "Config: ${GREEN}~/.agentgrid/config.json${NC}"
fi

# ─── 6. tmux config ───
TMUX_CONF="${HOME}/.tmux.conf"
if ! grep -q "agentgrid" "$TMUX_CONF" 2>/dev/null; then
    log "Configuring tmux..."
    cat >> "$TMUX_CONF" << 'TMUXEOF'

# ─── agentgrid ───
set -g prefix C-a
unbind C-b
bind C-a send-prefix
set -g mouse on
set -g base-index 1
setw -g pane-base-index 1
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind -n M-h select-pane -L
bind -n M-l select-pane -R
bind -n M-k select-pane -U
bind -n M-j select-pane -D
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D
bind -n M-z resize-pane -Z
bind . command-prompt -p "Name:" "set-option -p @pane_label '%%'"
bind E select-layout tiled \; display "Equalized"
set -g allow-rename off
setw -g automatic-rename off
set -g pane-border-status top
set -g pane-border-format '#{?#{==:#{@pane_status},done},#[bg=green fg=black bold] ✅ DONE #[default] ,#{?#{==:#{@pane_status},needs-input},#[bg=yellow fg=black bold] ⏳ WAITING #[default] ,#{?#{==:#{@pane_status},running},#[bg=blue fg=white bold] ⚡ WORKING #[default] , }}}#{?pane_active,#[fg=#8B5CF6 bold],#[fg=#6b6560]}#{?#{==:#{@pane_label},},Pane #{pane_index},#{@pane_label}} #{?pane_active,●,○}'
set -g pane-border-style "fg=#3f3d3b"
set -g pane-active-border-style "fg=#8B5CF6"
set -g status-style "bg=#1e1d1c,fg=#a8a29e"
set -g status-left "#[fg=#8B5CF6,bold] ⚡ agentgrid "
set -g status-right "#[fg=#a8a29e] %H:%M "
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-256color:RGB"
set -g history-limit 50000
TMUXEOF
    log "tmux: ${GREEN}configured${NC}"
else
    log "tmux: ${GREEN}already configured${NC}"
fi

# ─── 7. Claude Code hooks ───
PANE_STATUS="${INSTALL_DIR}/agentgrid-pane-status"
CLAUDE_DIR="${HOME}/.claude"

if [ -d "$CLAUDE_DIR" ] || command -v claude &>/dev/null; then
    log "Detected Claude Code. Installing hooks..."
    mkdir -p "$CLAUDE_DIR"
    CLAUDE_SETTINGS="${CLAUDE_DIR}/settings.json"

    if [ "$PLATFORM" = "macos" ]; then
        SOUND_DONE="afplay /System/Library/Sounds/Glass.aiff &"
        SOUND_WAIT="afplay /System/Library/Sounds/Tink.aiff &"
    else
        SOUND_DONE="paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null &"
        SOUND_WAIT="paplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null &"
    fi

    python3 << PYEOF
import json, os
path = os.path.expanduser("~/.claude/settings.json")
try:
    with open(path) as f: s = json.load(f)
except: s = {}
h = s.setdefault("hooks", {})
ps = "$PANE_STATUS"
def has(lst):
    return any("agentgrid" in hook.get("command","") for entry in lst for hook in entry.get("hooks",[]))
if not has(h.get("UserPromptSubmit",[])):
    h.setdefault("UserPromptSubmit",[]).append({"matcher":"","hooks":[{"type":"command","command":f"{ps} running 2>/dev/null; true"}]})
if not has(h.get("PermissionRequest",[])):
    h.setdefault("PermissionRequest",[]).append({"matcher":"","hooks":[{"type":"command","command":f"{ps} needs-input 2>/dev/null; $SOUND_WAIT"}]})
if not has(h.get("Stop",[])):
    h.setdefault("Stop",[]).append({"matcher":"","hooks":[{"type":"command","command":f"{ps} done 2>/dev/null; $SOUND_DONE"}]})
with open(path,"w") as f: json.dump(s,f,indent=2)
print("  Hooks installed")
PYEOF
else
    log "Claude Code not detected (install hooks later with: agentgrid install-hooks)"
fi

# ─── Done ───
echo ""
echo -e "  ${GREEN}${BOLD}✅ agentgrid installed!${NC}"
echo ""
echo -e "  ${BOLD}Quick start:${NC}"
echo -e "    ${CYAN}agentgrid start${NC}             Start a tmux session"
echo -e "    ${CYAN}agentgrid grid 2x3 claude${NC}   6 Claude Code instances"
echo -e "    ${CYAN}agentgrid sound test${NC}         Preview your alert sounds"
echo ""
echo -e "  ${BOLD}Custom sounds:${NC}"
echo -e "    ${CYAN}agentgrid sound done ~/Music/tada.mp3${NC}"
echo ""
echo -e "  ${BOLD}Navigation:${NC}"
echo -e "    Option+H/J/K/L   Move between panes"
echo -e "    Ctrl+A .          Name a pane"
echo -e "    Ctrl+A E          Equalize sizes"
echo ""
echo -e "  ${DIM}Docs: https://github.com/naman10parikh/agentgrid${NC}"
echo ""
if [ -n "${SHELL_RC:-}" ]; then
    echo -e "  ${YELLOW}Open a new terminal or run: source ~/${SHELL_RC##*/}${NC}"
    echo ""
fi
