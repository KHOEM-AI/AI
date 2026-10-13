#!/usr/bin/env bash
# Thin wrapper: the real launcher lives in KHOEM_AI (single source of truth).
# Usage: ai [run|stop|restart]
LAUNCHER="${KHOEM_LAUNCHER:-$HOME/KHOEM_AI/KHOEM_AI/ai.sh}"
if [ ! -f "$LAUNCHER" ]; then
  echo "Launcher not found: $LAUNCHER (set KHOEM_LAUNCHER to override)"; exit 1
fi
export AI_DIR="${AI_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
exec bash "$LAUNCHER" "$@"
