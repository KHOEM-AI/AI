#!/data/data/com.termux/files/usr/bin/bash

AI_DIR="$HOME/ai-project/AI"
KHOEM_DIR="$HOME/KHOEM_AI_repo/localization"

AI_LOG="$HOME/ai-server.log"
KHOEM_LOG="$HOME/khoem-api.log"
UI_LOG="$HOME/ai-ui.log"

AI_PID=""
KHOEM_PID=""
UI_PID=""
OWN_AI=0
OWN_KHOEM=0
OWN_UI=0

killtree() {
  for c in $(pgrep -P "$1" 2>/dev/null); do killtree "$c"; done
  kill "$1" 2>/dev/null
}

cleanup() {
  echo
  echo "Stopping services started by ai..."

  [ "$OWN_UI" = "1" ] && killtree "$UI_PID"
  [ "$OWN_AI" = "1" ] && killtree "$AI_PID"
  [ "$OWN_KHOEM" = "1" ] && killtree "$KHOEM_PID"

  wait 2>/dev/null
  echo "Stopped."
}

trap cleanup INT TERM EXIT

wait_for() {
  local url="$1"
  local name="$2"

  for i in $(seq 1 30); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      echo "$name: ready"
      return 0
    fi
    sleep 1
  done

  echo "$name: not ready"
  return 1
}

echo "Starting KHOEM_AI + AI..."

# KHOEM_AI API :8790
if curl -fsS -o /dev/null http://127.0.0.1:8790/health 2>/dev/null; then
  echo "KHOEM API: already running on 8790"
else
  (
    cd "$KHOEM_DIR" || exit 1
    npm run api > "$KHOEM_LOG" 2>&1
  ) &
  KHOEM_PID=$!
  OWN_KHOEM=1

  if ! wait_for "http://127.0.0.1:8790/health" "KHOEM API"; then
    echo "KHOEM API failed — see $KHOEM_LOG"
    exit 1
  fi
fi

# AI backend :8787
if curl -fsS -o /dev/null http://127.0.0.1:8787/api/status 2>/dev/null; then
  echo "AI backend: already running on 8787"
else
  (
    cd "$AI_DIR" || exit 1
    npm run server > "$AI_LOG" 2>&1
  ) &
  AI_PID=$!
  OWN_AI=1

  if ! wait_for "http://127.0.0.1:8787/api/status" "AI backend"; then
    echo "AI backend failed — see $AI_LOG"
    exit 1
  fi
fi

# AI UI :5175
if curl -fsS -o /dev/null http://127.0.0.1:5175/ 2>/dev/null; then
  echo "AI UI: already running on 5175"
else
  (
    cd "$AI_DIR" || exit 1
    npm run dev -- --host 127.0.0.1 > "$UI_LOG" 2>&1
  ) &
  UI_PID=$!
  OWN_UI=1

  if ! wait_for "http://127.0.0.1:5175/" "AI UI"; then
    echo "AI UI failed — see $UI_LOG"
    exit 1
  fi
fi

echo
echo "======================================"
echo "KHOEM_AI API : http://127.0.0.1:8790"
echo "AI backend   : http://127.0.0.1:8787"
echo "AI UI        : http://127.0.0.1:5175"
echo "======================================"
echo "ai is running. Ctrl+C = stop services started by this command."

while true; do
  sleep 2

  if [ "$OWN_KHOEM" = "1" ] && ! kill -0 "$KHOEM_PID" 2>/dev/null; then
    echo "KHOEM API stopped — see $KHOEM_LOG"
    exit 1
  fi

  if [ "$OWN_AI" = "1" ] && ! kill -0 "$AI_PID" 2>/dev/null; then
    echo "AI backend stopped — see $AI_LOG"
    exit 1
  fi

  if [ "$OWN_UI" = "1" ] && ! kill -0 "$UI_PID" 2>/dev/null; then
    echo "AI UI stopped — see $UI_LOG"
    exit 1
  fi
done
