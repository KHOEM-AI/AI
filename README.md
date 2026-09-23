# KHOEM-AI

ខួរ AI ផ្ទាល់ខ្លួន ដែលសាងសង់ និងដំណើរការទាំងស្រុងលើទូរស័ព្ទ (Termux)។
ប្រព័ន្ធនេះ **មិនហៅ API របស់អ្នកដទៃ** ឡើយ ចម្លើយទាំងអស់មកពីខួរ `khoem` ដែលសរសេរដោយខ្លួនឯង។

> **ស្ថានភាព៖** ជាមូលដ្ឋានដំបូង (ផ្អែកលើច្បាប់) នៅតូច និងមិនទាន់ជា AGI ទេ។
> ឥឡូវនេះមាន Permission/Policy Engine, Task Engine, Audit Log, និង Human Approval Gate
> សម្រាប់សកម្មភាពហានិភ័យខ្ពស់។ គោលដៅរយៈពេលវែង គឺបន្ថែមសមត្ថភាពបន្តិចម្តងៗតាមផែនការ Phase។

## ១. ទិដ្ឋភាពទូទៅ

| ផ្នែក | បច្ចេកវិទ្យា | ច្រក |
|---|---|---|
| ផ្នែកខាងមុខ (Frontend) | Vite + React + TypeScript | 5173 |
| ផ្នែកខាងក្រោយ (Backend) | Node.js + Express (`server.mjs`) | 8787 |
| ខួរ AI | ម៉ូឌុលក្នុង `src/ai/` | គ្មាន |

Vite បញ្ជូនសំណើ `/api` ទៅ `server.mjs` ដោយស្វ័យប្រវត្តិ។

## ២. លក្ខណៈពិសេស

- ផ្ទាំងចាប់ផ្តើម៖ ចុចប៊ូតុងឱ្យជាប់ ១០ វិនាទី ទើបចូលបាន
- ជជែកជាភាសាខ្មែរ ដោយប្រើសំឡេងគួរសមនិងគោរព
- ស្កេនកូដ អានឯកសារ បង្ហាញ function ស្វែងរកពាក្យ និងពិនិត្យបញ្ហាទូទៅ
- រៀនពីអ្វីដែលអ្នកប្រើបង្រៀន (រក្សាទុកក្នុង `~/khoem-learned.json` ក្រៅគម្រោង)
- API ផ្ទាល់ខ្លួន ការពារដោយ key
- **Permission + Policy Engine**៖ រាល់សកម្មភាពត្រូវឆ្លងកាត់ការត្រួតពិនិត្យ permission/risk (LOW/MEDIUM/HIGH/CRITICAL) មុននឹងអនុវត្ត
- **Task Engine**៖ តាមដានស្ថានភាពការងារនីមួយៗ (CREATED→QUEUED→RUNNING→COMPLETED...) ជាមួយ trace event ពេញលេញ
- **Audit Log**៖ កត់ត្រារាល់សកម្មភាព (actor, action, permission, risk, decision, timestamp)
- **Human Approval Gate**៖ សកម្មភាពហានិភ័យខ្ពស់ (HIGH/CRITICAL) ត្រូវរង់ចាំមនុស្សអនុម័តជាមុនសិន ទើបប្រតិបត្តិបាន
- **Control Center**៖ ផ្ទាំងសង្កេត read-only បង្ហាញ Pending Approvals, Task Events, និង Permission Audit ជាមួយប៊ូតុង APPROVE/REJECT

## ៣. តម្រូវការ

- Termux (Android)
- Node.js និង npm
- Git

## ៤. ការដំឡើង (ធ្វើម្តងគត់)

**ជំហាន ១៖ ទាញយកកូដ**

    git clone https://github.com/KHOEM-AI/AI.git ai-project
    cd ai-project/AI
    npm install

**ជំហាន ២៖ បង្កើតឯកសារ `.env` និង key ផ្ទាល់ខ្លួន**

    cp .env.example .env
    printf '\nKHOEM_API_KEY=%s\n' "$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')" >> .env

**ជំហាន ៣៖ បង្កើតពាក្យបញ្ជាខ្លីៗ `ai`**

    echo "alias ai='bash ~/ai-project/AI/ai.sh'" >> ~/.bashrc
    source ~/.bashrc

## ៥. ការប្រើប្រាស់

វាយពាក្យបញ្ជាមួយនេះក្នុង Termux៖

    ai

ពាក្យបញ្ជានេះបើក backend (ច្រក 8787) និង frontend (ច្រក 5173) ព្រមគ្នា។
បន្ទាប់មកបើក **http://localhost:5173** ក្នុងកម្មវិធីរុករក ហើយចុចប៊ូតុងឱ្យជាប់ ១០ វិនាទី។
ចុច `Ctrl+C` ដើម្បីបិទទាំងពីរ។ កំណត់ត្រារបស់ backend នៅក្នុង `~/ai-server.log`។

**របៀបបើកដោយដៃ** (ក្នុងផ្ទាំង Termux ពីរ)៖

    npm run server
    npm run dev

## ៦. ពាក្យបញ្ជារបស់ខួរ

សរសេរក្នុងប្រអប់សន្ទនា៖

| ពាក្យបញ្ជា | ការពន្យល់ | ឧទាហរណ៍ |
|---|---|---|
| `/help` | បង្ហាញបញ្ជីពាក្យបញ្ជា | `/help` |
| `/scan` | ស្កេនកូដក្នុងគម្រោង | `/scan` |
| `/read ឯកសារ` | អាន ៤០ បន្ទាត់ដំបូង (ក្នុង `src/` ប៉ុណ្ណោះ) | `/read src/App.tsx` |
| `/funcs ឯកសារ` | បង្ហាញបញ្ជី function | `/funcs src/Gate.tsx` |
| `/find ពាក្យ` | ស្វែងរកពាក្យក្នុងកូដ | `/find sendMessage` |
| `/check` | រកបញ្ហាទូទៅ | `/check` |
| `/learn សំណួរ = ចម្លើយ` | បង្រៀនខួរ | `/learn សួស្ដី = សួស្ដីបង!` |
| `/learned` | បង្ហាញអ្វីដែលបានរៀន | `/learned` |
| `/forget សំណួរ` | ឱ្យខួរភ្លេច | `/forget សួស្ដី` |

ខួរផ្គូផ្គងសំណួរដែលបានបង្រៀន ទោះសរសេរខុសបន្តិចបន្តួច។
បើស្រដៀងគ្នាកណ្តាល វាសួរបញ្ជាក់ បើស្រដៀងគ្នាខ្លាំង វាឆ្លើយតែម្តង។

## ៧. API

| Method | Path | ត្រូវការ key | ការពន្យល់ |
|---|---|---|---|
| GET | `/api/health` | ទេ | ពិនិត្យស្ថានភាព |
| GET | `/api` | ទេ | ព័ត៌មាន API |
| GET | `/api/models` | ទេ | បញ្ជីម៉ូដែល |
| GET | `/api/status` | ទេ | ស្ថានភាពម៉ូឌុលនីមួយៗ + សុខភាពប្រព័ន្ធ |
| GET | `/api/control` | ទេ | Task events + Audit + Approvals (សម្រាប់ Control Center) |
| POST | `/api/chat` | ទេ | សន្ទនា (app ប្រើ) |
| GET | `/api/scan` | បាទ/ចាស | ស្កេនកូដ |
| GET | `/api/check` | បាទ/ចាស | ពិនិត្យបញ្ហា |
| GET | `/api/learned` | បាទ/ចាស | បញ្ជីអ្វីដែលបានរៀន |
| GET | `/api/funcs?file=` | បាទ/ចាស | បញ្ជី function |
| GET | `/api/read?file=` | បាទ/ចាស | អានឯកសារ |
| GET | `/api/find?q=` | បាទ/ចាស | ស្វែងរកពាក្យ |
| POST | `/api/learn` | បាទ/ចាស | បង្រៀន (JSON: `q`, `a`) |
| POST | `/api/forget` | បាទ/ចាស | ឱ្យភ្លេច (JSON: `q`) |
| GET | `/api/audit` | បាទ/ចាស | បញ្ជី permission audit log |
| GET | `/api/tasks` | បាទ/ចាស | បញ្ជី task events |
| GET | `/api/approvals` | បាទ/ចាស | បញ្ជី approval requests |
| GET | `/api/approvals/:id` | បាទ/ចាស | ព័ត៌មាន approval មួយ |
| POST | `/api/approvals/:id/approve` | បាទ/ចាស | អនុម័ត |
| POST | `/api/approvals/:id/reject` | បាទ/ចាស | បដិសេធ |
| POST | `/api/approvals/:id/execute` | បាទ/ចាស | ប្រតិបត្តិសកម្មភាពដែលអនុម័តរួច |

Endpoint ដែលត្រូវការ key ត្រូវដាក់ header `x-api-key`។ ឧទាហរណ៍៖

    cd ~/ai-project/AI
    KEY=$(grep '^KHOEM_API_KEY=' .env | cut -d= -f2)
    curl -s -H "x-api-key: $KEY" "localhost:8787/api/find?q=useChat"

បើមិនមាន key ឬ key ខុស ប្រព័ន្ធឆ្លើយកំហុស `401`។ បើមិនទាន់កំណត់ `KHOEM_API_KEY` ប្រព័ន្ធឆ្លើយ `503`។

## ៨. ការគ្រប់គ្រងហានិភ័យ (Permission / Policy / Approval)

- រាល់សកម្មភាពត្រូវចុះឈ្មោះក្នុង Permission Registry ជាមួយកម្រិតហានិភ័យ LOW/MEDIUM/HIGH/CRITICAL
- LOW/MEDIUM → អនុវត្តភ្លាម (normal flow)
- HIGH/CRITICAL → ត្រូវរង់ចាំមនុស្សអនុម័ត (`PENDING_APPROVAL`) មុននឹងប្រតិបត្តិ
- Approval request មានអាយុកាលកំណត់ (TTL) ដោយស្វ័យប្រវត្តិប្រសិនបើគ្មានការសម្រេចចិត្ត
- អ្នកស្នើសុំ មិនអាចអនុម័តសំណើររបស់ខ្លួនឯងបានទេ
- មិនអាចអនុម័ត/ប្រតិបត្តិសកម្មភាពដដែលពីរដង
- បើ policy ឬ permission ផ្លាស់ប្តូរបន្ទាប់ពីស្នើសុំ approval នោះនឹងចាស់ (stale) ស្វ័យប្រវត្តិ
- មិនទាន់មាន HIGH/CRITICAL tool ពិតប្រាកដទេ — មានតែ mock action សម្រាប់សាកល្បង pipeline

## ៩. សុវត្ថិភាព

- ឯកសារ `.env` **មិនត្រូវ** ឡើង GitHub ទេ (ការពារដោយ `.gitignore` ក្នុងថត `ai-project/`)
- កុំបិទភ្ជាប់ខ្លឹមសារ `.env` ឬ key ក្នុងសារជជែក ឬសាធារណៈ
- Endpoint ដែលអានកូដ ត្រូវការ key ទាំងអស់
- `/read` និង `/funcs` អានបានតែក្នុងថត `src/`
- `/find` មិនមើលឯកសារ `.env` និងថតលាក់ទេ
- កុំបើកច្រក 8787 ទៅអ៊ីនធឺណិត ដោយគ្មានការការពារបន្ថែម
- Control Center ប្រើ `window.prompt()` សុំ x-api-key ពេលអនុម័ត/បដិសេធ — ជាយន្តការបណ្តោះអាសន្ន មិនមែន session សុវត្ថិភាពពេញលេញ

## ១០. រចនាសម្ព័ន្ធគម្រោង

    ai-project/
    ├── .gitignore
    └── AI/
        ├── ai.sh               ស្គ្រីបចាប់ផ្តើម backend និង frontend
        ├── server.mjs          backend (Express)
        ├── package.json
        ├── vite.config.ts
        ├── index.html
        ├── public/logo.png     ឡូហ្គោ
        └── src/
            ├── main.tsx        ចំណុចចូលរបស់ React
            ├── Gate.tsx        ផ្ទាំងចាប់ផ្តើម (ចុចជាប់ ១០ វិនាទី)
            ├── App.tsx         ផ្ទាំងសន្ទនា
            ├── App.css         រចនាប័ទ្ម
            ├── hooks/
            │   └── useChat.ts        ភ្ជាប់ទៅ /api/chat
            ├── components/
            │   ├── AIStatus.tsx      ផ្ទាំងស្ថានភាព AI
            │   └── ControlCenter.tsx ផ្ទាំង Pending Approvals + Events + Audit
            ├── storage.ts
            ├── types.ts
            └── ai/
                ├── core.mjs        ស្នូលរបស់ AI
                ├── memory.mjs      ការចងចាំក្នុងសន្ទនា
                ├── khoem.mjs       ខួរ ដែលបកប្រែពាក្យបញ្ជា
                ├── tools.mjs       /funcs /check និងបញ្ជីជំនួយ
                ├── learn.mjs       /learn /forget និងការផ្គូផ្គង
                ├── find.mjs        /find
                ├── api.mjs         endpoint ដែលការពារដោយ key
                ├── status.mjs      ស្ថានភាពម៉ូឌុលនីមួយៗ
                ├── tasks.mjs       Task/Execution/Cognitive state machine
                ├── permission.mjs  Permission + Policy Engine
                └── approvals.mjs   Human Approval Gate

## ១១. ការរក្សាទុកកូដលើ GitHub

    cd ~/ai-project
    git add -A
    git commit -m "describe the change"
    git push

បើ `git push` ត្រូវបានបដិសេធ (`fetch first`) សូមទាញកូដថ្មីមកសិន៖

    git pull --no-rebase origin main

## ១២. ដែនកំណត់បច្ចុប្បន្ន

- ខួរផ្អែកលើច្បាប់ និងអ្វីដែលបានបង្រៀន វាមិនទាន់យល់ន័យជ្រៅទេ
- ការផ្គូផ្គងសំណួរប្រៀបធៀបអក្សរ មិនមែនការយល់ន័យ
- ការចងចាំសន្ទនានៅក្នុង server បាត់ពេលបិទ (តែអ្វីដែលបានបង្រៀនត្រូវបានរក្សាទុក)
- មិនទាន់ជា AGI ទេ
- Engine Idea/Planning/Experiment មានតែកត់ត្រា (មិនរក្សាទុកលើ disk ហើយមិនទាន់ភ្ជាប់ Control Center)
- មិនទាន់មាន Kill Switch ឬ Circuit Breaker ពេញលេញទេ

## ១៣. កំណត់ត្រាការផ្លាស់ប្តូរ

**2026-09-24**

- បន្ថែម Idea / Planning / Experiment / Self-Evaluation engines (`ideas.mjs`, `planning.mjs`, `experiments.mjs`, `selfEval.mjs`) ជាមួយ API ដែលមាន key
- ចុះឈ្មោះ action ថ្មី ៨ ក្នុង permission registry (LOW) ហើយបង្កើន policy/permission version ទៅ 2
- `patch.mjs`៖ បន្ថែម staleness guard និងកែ bug ការលុប proposal ចាស់ (`pruneProposals`)
- Tests សរុប 112 (22 ឯកសារ)

**2026-09-22**

- បន្ថែម Permission + Policy Engine (`permission.mjs`) — ចាត់ថ្នាក់ហានិភ័យ LOW/MEDIUM/HIGH/CRITICAL, audit log
- បន្ថែម Task Engine (`tasks.mjs`) — តាមដានស្ថានភាព task/execution/cognitive ជាមួយ trace event
- បន្ថែម Human Approval Gate (`approvals.mjs`) — PENDING_APPROVAL/APPROVED/REJECTED/EXPIRED, verify-before-execute, self-approval forbidden
- បន្ថែម `/api/approvals`, `/api/audit`, `/api/tasks`, `/api/status`, `/api/control`
- បន្ថែម Control Center UI — Pending Approvals, Task Events, Permission Audit

**2026-09-21**

- ដាក់កូដក្នុងថត `AI/` ស៊ុមផ្ទៃមេឃ ផ្កាយភ្លឹបៗ និងឈ្មោះ KHOEM-AI
- ផ្ទាំងចាប់ផ្តើម៖ ចុចប៊ូតុងឱ្យជាប់ ១០ វិនាទី
- ស្គ្រីប `ai.sh` សម្រាប់ចាប់ផ្តើមតែម្តង
- បង្កើតខួរ `khoem` (គ្មាន API) និងពាក្យបញ្ជា `/scan` `/read` `/funcs` `/check` `/find` `/help` `/learn` `/learned` `/forget`
- បង្កើត API ផ្ទាល់ខ្លួន ការពារដោយ key
- លុបកូដដែលហៅ API របស់អ្នកដទៃ
- ប្តូរសំឡេងខួរទៅជាភាសាគួរសមនិងគោរព

## ១៤. Engine ថ្មីៗ (Phase 15 / 16 / 18 / 19)

Engine ទាំងនេះ **គ្រាន់តែកត់ត្រា** ហើយមិនអនុវត្ត ឬអនុម័តអ្វីទេ (`executable: false`)។
ទិន្នន័យនៅក្នុង memory ដូច្នេះបាត់ពេលបិទ server។ រាល់ route ត្រូវការ `x-api-key`
ហើយឆ្លងកាត់ `policy()` (permission registry, audit log និង kill switch)។

| Method | Path | Action (LOW) |
|---|---|---|
| GET | `/api/ideas` | `ideas.read` |
| GET | `/api/ideas/rank` | `ideas.read` |
| POST | `/api/ideas` | `ideas.create` |
| GET | `/api/ideas/:id` | `ideas.read` |
| GET | `/api/plans` | `plan.read` |
| POST | `/api/plans` | `plan.create` |
| GET | `/api/plans/:id` | `plan.read` |
| GET | `/api/experiments` | `experiment.read` |
| POST | `/api/experiments` | `experiment.create` |
| GET | `/api/experiments/:id` | `experiment.read` |
| POST | `/api/experiments/:id/transition` | `experiment.transition` (JSON: `to`, `results`, `metrics`) |
| POST | `/api/selfeval` | `selfeval.run` |

- **Idea**៖ ពិន្ទុ = benefitScore − ហានិភ័យ − ភាពស្មុគស្មាញ (ធំជាងល្អជាង)
- **Plan**៖ ជំហាន HIGH ត្រូវការ approval ហើយ plan ហានិភ័យ MEDIUM ឡើងទៅ ត្រូវមាន `rollbackPlan`
  ចំណែក plan ណាគ្មាន `verificationCriteria` ជា `INVALID`
- **Experiment**៖ CREATED → RUNNING → COMPLETED / FAILED / CANCELLED (ការផ្លាស់ប្តូរផ្សេងត្រូវបដិសេធ `409`)
- **Self-Evaluation**៖ ជាគំនិតប្រឹក្សាតែប៉ុណ្ណោះ បើ test បរាជ័យ ចម្លើយគឺ `FAILED` ជានិច្ច
  ទោះបីអះអាងថាជោគជ័យ

### ម៉ូឌុលផ្សេងទៀតក្នុង `src/ai/`

`sandbox.mjs` (សាកល្បងលើច្បាប់ចម្លងបណ្តោះអាសន្ន) · `patch.mjs` (propose → sandbox → approval → apply
ជាមួយ rollback snapshot និងការពារ patch ចាស់) · `rollback.mjs` (បង្កើតតែផែនការ មិនប្រតិបត្តិដោយខ្លួនឯង) ·
`verification.mjs` · `killswitch.mjs` · `budget.mjs` · `circuitBreaker.mjs` · `metrics.mjs` · `goal.mjs` ·
`modelRouting.mjs` · `audit.mjs`។ Route របស់ម៉ូឌុលទាំងនេះមិនទាន់ចុះក្នុងតារាង API ខាងលើទេ។

### សាកល្បង

    cd ~/ai-project/AI
    npx vitest run

មាន 112 tests (22 ឯកសារ) នៅថ្ងៃ 2026-09-24។ Test ដែលរត់ sandbox ពិតចំណាយពេលយូរ
ដូច្នេះលើទូរស័ព្ទ ការរត់ទាំងអស់ប្រើពេលប្រហែល ៣-៤ នាទី។
