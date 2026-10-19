# KHOEM-AI — API Documentation ពេញលេញ

ឯកសារនេះពន្យល់រាល់ endpoint ទាំងអស់របស់ backend `server.mjs`,
រួមទាំង Permission/Policy Engine, Task Engine, Audit Log, និង
Human Approval Gate ។ គ្រប់ endpoint ត្រូវបានប្រើតាម base URL
`http://localhost:8787` ។

---

## ១. ការផ្ទៀងផ្ទាត់ (Authentication)

Endpoint ដែលមាន 🔒 ត្រូវការ header:

    x-api-key: <តម្លៃពី .env>

ទាញយក key៖

    KEY=$(grep '^KHOEM_API_KEY=' .env | cut -d= -f2)

| លទ្ធផល | អត្ថន័យ |
|---|---|
| `401 Unauthorized` | key ខុស ឬបាត់ |
| `503 Service Unavailable` | `KHOEM_API_KEY` មិនទាន់កំណត់ក្នុង `.env` |

---

## ២. Endpoint សាធារណៈ (គ្មានត្រូវការ key)

### `GET /api/health`
ពិនិត្យស្ថានភាព server ជាមូលដ្ឋាន។

    curl -s localhost:8787/api/health

ត្រឡប់: `{ status, service, port, provider, toolsProtected }`

### `GET /api`
ព័ត៌មានទូទៅ + បញ្ជី endpoint ទាំងអស់។

### `GET /api/models`
បញ្ជីម៉ូដែលដែលកំពុងប្រើ (`khoem-local`)។

### `GET /api/status`
ស្ថានភាពលម្អិតនៃម៉ូឌុលនីមួយៗ (core, model, memory, learning,
knowledge, english, khmer, tools, session) + សុខភាពរួម
(`HEALTHY` / `DEGRADED` / `ERROR` / `OFFLINE`)។

    curl -s localhost:8787/api/status

### `GET /api/control`
Feed សម្រាប់ Control Center — task events ៗចុងក្រោយ, permission
audit, និង approval requests ។ គ្មាន secret នៅក្នុង payload។

    curl -s localhost:8787/api/control

### `POST /api/chat`
ចំណុចសន្ទនាចម្បង (frontend ប្រើ)។

    curl -s -X POST localhost:8787/api/chat \
      -H "Content-Type: application/json" \
      -d '{"messages":[{"role":"user","content":"សួស្ដី"}]}'

រាល់ការហៅ `/api/chat` បង្កើត Task ថ្មីមួយ ហើយឆ្លងកាត់ស្ថានភាព៖

    TASK_CREATED → QUEUED → RUNNING
    → EXECUTION_PROCESSING → COGNITIVE_UNDERSTANDING → ...
    → TASK_COMPLETED (ឬ TASK_FAILED)

---

## ៣. Endpoint ឧបករណ៍ (Tools) — 🔒 ត្រូវការ key

ទាំងអស់នេះកាត់តាម Permission/Policy Engine ជាមុនសិន (មើលផ្នែក ៥)។

| Method | Path | ការពន្យល់ | Permission | Risk |
|---|---|---|---|---|
| GET | `/api/scan` | ស្កេនស្ថិតិកូដក្នុងគម្រោង | `tool.execute` | LOW |
| GET | `/api/check` | រកបញ្ហាទូទៅក្នុងកូដ | `tool.execute` | LOW |
| GET | `/api/learned` | បញ្ជីអ្វីដែលបានបង្រៀន | `knowledge.read` | LOW |
| GET | `/api/find?q=` | ស្វែងរកពាក្យក្នុងកូដ | `file.read` | LOW |
| GET | `/api/funcs?file=` | បញ្ជី function ក្នុងឯកសារ | `file.read` | LOW |
| GET | `/api/read?file=` | អានឯកសារ (តែក្នុង `src/`) | `file.read` | LOW |
| POST | `/api/learn` | បង្រៀនខួរ (JSON: `q`,`a`) | `knowledge.write` | MEDIUM |
| POST | `/api/forget` | ឱ្យខួរភ្លេច (JSON: `q`) | `knowledge.write` | MEDIUM |

ឧទាហរណ៍៖

    curl -s "localhost:8787/api/find?q=useChat" -H "x-api-key: $KEY"
    curl -s -X POST localhost:8787/api/learn \
      -H "x-api-key: $KEY" -H "Content-Type: application/json" \
      -d '{"q":"សួស្ដី","a":"សួស្ដីបង!"}'

---

## ៤. Audit + Tasks — 🔒 ត្រូវការ key

### `GET /api/audit`
កំណត់ត្រា Permission/Policy decision ចុងក្រោយ (default 50)។
រាល់ធាតុមាន: `actor, action, permission, risk, decision, timestamp`។

### `GET /api/tasks`
បញ្ជី task events ។ បន្ថែម `?id=<taskId>` ដើម្បីមើល task មួយជាក់លាក់
ជាមួយ trace ពេញលេញ។

---

## ៥. Permission / Policy Engine

រាល់សកម្មភាពត្រូវឆ្លងកាត់ `policyCheck(action, actor)` ជាមុនសិន៖

    ACTION → PERMISSION CHECK → RISK CLASSIFICATION → DECISION

| Risk | អ្វីកើតឡើង |
|---|---|
| LOW / MEDIUM | អនុវត្តភ្លាម (`DECISION.ALLOW`) |
| HIGH / CRITICAL | ត្រូវការ Human Approval (`DECISION.REQUIRE_APPROVAL`) → `202 PENDING_APPROVAL` |
| មិនបានចុះឈ្មោះ | បដិសេធស្វ័យប្រវត្តិ (`DECISION.DENY`, fail-safe) |

---

## ៦. Human Approval Gate — 🔒 ត្រូវការ key

សម្រាប់សកម្មភាព HIGH/CRITICAL ។ Flow ពេញលេញ៖

    HIGH/CRITICAL action
      → 202 PENDING_APPROVAL (approvalId ត្រូវបានបង្កើត)
      → GET /api/approvals/:id (ពិនិត្យសំណើ)
      → POST /api/approvals/:id/approve   ឬ   /reject
      → (បើ approve) POST /api/approvals/:id/execute
      → executedAt ត្រូវបានកំណត់ (ប្រតិបត្តិបានតែម្តងគត់)

### ស្ថានភាព Approval

    PENDING_APPROVAL ── APPROVED
                     ├── REJECTED
                     └── EXPIRED

ការផ្លាស់ប្តូរផ្សេងទៀត (ឧ. `APPROVED → REJECTED`) ត្រូវបានហាមឃាត់។

### Endpoint

| Method | Path | ការពន្យល់ |
|---|---|---|
| GET | `/api/approvals` | បញ្ជី approval requests ទាំងអស់ (`?status=` filter) |
| GET | `/api/approvals/:id` | ព័ត៌មាន approval មួយ |
| POST | `/api/approvals/:id/approve` | អនុម័ត (JSON: `decidedBy`, `reason`) |
| POST | `/api/approvals/:id/reject` | បដិសេធ (JSON: `decidedBy`, `reason`) |
| POST | `/api/approvals/:id/execute` | ប្រតិបត្តិ — verify ម្តងទៀតភ្លាមៗមុនប្រតិបត្តិ |

### ច្បាប់សុវត្ថិភាព

- អ្នកស្នើសុំ (`requestedBy`) មិនអាចអនុម័តសំណើររបស់ខ្លួនឯង (`SELF_APPROVAL_FORBIDDEN`)
- Approval មានអាយុកាល (TTL) — លើសពេលនោះទៅជា `EXPIRED` ស្វ័យប្រវត្តិ
- ប្រតិបត្តិបានតែម្តងគត់ (`ALREADY_EXECUTED` បើហៅម្តងទៀត)
- បើ policy/permission ផ្លាស់ប្តូរបន្ទាប់ពីស្នើសុំ → approval ចាស់ស្វ័យប្រវត្តិ (`STALE_APPROVAL`)
- មិនទាន់មាន HIGH/CRITICAL tool ពិតប្រាកដទេ — មានតែ mock action
  `approval.test.high-risk` សម្រាប់សាកល្បង pipeline

### ឧទាហរណ៍ពេញលេញ

    # ១. ស្នើសុំ (mock HIGH action)
    curl -s -X POST localhost:8787/api/approvals/test-action -H "x-api-key: $KEY"
    # → {"status":"PENDING_APPROVAL","approvalId":"...","risk":"HIGH",...}

    ID=<approvalId ពី response ខាងលើ>

    # ២. អនុម័ត
    curl -s -X POST localhost:8787/api/approvals/$ID/approve \
      -H "x-api-key: $KEY" -H "Content-Type: application/json" -d '{}'

    # ៣. ប្រតិបត្តិ
    curl -s -X POST localhost:8787/api/approvals/$ID/execute -H "x-api-key: $KEY"

---

## ៧. តារាងកូដកំហុស (Error Codes)

| កូដ | អត្ថន័យ |
|---|---|
| `400` | សំណើមិនត្រឹមត្រូវ (ខ្វះ field ចាំបាច់) |
| `401` | x-api-key ខុស ឬបាត់ |
| `403` | សកម្មភាពមិនត្រូវបានអនុញ្ញាត (DENY) |
| `404` | រកមិនឃើញ (approval ID មិនត្រឹមត្រូវ) |
| `409` | ស្ថានភាពមិនត្រឹមត្រូវ (double-approve, execute-after-reject...) |
| `503` | `KHOEM_API_KEY` មិនទាន់កំណត់ |

---

## ៨. ឯកសារពាក់ព័ន្ធក្នុងកូដ (Source Map)

| ឯកសារ | តួនាទី |
|---|---|
| `server.mjs` | ចុះឈ្មោះ route ទាំងអស់, ចាប់ផ្តើម server |
| `src/ai/api.mjs` | Tool routes + Approval routes, middleware `guard`/`policy` |
| `src/ai/permission.mjs` | Permission Registry, Risk Classification, Audit Log |
| `src/ai/approvals.mjs` | Human Approval Gate — state machine ពេញលេញ |
| `src/ai/tasks.mjs` | Task/Execution/Cognitive state machine + event trace |
| `src/ai/status.mjs` | `/api/status` collector |
| `src/components/ControlCenter.tsx` | UI សម្រាប់ Pending Approvals + Events + Audit |

---

*ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ Phase 14 — Human Approval Gate (VERIFIED)*

---

## បន្ថែម: route ដែលមិនទាន់មានខាងលើ (បង្កើតស្វ័យប្រវត្តិពី `/api/routes/all`)

route ទាំងនេះមានក្នុង backend ពិត។ ជួរ Policy ទាញពី `policy("...")` ក្នុងកូដ (— = គ្មាន policy ឬកំណត់ក្នុងទម្រង់ផ្សេង)។

### api

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api` | — |

### approvals

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/approvals/test-action` | `approval.test.high-risk` |

### assets

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/assets` | — |
| POST | `/api/assets` | — |
| GET | `/api/assets/pick` | — |
| POST | `/api/assets/seed` | — |

### audit

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/audit` | `audit.read` |

### budget

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/budget` | `budget.check` |
| GET | `/api/budget/:taskId` | `budget.check` |
| POST | `/api/budget/create` | `budget.check` |

### characters

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/characters` | — |
| POST | `/api/characters` | — |
| GET | `/api/characters/:id` | — |
| POST | `/api/characters/:id/merge` | — |
| GET | `/api/characters/:id/prompt` | — |
| GET | `/api/characters/:id/refs` | `characters.read` |
| POST | `/api/characters/:id/refs` | `characters.write` |
| DELETE | `/api/characters/:id/refs/:n` | `characters.write` |
| GET | `/api/characters/:id/timeline` | — |

### circuit

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/circuit` | `circuit.check` |
| GET | `/api/circuit/:name` | `circuit.check` |

### code

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/code/circular` | `code.read` |
| GET | `/api/code/dependencies` | `code.read` |
| GET | `/api/code/dependents` | `code.read` |
| GET | `/api/code/findings` | `code.read` |
| GET | `/api/code/health` | `code.read` |
| GET | `/api/code/index` | `code.read` |
| POST | `/api/code/scan` | `code.scan` |
| GET | `/api/code/symbol` | `code.read` |
| GET | `/api/code/symbols` | `code.read` |

### control

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/control` | — |

### experiments

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/experiments` | `experiment.read` |
| POST | `/api/experiments` | `experiment.create` |
| GET | `/api/experiments/:id` | `experiment.read` |
| POST | `/api/experiments/:id/transition` | `experiment.transition` |

### find

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/find` | `tool.find` |

### funcs

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/funcs` | `tool.funcs` |

### goals

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/goals` | `goal.read` |
| POST | `/api/goals` | `goal.create` |
| GET | `/api/goals/:id` | `goal.read` |
| POST | `/api/goals/:id/link` | `goal.link` |
| GET | `/api/goals/:id/progress` | `goal.read` |
| POST | `/api/goals/:id/status` | `goal.setStatus` |

### health

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/health` | — |

### hub

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/hub/status` | — |

### ideas

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/ideas` | `ideas.read` |
| POST | `/api/ideas` | `ideas.create` |
| GET | `/api/ideas/:id` | `ideas.read` |
| GET | `/api/ideas/rank` | `ideas.read` |

### khoem

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/khoem/coverage` | — |
| GET | `/api/khoem/health` | — |
| GET | `/api/khoem/khmer` | — |
| GET | `/api/khoem/knowledge` | — |
| GET | `/api/khoem/languages` | — |
| GET | `/api/khoem/locales` | — |
| POST | `/api/khoem/translate` | — |

### learned

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/learned/alias` | — |
| POST | `/api/learned/append` | — |
| POST | `/api/learned/backup` | — |
| GET | `/api/learned/backup-diff` | — |
| GET | `/api/learned/backups` | — |
| POST | `/api/learned/bulk` | — |
| GET | `/api/learned/by-length` | — |
| POST | `/api/learned/clean` | — |
| POST | `/api/learned/clear` | — |
| GET | `/api/learned/count` | — |
| GET | `/api/learned/duplicates` | — |
| GET | `/api/learned/exists` | — |
| GET | `/api/learned/export` | — |
| GET | `/api/learned/export.txt` | — |
| POST | `/api/learned/forget-bulk` | — |
| POST | `/api/learned/forget-prefix` | — |
| GET | `/api/learned/get` | — |
| GET | `/api/learned/health` | — |
| POST | `/api/learned/import` | — |
| GET | `/api/learned/keys` | — |
| GET | `/api/learned/lang-mix` | — |
| GET | `/api/learned/longest` | — |
| GET | `/api/learned/match` | — |
| GET | `/api/learned/page` | — |
| POST | `/api/learned/prune-backups` | — |
| GET | `/api/learned/random` | — |
| GET | `/api/learned/recent` | — |
| POST | `/api/learned/rename` | — |
| POST | `/api/learned/replace` | — |
| POST | `/api/learned/restore` | — |
| GET | `/api/learned/routes` | — |
| GET | `/api/learned/search` | — |
| GET | `/api/learned/shortest` | — |
| GET | `/api/learned/similar` | — |
| GET | `/api/learned/starts` | — |
| GET | `/api/learned/stats` | — |
| GET | `/api/learned/suggest` | — |
| POST | `/api/learned/update` | — |
| GET | `/api/learned/validate` | — |
| GET | `/api/learned/words` | — |

### lexicon

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/lexicon` | — |
| POST | `/api/lexicon` | — |
| GET | `/api/lexicon/answer` | — |
| GET | `/api/lexicon/domains` | — |

### library

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/library` | — |
| GET | `/api/library/:id` | — |
| GET | `/api/library/groups` | — |

### metrics

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/metrics` | `metrics.read` |

### model

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/model/providers` | `model.route` |
| GET | `/api/model/route` | `model.route` |
| GET | `/api/model/routing-history` | `model.route` |

### models

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/models` | — |

### patch

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/patch/:id/apply` | `code.applyPatch` |
| POST | `/api/patch/:id/approve` | `approval.decide` |
| POST | `/api/patch/:id/reject` | `approval.decide` |
| POST | `/api/patch/apply` | `code.applyPatch` |
| GET | `/api/patch/list` | `patch.read` |
| GET | `/api/patch/proposals` | `patch.read` |
| GET | `/api/patch/proposals/:id` | `patch.read` |
| POST | `/api/patch/propose` | `code.proposePatch` |

### plans

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/plans` | `plan.read` |
| POST | `/api/plans` | `plan.create` |
| GET | `/api/plans/:id` | `plan.read` |

### read

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/read` | `tool.read` |

### registry

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/registry` | — |

### rollback

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/rollback/plan/:id` | `rollback.plan` |
| POST | `/api/rollback/snapshot` | `rollback.snapshot` |
| GET | `/api/rollback/snapshots` | `rollback.plan` |
| GET | `/api/rollback/snapshots/:id` | `rollback.plan` |

### routes

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/routes/all` | — |

### sandbox

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/sandbox/test` | `code.sandboxTest` |

### self-consistency

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/self-consistency` | `selfconsistency.run` |

### selfeval

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/selfeval` | `selfeval.run` |

### shotlist

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/shotlist` | `characters.read` |

### storyboards

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/storyboards` | — |
| POST | `/api/storyboards` | — |
| GET | `/api/storyboards/:id` | — |
| GET | `/api/storyboards/:id/continuity` | — |
| POST | `/api/storyboards/:id/scenes` | — |
| POST | `/api/storyboards/:id/scenes/:sc` | — |
| GET | `/api/storyboards/:id/scenes/:sc/prompt` | — |
| POST | `/api/storyboards/:id/scenes/:sc/status` | — |
| GET | `/api/storyboards/options` | — |

### system

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/system/kill` | `system.kill` |
| POST | `/api/system/resume` | `system.resume` |
| GET | `/api/system/status` | `system.statusRead` |

### tasks

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/tasks` | `task.read` |
| GET | `/api/tasks/:id` | `task.read` |

### tools

| Method | Endpoint | Policy |
|---|---|---|
| GET | `/api/tools` | `tool.find` |
| POST | `/api/tools/:id/execute` | `tool.find` |
| GET | `/api/tools/:id/risk` | `tool.find` |
| GET | `/api/tools/find` | `tool.find` |

### verify

| Method | Endpoint | Policy |
|---|---|---|
| POST | `/api/verify` | `code.verify` |
| GET | `/api/verify/history` | `verify.read` |
| GET | `/api/verify/last` | `verify.read` |

