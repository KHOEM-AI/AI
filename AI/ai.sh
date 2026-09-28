#!/data/data/com.termux/files/usr/bin/bash
cd ~/ai-project/AI || exit 1
pkill -f "node server.mjs" 2>/dev/null
pkill -f vite 2>/dev/null
sleep 1
node server.mjs > $HOME/ai-server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -s -o /dev/null http://127.0.0.1:8787/api/status && break
  sleep 1
done
if ! kill -0 $SERVER 2>/dev/null; then
  echo "server មិនដំណើរការ — មើល ~/ai-server.log"
  exit 1
fi
echo "server: 8787 | app: http://localhost:5175 | log: ~/ai-server.log | Ctrl+C = stop"
npm run dev
