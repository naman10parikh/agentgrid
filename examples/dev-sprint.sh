#!/bin/bash
# Example: Development sprint with 4 focused agents
# Run inside tmux: agentgrid start then ./examples/dev-sprint.sh

set -euo pipefail

echo "Setting up dev sprint..."

# Create a 2x2 grid with claude in each
agentgrid grid 2x2 claude

# Name each pane
sleep 2  # wait for claude to start
tmux set-option -p -t :.1 @pane_label "Frontend"
tmux set-option -p -t :.2 @pane_label "Backend"
tmux set-option -p -t :.3 @pane_label "Tests"
tmux set-option -p -t :.4 @pane_label "Docs"

echo "Sprint ready! Give each Claude a task."
echo "  Frontend: Build the UI component"
echo "  Backend:  Build the API route"
echo "  Tests:    Write tests for both"
echo "  Docs:     Update documentation"
