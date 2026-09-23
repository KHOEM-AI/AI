#!/data/data/com.termux/files/usr/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT="$REPO_ROOT/docs/FILE-CLASSIFICATION-$(date +%Y%m%d-%H%M).md"

cd "$REPO_ROOT"

echo "# KHOEM-AI FILE CLASSIFICATION (Ready to Lock vs In-Progress)" > "$REPORT"
echo "Generated: $(date)" >> "$REPORT"
echo "" >> "$REPORT"

echo "## ✅ HAS TEST COVERAGE (candidates for lock)" >> "$REPORT"
echo '```' >> "$REPORT"
for f in $(find src/ai -name "*.mjs" -not -path "*__tests__*"); do
  base=$(basename "$f" .mjs)
  if [ -f "src/ai/__tests__/${base}.test.mjs" ]; then
    lastmod=$(git log -1 --format="%ar" -- "$f" 2>/dev/null)
    echo "$f  (test: yes, last changed: $lastmod)" >> "$REPORT"
  fi
done
echo '```' >> "$REPORT"

echo "" >> "$REPORT"
echo "## ⏳ NO TEST COVERAGE (NOT ready to lock)" >> "$REPORT"
echo '```' >> "$REPORT"
for f in $(find src/ai -name "*.mjs" -not -path "*__tests__*"); do
  base=$(basename "$f" .mjs)
  if [ ! -f "src/ai/__tests__/${base}.test.mjs" ]; then
    lastmod=$(git log -1 --format="%ar" -- "$f" 2>/dev/null)
    echo "$f  (test: NO, last changed: $lastmod)" >> "$REPORT"
  fi
done
echo '```' >> "$REPORT"

echo "" >> "$REPORT"
echo "## ⏳ CHANGED IN LAST 24 HOURS (NOT ready to lock — still active)" >> "$REPORT"
echo '```' >> "$REPORT"
git log --since="24 hours ago" --name-only --pretty=format: | sort -u | grep -v '^$' >> "$REPORT" || true
echo '```' >> "$REPORT"

echo "" >> "$REPORT"
echo "## 📄 ALL DOCS (docs/*.md) — status" >> "$REPORT"
echo '```' >> "$REPORT"
for f in docs/*.md; do
  [ -f "$f" ] || continue
  lastmod=$(git log -1 --format="%ar" -- "$f" 2>/dev/null)
  echo "$f  (last changed: $lastmod)" >> "$REPORT"
done
echo '```' >> "$REPORT"

echo "✅ Done: $REPORT"
