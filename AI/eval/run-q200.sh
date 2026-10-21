#!/data/data/com.termux/files/usr/bin/bash
MODEL="$HOME/models/Qwen3-0.6B-khm-ft3-Q8_0.gguf"
Q="$HOME/ai-project/AI/eval/q200.txt"
RAW="$HOME/ai-project/AI/eval/q200_raw"
[ -f "$MODEL" ] && [ -f "$Q" ] || { echo "ERROR: រកមិនឃើញម៉ូដែល ឬសំណួរ"; exit 1; }
mkdir -p "$RAW"
n=0
while IFS= read -r q || [ -n "$q" ]; do
  [[ -z "${q//[[:space:]]/}" ]] && continue
  n=$((n+1))
  f=$(printf '%s/%03d.txt' "$RAW" "$n")
  if [ -s "$f" ] && grep -qF '[ Prompt:' "$f"; then continue; fi
  echo "[$n] $q"
  if llama-cli -m "$MODEL" -t 4 -c 2048 -n 150 --temp 0.3 --repeat-penalty 1.1 -st \
       -p "$q /no_think" </dev/null > "$f.tmp" 2>&1; then
    mv "$f.tmp" "$f"
  else
    echo "កំហុសសំណួរ $n"; rm -f "$f.tmp"
  fi
done < "$Q"
echo "រួច: $n សំណួរ"
