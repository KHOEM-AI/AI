#!/data/data/com.termux/files/usr/bin/bash
set -o pipefail

MODEL="$HOME/models/Qwen3-0.6B-khm-ft3-Q8_0.gguf"
QUESTIONS="$HOME/ai-project/AI/eval/khmer-questions.txt"
OUT="$HOME/ai-project/AI/eval/results.txt"

if [ ! -f "$MODEL" ] || [ ! -f "$QUESTIONS" ]; then
  echo "ERROR: រកមិនឃើញម៉ូដែល ឬឯកសារសំណួរ"
  exit 1
fi

: > "$OUT"
n=0
failed=0

while IFS= read -r line || [ -n "$line" ]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line//[[:space:]]/}" ]] && continue

  q=$(printf '%s\n' "$line" |
      sed -E 's/^[0-9]+\. \[[^]]+\] //')

  n=$((n + 1))
  printf '\n===== សំណួរទី %s =====\n%s\n' "$n" "$q" |
      tee -a "$OUT"

  if llama-cli \
      -m "$MODEL" \
      -t 4 \
      -c 2048 \
      -n 200 \
      --temp 0.3 \
      --repeat-penalty 1.1 \
      -st \
      -p "$q /no_think" \
      </dev/null 2>&1 | tee -a "$OUT"
  then
    echo "ស្ថានភាព៖ ដំណើរការរួច" | tee -a "$OUT"
  else
    echo "ស្ថានភាព៖ មានកំហុស" | tee -a "$OUT"
    failed=$((failed + 1))
  fi

done < "$QUESTIONS"

echo
echo "===== សរុប ====="
echo "ចំនួនសំណួរ៖ $n"
echo "ចំនួនកំហុសដំណើរការ៖ $failed"
echo "លទ្ធផល៖ $OUT"
