#!/data/data/com.termux/files/usr/bin/bash
APP="$HOME/ai-project/AI"
PORT="${PORT:-3000}"
LOG="$HOME/ai-server.log"
PIDF="$HOME/.ai-server.pid"

running() { [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; }

start() {
  cd "$APP" || { echo "❌ រកថត $APP មិនឃើញ"; exit 1; }
  command -v termux-wake-lock >/dev/null && termux-wake-lock
  if running; then echo "ℹ️ កំពុងរត់រួចហើយ (PID $(cat "$PIDF"))"; return; fi
  [ -d node_modules ] || npm install
  node --check server.mjs || { echo "❌ server.mjs មានកំហុស syntax"; exit 1; }
  PORT=$PORT nohup node server.mjs >"$LOG" 2>&1 &
  echo $! > "$PIDF"
  for i in $(seq 1 20); do
    if curl -s "http://127.0.0.1:$PORT/api/learned/health" >/dev/null 2>&1; then
      echo "✅ API រត់ហើយ: http://127.0.0.1:$PORT"
      return
    fi
    sleep 1
  done
  echo "⚠️ មិនទាន់ឆ្លើយតប — មើល log: ai log"
}

stop() {
  if running; then kill "$(cat "$PIDF")"; rm -f "$PIDF"; echo "🛑 បានបញ្ឈប់"; else echo "មិនកំពុងរត់"; fi
}

case "${1:-start}" in
  start)   start ;;
  stop)    stop ;;
  restart) stop; sleep 1; start ;;
  status)  running && echo "✅ កំពុងរត់ (PID $(cat "$PIDF"))" || echo "❌ មិនរត់" ;;
  log)     tail -n 50 -f "$LOG" ;;
  *)       echo "ប្រើ: ai [start|stop|restart|status|log]" ;;
esac
