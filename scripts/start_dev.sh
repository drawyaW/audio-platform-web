#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

exec conda run --no-capture-output -n audio-frontend \
  npm --prefix "$PROJECT_DIR" run dev -- --host 0.0.0.0 --port 8040
