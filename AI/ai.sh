#!/usr/bin/env bash
# AI repo: thin wrapper. The real launcher lives in KHOEM_AI (single source of truth).
# Usage: ./ai.sh [run|stop|restart]
# Whole stack (IQ-AI + KHOEM_AI + AI + KSV gateway): run `ai` (~/KSV/ai.sh).
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
LAUNCHER="${KHOEM_LAUNCHER:-$HOME/KHOEM_AI/KHOEM_AI/ai.sh}"
if [ ! -f "$LAUNCHER" ]; then
  echo "Launcher not found: $LAUNCHER (set KHOEM_LAUNCHER to override)" >&2
  exit 1
fi
export AI_DIR="${AI_DIR:-$HERE}"
exec bash "$LAUNCHER" "$@"
