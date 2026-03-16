#!/bin/bash
# agentgrid pane status — sets @pane_status for colored tmux labels
# Called from agent hooks (Claude Code Stop, PermissionRequest, etc.)

STATUS="${1:-off}"

# Normalize status
case "$STATUS" in
    running|needs-input|done) ;; # valid
    *) STATUS="" ;; # clear
esac

# Method 1: Direct via TMUX_PANE (best — works when TMUX is set)
if [ -n "${TMUX:-}" ] && [ -n "${TMUX_PANE:-}" ]; then
    tmux set-option -p -t "${TMUX_PANE}" @pane_status "$STATUS" 2>/dev/null
    exit 0
fi

# Method 2: Walk process tree to find our tmux pane (for hook subprocesses)
if command -v tmux &>/dev/null && tmux ls &>/dev/null 2>&1; then
    SEARCH_PID=$$
    for _ in 1 2 3 4 5 6 7 8 9 10; do
        SEARCH_PID=$(ps -o ppid= -p "$SEARCH_PID" 2>/dev/null | tr -d ' ')
        [ -z "$SEARCH_PID" ] || [ "$SEARCH_PID" = "1" ] && break
        FOUND=$(tmux list-panes -a -F '#{pane_pid} #{pane_id}' 2>/dev/null | awk -v pid="$SEARCH_PID" '$1 == pid {print $2; exit}')
        if [ -n "$FOUND" ]; then
            tmux set-option -p -t "$FOUND" @pane_status "$STATUS" 2>/dev/null
            exit 0
        fi
    done
fi
