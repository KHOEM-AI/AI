# KHOEM AI

**KHOEM AI** គឺជាប្រព័ន្ធ AI បែបម៉ូឌុល (modular) ដែលសង្កេតបាន (observable) អាចផ្ទៀងផ្ទាត់បាន (verifiable) និងអាចទុកចិត្តបាន ដោយមានមនុស្សជាអ្នកកាន់សិទ្ធិចុងក្រោយលើសកម្មភាពដែលមានសិទ្ធិពិសេស។ គម្រោងនេះត្រូវបានអភិវឌ្ឍទាំងស្រុងលើទូរស័ព្ទតាមរយៈ Termux។

*KHOEM AI is a modular, observable, verifiable AI system with human authority over privileged actions. It supports Khmer and English, with a Black 3D UI.*

- Repository: `~/ai-project/AI`
- Remote: `https://github.com/KHOEM-AI/AI.git`
- Branch: `main`

---

## គោលការណ៍ចម្បង (Core Principle)

> **CAPABILITY ≠ AUTHORITY**

AI អាចកាន់តែឆ្លាតក្នុងការគិត វែកញែក បង្កើត គ្រោងផែនការ រៀន ស្នើ និងផ្ទៀងផ្ទាត់ ដោយមិនទទួលបានសិទ្ធិអនុវត្តសកម្មភាពពិសេសដោយស្វ័យប្រវត្តិឡើយ។ មនុស្សនៅតែជាព្រំដែនគ្រប់គ្រងចុងក្រោយ។

គម្រោងនេះមានទិសដៅឆ្ពោះទៅរកស្ថាបត្យកម្ម AGI ប៉ុន្តែ **មិនអះអាងថាប្រព័ន្ធនេះជា AGI ទេ** ទោះមានអង្គចងចាំ ផែនការ ឧបករណ៍ ឬស្វ័យភាពក៏ដោយ។

ទិសដៅគោល៖ ស្វ័យភាពច្នៃប្រឌិត + ការគ្រប់គ្រងដោយមនុស្ស + ភាពផ្ទៀងផ្ទាត់ + សុវត្ថិភាព + ភាពទុកចិត្តបាន + ភាពសង្កេតបាន។

---

## មុខងារសំខាន់ៗ (Features)

- **Chat API** (`POST /api/chat`) — រាល់ការសន្ទនាបង្កើត Task មួយ ដែលមានស្ថានភាពតាមដានបាន (`TASK_CREATED → QUEUED → RUNNING → ... → TASK_COMPLETED / TASK_FAILED`)
- **ភាសាខ្មែរ និងអង់គ្លេស** — ម៉ូឌុលភាសាដាច់ដោយឡែក ឆ្លងកាត់ Language Center → Language Registry (មានម៉ូឌុលចិន និងថៃផងដែរ)
- **Permission / Policy Engine** — រាល់ endpoint ឧបករណ៍ត្រូវកាត់តាមការត្រួតពិនិត្យសិទ្ធិ និងកម្រិតហានិភ័យ
- **Human Approval Gate** — សកម្មភាពពិសេសត្រូវការការអនុម័តពីមនុស្ស
- **Audit Log** — កត់ត្រាសកម្មភាព មានខ្សែសង្វាក់ hash (hash chain)
- **Kill Switch និង Rollback** — បញ្ឈប់ និងត្រឡប់ក្រោយបានដោយសុវត្ថិភាព
- **Sandbox, Patch Proposal និង Verification** — សាកល្បងនិងផ្ទៀងផ្ទាត់ការកែកូដមុនអនុវត្ត
- **Learning / Knowledge / RAG** — `/learn`, `/learned`, `/forget` និងការទាញយកចំណេះដឹង
- **Code tools** — `/scan`, `/read`, `/funcs`, `/find`, `/check`, `/help`
- **Storyboard, Shotlist, Video plan, Characters, Assets** — ឧបករណ៍ច្នៃប្រឌិតសម្រាប់ផលិតវីដេអូ
- **Observability** — status, metrics, budget, circuit breaker, drift

---

## ស្ថាបត្យកម្ម (Architecture)

```
server.mjs  (Express API, port 8787)
   └─ API layer (src/ai/api.mjs + *Api.mjs)
        └─ khoem.mjs  (Master / Router / Orchestrator)
             └─ Language Center → Language Registry → Language module
                  └─ Knowledge / Retrieval / Interpretation
                       └─ Policy / Permission → Approval (when required)
                            └─ Execution → Audit → Response
```

ការសន្ទនាមិនចាំបាច់ឆ្លងកាត់ការអនុវត្តជានិច្ចទេ។ ការអនុវត្ត (Execution) ត្រូវបានទៅដល់ លុះត្រាតែសំណើជាសកម្មភាព ហើយបានឆ្លងកាត់ policy, permission, approval និងការត្រួតពិនិត្យសុវត្ថិភាព។

UI i18n (`src/i18n/`) និងស្ថាបត្យកម្មភាសា AI (`src/ai/`) ត្រូវតែដាច់ពីគ្នា។

---

## រចនាសម្ព័ន្ធ folder

| Path | តួនាទី |
|---|---|
| `server.mjs` | Backend Express (port 8787) |
| `src/ai/` | ម៉ូឌុល AI (engine, agent, audit, killswitch, rollback, sandbox, language, tools...) |
| `src/ai/__tests__/` | Tests (vitest) |
| `src/components/` | UI Centers (Control, Patch, Code, Audit/Metrics, Observability, Management, Safety, Tool Registry, Learning, API, Data) |
| `src/i18n/` | ការបកប្រែ UI (`km`, `en`) |
| `src/hooks/`, `src/lib/`, `src/api/` | Frontend logic |
| `eval/` | ការវាយតម្លៃគុណភាព (Khmer questions, q200) |
| `scripts/` | Scripts ថែទាំ និង patches |
| `docs/` | ឯកសារ (API, Master Spec, Language Architecture, Reports) |
| `data/`, `knowledge/` | ទិន្នន័យ runtime និងចំណេះដឹង RAG |
| `data_clean/` | សំណុំទិន្នន័យសម្រាប់ហ្វឹកហ្វឺន (LoRA) |

---

## ចាប់ផ្ដើមប្រើ (Getting Started)

### តម្រូវការ
- Node.js
- ឯកសារ `.env` (ចម្លងពី `.env.example`)

### ការកំណត់ `.env`

| Key | ការពន្យល់ |
|---|---|
| `ANTHROPIC_API_KEY` | key សម្រាប់ model provider |
| `PORT` | port របស់ server (លំនាំដើម 8787) |
| `CORS_ORIGINS` | origin ដែលអនុញ្ញាត (បំបែកដោយក្បៀស) |
| `KHOEM_API_KEY` | key សម្រាប់ endpoint ដែលមាន 🔒 |
| `KHOEM_SANDBOX_NESTED` | ការកំណត់ sandbox |

⚠️ កុំ commit ឯកសារ `.env` ឬបង្ហាញ key សម្ងាត់។

### ពាក្យបញ្ជា

```bash
npm install          # ដំឡើង dependencies
npm run server       # ចាប់ផ្ដើម backend (port 8787)
npm run dev          # ចាប់ផ្ដើម frontend (Vite, port 5175)
npm run build        # tsc + vite build
npm run typecheck    # ពិនិត្យ TypeScript
npm test             # tests លឿន
npm run test:slow    # tests យឺត (patch, sandbox)
npm run test:all     # ទាំងអស់
npm run verify:all   # typecheck + build + test + localization verify
```

> `package.json` ពឹងលើ `@khoem-ai/localization` ពី `../../KHOEM_AI/KHOEM_AI/localization`។ ត្រូវតែមាន folder នោះ។

---

## API សង្ខេប

Base URL: `http://localhost:8787`

**សាធារណៈ**

| Endpoint | ការពន្យល់ |
|---|---|
| `GET /api/health` | ពិនិត្យ server |
| `GET /api` | ព័ត៌មាន និងបញ្ជី endpoint |
| `GET /api/models` | បញ្ជីម៉ូដែល |
| `GET /api/status` | ស្ថានភាពម៉ូឌុលនីមួយៗ និងសុខភាពរួម |
| `GET /api/control` | Feed សម្រាប់ Control Center |
| `POST /api/chat` | ការសន្ទនាចម្បង |
| `GET /api/routes/all` | បញ្ជី route ទាំងអស់ |

**ឧបករណ៍ 🔒** (ត្រូវការ header `x-api-key`)

`/api/scan` · `/api/check` · `/api/learned` · `/api/find?q=` · `/api/funcs?file=` និងផ្សេងទៀត

ឧទាហរណ៍៖

```bash
KEY=$(grep '^KHOEM_API_KEY=' .env | cut -d= -f2)
curl -s -H "x-api-key: $KEY" localhost:8787/api/scan
```

សម្រាប់ព័ត៌មានលម្អិត សូមមើល [`docs/API.md`](../docs/API.md)។

---

## ច្បាប់អភិវឌ្ឍន៍ (Development Contract)

**ពិនិត្យមុន → កែ → សាកល្បង → Commit ចុងក្រោយ**

- ពិនិត្យ code ដែលមានស្រាប់មុនកែ ហើយ **ពង្រីក** វាជំនួសការសរសេរឡើងវិញ
- កុំលុប ឬជំនួសឯកសារដែលកំពុងដំណើរការដោយងងឹតងងុល
- កុំលុប route ឬ tool ដែលមានស្រាប់ (`/learn`, `/learned`, `/forget`, `/scan`, `/read`, `/funcs`, `/check`, `/help`)
- កុំបំបែក `/api/chat` និងការគាំទ្រភាសាខ្មែរ/អង់គ្លេស
- កុំបន្ថយ Permission/Policy ឬរំលង Audit logging
- កុំបង្ហាញ secret ឬអះអាងលទ្ធផលដែលមិនទាន់ផ្ទៀងផ្ទាត់
- កុំប្រើ `git reset --hard` ឬ `git clean -fd` លុះត្រាមានការអនុញ្ញាតច្បាស់លាស់

**Git មុន/ក្រោយកែ**

```bash
git status --short && git branch --show-current && git log --oneline -8   # មុន
git diff --stat && git status --short                                      # ក្រោយ
```

មុន commit៖ build → typecheck → test → ពិនិត្យសុវត្ថិភាព។

---

## ឯកសារបន្ថែម

- [`docs/API.md`](../docs/API.md) — API ពេញលេញ
- [`docs/KHOEM_AI_MASTER_SPEC.md`](../docs/KHOEM_AI_MASTER_SPEC.md) — ស្ថាបត្យកម្មម៉ាស្ទ័រ
- [`docs/LANGUAGE_ARCHITECTURE.md`](../docs/LANGUAGE_ARCHITECTURE.md) — ស្ថាបត្យកម្មភាសា
- [`docs/PHASE_REPORT.md`](../docs/PHASE_REPORT.md) — របាយការណ៍ phase
- [`docs/KHOEM_AI_CONSOLIDATED_SPEC.md`](../docs/KHOEM_AI_CONSOLIDATED_SPEC.md) — Master Architecture + Controlled Autonomy (spec ពេញលេញ ពី README ចាស់)

---

© KHOEM-AI · Khoem Soksivutha
