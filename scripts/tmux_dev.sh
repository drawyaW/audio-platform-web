#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_NAME="audio-platform-web"

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  tmux kill-session -t "$SESSION_NAME"
fi

tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR" \
  "bash '$PROJECT_DIR/scripts/start_dev.sh'; exec bash"

echo "Started tmux session: $SESSION_NAME"
echo "Open: http://127.0.0.1:8040"
