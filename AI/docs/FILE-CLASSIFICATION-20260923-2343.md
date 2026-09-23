# KHOEM-AI FILE CLASSIFICATION (Ready to Lock vs In-Progress)
Generated: Wed Sep 23 23:43:19 +07 2026

## ✅ HAS TEST COVERAGE (candidates for lock)
```
src/ai/memory.mjs  (test: yes, last changed: 23 hours ago)
src/ai/status.mjs  (test: yes, last changed: 21 hours ago)
src/ai/tasks.mjs  (test: yes, last changed: 20 hours ago)
src/ai/permission.mjs  (test: yes, last changed: 8 hours ago)
src/ai/approvals.mjs  (test: yes, last changed: 23 hours ago)
src/ai/audit.mjs  (test: yes, last changed: 16 hours ago)
src/ai/model.mjs  (test: yes, last changed: 23 hours ago)
src/ai/session.mjs  (test: yes, last changed: 23 hours ago)
src/ai/killswitch.mjs  (test: yes, last changed: 18 hours ago)
src/ai/rollback.mjs  (test: yes, last changed: 18 hours ago)
src/ai/sandbox.mjs  (test: yes, last changed: 17 hours ago)
src/ai/patch.mjs  (test: yes, last changed: 17 hours ago)
src/ai/verification.mjs  (test: yes, last changed: 16 hours ago)
src/ai/budget.mjs  (test: yes, last changed: 9 hours ago)
src/ai/circuitBreaker.mjs  (test: yes, last changed: 9 hours ago)
src/ai/metrics.mjs  (test: yes, last changed: 9 hours ago)
src/ai/retry.mjs  (test: yes, last changed: 8 hours ago)
src/ai/goal.mjs  (test: yes, last changed: 8 hours ago)
src/ai/modelRouting.mjs  (test: yes, last changed: 8 hours ago)
```

## ⏳ NO TEST COVERAGE (NOT ready to lock)
```
src/ai/core.mjs  (test: NO, last changed: 2 days ago)
src/ai/learn.mjs  (test: NO, last changed: 3 days ago)
src/ai/api.mjs  (test: NO, last changed: 8 hours ago)
src/ai/find.mjs  (test: NO, last changed: 3 days ago)
src/ai/khoem.mjs  (test: NO, last changed: 2 days ago)
src/ai/english.mjs  (test: NO, last changed: 2 days ago)
src/ai/knowledge.mjs  (test: NO, last changed: 2 days ago)
src/ai/tools.mjs  (test: NO, last changed: 3 days ago)
src/ai/codeDataCenter.mjs  (test: NO, last changed: 20 hours ago)
```

## ⏳ CHANGED IN LAST 24 HOURS (NOT ready to lock — still active)
```
.gitignore
AI/.github/CODEOWNERS
AI/.github/LOCKED-FILES.md
AI/.gitignore
AI/add-i18n-keys.mjs
AI/ai.sh
AI/apply-phase1-patch.mjs
AI/apply-phase10-ui.mjs
AI/apply-phase11-tasks-api.mjs
AI/apply-phase12-killswitch.mjs
AI/apply-phase13-rollback.mjs
AI/apply-phase2-patch.mjs
AI/apply-phase20-sandbox.mjs
AI/apply-phase21-patch-proposal.mjs
AI/apply-phase22-verification.mjs
AI/apply-phase3-1-cdc-fix.mjs
AI/apply-phase3-cdc-patch.mjs
AI/apply-phase3-patch.mjs
AI/apply-phase4-patch.mjs
AI/apply-phase5-symbol-index.mjs
AI/apply-phase6-dependency-graph.mjs
AI/apply-phase7-code-health.mjs
AI/apply-phase8-provenance.mjs
AI/apply-phase9-findings.mjs
AI/check-i18n.mjs
AI/data/audit-log.jsonl
AI/docs/AUDIT-REPORT-20260923-0032.md
AI/docs/PHASE_REPORT.md
AI/eslint.config.js
AI/extract-keys.mjs
AI/khoem-audit.sh
AI/package-lock.json
AI/package.json
AI/src/App.tsx
AI/src/Gate.tsx
AI/src/README.md
AI/src/ai.ts
AI/src/ai/__tests__/approvals.test.mjs
AI/src/ai/__tests__/audit.test.mjs
AI/src/ai/__tests__/budget.test.mjs
AI/src/ai/__tests__/circuitBreaker.test.mjs
AI/src/ai/__tests__/goal.test.mjs
AI/src/ai/__tests__/killswitch.test.mjs
AI/src/ai/__tests__/memory.test.mjs
AI/src/ai/__tests__/metrics.test.mjs
AI/src/ai/__tests__/model.test.mjs
AI/src/ai/__tests__/modelRouting.test.mjs
AI/src/ai/__tests__/patch.test.mjs
AI/src/ai/__tests__/permission.test.mjs
AI/src/ai/__tests__/retry.test.mjs
AI/src/ai/__tests__/rollback.test.mjs
AI/src/ai/__tests__/sandbox.test.mjs
AI/src/ai/__tests__/session.test.mjs
AI/src/ai/__tests__/status.test.mjs
AI/src/ai/__tests__/tasks.test.mjs
AI/src/ai/__tests__/verification.test.mjs
AI/src/ai/api.mjs
AI/src/ai/approvals.mjs
AI/src/ai/audit.mjs
AI/src/ai/budget.mjs
AI/src/ai/circuitBreaker.mjs
AI/src/ai/codeDataCenter.mjs
AI/src/ai/goal.mjs
AI/src/ai/killswitch.mjs
AI/src/ai/memory.mjs
AI/src/ai/metrics.mjs
AI/src/ai/model.mjs
AI/src/ai/modelRouting.mjs
AI/src/ai/patch.mjs
AI/src/ai/permission.mjs
AI/src/ai/retry.mjs
AI/src/ai/rollback.mjs
AI/src/ai/sandbox.mjs
AI/src/ai/session.mjs
AI/src/ai/status.mjs
AI/src/ai/tasks.mjs
AI/src/ai/verification.mjs
AI/src/app.ts
AI/src/components/AIStatus.tsx
AI/src/components/AIStatus.tsx.bak
AI/src/components/ControlCenter.tsx
AI/src/components/LanguagePrompt.tsx
AI/src/data/aiStatus.ts
AI/src/i18n/ar.ts
AI/src/i18n/bn.ts
AI/src/i18n/cs.ts
AI/src/i18n/de.ts
AI/src/i18n/el.ts
AI/src/i18n/en.ts
AI/src/i18n/en.ts.bak
AI/src/i18n/es.ts
AI/src/i18n/fa.ts
AI/src/i18n/fr.ts
AI/src/i18n/he.ts
AI/src/i18n/hi.ts
AI/src/i18n/hu.ts
AI/src/i18n/id.ts
AI/src/i18n/index.ts
AI/src/i18n/index.ts.bak
AI/src/i18n/it.ts
AI/src/i18n/ja.ts
AI/src/i18n/km.ts
AI/src/i18n/km.ts.bak
AI/src/i18n/ko.ts
AI/src/i18n/lo.ts
AI/src/i18n/mn.ts
AI/src/i18n/ms.ts
AI/src/i18n/my.ts
AI/src/i18n/ne.ts
AI/src/i18n/nl.ts
AI/src/i18n/pl.ts
AI/src/i18n/pt.ts
AI/src/i18n/ro.ts
AI/src/i18n/ru.ts
AI/src/i18n/si.ts
AI/src/i18n/sv.ts
AI/src/i18n/ta.ts
AI/src/i18n/th.ts
AI/src/i18n/tl.ts
AI/src/i18n/tr.ts
AI/src/i18n/types.ts
AI/src/i18n/types.ts.bak
AI/src/i18n/uk.ts
AI/src/i18n/ur.ts
AI/src/i18n/vi.ts
AI/src/i18n/zh.ts
AI/src/language.ts
AI/src/lib/app.ts
AI/vite.config.ts
AUDIT-REPORT-20260923-0032.md
khoem-audit.sh
```

## 📄 ALL DOCS (docs/*.md) — status
```
docs/API.md  (last changed: 34 hours ago)
docs/AUDIT-REPORT-20260923-0032.md  (last changed: 22 hours ago)
docs/FILE-CLASSIFICATION-20260923-2320.md  (last changed: )
docs/FILE-CLASSIFICATION-20260923-2343.md  (last changed: )
docs/KHOEM_AI_MASTER_SPEC.md  (last changed: 2 days ago)
docs/PHASE_REPORT.md  (last changed: 27 minutes ago)
```
