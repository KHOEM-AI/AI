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

## API

Base URL: `http://localhost:8787` · ឯកសារលម្អិត: [`docs/API.md`](../docs/API.md) · បញ្ជី route ពិតពេលដំណើរការ: `GET /api/routes/all`

### ការផ្ទៀងផ្ទាត់ (Authentication)

Endpoint ដែលមាន 🔒 ត្រូវការ header `x-api-key: <KHOEM_API_KEY ពី .env>`

```bash
KEY=$(grep '^KHOEM_API_KEY=' .env | cut -d= -f2)
curl -s -H "x-api-key: $KEY" localhost:8787/api/scan
```

| កូដ | អត្ថន័យ |
|---|---|
| `400` | សំណើមិនត្រឹមត្រូវ (ខ្វះ field ចាំបាច់) |
| `401` | `x-api-key` ខុស ឬបាត់ |
| `403` | សកម្មភាពត្រូវបានបដិសេធ (DENY) |
| `404` | រកមិនឃើញ |
| `409` | ស្ថានភាពមិនត្រឹមត្រូវ (ឧ. approve ពីរដង) |
| `503` | `KHOEM_API_KEY` មិនទាន់កំណត់ក្នុង `.env` |

### Permission / Policy

| Risk | អ្វីកើតឡើង |
|---|---|
| LOW / MEDIUM | អនុវត្តភ្លាម |
| HIGH / CRITICAL | ត្រូវការ Human Approval → `202 PENDING_APPROVAL` |
| មិនបានចុះឈ្មោះ | បដិសេធស្វ័យប្រវត្តិ (fail-safe) |

### សាធារណៈ (គ្មាន key)

| Method | Endpoint | ការពន្យល់ |
|---|---|---|
| GET | `/api/health` | ពិនិត្យ server |
| GET | `/api` | ព័ត៌មាន និងបញ្ជី endpoint |
| GET | `/api/models` | បញ្ជីម៉ូដែល |
| GET | `/api/status` | ស្ថានភាពម៉ូឌុល និងសុខភាពរួម |
| GET | `/api/control` | Feed សម្រាប់ Control Center |
| POST | `/api/chat` | ការសន្ទនាចម្បង (បង្កើត Task មួយ) |
| GET | `/api/registry` | Registry |
| GET | `/api/routes/all` | បញ្ជី route ទាំងអស់ |

### ឧបករណ៍កូដ និងចំណេះដឹង 🔒

| Method | Endpoint | ការពន្យល់ | Risk |
|---|---|---|---|
| GET | `/api/scan` | ស្កេនស្ថិតិកូដ | LOW |
| GET | `/api/check` | រកបញ្ហាទូទៅក្នុងកូដ | LOW |
| GET | `/api/find?q=` | ស្វែងរកពាក្យក្នុងកូដ | LOW |
| GET | `/api/funcs?file=` | បញ្ជី function ក្នុងឯកសារ | LOW |
| GET | `/api/read?file=` | អានឯកសារ (តែក្នុង `src/`) | LOW |
| GET | `/api/learned` | បញ្ជីអ្វីដែលបានបង្រៀន | LOW |
| POST | `/api/learn` | បង្រៀនខួរ (`q`, `a`) | MEDIUM |
| POST | `/api/forget` | ឱ្យខួរភ្លេច (`q`) | MEDIUM |

### Audit, Task, Metrics 🔒

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/audit` | `audit.read` |
| GET | `/api/tasks`, `/api/tasks/:id` | `task.read` |
| GET | `/api/metrics` | `metrics.read` |
| GET | `/api/budget`, `/api/budget/:taskId` | `budget.check` |
| POST | `/api/budget/create` | `budget.check` |
| GET | `/api/circuit`, `/api/circuit/:name` | `circuit.check` |

### Human Approval 🔒

| Method | Endpoint | ការពន្យល់ |
|---|---|---|
| GET | `/api/approvals` | បញ្ជី (`?status=`) |
| GET | `/api/approvals/:id` | ព័ត៌មានមួយ |
| POST | `/api/approvals/:id/approve` | អនុម័ត (`decidedBy`, `reason`) |
| POST | `/api/approvals/:id/reject` | បដិសេធ (`decidedBy`, `reason`) |
| POST | `/api/approvals/:id/execute` | ប្រតិបត្តិ (verify ម្ដងទៀតមុនប្រតិបត្តិ) |
| POST | `/api/approvals/test-action` | សាកល្បង action ហានិភ័យខ្ពស់ |

### Code Intelligence, Patch, Sandbox, Verify, Rollback 🔒

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/code/scan` | `code.scan` |
| GET | `/api/code/index`, `symbol`, `symbols`, `dependencies`, `dependents`, `circular`, `findings`, `health` | `code.read` |
| POST | `/api/patch/propose` | `code.proposePatch` |
| GET | `/api/patch/list`, `/api/patch/proposals`, `/api/patch/proposals/:id` | `patch.read` |
| POST | `/api/patch/apply`, `/api/patch/:id/apply` | `code.applyPatch` |
| POST | `/api/patch/:id/approve`, `/api/patch/:id/reject` | `approval.decide` |
| POST | `/api/sandbox/test` | `code.sandboxTest` |
| POST | `/api/verify` | `code.verify` |
| GET | `/api/verify/history`, `/api/verify/last` | `verify.read` |
| POST | `/api/rollback/snapshot` | `rollback.snapshot` |
| GET | `/api/rollback/snapshots`, `/snapshots/:id`, `/plan/:id` | `rollback.plan` |

### System (Kill Switch) 🔒

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/system/kill` | `system.kill` |
| POST | `/api/system/resume` | `system.resume` |
| GET | `/api/system/status` | `system.statusRead` |

### Goals, Plans, Ideas, Experiments 🔒

| Method | Endpoint | Policy |
|---|---|---|
| GET/POST | `/api/goals` | `goal.read` / `goal.create` |
| GET | `/api/goals/:id`, `/api/goals/:id/progress` | `goal.read` |
| POST | `/api/goals/:id/link` | `goal.link` |
| POST | `/api/goals/:id/status` | `goal.setStatus` |
| POST | `/api/goals/:id/ideas`, `/api/goals/:id/plans` | (មើល `/api/routes/all`) |
| GET/POST | `/api/plans`, GET `/api/plans/:id` | `plan.read` / `plan.create` |
| GET/POST | `/api/ideas`, GET `/api/ideas/:id`, `/api/ideas/rank` | `ideas.read` / `ideas.create` |
| GET/POST | `/api/experiments`, GET `/api/experiments/:id` | `experiment.read` / `experiment.create` |
| POST | `/api/experiments/:id/transition` | `experiment.transition` |

### Learned (ចំណេះដឹងដែលបានបង្រៀន) 🔒

| ប្រភេទ | Endpoint (`/api/learned/...`) | Policy |
|---|---|---|
| អាន (GET) | `count`, `keys`, `get`, `exists`, `search`, `match`, `similar`, `suggest`, `starts`, `words`, `page`, `recent`, `random`, `longest`, `shortest`, `by-length`, `duplicates`, `lang-mix`, `validate`, `stats`, `health`, `export`, `export.txt`, `backups`, `backup-diff`, `routes` | `knowledge.readLearned` |
| សរសេរ (POST) | `alias`, `append`, `backup`, `bulk`, `import`, `rename`, `replace`, `update` | `learning.write` |
| លុប / ស្ដារ (POST) | `clean`, `clear`, `forget-bulk`, `forget-prefix`, `prune-backups`, `restore` | `learning.delete` |

### Language, Lexicon, Library, Model 🔒

| Method | Endpoint | ការពន្យល់ |
|---|---|---|
| GET | `/api/khoem/coverage`, `health`, `khmer`, `knowledge`, `languages`, `locales` | ព័ត៌មានភាសា និងចំណេះដឹង |
| POST | `/api/khoem/translate` | បកប្រែ |
| GET/POST | `/api/lexicon`, GET `/api/lexicon/answer`, `/api/lexicon/domains` | វចនានុក្រម |
| GET | `/api/library`, `/api/library/:id`, `/api/library/groups` | Library |
| GET | `/api/model/providers`, `/api/model/route`, `/api/model/routing-history` | `model.route` |
| POST | `/api/self-consistency` | `selfconsistency.run` |
| POST | `/api/selfeval` | `selfeval.run` |

### Tools & Agent 🔒

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/tools`, `/api/tools/find`, `/api/tools/:id/risk` | `tool.find` |
| POST | `/api/tools/:id/execute` | `tool.find` |
| POST | `/api/agent/run` | Agent loop |
| GET | `/api/hub/status` | Hub |

### ឧបករណ៍ច្នៃប្រឌិត (Characters, Assets, Storyboards, Shotlist) 🔒

| Method | Endpoint | ការពន្យល់ |
|---|---|---|
| GET/POST | `/api/characters`, GET `/api/characters/:id` | តួអង្គ |
| POST | `/api/characters/:id/merge` | បញ្ចូលតួអង្គ |
| GET | `/api/characters/:id/prompt`, `/timeline` | prompt និង timeline |
| GET/POST/DELETE | `/api/characters/:id/refs`, DELETE `/refs/:n` | រូបយោង (`characters.read` / `characters.write`) |
| GET/POST | `/api/assets`, GET `/api/assets/pick`, POST `/api/assets/seed` | Assets |
| GET/POST | `/api/storyboards`, GET `/api/storyboards/:id`, `/options`, `/:id/continuity` | Storyboard |
| POST | `/api/storyboards/:id/scenes`, `/scenes/:sc`, `/scenes/:sc/status` | កែ Scene |
| GET | `/api/storyboards/:id/scenes/:sc/prompt` | prompt របស់ Scene |
| POST | `/api/shotlist` | Shotlist (`characters.read`) |

> ប្រសិនបើ endpoint ណាមានក្នុងតារាងនេះ ប៉ុន្តែមិនឆ្លើយតប សូមពិនិត្យ `GET /api/routes/all` ដែលជាប្រភពពិតបំផុត។

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
