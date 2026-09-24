#!/bin/bash
# safe-check.sh - checks before pushing. Add --full to also run all tests (~4 min).
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
ROOT=$(pwd)
FAIL=0
ok()  { echo "✅ $1"; }
bad() { echo "❌ $1"; FAIL=1; }

echo "== 1. forbidden files tracked by git =="
HITS=$(git ls-files | grep -E '(^|/)\.env(\.local)?$|(^|/)dist/|(^|/)node_modules/|audit-log.*\.jsonl$')
if [ -z "$HITS" ]; then ok "none"; else bad "tracked: $HITS"; fi

echo "== 2. secrets in commits being pushed =="
UP=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)
if [ -n "$UP" ]; then RANGE="$UP..HEAD"; else RANGE="HEAD~1..HEAD"; fi
S=$(git diff -U0 "$RANGE" 2>/dev/null | grep '^+' | grep -v '^+++' | grep -E 'KHOEM_API_KEY=[A-Za-z0-9]{8,}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN [A-Z ]*PRIVATE KEY')
if [ -z "$S" ]; then ok "no key patterns found"; else bad "possible secret in $(echo "$S" | wc -l) line(s) - check: git diff $RANGE"; fi

echo "== 3. up to date with GitHub =="
git fetch -q 2>/dev/null
if [ -n "$UP" ]; then
  BEHIND=$(git rev-list --count "HEAD..$UP")
  if [ "$BEHIND" = "0" ]; then ok "not behind"; else bad "GitHub has $BEHIND newer commit(s). Run: git pull --no-rebase origin main"; fi
else
  echo "ℹ️ no upstream set, skipped"
fi

cd "$ROOT/AI" || exit 1
echo "== 4. TypeScript + build =="
if npm run build >/dev/null 2>&1; then ok "build"; else bad "build failed (run: npm run build)"; fi

if [ "${1:-}" = "--full" ]; then
  echo "== 5. full tests (~4 min) =="
  npx vitest run 2>&1 | tail -6
  if [ "${PIPESTATUS[0]}" = "0" ]; then ok "tests"; else bad "tests failed"; fi
fi

if git status --short | grep -q .; then echo "ℹ️ uncommitted files exist (they will NOT be pushed)"; fi

if [ "$FAIL" = "0" ]; then echo "✅ SAFE TO PUSH"; exit 0; else echo "⛔ PUSH BLOCKED"; exit 1; fi
