#!/bin/bash
# Example: Set up an earning agent fleet with 7 named agents
# Run inside tmux: agentgrid start then ./examples/earning-fleet.sh

set -euo pipefail

echo "Setting up earning agent fleet..."

# Create a 2x4 grid (8 panes, we'll use 7)
agentgrid grid 2x4

# Name each pane for an agent
tmux set-option -p -t :.1 @pane_label "Mercury (Trading)"
tmux set-option -p -t :.2 @pane_label "Venus (Bounties)"
tmux set-option -p -t :.3 @pane_label "Mars (Crypto)"
tmux set-option -p -t :.4 @pane_label "Jupiter (Gigs)"
tmux set-option -p -t :.5 @pane_label "Saturn (Products)"
tmux set-option -p -t :.6 @pane_label "Neptune (Content)"
tmux set-option -p -t :.7 @pane_label "Pluto (Outreach)"
tmux set-option -p -t :.8 @pane_label "HQ (Monitor)"

echo "Fleet ready! Start claude in each pane and assign tasks."
