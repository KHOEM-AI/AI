#!/data/data/com.termux/files/usr/bin/bash
cd ~/ai-project/AI || exit 1
pkill -f "node server.mjs" 2>/dev/null
pkill -f vite 2>/dev/null
sleep 1
node server.mjs > /tmp/ai-server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
echo "server: 8787 | app: http://localhost:5173 | Ctrl+C = stop"
npm run dev
