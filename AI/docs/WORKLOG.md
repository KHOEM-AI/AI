# KHOEM AI — Work Log

កំណត់ត្រាការងារ (ថ្មីបំផុតនៅខាងក្រោម)។

## 2026-10-25

**Commits**
- `18d54f7` សរសេរ `src/README.md` ថ្មី ហើយរក្សា spec ចាស់ទាំងមូលក្នុង `docs/KHOEM_AI_CONSOLIDATED_SPEC.md`
- `81183b1` ជួសជុល lint តូចៗ (`OpCard.tsx` no-unused-expressions, `useChat.ts` catch ទទេ, `inputGuard.ts` control-char regex) និងបន្ថែម port 5175 ក្នុង README
- `a1c8a5b` ពង្រីកផ្នែក API ក្នុង README ជាតារាងតាមក្រុម (auth, policy, error codes)
- commit នេះ: បន្ថែម route ដែលខ្វះក្នុង `docs/API.md` និង WORKLOG នេះ

**លទ្ធផលត្រួតពិនិត្យ**
- Tests: 80 files / 587 tests ជាប់ទាំងអស់ (agentApi.test.mjs 38/38 ត្រូវបានរត់ឡើងវិញដាច់ដោយឡែក ព្រោះ vitest worker timeout ពេលរត់រួមជាមួយ build) · typecheck និង build ជាប់ · `node --check` ជាប់
- Git: សមកាលជាមួយ GitHub · `.env` មិនត្រូវបាន track · គ្មាន secret ក្នុង tracked files
- ESLint: 50 → 44 errors។ នៅសល់ 39 `no-explicit-any` និង 5 react-hooks ដែលទុកដោយចេតនា
  (`App.tsx:102`, `LearnedManager.tsx:181`, `PatchDashboard.tsx:46`, `ObservabilityCenter.tsx:56`, `useChat.ts:35`)
- Server ស្តាប់លើ `127.0.0.1:8787` · Vite dev ប្រើ port 5175 (ត្រូវនឹង CORS លំនាំដើម)

**គម្លាត docs ធៀបនឹងកូដ**
- `POST /api/agent/run`, `POST /api/goals/:id/ideas`, `POST /api/goals/:id/plans` មានក្នុងកូដ តែខ្វះក្នុង docs
- `/api/learned/*` មានក្នុង docs ប៉ុន្តែការស្កេន `app.get(...)` រកមិនឃើញ (ប្រហែលចុះឈ្មោះក្នុង loop) ផ្ទៀងផ្ទាត់ដោយ `GET /api/routes/all`

**ឯកសារ backup ដែលទុក (មិនលុប)**
- `src/README.md.bak-20261025`, `src/README.md.bak2-20261025`, `src/components/OpCard.tsx.bak-20261025`, `src/hooks/useChat.ts.bak-20261025`, `src/lib/inputGuard.ts.bak-20261025`, `docs/API.md.bak-20261025`
- `.bak-*` ចាស់ៗក្នុង `src/` (knowledge, khoem, components ។ល។) ត្រូវបាន `.gitignore` ការពារ

**ច្បាប់ការងារ**
- មិនប្រើ `nano` (ប្រើ `cat`, script, patch) · backup មុនកែ · commit/push ម្ដងនៅចុងបាច់ · មិនលុប `.bak-*` ដរាបណាមិនទាន់បញ្ជាក់

### Final verification 2026-10-25
- `npm test`: 80 files / 587 tests ជាប់ទាំងអស់ (129.8s)
- `patch.test.mjs`: 12/12 ជាប់ (14m28s ព្រោះរត់ tsc ពិតក្នុង sandbox) · `sandbox.test.mjs`: 4/4 ជាប់ (172.6s)
- tsc, build, `git diff --check` ស្អាត
- ករណី vitest `Timeout calling "onTaskUpdate"` ពេលរត់រួមជាមួយ build គឺជាការរង់ចាំរបស់ worker (មិនមែន test ធ្លាក់) ហើយ `agentApi.test.mjs` ជាប់ 38/38 ពេលរត់ដាច់ដោយឡែក
- commit `1fb3547`: `docs/API.md` (route `agent/run`, `goals/:id/ideas`, `goals/:id/plans`) និង WORKLOG នេះ

### Localization verify 2026-10-25
- `npm run validate:locales`: PASSED (61 ភាសា, 85 locales, 53 ភាសាមានទិន្នន័យបកប្រែ)
- `npm run check:duplicates`: PASSED
- `npm run verify` (localization): 49/49 tests ជាប់
- `km`: បំពេញ 273/273 (100%) ប៉ុន្តែស្ថានភាពប្រកាសនៅ `draft` (ភាសាដទៃភាគច្រើនជា `review`) ម្ចាស់គម្រោងត្រូវសម្រេចថាត្រូវប្ដូរឬអត់
- 8 ភាសាជា planned-only (មិនទាន់មានទិន្នន័យបកប្រែ)
- ផ្នែកនីមួយៗរបស់ `verify:all` (typecheck, build, test, localization verify) បានរត់ដាច់ដោយឡែក ហើយជាប់ទាំងអស់

## 2026-11-07

**Commits**
- `797307c` លុប `public/ksv-device-guide.html` (គ្មានអ្វីយោង)
- `608af4e` `server.mjs`៖ ចាក់ `KHOEM_API_KEY` តែឱ្យសំណើពី UI ខ្លួនឯង (`isOwnUi`) លើ `/api/patch`, `/api/approvals` និង bridge ធំ
- commit នេះ៖ ធ្វើឱ្យ `LOCKED-FILES.md` ត្រូវនឹង `CODEOWNERS`, បន្ថែមសេវាក្នុង `SYSTEM_MAP.md`, README និង WORKLOG នេះ

**លទ្ធផលត្រួតពិនិត្យ**
- `npx tsc --noEmit`: ជាប់ · `npm test`: 83 files / 619 tests ជាប់ទាំងអស់ (157s)
- ផ្ទៀងផ្ទាត់ផ្ទាល់ក្រោយកែ `server.mjs`៖ `POST /api/approvals/x/execute` គ្មាន Origin → 401, ជាមួយ Origin `http://localhost:5175` → 404 (id មិនមាន)
- Pre-push safety check ជាប់ទាំង ៤

**នៅសល់ (មិនទាន់ធ្វើ)**
- `eval/q200_raw/` មាន 116 ឯកសារទទេ (0 byte) ហើយត្រូវបាន track ទោះមានក្នុង `.gitignore`; `q200.txt` មាន 200 សំណួរ
- comment ជាភាសាខ្មែរក្នុងកូដ ~275 បន្ទាត់ ក្នុង 42 ឯកសារ
- `@khoem-ai/localization`, `ai.sh` និង `vite.config.ts` ពឹងលើថតក្រៅ repo (`~/KHOEM_AI`, `~/KSV`)
