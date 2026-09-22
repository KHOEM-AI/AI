#!/data/data/com.termux/files/usr/bin/bash
REPORT="AUDIT-REPORT-$(date +%Y%m%d-%H%M).md"

echo "# KHOEM-AI PHASE 0 AUDIT REPORT" > "$REPORT"
echo "Generated: $(date)" >> "$REPORT"
echo "" >> "$REPORT"

section() {
  echo "" >> "$REPORT"
  echo "## $1" >> "$REPORT"
  echo '```' >> "$REPORT"
}
endsection() {
  echo '```' >> "$REPORT"
}

section "1. REPO STRUCTURE (2 levels)"
find . -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*' | sort >> "$REPORT"
endsection

section "2. PACKAGE.JSON FILES"
find . -name "package.json" -not -path "*/node_modules/*" -exec echo "--- {} ---" \; -exec cat {} \; >> "$REPORT"
endsection

section "3. ALL SOURCE FILES BY TYPE"
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mjs" -o -name "*.jsx" \) -not -path "*/node_modules/*" | sort >> "$REPORT"
endsection

section "4. AI / STATUS MODULES"
find . -iname "*status*" -o -iname "*health*" -not -path "*/node_modules/*" 2>/dev/null | grep -v node_modules >> "$REPORT"
endsection

section "5. MEMORY MODULES"
find . -iname "*memory*" -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "6. LEARNING MODULES (/learn /learned /forget)"
grep -rl "learn\|forget" --include="*.mjs" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules >> "$REPORT"
endsection

section "7. KNOWLEDGE MODULES"
find . -iname "*knowledge*" -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "8. TOOLS MODULES"
find . -iname "*tool*" -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "9. API / ROUTES"
find . -iname "*api*" -o -iname "*route*" -not -path "*/node_modules/*" 2>/dev/null | grep -v node_modules >> "$REPORT"
endsection

section "10. MODEL LAYER"
find . -iname "*model*" -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "11. SESSION LAYER"
find . -iname "*session*" -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "12. PERMISSION / POLICY / APPROVAL"
find . \( -iname "*permission*" -o -iname "*policy*" -o -iname "*approval*" \) -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "13. AUDIT / EVENT LOG SYSTEM"
find . \( -iname "*audit*" -o -iname "*event*" -o -iname "*log*" \) -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "14. CONTROL CENTER"
find . -iname "*control*" -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "15. LANGUAGE / I18N SYSTEM"
find . \( -iname "*i18n*" -o -iname "*language*" -o -iname "*locale*" \) -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "16. TESTS"
find . \( -iname "*test*" -o -iname "*spec*" \) -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "17. CODE SCANNER (existing)"
find . -iname "*scan*" -not -path "*/node_modules/*" | grep -v node_modules >> "$REPORT"
endsection

section "18. CODE DATA CENTER (existing, if any)"
find . -iname "*codedata*" -o -iname "*code-data*" -o -iname "*index*" -not -path "*/node_modules/*" 2>/dev/null | grep -v node_modules >> "$REPORT"
endsection

section "19. GIT STATUS"
git status --short 2>&1 >> "$REPORT"
endsection

section "20. GIT LOG (last 10)"
git log --oneline -10 2>&1 >> "$REPORT"
endsection

section "21. TYPESCRIPT CHECK"
npx tsc --noEmit 2>&1 | tail -50 >> "$REPORT"
endsection

section "22. FILE COUNT SUMMARY"
echo "TS/TSX files: $(find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | wc -l)" >> "$REPORT"
echo "MJS/JS files: $(find . -name '*.mjs' -o -name '*.js' | grep -v node_modules | wc -l)" >> "$REPORT"
echo "Total lines (ts/tsx/mjs/js): $(find . \( -name '*.ts' -o -name '*.tsx' -o -name '*.mjs' -o -name '*.js' \) -not -path '*/node_modules/*' -exec cat {} + 2>/dev/null | wc -l)" >> "$REPORT"
endsection

section "23. LARGEST FILES (top 15, potential oversized files)"
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.js" \) -not -path "*/node_modules/*" -exec wc -l {} \; 2>/dev/null | sort -rn | head -15 >> "$REPORT"
endsection

echo ""
echo "✅ Audit complete: $REPORT"
echo "សូមចម្លងខ្លឹមសារ file នេះមកខ្ញុំវិញ (cat $REPORT)"
