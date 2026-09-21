cd ~/ai-project
ls README.md AI/README.md 2>/dev/null
cat > README.md << 'EOF'
# KHOEM-AI

ខួរ AI ផ្ទាល់ខ្លួន ដែលសាងសង់ និងដំណើរការទាំងស្រុងលើទូរស័ព្ទ (Termux)។
ប្រព័ន្ធនេះ **មិនហៅ API របស់អ្នកដទៃ** ឡើយ ចម្លើយទាំងអស់មកពីខួរ `khoem` ដែលសរសេរដោយខ្លួនឯង។

> **ស្ថានភាព៖** ជាមូលដ្ឋានដំបូង (ផ្អែកលើច្បាប់) នៅតូច និងមិនទាន់ជា AGI ទេ។
> គោលដៅរយៈពេលវែង គឺបន្ថែមសមត្ថភាពបន្តិចម្តងៗ។

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
| POST | `/api/chat` | ទេ | សន្ទនា (app ប្រើ) |
| GET | `/api/scan` | បាទ/ចាស | ស្កេនកូដ |
| GET | `/api/check` | បាទ/ចាស | ពិនិត្យបញ្ហា |
| GET | `/api/learned` | បាទ/ចាស | បញ្ជីអ្វីដែលបានរៀន |
| GET | `/api/funcs?file=` | បាទ/ចាស | បញ្ជី function |
| GET | `/api/read?file=` | បាទ/ចាស | អានឯកសារ |
| GET | `/api/find?q=` | បាទ/ចាស | ស្វែងរកពាក្យ |
| POST | `/api/learn` | បាទ/ចាស | បង្រៀន (JSON: `q`, `a`) |
| POST | `/api/forget` | បាទ/ចាស | ឱ្យភ្លេច (JSON: `q`) |

Endpoint ដែលត្រូវការ key ត្រូវដាក់ header `x-api-key`។ ឧទាហរណ៍៖

    cd ~/ai-project/AI
    KEY=$(grep '^KHOEM_API_KEY=' .env | cut -d= -f2)
    curl -s -H "x-api-key: $KEY" "localhost:8787/api/find?q=useChat"

បើមិនមាន key ឬ key ខុស ប្រព័ន្ធឆ្លើយកំហុស `401`។ បើមិនទាន់កំណត់ `KHOEM_API_KEY` ប្រព័ន្ធឆ្លើយ `503`។

## ៨. សុវត្ថិភាព

- ឯកសារ `.env` **មិនត្រូវ** ឡើង GitHub ទេ (ការពារដោយ `.gitignore` ក្នុងថត `ai-project/`)
- កុំបិទភ្ជាប់ខ្លឹមសារ `.env` ឬ key ក្នុងសារជជែក ឬសាធារណៈ
- Endpoint ដែលអានកូដ ត្រូវការ key ទាំងអស់
- `/read` និង `/funcs` អានបានតែក្នុងថត `src/`
- `/find` មិនមើលឯកសារ `.env` និងថតលាក់ទេ
- កុំបើកច្រក 8787 ទៅអ៊ីនធឺណិត ដោយគ្មានការការពារបន្ថែម

## ៩. រចនាសម្ព័ន្ធគម្រោង

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
            │   └── useChat.ts  ភ្ជាប់ទៅ /api/chat
            ├── storage.ts
            ├── types.ts
            └── ai/
                ├── core.mjs    ស្នូលរបស់ AI
                ├── memory.mjs  ការចងចាំក្នុងសន្ទនា
                ├── khoem.mjs   ខួរ ដែលបកប្រែពាក្យបញ្ជា
                ├── tools.mjs   /funcs /check និងបញ្ជីជំនួយ
                ├── learn.mjs   /learn /forget និងការផ្គូផ្គង
                ├── find.mjs    /find
                └── api.mjs     endpoint ដែលការពារដោយ key

## ១០. ការរក្សាទុកកូដលើ GitHub

    cd ~/ai-project
    git add -A
    git commit -m "describe the change"
    git push

បើ `git push` ត្រូវបានបដិសេធ (`fetch first`) សូមទាញកូដថ្មីមកសិន៖

    git pull --ff-only

## ១១. ដែនកំណត់បច្ចុប្បន្ន

- ខួរផ្អែកលើច្បាប់ និងអ្វីដែលបានបង្រៀន វាមិនទាន់យល់ន័យជ្រៅទេ
- ការផ្គូផ្គងសំណួរប្រៀបធៀបអក្សរ មិនមែនការយល់ន័យ
- ការចងចាំសន្ទនានៅក្នុង server បាត់ពេលបិទ (តែអ្វីដែលបានបង្រៀនត្រូវបានរក្សាទុក)
- មិនទាន់ជា AGI ទេ

## ១២. គំនិតសម្រាប់ជំហានបន្ទាប់

ចំណុចទាំងនេះជាគំនិត មិនទាន់បានធ្វើទេ៖

- បង្រៀនសំណួរ-ចម្លើយភាសាខ្មែរឱ្យបានច្រើនជាងនេះ
- ឱ្យខួរស្គាល់ពាក្យខ្មែរ និងបំបែកពាក្យ
- ពង្រីក `/check` ឱ្យរកបញ្ហាបន្ថែម

## ១៣. កំណត់ត្រាការផ្លាស់ប្តូរ

**2026-09-21**

- ដាក់កូដក្នុងថត `AI/` ស៊ុមផ្ទៃមេឃ ផ្កាយភ្លឹបៗ និងឈ្មោះ KHOEM-AI
- ផ្ទាំងចាប់ផ្តើម៖ ចុចប៊ូតុងឱ្យជាប់ ១០ វិនាទី
- ស្គ្រីប `ai.sh` សម្រាប់ចាប់ផ្តើមតែម្តង
- បង្កើតខួរ `khoem` (គ្មាន API) និងពាក្យបញ្ជា `/scan` `/read` `/funcs` `/check` `/find` `/help` `/learn` `/learned` `/forget`
- បង្កើត API ផ្ទាល់ខ្លួន ការពារដោយ key
- លុបកូដដែលហៅ API របស់អ្នកដទៃ
- ប្តូរសំឡេងខួរទៅជាភាសាគួរសមនិងគោរព
EOF
wc -l README.md
head -8 README.md

git add -A
git commit -m "Rewrite README in Khmer"
git push
