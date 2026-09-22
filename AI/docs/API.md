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
