# KHOEM-AI — កំណត់ត្រាឆែកគម្រោង

ថ្ងៃទី៖ 2026-10-26 15:13

## ថតនៅកម្រិតលើ
```
data: 17 ឯកសារ
data_clean: 9 ឯកសារ
dist: 62 ឯកសារ
docs: 15 ឯកសារ
eval: 211 ឯកសារ
input: 1 ឯកសារ
knowledge: 1 ឯកសារ
output: 3 ឯកសារ
public: 1 ឯកសារ
scripts: 35 ឯកសារ
src: 314 ឯកសារ
```

## បន្ទាត់កូដសរុប (src)
```
99150
```

## ឯកសារ backup (គួរសម្អាត)
```
87
```

## Git
```
main
9b2456e Add IQ-AI media helpers to api client
1927451 Add /iqai dev proxy to IQ-AI media service
e69cbd9 feat(studio): add Camera Studio and StudioHub switcher
fa70558 Add 3D Studio and improve video planning
233bdd8 docs(worklog): record sandbox and localization verification results
5037f75 docs(worklog): record final verification results for 2026-10-25
1fb3547 docs: document agent/goals routes from code; add WORKLOG for 2026-10-25
a1c8a5b docs(readme): expand API section with grouped endpoint tables, auth, policy and error codes
81183b1 chore(lint): fix no-unused-expressions, annotate intentional empty catches and control-char regex; note Vite port 5175 in README
18d54f7 docs: rewrite src/README.md and archive old master spec to docs/KHOEM_AI_CONSOLIDATED_SPEC.md
--- ស្ថានភាព ---
?? ai.sh.before-fix.backup
?? docs/PROJECT_CHECK.md
?? install-camera-studio.mjs
?? src/App.css.before-3d-studio.backup
?? src/App.tsx.before-3d-studio.backup
?? src/App.tsx.before-camera-hub.backup
?? src/ai/__tests__/voiceEngine.test.mjs
?? src/ai/threeScene.mjs.before-orbit.backup
?? src/ai/threeScene.mjs.before-ui.backup
?? src/ai/videoPlan.mjs.backup
?? src/ai/videoPlan.mjs.before-22k.backup
?? src/ai/videoPlan.mjs.before-36k.backup
?? src/ai/videoRenderer.mjs.backup
?? src/ai/voiceEngine.mjs
?? src/api/client.ts.before-iqai.backup
?? src/components/ThreeDStudio.tsx.before-camera-hub.backup
?? src/components/ThreeDStudio.tsx.before-camera.backup
?? vite.config.ts.before-iqai.backup
```

## TODO / FIXME
```
src/ai/codeDataCenter.mjs:207:      todoCount = (content.match(/\bTODO\b/g) || []).length;
src/ai/codeDataCenter.mjs:208:      fixmeCount = (content.match(/\bFIXME\b/g) || []).length;
src/ai/codeDataCenter.mjs:409:      evidence: health.todoCount + " TODO and " + health.fixmeCount + " FIXME marker(s) found across the codebase",
src/ai/codeDataCenter.mjs:410:      explanation: "Unresolved TODO/FIXME markers may indicate incomplete work or known issues.",
src/ai/policyRegistry.mjs:21:  // TODO: raise "system.resume" to RISK.HIGH once execute-after-approval
src/components/CodeCenter.tsx:211:                <div>TODO: {health.todoCount} · FIXME: {health.fixmeCount}</div>
```
