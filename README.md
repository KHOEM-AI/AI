## 🇰🇭 KHOEM-AI

## 🌐 AI

AI PROJECT — MASTER LANGUAGE ARCHITECTURE & IMPLEMENTATION INSTRUCTIONS

0. SCOPE — IMPORTANT

This work is ONLY for the AI Project:

~/ai-project/AI

DO NOT mix this work with:

KSV
KHOEM SMART HOME
KHOEM INDUSTRIAL SYSTEM

The AI Project must be treated as an independent project.

The current objective is to build a scalable Language Architecture supporting both:

1. Human Languages
2. Programming / Code Languages

The main Core is:

src/ai/khoem.mjs

"khoem.mjs" is the Master/Core/Router.

Do NOT turn "khoem.mjs" into a giant language-content file.

---

1. PRIMARY RULE

Before changing anything:

SCAN
↓
UNDERSTAND
↓
VERIFY
↓
PLAN
↓
CHANGE ONLY THE REQUIRED LANGUAGE AREA
↓
TEST
↓
VERIFY FILE LOCATION
↓
GIT STATUS
↓
COMMIT
↓
PUSH TO CORRECT GITHUB LOCATION

Never:

GUESS
↓
CREATE RANDOM FILES
↓
MOVE RANDOM FILES
↓
PUSH

Do not modify unrelated systems while working on Language Architecture.

---

2. DO NOT ASSUME A LANGUAGE IS MISSING

Some programming languages are already implemented.

Therefore:

DO NOT say:

«"JavaScript is missing."»

DO NOT say:

«"Python needs to be created."»

until the project has actually been scanned.

Instead:

Project Scan
↓
Find existing source files
↓
Find language detection/routing logic
↓
Find tests
↓
Find registries
↓
Find documentation
↓
Determine current support

Existing files must be reused when appropriate.

If a useful file already exists:

DO NOT CREATE DUPLICATE FILE

Instead:

inspect
↓
repair
↓
refactor if necessary
↓
connect to the correct Center
↓
test

Only create a new file when the required capability genuinely does not exist.

---

3. HUMAN LANGUAGE COVERAGE

The Human Language architecture should be expandable globally.

Priority groups:

Core / Priority Languages

Khmer — km / kh
English — en
Chinese / Mandarin — zh
Thai — th
Japanese — ja
Korean — ko
Vietnamese — vi
Indonesian — id
Malay — ms
Filipino / Tagalog — fil
Lao — lo
Burmese — my
Hindi — hi
Bengali — bn
Urdu — ur
Tamil — ta
Telugu — te
Marathi — mr
Gujarati — gu
Punjabi — pa
Arabic — ar
Persian — fa
Hebrew — he
Turkish — tr
Russian — ru
Ukrainian — uk
Polish — pl
Czech — cs
Slovak — sk
German — de
French — fr
Spanish — es
Portuguese — pt
Italian — it
Dutch — nl
Greek — el
Romanian — ro
Hungarian — hu
Swedish — sv
Danish — da
Norwegian — no
Finnish — fi
Icelandic — is
Swahili — sw
Zulu — zu
Afrikaans — af

This is a starting priority list, NOT a claim that all these languages are already implemented.

The project must determine actual support by scanning the repository.

The architecture must allow additional languages later without changing the Core unnecessarily.

---

4. HUMAN LANGUAGE CATEGORIES

Human languages should be represented through a Language Center.

Conceptually:

Language Center
│
├── Detection
├── Normalization
├── Routing
├── Retrieval
├── Interpretation
├── Explanation
└── Response

Do not put all language content into:

khoem.mjs

Instead:

khoem.mjs
    ↓
Language Center
    ↓
specific language module

Example:

Khmer request
    ↓
Language Center
    ↓
Khmer module

Chinese request
    ↓
Language Center
    ↓
Chinese module

---

5. PROGRAMMING / CODE LANGUAGE COVERAGE

The Code Language architecture should be expandable.

Priority languages include:

JavaScript
TypeScript
Python
Java
C
C++
C#
Go
Rust
PHP
Ruby
Swift
Kotlin
Dart
Lua
R
Scala
Objective-C
Perl
Haskell
Elixir
Erlang
Julia
Fortran
COBOL
Assembly
MATLAB
Groovy
PowerShell
Visual Basic / VB.NET

Again:

DO NOT assume these are missing.

First scan the project.

---

6. MARKUP LANGUAGES

Important markup/document languages include:

HTML
XML
SVG
Markdown
LaTeX
XHTML
YAML
TOML

Some of these may overlap with configuration/data formats.

Classification should be based on actual language semantics and project usage rather than forcing everything into one category.

---

7. QUERY LANGUAGES

Important query languages include:

SQL
GraphQL
SPARQL
Cypher
Gremlin
PromQL
Datalog

Database-specific SQL dialects may also need recognition later:

PostgreSQL SQL
MySQL SQL
SQLite SQL
T-SQL
PL/SQL

Do not create separate modules for every dialect unless the project actually needs different behavior.

---

8. SHELL / COMMAND LANGUAGES

Important shell/command systems include:

Bash
POSIX sh
Zsh
Fish
PowerShell
Windows CMD / Batch
Tcsh
KornShell

The project is being developed in:

Termux

Therefore Termux/Linux shell behavior must be considered when implementing shell-language detection or testing.

---

9. CONFIGURATION / DATA LANGUAGES

Important formats include:

JSON
JSON5
YAML
TOML
INI
CSV
XML
Protocol Buffers
MessagePack
HCL

These should generally be treated as data/configuration, not executable programming languages.

---

10. DOMAIN-SPECIFIC LANGUAGES

Potential DSL categories include:

Dockerfile syntax
Nginx configuration
Apache configuration
GitHub Actions YAML
Kubernetes YAML
Terraform HCL
SQL dialects
Regex
Cron expressions
Makefile syntax
CMake
Gradle DSL
Maven configuration
GraphQL
PromQL

Do not create a separate module for every DSL immediately.

Use a scalable registry.

---

11. IMPORTANT SECURITY BOUNDARY

The system MUST distinguish:

CODE AS TEXT

from:

CODE EXECUTION

Example:

User:
"Explain this Python code."

This is analysis.

NOT execution.

But:

User:
"Run this Python code."

This is execution.

Execution must pass through the existing security/policy/sandbox/approval architecture.

Downloaded code must NEVER automatically become executable merely because the Language Center detected it.

The flow should be:

Downloaded Content
        ↓
Untrusted Data
        ↓
Parse / Validate
        ↓
Language Detection
        ↓
Analysis
        ↓
Policy / Security
        ↓
Sandbox / Approval
        ↓
Execution ONLY IF AUTHORIZED

---

12. TARGET ARCHITECTURE

Recommended conceptual architecture:

                         KHOEM CORE
                         khoem.mjs
                             │
                             ↓
                    LANGUAGE CENTER
                             │
              ┌──────────────┴──────────────┐
              ↓                             ↓
       HUMAN LANGUAGES                CODE LANGUAGES
              │                             │
      ┌───────┼───────┐              ┌──────┼──────┐
      ↓       ↓       ↓              ↓      ↓      ↓
     KM      EN      ZH             JS     TS     PY
      ↓       ↓       ↓              ↓      ↓      ↓
    ...     ...     ...            ...    ...    ...
              │                             │
              └──────────────┬──────────────┘
                             ↓
                       KNOWLEDGE
                       RETRIEVAL
                             ↓
                        INTERPRET
                             ↓
                      POLICY / SECURITY
                             ↓
                           AUDIT
                             ↓
                         RESPONSE

---

13. KHOEM.MJS RESPONSIBILITY

"khoem.mjs" should be:

MASTER CORE
ROUTER
ORCHESTRATOR

It should NOT contain:

all Khmer content
all Chinese content
all English content
all programming language knowledge
all documentation
all explanations

Instead it should coordinate:

request
↓
detect
↓
route
↓
load required center/module
↓
retrieve
↓
interpret
↓
respond

---

14. LANGUAGE REGISTRY

The architecture should have one authoritative registry describing available language modules.

Conceptually:

Language Registry
│
├── Human
│   ├── km
│   ├── en
│   ├── zh
│   └── ...
│
└── Code
    ├── javascript
    ├── typescript
    ├── python
    └── ...

The registry should answer:

What language is this?
Where is its module?
What category does it belong to?
Is it available?
How should it be loaded?
What capabilities does it provide?

Do not duplicate this information across many unrelated files.

---

15. LAZY LOADING

Language modules should be loaded only when necessary.

Example concept:

Application starts
    ↓
Core loads
    ↓
Registry loads
    ↓
NO need to load every language

Then:

Chinese request
    ↓
load Chinese module

while:

Python request
    ↓
load Python module

This reduces unnecessary startup work and memory usage.

Do not load hundreds of language modules on every request.

---

16. AVOID CIRCULAR DEPENDENCIES

Do NOT create:

Khmer → Chinese → English → Khmer

or:

Language A
   ↓
Language B
   ↓
Core
   ↓
Language A

Preferred:

             KHOEM CORE
                 │
          LANGUAGE CENTER
                 │
       ┌─────────┼─────────┐
       ↓         ↓         ↓
      KM        EN        ZH

Centers communicate through defined interfaces/contracts.

They should not directly control each other's internal state.

---

17. KNOWLEDGE FILES

Knowledge should be separated from executable modules.

Conceptually:

Language Module
      ↓
Knowledge Index
      ↓
Relevant Documents
      ↓
Retrieve only what is needed

Do not make the Core scan every document for every request.

The system should eventually support:

HOT knowledge
WARM knowledge
COLD knowledge

and indexed retrieval.

---

18. PROJECT SCAN — FIRST ACTION

Before writing language code, scan the actual repository.

Start:

cd ~/ai-project/AI

Then inspect:

find src/ai -maxdepth 5 -type f | sort

Inspect broader project structure:

find . -maxdepth 3 -type f | sort

Search language references:

grep -RniE 'javascript|typescript|python|java|c\+\+|csharp|golang|rust|php|ruby|swift|kotlin|dart|sql|bash|shell|html|css|khmer|english|chinese|mandarin|thai' src/ai

Also inspect package configuration and tests before deciding what already exists.

The exact commands may be adjusted after seeing the real project structure.

---

19. WHAT THE SCAN MUST DETERMINE

The scan must produce an inventory:

Language
Category
Existing File
Existing Module
Existing Router
Existing Test
Existing Documentation
Current Status
Needs Repair?
Needs Connection?
Missing?

Example:

Chinese
Human Language
src/ai/chinese.mjs
YES
YES
YES
Needs Core integration verification

This is an example of the inventory format only.

Never fabricate the actual result.

---

20. DO NOT CREATE DUPLICATE FILES

Before:

mkdir
touch
cat > new-file

check whether an equivalent file already exists.

If it exists:

inspect
↓
repair
↓
connect

If it does not exist:

design
↓
create
↓
test
↓
connect

---

21. UNUSED FILES

A file that appears unnecessary must NOT immediately be deleted.

First determine:

Is it imported?
Is it referenced?
Is it tested?
Is it documented?
Is it a backup?
Is it generated?
Is it historical?
Is it required by another module?

Only after verification should deletion be considered.

If deleting:

verify references
↓
remove
↓
run tests
↓
inspect git diff

Never delete blindly.

---

22. TERMUX DEVELOPMENT RULE

Development environment:

Termux

Do NOT instruct the developer to use "nano".

Use command-line inspection/editing methods appropriate to the workflow.

The preferred principle is:

clean code
clean file
clean structure
clean diff

When creating a new file, create it deliberately and verify it immediately.

When modifying an existing file, preserve unrelated code.

---

23. DO NOT ASK UNNECESSARY QUESTIONS

The assistant should not repeatedly ask:

«"Should I do this?"»

when the requested scope and next technical action are already clear.

Instead:

Inspect
↓
Explain what was found
↓
Propose exact change
↓
If the change is potentially destructive or ambiguous, ask for confirmation
↓
Implement
↓
Test

Questions are appropriate when:

- deleting an important file
- changing architecture beyond the requested scope
- changing public API behavior
- changing security behavior
- ambiguity could damage existing functionality

Do NOT ask unnecessary questions for routine inspection, testing, or verification.

---

24. WORK ONE AREA AT A TIME

If the current task is:

LANGUAGE

then work on:

LANGUAGE

Do NOT start modifying:

database
authentication
UI
KSV
industrial system
unrelated APIs

unless the language integration genuinely requires a minimal change there.

The principle is:

Language task
→ inspect language area
→ repair language area
→ test language area
→ verify integration
→ stop

---

25. TESTING

Language routing must eventually have tests for:

language detection
routing
supported language
unsupported language
fallback behavior
lazy loading
module loading failure
human language routing
code language routing
category classification
registry correctness

Also test that:

code-as-text

does NOT automatically become:

code execution

---

26. PERFORMANCE

The objective is:

small Core
+
small initial load
+
lazy language modules
+
indexed knowledge
+
minimal repeated work

Do NOT solve performance by putting everything into one huge file.

Do NOT solve it by loading every language at startup.

---

27. GITHUB RULE

GitHub repository:

https://github.com/KHOEM-AI/AI.git

Before pushing:

check current branch
check current directory
check repository root
check file path
check git status
check diff
check tests

Commands:

pwd
git branch --show-current
git status --short
git diff --check
git diff --stat

Then run the relevant tests.

Only after verification:

git add <correct-files>
git diff --cached --check
git diff --cached --stat
git commit -m "..."
git push origin main

Never:

git add .

blindly when unrelated files may exist.

The correct project directory and correct target folder must be verified before pushing.

---

28. GITHUB DIRECTORY RULE

Files must be committed according to their actual architecture.

For example:

src/ai/khoem.mjs

must remain under:

src/ai/

Language modules must be placed under the agreed language architecture.

Do NOT push files into random folders merely because GitHub accepts the path.

Before adding a new file:

Where does this responsibility belong?
Does that folder already exist?
Does another file already perform this job?
Does the Core know how to reach it?
Are tests located consistently?

---

29. THREE-PASS VERIFICATION

Before any significant change, verify the instruction three times conceptually:

PASS 1 — Scope

Is this actually a Language task?

PASS 2 — Existing System

Does the required file/module already exist?

PASS 3 — Impact

Will this change affect unrelated project functionality?

Only then implement.

---

30. IMPLEMENTATION PHASES

Phase 1 — Inventory

Scan:

files
folders
modules
tests
language references
registries
documentation

Do not modify code.

---

Phase 2 — Language Map

Create the actual map of:

Human Languages
Code Languages
Markup
Query
Shell
Configuration/Data
DSL

Mark each:

EXISTS
PARTIAL
MISSING
UNKNOWN

Only "UNKNOWN" items require further inspection.

---

Phase 3 — Architecture Verification

Determine whether current files already provide:

Core
Language Router
Language Registry
Language Modules
Knowledge Retrieval
Tests

Reuse existing architecture wherever possible.

---

Phase 4 — Minimal Repair

Repair existing modules first.

Do not create replacements unless necessary.

---

Phase 5 — Language Registry

Introduce or repair one authoritative registry if one does not already exist.

---

Phase 6 — Language Center

Connect:

khoem.mjs
    ↓
Language Center
    ↓
Registry
    ↓
Specific Module

---

Phase 7 — Lazy Loading

Implement lazy loading only after routing is stable.

---

Phase 8 — Knowledge Retrieval

Connect language modules to appropriate knowledge sources/indexes without putting all knowledge into Core.

---

Phase 9 — Security Boundary

Verify:

Code text
≠
Code execution

and preserve the existing sandbox/policy/approval system.

---

Phase 10 — Tests

Run targeted language tests first.

Then run the full project suite.

Because the existing project contains expensive sandbox/patch tests, do not unnecessarily run the full suite after every tiny edit.

Use:

targeted test
↓
verify
↓
group related changes
↓
full suite

---

Phase 11 — Git Verification

Before commit:

git status --short
git diff --check
git diff --stat

Confirm:

Only intended Language files changed.
No KSV files changed.
No unrelated files changed.
No secrets changed.
No accidental backup/generated files added.

---

Phase 12 — Commit and Push

Only after all verification:

git add <verified files>
git diff --cached --check
git commit
git push origin main

Then verify:

git status

The working tree should be understood and clean according to the intended workflow.

---

31. FINAL ARCHITECTURE GOAL

The final direction is:

                         KHOEM
                      MASTER CORE
                     khoem.mjs
                          │
                          ↓
                   CENTER REGISTRY
                          │
                          ↓
                  LANGUAGE CENTER
                     /          \
                    /            \
                   ↓              ↓
          HUMAN LANGUAGES     CODE LANGUAGES
              │                   │
        ┌─────┼─────┐       ┌────┼────┐
        ↓     ↓     ↓       ↓    ↓    ↓
       KM    EN    ZH      JS   TS   PY
        │     │     │       │    │    │
        └─────┴─────┴───────┴────┴────┘
                          │
                          ↓
                  KNOWLEDGE INDEX
                          │
                          ↓
                     RETRIEVAL
                          │
                          ↓
                     INTERPRET
                          │
                          ↓
                  POLICY / SECURITY
                          │
                          ↓
                        AUDIT
                          │
                          ↓
                       RESPONSE

The Core remains small.

Languages remain modular.

Knowledge remains separate.

Execution remains protected.

New languages can be added without rewriting the Core.

---

32. MOST IMPORTANT WORKING PRINCIPLE

The assistant must behave like a careful engineering partner:

DO NOT GUESS.
DO NOT DUPLICATE.
DO NOT RANDOMLY MOVE FILES.
DO NOT RANDOMLY DELETE FILES.
DO NOT MIX PROJECTS.
DO NOT MODIFY UNRELATED AREAS.
DO NOT EXECUTE UNTRUSTED CODE.
DO NOT PUSH UNVERIFIED FILES.
DO NOT MAKE THE CORE HUGE.
DO NOT ASK UNNECESSARY QUESTIONS.

Instead:

SCAN
→ UNDERSTAND
→ VERIFY
→ REUSE
→ REPAIR
→ CONNECT
→ TEST
→ REVIEW
→ COMMIT
→ PUSH

When the current task is Language Architecture:

Stay on Language Architecture until that part is verified.

Do not jump to another part of the project simply because another possible improvement is discovered.

The goal is not to create the largest number of files.

The goal is to create a clean, modular, testable, scalable, secure Language System that "khoem.mjs" can control reliably.
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
