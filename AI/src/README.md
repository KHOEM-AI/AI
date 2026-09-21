KHOEM AI — MASTER IMPLEMENTATION SPEC
=====================================

PROJECT GOAL
------------
Upgrade the current KHOEM AI system from a UI status dashboard into a
real backend-driven AI Core observability and state architecture.

IMPORTANT:
This is an AGI-oriented architecture, NOT a claim that the system is AGI.

The system must report real state from the backend.
DO NOT fake READY/ONLINE values just to make the UI look good.

==================================================
0. NON-DESTRUCTIVE DEVELOPMENT RULES
==================================================

Before changing ANY file:

1. Inspect the repository structure.
2. Inspect the current Git status.
3. Inspect the existing implementation of:
   - /api/status
   - status.mjs
   - AI Core
   - memory
   - learning
   - knowledge
   - tools
   - model
   - session
   - frontend status UI
4. Identify existing code before creating replacement code.
5. NEVER delete working functionality.
6. NEVER overwrite an existing file blindly.
7. Preserve existing routes and APIs unless a compatibility-safe extension is required.
8. Preserve existing Khmer/English UI.
9. Preserve existing Black 3D UI.
10. Preserve existing /scan /read /funcs /check /help /learn /learned /forget functionality.
11. Do not remove existing features because they are not directly related to this task.
12. If an existing implementation already solves part of this specification, extend it instead of duplicating it.
13. Before modifying a file, create a safe temporary backup if the workflow requires it.
14. Do not use nano.
15. Use shell commands, cat, Python scripts, or automated file editing.
16. Do not commit or push until verification is complete.
17. Never claim success without actually running the relevant tests.

==================================================
1. FIRST: REPOSITORY AUDIT
==================================================

Run and inspect:

pwd
git rev-parse --show-toplevel
git status --short
git branch --show-current
git log --oneline -8

Then inspect:

find . -maxdepth 3 -type f | sort

Locate:

- package.json
- server files
- src/ai/
- status.mjs
- API routes
- frontend status components
- App.tsx
- App.css
- test files
- build configuration

Do NOT modify anything during the audit.

Report:

A. Current backend entry point
B. Current frontend entry point
C. Current /api/status implementation
D. Current health implementation
E. Current AI Core implementation
F. Current memory implementation
G. Current learning implementation
H. Current knowledge implementation
I. Current tools implementation
J. Current model implementation
K. Current session implementation
L. Current frontend status mapping
M. Existing tests
N. Existing gaps

Only after this audit begin implementation.

==================================================
2. TARGET ARCHITECTURE
==================================================

Build the following architecture:

KHOEM AI
│
├── SERVICE HEALTH
│   ├── system
│   ├── api
│   ├── aiCore
│   ├── memory
│   ├── learning
│   ├── knowledge
│   ├── englishBrain
│   ├── khmerBrain
│   ├── tools
│   ├── model
│   └── session
│
├── TASK STATE
│   ├── CREATED
│   ├── QUEUED
│   ├── RUNNING
│   ├── WAITING
│   ├── COMPLETED
│   ├── FAILED
│   ├── CANCELLED
│   └── TIMEOUT
│
├── EXECUTION STATE
│   ├── IDLE
│   ├── PROCESSING
│   ├── TOOL_CALL
│   ├── RETRIEVING
│   ├── LEARNING
│   └── RESPONDING
│
├── COGNITIVE STATE
│   ├── IDLE
│   ├── UNDERSTANDING
│   ├── RETRIEVING
│   ├── PLANNING
│   ├── REASONING
│   ├── VERIFYING
│   └── ANSWERING
│
├── KNOWLEDGE STATE
│   ├── UNKNOWN
│   ├── KNOWN
│   ├── RETRIEVED
│   ├── VERIFIED
│   └── CONFLICTING
│
├── MEMORY STATE
│   ├── EMPTY
│   ├── AVAILABLE
│   ├── RETRIEVING
│   └── SAVING
│
├── CONFIDENCE
│   ├── HIGH
│   ├── MEDIUM
│   ├── LOW
│   └── UNCERTAIN
│
├── VERIFICATION
│   ├── NOT_CHECKED
│   ├── CHECKING
│   ├── VERIFIED
│   └── FAILED
│
├── PROVENANCE
│   ├── source
│   ├── origin
│   ├── createdAt
│   ├── updatedAt
│   ├── version
│   └── verified
│
├── RELIABILITY
│   ├── timeout
│   ├── retry
│   ├── circuitBreaker
│   └── dependencyHealth
│
├── RESOURCE BUDGET
│   ├── time
│   ├── tools
│   ├── retries
│   ├── memory
│   └── tokens
│
└── OBSERVABILITY
    ├── event
    ├── trace
    ├── latency
    ├── errors
    └── metrics

==================================================
3. SINGLE SOURCE OF TRUTH
==================================================

Create or extend a central status/state engine.

Preferred concept:

src/ai/status.mjs

This module must become the single source of truth for backend status.

Do NOT allow the frontend to invent backend status.

Backend determines state.
Frontend renders state.

Architecture:

module
   ↓
status engine
   ↓
/api/status
   ↓
frontend
   ↓
status cards

==================================================
4. SERVICE STATUS MODEL
==================================================

Every service status must support:

{
  "status": "...",
  "reason": "...",
  "lastChecked": "...",
  "lastSuccessfulCheck": "...",
  "responseTime": 123,
  "error": null,
  "version": "...",
  "available": true
}

Fields may be null when unavailable.

Never fabricate data.

If a value cannot be determined:

status = "UNKNOWN"

reason = "Status information unavailable"

==================================================
5. VALID SERVICE STATES
==================================================

Service-level states:

ONLINE
OFFLINE
ERROR
TIMEOUT
UNKNOWN
LOADING
UPDATING
ACTIVE
READY
DEVELOPING
DEGRADED

Use states according to actual meaning.

Do NOT use READY as a generic replacement for every successful service.

Examples:

API:
ONLINE

AI Core:
READY when initialized and usable

Memory:
READY when storage can be accessed

Learning:
READY when learning storage can be read/written

English Brain:
DEVELOPING if the module exists but is still under development

Tools:
READY when tool registry loads successfully

Model:
READY when the configured local model/provider is usable

Session:
READY when session subsystem is operational

==================================================
6. STATUS PRIORITY
==================================================

When aggregating system health:

ERROR
>
OFFLINE
>
TIMEOUT
>
LOADING
>
UPDATING
>
ACTIVE
>
READY
>
DEVELOPING

But do not hide the individual module status.

Example:

system = DEGRADED

because:

API = ONLINE
Memory = READY
Learning = ERROR

==================================================
7. /api/status
==================================================

Implement or extend:

GET /api/status

It must return real status for:

system
api
aiCore
memory
learning
knowledge
englishBrain
khmerBrain
tools
model
session

Example structure:

{
  "ok": true,
  "timestamp": "...",
  "system": {
    "status": "HEALTHY",
    "reason": "...",
    "lastChecked": "...",
    "responseTime": 106
  },
  "services": {
    "api": {},
    "aiCore": {},
    "memory": {},
    "learning": {},
    "knowledge": {},
    "englishBrain": {},
    "khmerBrain": {},
    "tools": {},
    "model": {},
    "session": {}
  }
}

Do not hard-code all services to READY.

==================================================
8. REAL MODULE CHECKS
==================================================

Implement real health/readiness checks.

AI CORE CHECK
-------------
Verify the AI Core module can load and expose its required interface.

Memory CHECK
------------
Verify memory subsystem is initialized and usable.

Learning CHECK
--------------
Verify learned data storage can be accessed safely.

Knowledge CHECK
---------------
Verify knowledge source/module can be loaded and queried.

English Brain CHECK
-------------------
Verify English knowledge/processing module exists and loads.

Khmer Brain CHECK
-----------------
Verify Khmer knowledge/processing module exists and loads.

Tools CHECK
-----------
Verify tool registry loads and required tools exist.

Model CHECK
-----------
Verify current model configuration exists and the configured local model/provider
is available according to the actual implementation.

Session CHECK
-------------
Verify session subsystem is available.

==================================================
9. API HEALTH TIMEOUT
==================================================

Health check timeout:

3000 ms

Default API timeout:

10000 ms

Chat timeout:

30000 ms

Tool timeout:

15000 ms

Learning timeout:

5000 ms

Knowledge timeout:

5000 ms

Status polling interval:

10000 ms

Constants:

API_HEALTH_TIMEOUT_MS = 3000
API_DEFAULT_TIMEOUT_MS = 10000
CHAT_TIMEOUT_MS = 30000
TOOL_TIMEOUT_MS = 15000
LEARN_TIMEOUT_MS = 5000
KNOWLEDGE_TIMEOUT_MS = 5000
STATUS_POLL_INTERVAL_MS = 10000

==================================================
10. TIMEOUT ≠ OFFLINE ≠ ERROR
==================================================

TIMEOUT:
Request did not respond within allowed time.

ERROR:
Request responded but operation failed.

OFFLINE:
Repeated health checks failed.

UNKNOWN:
Insufficient information.

Never convert a single timeout directly into OFFLINE.

Recommended:

health failure count >= 3
→ OFFLINE

successful health check
→ reset failure count

==================================================
11. RETRY POLICY
==================================================

Health checks:

maximum 2 retries

Safe tool operations:

maximum 1 retry

Chat:

do NOT automatically retry operations that could create duplicate side effects.

Learning:

do not duplicate writes.

Knowledge lookup:

safe retry only when operation is read-only.

All retries must be observable in trace/event data.

==================================================
12. TASK STATE MACHINE
==================================================

Create a task state manager.

States:

CREATED
QUEUED
RUNNING
WAITING
COMPLETED
FAILED
CANCELLED
TIMEOUT

Valid flow:

CREATED
  ↓
QUEUED
  ↓
RUNNING
  ↓
COMPLETED

Possible branches:

RUNNING → WAITING → RUNNING
RUNNING → FAILED
RUNNING → TIMEOUT
RUNNING → CANCELLED

Prevent invalid state transitions.

Every transition should include:

{
  "from": "...",
  "to": "...",
  "timestamp": "...",
  "reason": "...",
  "taskId": "..."
}

==================================================
13. EXECUTION STATE
==================================================

Execution states:

IDLE
PROCESSING
TOOL_CALL
RETRIEVING
LEARNING
RESPONDING

Example:

User sends request:

Task:
RUNNING

Execution:
PROCESSING

If knowledge lookup starts:

Execution:
RETRIEVING

If tool runs:

Execution:
TOOL_CALL

If answer is generated:

Execution:
RESPONDING

==================================================
14. COGNITIVE STATE
==================================================

Cognitive states:

IDLE
UNDERSTANDING
RETRIEVING
PLANNING
REASONING
VERIFYING
ANSWERING

This is an architectural state representation.

Do NOT claim it represents actual human-like consciousness.

Example:

Input:
"Explain what KHOEM AI memory does."

State flow:

UNDERSTANDING
→ RETRIEVING
→ REASONING
→ VERIFYING
→ ANSWERING

==================================================
15. KNOWLEDGE STATE
==================================================

States:

UNKNOWN
KNOWN
RETRIEVED
VERIFIED
CONFLICTING

Important:

UNKNOWN must not be interpreted as false.

CONFLICTING means multiple sources disagree.

VERIFIED means verification has actually happened.

Never mark information VERIFIED merely because it came from the model.

==================================================
16. CONFIDENCE
==================================================

Confidence:

HIGH
MEDIUM
LOW
UNCERTAIN

Do not invent confidence values.

Confidence should be based on explicit signals such as:

- source availability
- verification result
- knowledge match
- conflict detection
- retrieval quality
- model certainty if available

If there is not enough evidence:

UNCERTAIN

==================================================
17. PROVENANCE
==================================================

Every learned/knowledge item should be able to track:

{
  "source": "...",
  "origin": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "version": "...",
  "verified": false,
  "confidence": "UNCERTAIN"
}

For learned information:

source = user / system / imported / generated

Never pretend generated information came from an external source.

==================================================
18. VERIFICATION
==================================================

Verification states:

NOT_CHECKED
CHECKING
VERIFIED
FAILED

Example:

Knowledge retrieved
→ RETRIEVED

Verification begins
→ CHECKING

Verification succeeds
→ VERIFIED

Verification fails
→ FAILED

==================================================
19. MEMORY ARCHITECTURE
==================================================

Keep memory separate from knowledge.

Memory:

conversation
session
recent context
learned mappings

Knowledge:

facts
documents
structured knowledge
verified information

Do not automatically treat every conversation message as permanent knowledge.

Learning should require an explicit learning operation or approved process.

Preserve:

/learn
/learned
/forget

==================================================
20. EVENT / TRACE SYSTEM
==================================================

Create an internal event/trace mechanism.

Events should include:

INPUT_RECEIVED
TASK_CREATED
TASK_STARTED
UNDERSTANDING_STARTED
MEMORY_RETRIEVED
KNOWLEDGE_RETRIEVED
PLAN_CREATED
TOOL_CALL_STARTED
TOOL_CALL_COMPLETED
REASONING_STARTED
VERIFICATION_STARTED
VERIFICATION_COMPLETED
RESPONSE_STARTED
RESPONSE_COMPLETED
MEMORY_UPDATED
TASK_COMPLETED
TASK_FAILED
TASK_TIMEOUT

Each event:

{
  "id": "...",
  "taskId": "...",
  "type": "...",
  "timestamp": "...",
  "duration": 123,
  "metadata": {}
}

Do not store sensitive user data unnecessarily.

==================================================
21. RESOURCE BUDGET
==================================================

Every task should be capable of having:

{
  "timeMs": 30000,
  "maxToolCalls": 5,
  "maxRetries": 1,
  "maxMemoryItems": 20,
  "maxTokens": null
}

Prevent infinite loops.

If budget is exhausted:

Task → FAILED or TIMEOUT

Reason must explain why.

==================================================
22. CIRCUIT BREAKER
==================================================

For external or unreliable dependencies support:

CLOSED
OPEN
HALF_OPEN

CLOSED:
normal operation

OPEN:
dependency temporarily blocked after repeated failures

HALF_OPEN:
test whether dependency recovered

Do not implement this for every local module unnecessarily.

Use it where repeated dependency failure can cause cascading problems.

==================================================
23. SYSTEM HEALTH AGGREGATION
==================================================

System health:

HEALTHY
DEGRADED
ERROR
OFFLINE

Example:

All critical services healthy:
HEALTHY

Non-critical service failing:
DEGRADED

Critical service error:
ERROR

Critical infrastructure unavailable:
OFFLINE

The aggregation must be deterministic.

Document which services are critical.

==================================================
24. FRONTEND
==================================================

Keep current Black 3D design.

Do NOT redesign the entire UI.

Fix the current UNKNOWN issue by connecting the UI to the real /api/status response.

Current cards:

AI CORE
MEMORY
LEARNING
KNOWLEDGE
ENGLISH BRAIN
KHMER BRAIN
TOOLS
API
MODEL
SESSION

Each card must display:

- Status
- Khmer explanation
- English explanation
- Reason
- Last checked
- Last successful check
- Response time when available
- Error when available

Do not show fake data.

==================================================
25. UNKNOWN STATE
==================================================

UNKNOWN is a valid state.

Example:

UNKNOWN — មិនទាន់មានព័ត៌មានស្ថានភាព

Reason:

"Status information unavailable"

Do not replace UNKNOWN with READY just because the UI looks better.

==================================================
26. STATUS POLLING
==================================================

Frontend polls:

GET /api/status

every:

10000 ms

Each request timeout:

3000 ms

When polling fails:

Do not instantly mark every service OFFLINE.

Display the last known state where appropriate and indicate:

stale = true

or:

statusAge

Example:

{
  "status": "READY",
  "lastChecked": "...",
  "stale": true
}

==================================================
27. UI STATUS DETAILS
==================================================

For each card provide a compact details area.

Example:

AI CORE
READY

Reason:
AI Core initialized successfully.

Last checked:
22:10:30

Response:
4 ms

Version:
1.0.0

Avoid excessive visual noise.

Keep the existing Black 3D visual language.

==================================================
28. API RESPONSE VALIDATION
==================================================

Validate /api/status response.

Frontend must safely handle:

missing fields
unknown status
malformed JSON
HTTP errors
timeout
network failure

Never crash the UI because one status field is missing.

==================================================
29. BACKWARD COMPATIBILITY
==================================================

Do not break:

POST /api/chat

Existing commands:

/scan
/read
/funcs
/check
/help
/learn
/learned
/forget

Do not break current KHOEM local AI behavior.

Do not remove existing routes.

==================================================
30. ERROR HANDLING
==================================================

All backend status checks must fail safely.

Never allow one broken module to crash /api/status.

Example:

memory check fails

/api/status must still return:

API
AI Core
Learning
Knowledge
Tools
Model
Session

with Memory marked ERROR.

==================================================
31. SECURITY
==================================================

Do not expose:

API keys
environment secrets
tokens
passwords
private filesystem contents

in /api/status.

Do not return raw internal exceptions to users.

Use safe error messages.

Example:

Good:
"Memory storage unavailable"

Bad:
"/home/user/... stack trace ..."

==================================================
32. OBSERVABILITY
==================================================

Track:

request count
success count
error count
timeout count
latency

At minimum expose internal metrics sufficient for debugging.

Do not over-engineer a complete monitoring platform yet.

==================================================
33. TESTING
==================================================

Add tests for:

1. /api/status returns 200
2. /api/status returns all required services
3. no service status is silently fabricated
4. API status is ONLINE when health succeeds
5. timeout is distinct from OFFLINE
6. repeated health failures produce OFFLINE
7. successful health check resets failure count
8. task state transitions
9. invalid task transition rejected
10. execution state transitions
11. cognitive state transitions
12. unknown knowledge remains UNKNOWN
13. verified knowledge becomes VERIFIED only after verification
14. malformed status response does not crash frontend
15. existing /api/chat still works
16. existing learning commands still work
17. existing tools still work

==================================================
34. STATIC VALIDATION
==================================================

Run:

node --check <relevant .mjs files>

Then:

npx tsc --noEmit

Then:

npm run build

or:

vite build

depending on existing project configuration.

Do not modify package configuration unless necessary.

==================================================
35. RUNTIME VALIDATION
==================================================

Start backend.

Verify:

GET /api/health

GET /api/status

POST /api/chat

Verify real responses.

Example:

curl -s http://localhost:8787/api/health

curl -s http://localhost:8787/api/status

Then test chat.

Do not claim runtime success without actually testing it.

==================================================
36. EXPECTED /api/status RESULT
==================================================

After implementation, the current UI should no longer show:

"No status for this module was returned by /api/status"

for modules that actually have working status checks.

Instead it should show real states.

For example:

SYSTEM
HEALTHY

API
ONLINE

AI CORE
READY

MEMORY
READY

LEARNING
READY

KNOWLEDGE
READY

ENGLISH BRAIN
DEVELOPING

KHMER BRAIN
READY

TOOLS
READY

MODEL
READY

SESSION
READY

IMPORTANT:
These are EXAMPLES ONLY.

Use actual runtime state.

==================================================
37. PHASE 2 — AFTER STATUS IS VERIFIED
==================================================

Do NOT start Phase 2 until Phase 1 passes all tests.

Then implement:

TASK STATE
+
EXECUTION STATE
+
COGNITIVE STATE

Architecture:

USER INPUT
   ↓
TASK CREATED
   ↓
UNDERSTANDING
   ↓
MEMORY / KNOWLEDGE RETRIEVAL
   ↓
PLANNING
   ↓
REASONING
   ↓
TOOL EXECUTION
   ↓
VERIFICATION
   ↓
ANSWERING
   ↓
MEMORY UPDATE
   ↓
TASK COMPLETED

Every phase must emit trace events.

==================================================
38. PHASE 3
==================================================

After Phase 2 is stable:

CONFIDENCE
+
PROVENANCE
+
VERIFICATION
+
KNOWLEDGE CONFLICT DETECTION

==================================================
39. PHASE 4
==================================================

After Phase 3:

TIMEOUT
+
RETRY
+
CIRCUIT BREAKER
+
RESOURCE BUDGET
+
DEPENDENCY HEALTH

==================================================
40. PHASE 5
==================================================

After everything above is stable:

METRICS
+
LATENCY
+
ERROR RATE
+
TRACE VIEWER
+
SLO

Do not implement SLO complexity before the core state architecture is stable.

==================================================
41. "STAR 10" ENGINEERING ACCEPTANCE CRITERIA
==================================================

Treat "10 stars" as engineering quality criteria, NOT as a claim of AGI.

10/10 means:

★ 1 — Correctness
Real backend state is reported.

★ 2 — Reliability
Timeouts, failures, retries and degradation are handled safely.

★ 3 — Observability
The system can explain what state it is in and why.

★ 4 — State consistency
Task, execution and cognitive states cannot randomly contradict each other.

★ 5 — Traceability
Important state changes produce trace events.

★ 6 — Verification
Knowledge can distinguish UNKNOWN, RETRIEVED and VERIFIED.

★ 7 — Provenance
Learned/known information can identify origin and timestamps.

★ 8 — Security
Secrets and internal sensitive information are not exposed.

★ 9 — Compatibility
Existing KHOEM features continue working.

★ 10 — Maintainability
Architecture is modular, tested, documented and extensible.

==================================================
42. DO NOT DO THESE THINGS
==================================================

DO NOT:

- fake statuses
- hard-code READY everywhere
- claim AGI
- delete existing modules
- rewrite the entire frontend unnecessarily
- break /api/chat
- remove learning
- remove tools
- expose secrets
- create infinite retry loops
- mark knowledge VERIFIED without verification
- treat UNKNOWN as ERROR
- treat TIMEOUT as OFFLINE
- silently swallow important failures
- duplicate state engines
- create multiple competing sources of truth

==================================================
43. IMPLEMENTATION ORDER
==================================================

Follow exactly:

STEP 1
Audit repository.

STEP 2
Inspect current status.mjs and /api/status.

STEP 3
Design compatibility-safe status schema.

STEP 4
Implement real service checks.

STEP 5
Implement system health aggregation.

STEP 6
Connect frontend to /api/status.

STEP 7
Test backend.

STEP 8
Test frontend/build.

STEP 9
Test existing chat/tools/learning.

STEP 10
Only after Phase 1 passes:
implement Task State.

STEP 11
Implement Execution State.

STEP 12
Implement Cognitive State.

STEP 13
Implement Event/Trace.

STEP 14
Implement Confidence/Provenance.

STEP 15
Implement Verification.

STEP 16
Implement Reliability layer.

STEP 17
Implement Metrics/SLO last.

==================================================
44. FINAL REPORT FORMAT
==================================================

At the end report:

FILES INSPECTED
----------------
[list]

FILES CHANGED
-------------
[list]

FILES CREATED
-------------
[list]

API CHANGES
-----------
[list]

STATE ENGINE
------------
[list]

TESTS
-----
[commands + results]

BUILD
-----
[command + result]

RUNTIME
-------
[health result]
[status result]
[chat result]

EXISTING FEATURES VERIFIED
---------------------------
/scan
/read
/funcs
/check
/help
/learn
/learned
/forget

RISKS / REMAINING WORK
----------------------
[list]

DO NOT say "100% complete" unless every acceptance criterion above
has actually been verified.

If something cannot be verified, explicitly mark it:

NOT VERIFIED

==================================================
45. MOST IMPORTANT RULE
==================================================

BUILD THE FOUNDATION FIRST.

Do not chase visual perfection before backend correctness.

The final architecture must be:

REAL STATE
   ↓
STATUS ENGINE
   ↓
TASK ENGINE
   ↓
EXECUTION ENGINE
   ↓
COGNITIVE ENGINE
   ↓
KNOWLEDGE + MEMORY
   ↓
VERIFICATION
   ↓
CONFIDENCE + PROVENANCE
   ↓
RELIABILITY
   ↓
OBSERVABILITY
   ↓
UI

The frontend must visualize the real system,
not simulate a healthy AI.

Start with repository audit now.
Do not modify files until the audit is complete.

Repository Audit
       ↓
/api/status
       ↓
Real Module Checks
       ↓
System Health
       ↓
Frontend Connection
       ↓
Tests
       ↓
Build

TASK
  ↓
EXECUTION
  ↓
COGNITIVE
  ↓
TRACE
  ↓
VERIFICATION
  ↓
CONFIDENCE
  ↓
PROVENANCE

KHOEM AI — MASTER DEVELOPMENT WORK ORDER
=========================================

PROJECT
-------
KHOEM AI

REPOSITORY
----------
~/ai-project/AI

REMOTE
------
https://github.com/KHOEM-AI/AI.git

BRANCH
------
main

MISSION
-------
Continue developing KHOEM AI into a modular, reliable,
observable, AGI-oriented AI system.

IMPORTANT:
"AGI-oriented" means the architecture is designed to support
memory, knowledge, planning, reasoning, tools, verification,
state management, and autonomous task execution.

DO NOT claim that the system is AGI merely because these
architectural components exist.

============================================================
0. ABSOLUTE DEVELOPMENT RULES
============================================================

RULE 1 — INSPECT BEFORE MODIFYING
---------------------------------
Before changing ANY file:

- inspect repository structure
- inspect Git status
- inspect current implementation
- inspect existing routes
- inspect existing AI modules
- inspect frontend
- inspect tests
- inspect README/documentation

Never assume a feature is missing until the code has been checked.

RULE 2 — DO NOT DESTROY EXISTING WORK
--------------------------------------
Never:

- delete existing working files
- replace an existing implementation blindly
- remove existing API routes
- remove existing AI tools
- remove learning functionality
- remove frontend functionality
- remove Khmer/English support
- remove Black 3D UI
- remove existing status functionality
- rewrite the whole project unnecessarily

If something already exists:
EXTEND IT.

RULE 3 — VERIFY BEFORE MODIFYING
---------------------------------
Before modifying a file:

1. inspect it
2. understand its dependencies
3. determine what it currently does
4. identify what must be preserved
5. make the smallest safe change

RULE 4 — NO FAKE STATUS
-----------------------
Never hard-code:

READY
ONLINE
HEALTHY
VERIFIED
HIGH CONFIDENCE

just to make the UI look good.

Every status must come from real runtime information.

If information is unavailable:

UNKNOWN

RULE 5 — BACKWARD COMPATIBILITY
--------------------------------
Existing functionality must continue working.

Preserve:

/scan
/read
/funcs
/check
/help
/learn
/learned
/forget

Preserve:

POST /api/chat

Preserve existing health endpoint.

Preserve existing frontend.

RULE 6 — DO NOT USE NANO
-------------------------
Use:

cat
Python
shell commands
automated editing
existing coding tools

Do not use nano.

RULE 7 — TEST EVERYTHING
------------------------
Never say:

"done"
"complete"
"100%"
"working"

unless the relevant implementation was actually tested.

============================================================
1. CURRENT REPOSITORY SITUATION
============================================================

The repository has already been pushed successfully.

Recent synchronization showed:

origin/main
→ 759287c ID_AI_369_400_401

Then:

git pull --rebase origin main
git push

completed successfully.

Current remote advanced to:

a0565ed

There is also a newly added README:

AI/src/README.md

approximately:

1559 lines

IMPORTANT:
Read this README before making architecture changes.

Do not delete or rewrite the README unnecessarily.

Use it as project documentation.

============================================================
2. CURRENT FRONTEND STATUS
============================================================

The current Black 3D status UI already exists.

Current cards include:

AI CORE
MEMORY
LEARNING
KNOWLEDGE
ENGLISH BRAIN
KHMER BRAIN
TOOLS
API
MODEL
SESSION

Current observed behavior:

API
→ ONLINE
→ HTTP 200
→ response time around 106 ms

But many other modules currently show:

UNKNOWN

with:

"No status for this module was returned by /api/status"

This does NOT automatically mean those modules are broken.

It means the backend status endpoint is not currently returning
module-level status for them.

Therefore:

DO NOT start by redesigning the UI.

First fix the backend status architecture.

============================================================
3. PRIMARY OBJECTIVE
============================================================

Build a real backend-driven Status Engine.

Architecture:

MODULES
   ↓
STATUS ENGINE
   ↓
/api/status
   ↓
FRONTEND
   ↓
STATUS CARDS

Backend is the source of truth.

Frontend only displays backend state.

============================================================
4. FIRST STEP — FULL REPOSITORY AUDIT
============================================================

Before coding, run:

cd ~/ai-project/AI

pwd

git rev-parse --show-toplevel

git status --short

git branch --show-current

git log --oneline -12

git remote -v

Then inspect:

find . -maxdepth 3 -type f | sort

Also inspect:

package.json

src/
src/ai/
server files
API routes
frontend files
tests
configuration
README

Read:

AI/src/README.md

if that path exists relative to the repository root.

DO NOT MODIFY FILES DURING THIS AUDIT.

Produce an audit report containing:

1. backend entry point
2. frontend entry point
3. /api/health implementation
4. /api/status implementation
5. status.mjs location
6. AI Core location
7. memory implementation
8. learning implementation
9. knowledge implementation
10. English Brain implementation
11. Khmer Brain implementation
12. tools implementation
13. model implementation
14. session implementation
15. /api/chat implementation
16. frontend status component
17. existing tests
18. existing build command
19. existing dev command
20. existing gaps

Only after the audit is complete may implementation begin.

============================================================
5. TARGET ARCHITECTURE
============================================================

Build the architecture in layers.

KHOEM AI
│
├── 01 SERVICE HEALTH
│
├── 02 TASK STATE
│
├── 03 EXECUTION STATE
│
├── 04 COGNITIVE STATE
│
├── 05 MEMORY
│
├── 06 KNOWLEDGE
│
├── 07 PLANNING
│
├── 08 REASONING
│
├── 09 VERIFICATION
│
├── 10 CONFIDENCE
│
├── 11 PROVENANCE
│
├── 12 RELIABILITY
│
├── 13 RESOURCE BUDGET
│
├── 14 EVENT / TRACE
│
└── 15 METRICS / OBSERVABILITY

Do NOT implement everything at once.

Follow the phases defined below.

============================================================
6. PHASE 1 — REAL SERVICE STATUS
============================================================

This is the immediate priority.

Implement or extend:

status engine

and:

GET /api/status

The endpoint must provide real status for:

system
api
aiCore
memory
learning
knowledge
englishBrain
khmerBrain
tools
model
session

Suggested structure:

{
  "ok": true,
  "timestamp": "...",

  "system": {
    "status": "HEALTHY",
    "reason": "...",
    "lastChecked": "...",
    "lastSuccessfulCheck": "...",
    "responseTime": 106
  },

  "services": {

    "api": {
      "status": "...",
      "reason": "...",
      "lastChecked": "...",
      "lastSuccessfulCheck": "...",
      "responseTime": 106
    },

    "aiCore": {},
    "memory": {},
    "learning": {},
    "knowledge": {},
    "englishBrain": {},
    "khmerBrain": {},
    "tools": {},
    "model": {},
    "session": {}

  }
}

Do not require every field to exist when unavailable.

Use null where appropriate.

============================================================
7. SERVICE STATUS MODEL
============================================================

Every service should support:

status
reason
lastChecked
lastSuccessfulCheck
responseTime
error
version
available

Example:

{
  "status": "READY",
  "reason": "AI Core initialized successfully",
  "lastChecked": "2026-09-21T...",
  "lastSuccessfulCheck": "2026-09-21T...",
  "responseTime": 4,
  "error": null,
  "version": "1.0.0",
  "available": true
}

Never fabricate values.

============================================================
8. VALID SERVICE STATES
============================================================

Supported states:

ONLINE
OFFLINE
ERROR
TIMEOUT
UNKNOWN
LOADING
UPDATING
ACTIVE
READY
DEVELOPING
DEGRADED

Meaning:

ONLINE
------
Service is reachable and operating.

READY
-----
Module initialized and usable.

ACTIVE
------
Module is currently executing an operation.

DEVELOPING
----------
Module exists but functionality is still being developed.

LOADING
-------
Initialization is in progress.

UPDATING
--------
Module is being updated.

TIMEOUT
-------
Request did not respond within its configured timeout.

ERROR
-----
Request responded but operation failed.

OFFLINE
-------
Repeated health checks failed.

UNKNOWN
-------
There is not enough information to determine state.

DEGRADED
--------
Partially operational.

============================================================
9. STATUS PRIORITY
============================================================

When aggregating service health:

ERROR
>
OFFLINE
>
TIMEOUT
>
LOADING
>
UPDATING
>
ACTIVE
>
READY
>
DEVELOPING

But do not hide individual module states.

Example:

API = ONLINE
Memory = READY
Learning = ERROR

System:

DEGRADED

============================================================
10. REAL MODULE CHECKS
============================================================

AI CORE
-------
Verify the AI Core can load and expose the required interface.

MEMORY
------
Verify memory subsystem can initialize and perform its required
read/access operation.

LEARNING
--------
Verify learning storage can be safely read/written.

KNOWLEDGE
---------
Verify knowledge subsystem can load and perform its required
read/query operation.

ENGLISH BRAIN
-------------
Verify English knowledge/processing module exists and loads.

KHMER BRAIN
-----------
Verify Khmer knowledge/processing module exists and loads.

TOOLS
-----
Verify tool registry loads.

Verify required tools exist.

MODEL
-----
Verify current KHOEM local model/provider configuration
is actually available according to the current implementation.

SESSION
-------
Verify session subsystem is operational.

API
---
Use real health behavior.

SYSTEM
------
Aggregate actual critical service states.

============================================================
11. TIMEOUT CONSTANTS
============================================================

Use:

API_HEALTH_TIMEOUT_MS = 3000

API_DEFAULT_TIMEOUT_MS = 10000

CHAT_TIMEOUT_MS = 30000

TOOL_TIMEOUT_MS = 15000

LEARN_TIMEOUT_MS = 5000

KNOWLEDGE_TIMEOUT_MS = 5000

STATUS_POLL_INTERVAL_MS = 10000

Reuse existing constants if they already exist.

Do not duplicate configuration unnecessarily.

============================================================
12. TIMEOUT VS ERROR VS OFFLINE
============================================================

TIMEOUT
-------
No response within allowed time.

ERROR
-----
Request responded with failure.

OFFLINE
-------
Repeated health failures.

UNKNOWN
-------
Insufficient information.

A single timeout must NOT automatically become OFFLINE.

Recommended health behavior:

failure count < 3
→ retain appropriate state / TIMEOUT

failure count >= 3
→ OFFLINE

successful health check
→ reset failure count

============================================================
13. RETRY POLICY
============================================================

Health checks:

maximum 2 retries

Safe read-only tool:

maximum 1 retry

Chat:

do not automatically retry if duplicate side effects are possible.

Learning:

do not duplicate writes.

Knowledge:

read-only retry may be used safely.

Every retry must be observable.

============================================================
14. FRONTEND CONNECTION
============================================================

Do not redesign the current Black 3D UI.

Connect it to:

GET /api/status

The UI should show real state.

Remove the current false-looking situation where all modules
show UNKNOWN merely because backend does not return them.

For each card show:

status
reason
last checked
last successful check
response time
error if any
version if available

Maintain Khmer + English text.

Maintain current Black 3D visual language.

============================================================
15. UNKNOWN HANDLING
============================================================

UNKNOWN is valid.

Display:

UNKNOWN — មិនទាន់មានព័ត៌មានស្ថានភាព

Do not convert UNKNOWN to READY.

Do not convert UNKNOWN to ERROR.

============================================================
16. FRONTEND POLLING
============================================================

Poll:

GET /api/status

every:

10000 ms

Each status request:

3000 ms timeout

If polling fails:

do not immediately mark everything OFFLINE.

Use last known state where appropriate.

Indicate stale state.

Possible:

stale: true

statusAge: ...

============================================================
17. SYSTEM HEALTH
============================================================

System states:

HEALTHY
DEGRADED
ERROR
OFFLINE

Define critical services based on the actual architecture.

Do not guess.

Example:

If non-critical module fails:

DEGRADED

If critical infrastructure fails:

ERROR or OFFLINE

Aggregation must be deterministic.

============================================================
18. PHASE 1 ACCEPTANCE CRITERIA
============================================================

Phase 1 is complete only when:

[ ] /api/status returns HTTP 200 during normal operation

[ ] /api/status returns all required service entries

[ ] AI Core has real status

[ ] Memory has real status

[ ] Learning has real status

[ ] Knowledge has real status

[ ] English Brain has real status

[ ] Khmer Brain has real status

[ ] Tools has real status

[ ] Model has real status

[ ] Session has real status

[ ] API has real status

[ ] System has aggregate status

[ ] No fake READY values

[ ] Unknown states are handled safely

[ ] Timeout is distinct from OFFLINE

[ ] Existing /api/chat still works

[ ] Existing tools still work

[ ] Existing learning still works

[ ] TypeScript passes if applicable

[ ] Build passes

============================================================
19. PHASE 2 — TASK ENGINE
============================================================

Only start Phase 2 after Phase 1 passes.

Create a Task State system.

States:

CREATED
QUEUED
RUNNING
WAITING
COMPLETED
FAILED
CANCELLED
TIMEOUT

Valid flow:

CREATED
 ↓
QUEUED
 ↓
RUNNING
 ↓
COMPLETED

Other valid branches:

RUNNING
 ↓
WAITING
 ↓
RUNNING

RUNNING
 ↓
FAILED

RUNNING
 ↓
TIMEOUT

RUNNING
 ↓
CANCELLED

Prevent invalid transitions.

Every task has:

taskId
createdAt
updatedAt
state
reason
metadata

Every state transition has:

from
to
timestamp
reason
taskId

============================================================
20. PHASE 3 — EXECUTION STATE
============================================================

Execution states:

IDLE
PROCESSING
TOOL_CALL
RETRIEVING
LEARNING
RESPONDING

Example:

User input
→ PROCESSING

Knowledge lookup
→ RETRIEVING

Tool execution
→ TOOL_CALL

Learning
→ LEARNING

Answer generation
→ RESPONDING

============================================================
21. PHASE 4 — COGNITIVE STATE
============================================================

Cognitive states:

IDLE
UNDERSTANDING
RETRIEVING
PLANNING
REASONING
VERIFYING
ANSWERING

Example:

INPUT
↓
UNDERSTANDING
↓
RETRIEVING
↓
PLANNING
↓
REASONING
↓
VERIFYING
↓
ANSWERING

Important:

This is an architectural representation of processing stages.

Do not describe this as proof of human-like consciousness or AGI.

============================================================
22. PHASE 5 — MEMORY
============================================================

Keep MEMORY separate from KNOWLEDGE.

MEMORY contains:

conversation
session context
recent context
explicitly learned mappings

KNOWLEDGE contains:

facts
documents
structured information
verified information

Do not automatically convert every conversation into permanent knowledge.

Preserve:

/learn
/learned
/forget

Do not break current learning behavior.

============================================================
23. PHASE 6 — KNOWLEDGE STATE
============================================================

States:

UNKNOWN
KNOWN
RETRIEVED
VERIFIED
CONFLICTING

Important:

UNKNOWN ≠ FALSE

RETRIEVED ≠ VERIFIED

VERIFIED requires an actual verification step.

CONFLICTING means sources disagree.

============================================================
24. PHASE 7 — VERIFICATION
============================================================

States:

NOT_CHECKED
CHECKING
VERIFIED
FAILED

Flow:

UNKNOWN
↓
RETRIEVED
↓
CHECKING
↓
VERIFIED

or:

CHECKING
↓
FAILED

Do not mark information VERIFIED simply because
the model generated it.

============================================================
25. PHASE 8 — CONFIDENCE
============================================================

States:

HIGH
MEDIUM
LOW
UNCERTAIN

Confidence must use real evidence when possible.

Potential signals:

source availability
verification result
knowledge match
conflicting sources
retrieval quality

If evidence is insufficient:

UNCERTAIN

Do not fabricate confidence.

============================================================
26. PHASE 9 — PROVENANCE
============================================================

Knowledge/learned records should support:

source
origin
createdAt
updatedAt
version
verified
confidence

Possible origins:

user
system
imported
generated

Never claim generated information came from an external source.

============================================================
27. PHASE 10 — EVENT / TRACE
============================================================

Create an internal event/trace system.

Events:

INPUT_RECEIVED
TASK_CREATED
TASK_STARTED
UNDERSTANDING_STARTED
MEMORY_RETRIEVED
KNOWLEDGE_RETRIEVED
PLAN_CREATED
TOOL_CALL_STARTED
TOOL_CALL_COMPLETED
REASONING_STARTED
VERIFICATION_STARTED
VERIFICATION_COMPLETED
RESPONSE_STARTED
RESPONSE_COMPLETED
MEMORY_UPDATED
TASK_COMPLETED
TASK_FAILED
TASK_TIMEOUT

Event structure:

{
  "id": "...",
  "taskId": "...",
  "type": "...",
  "timestamp": "...",
  "duration": 123,
  "metadata": {}
}

Do not unnecessarily store sensitive user data.

============================================================
28. PHASE 11 — RESOURCE BUDGET
============================================================

Support task budgets:

{
  "timeMs": 30000,
  "maxToolCalls": 5,
  "maxRetries": 1,
  "maxMemoryItems": 20,
  "maxTokens": null
}

Prevent infinite loops.

If budget is exhausted:

FAILED

or:

TIMEOUT

with an explicit reason.

============================================================
29. PHASE 12 — CIRCUIT BREAKER
============================================================

For unreliable dependencies implement:

CLOSED
OPEN
HALF_OPEN

CLOSED:
normal

OPEN:
temporarily stop requests after repeated failures

HALF_OPEN:
test recovery

Do not add circuit breakers everywhere unnecessarily.

Use them where repeated dependency failure can cause cascading
failures.

============================================================
30. PHASE 13 — OBSERVABILITY
============================================================

Track at minimum:

request count
success count
error count
timeout count
latency

Later support:

P50
P95
P99

Do not build an unnecessarily complicated monitoring platform
before the core architecture is stable.

============================================================
31. SECURITY
============================================================

Never expose through /api/status:

API keys
tokens
passwords
environment secrets
private filesystem contents
raw sensitive exceptions

Use safe error messages.

Good:

"Memory storage unavailable"

Bad:

full stack trace
private path
secret value

============================================================
32. ERROR ISOLATION
============================================================

A failed module must NOT crash /api/status.

Example:

Memory check fails.

The response must still contain:

API
AI Core
Learning
Knowledge
English Brain
Khmer Brain
Tools
Model
Session

with Memory:

ERROR

or appropriate real state.

============================================================
33. API COMPATIBILITY
============================================================

Preserve:

GET /api/health

GET /api/status

POST /api/chat

and all current endpoints.

Do not rename existing endpoints unless absolutely necessary.

If an API extension is required:

make it backward compatible.

============================================================
34. EXISTING KHOEM AI FEATURES
============================================================

After modifications verify:

/scan
/read
/funcs
/check
/help
/learn
/learned
/forget

Also verify:

POST /api/chat

Existing local KHOEM AI behavior must continue.

============================================================
35. TESTING REQUIREMENTS
============================================================

Test:

1. /api/health returns 200

2. /api/status returns 200

3. /api/status contains all required modules

4. AI Core status is real

5. Memory status is real

6. Learning status is real

7. Knowledge status is real

8. English Brain status is real

9. Khmer Brain status is real

10. Tools status is real

11. Model status is real

12. Session status is real

13. timeout != offline

14. repeated failure produces offline

15. successful check resets failure count

16. one module failure does not crash /api/status

17. task state transitions work

18. invalid task transition is rejected

19. execution state works

20. cognitive state works

21. knowledge state works

22. verification works

23. confidence does not fabricate evidence

24. provenance is preserved

25. trace events are generated

26. resource limits prevent infinite execution

27. existing /api/chat works

28. existing tools work

29. existing learning works

30. frontend does not crash when status data is missing

============================================================
36. STATIC CHECKS
============================================================

Run the appropriate existing checks.

Examples:

node --check <relevant .mjs>

npx tsc --noEmit

npm run build

or:

vite build

Use the actual scripts from package.json.

Do not invent package scripts.

============================================================
37. RUNTIME CHECKS
============================================================

Start the backend using the project's existing command.

Then test:

curl -s http://localhost:8787/api/health

curl -s http://localhost:8787/api/status

Test:

POST /api/chat

Test existing commands.

Start frontend using the existing command.

Verify the UI.

============================================================
38. GIT SAFETY
============================================================

Before modifications:

git status --short

After implementation:

git status --short

git diff --stat

git diff

Review all changes.

Do not commit unrelated files.

Do not commit secrets.

Do not commit generated junk.

Before commit:

node --check ...
npx tsc --noEmit
npm run build

and runtime tests.

Only after verification:

git add <only intended files>

git commit -m "<appropriate message>"

Then:

git push origin main

After push:

git status --short

git log --oneline -5

Verify:

working tree clean
and
origin/main contains the new commit.

============================================================
39. PHASE ORDER — DO NOT SKIP
============================================================

PHASE 0
-------
Repository audit

↓

PHASE 1
-------
Real Service Status
/api/status
Status Engine

↓

PHASE 2
-------
System Health Aggregation

↓

PHASE 3
-------
Task State

↓

PHASE 4
-------
Execution State

↓

PHASE 5
-------
Cognitive State

↓

PHASE 6
-------
Event / Trace

↓

PHASE 7
-------
Knowledge + Verification

↓

PHASE 8
-------
Confidence + Provenance

↓

PHASE 9
-------
Timeout + Retry

↓

PHASE 10
--------
Circuit Breaker

↓

PHASE 11
--------
Resource Budget

↓

PHASE 12
--------
Metrics / Observability

Do not jump directly to Metrics/SLO.

============================================================
40. STAR-10 ENGINEERING STANDARD
============================================================

Treat "10 stars" as an engineering-quality target.

★ 1 — CORRECTNESS
Real state, not fake state.

★ 2 — RELIABILITY
Safe failure, timeout and retry behavior.

★ 3 — OBSERVABILITY
System can explain its state.

★ 4 — STATE CONSISTENCY
Task/execution/cognitive states are logically consistent.

★ 5 — TRACEABILITY
Important state transitions are traceable.

★ 6 — VERIFICATION
Unknown/retrieved/verified are clearly separated.

★ 7 — PROVENANCE
Knowledge origin and timestamps are preserved.

★ 8 — SECURITY
Secrets and internal sensitive information are protected.

★ 9 — COMPATIBILITY
Existing KHOEM features continue working.

★ 10 — MAINTAINABILITY
Modular, tested, documented and extensible.

============================================================
41. FINAL ARCHITECTURE
============================================================

The final architecture should evolve toward:

USER INPUT
    │
    ▼
TASK ENGINE
    │
    ▼
UNDERSTANDING
    │
    ▼
MEMORY / KNOWLEDGE
    │
    ▼
PLANNING
    │
    ▼
REASONING
    │
    ▼
TOOL EXECUTION
    │
    ▼
VERIFICATION
    │
    ▼
CONFIDENCE
    │
    ▼
RESPONSE
    │
    ▼
MEMORY UPDATE

Control layer:

SERVICE HEALTH
TIMEOUT
RETRY
PERMISSIONS
RESOURCE BUDGET
SAFETY
AUDIT
TRACE
OBSERVABILITY

============================================================
42. FRONTEND ARCHITECTURE
============================================================

Frontend:

Black 3D KHOEM AI UI

must visualize:

SYSTEM HEALTH
SERVICE STATUS
TASK STATE
EXECUTION STATE
COGNITIVE STATE
KNOWLEDGE STATE
MEMORY STATE
CONFIDENCE
VERIFICATION
TRACE

But do not overload the main screen.

Keep the current visual style.

Use details panels/modals for deeper information.

============================================================
43. UI STATUS EXAMPLE
============================================================

Example only:

SYSTEM
HEALTHY

API
ONLINE
HTTP 200
106 ms

AI CORE
READY

MEMORY
READY

LEARNING
READY

KNOWLEDGE
READY

ENGLISH BRAIN
DEVELOPING

KHMER BRAIN
READY

TOOLS
READY

MODEL
READY

SESSION
READY

IMPORTANT:

These are examples.

Use actual runtime results.

============================================================
44. TASK EXAMPLE
============================================================

User:

"ពន្យល់អំពី Memory របស់ KHOEM AI"

System:

TASK
RUNNING

EXECUTION
PROCESSING

COGNITIVE
UNDERSTANDING

Then:

EXECUTION
RETRIEVING

COGNITIVE
RETRIEVING

Then:

COGNITIVE
REASONING

Then:

COGNITIVE
VERIFYING

Then:

EXECUTION
RESPONDING

Finally:

TASK
COMPLETED

COGNITIVE
ANSWERING

============================================================
45. IMPORTANT ARCHITECTURAL PRINCIPLE
============================================================

Do not build a UI that pretends the AI is doing something.

Build backend state first.

Then expose real state.

Then visualize it.

Correct architecture:

REAL MODULE
   ↓
REAL STATE
   ↓
STATUS ENGINE
   ↓
API
   ↓
UI

Not:

UI
↓
fake status
↓
pretend backend

============================================================
46. DOCUMENTATION
============================================================

Update documentation only after implementation is verified.

Document:

- /api/status
- status schema
- state machines
- timeout rules
- retry rules
- task lifecycle
- cognitive state
- verification
- confidence
- provenance
- trace events
- resource budgets

Do not create duplicate documentation if README already contains
the same information.

Extend existing documentation instead.

============================================================
47. FINAL REPORT
============================================================

At the end provide:

REPOSITORY AUDIT
----------------
What was found.

FILES INSPECTED
---------------
List.

FILES CHANGED
-------------
List.

FILES CREATED
-------------
List.

FILES NOT TOUCHED
-----------------
Important preserved files.

API CHANGES
-----------
List.

STATUS ENGINE
-------------
Explain.

TASK ENGINE
-----------
Explain.

EXECUTION STATE
---------------
Explain.

COGNITIVE STATE
---------------
Explain.

VERIFICATION
------------
Explain.

CONFIDENCE
----------
Explain.

PROVENANCE
----------
Explain.

RELIABILITY
-----------
Explain.

TEST RESULTS
------------
Commands and actual results.

BUILD RESULT
------------
Actual result.

RUNTIME RESULT
--------------
/api/health
/api/status
/api/chat

EXISTING FEATURES VERIFIED
---------------------------
/scan
/read
/funcs
/check
/help
/learn
/learned
/forget

GIT STATUS
----------
Actual result.

COMMIT
------
Actual commit hash if committed.

PUSH
----
Actual push result.

REMAINING WORK
--------------
List only.

UNVERIFIED ITEMS
----------------
Explicitly list anything not verified.

============================================================
48. FINAL RULE
============================================================

Do not report:

"100% complete"

unless every relevant acceptance criterion has actually been
executed and verified.

If something is not verified:

write:

NOT VERIFIED

If something is blocked:

write:

BLOCKED

If something already existed:

write:

EXISTING — PRESERVED

If something was improved:

write:

UPDATED

If something was newly created:

write:

CREATED

============================================================
START NOW
============================================================

First perform ONLY the repository audit.

Do not modify files during the audit.

Read the existing README.

Inspect the current /api/status implementation.

Inspect status.mjs.

Inspect AI Core.

Inspect memory.

Inspect learning.

Inspect knowledge.

Inspect tools.

Inspect model.

Inspect session.

Inspect frontend status UI.

Then report the audit.

After the audit, proceed with Phase 1 only.

Do not jump ahead until Phase 1 is tested and verified.

                KHOEM AI
                   │
                   ▼
          ┌─────────────────┐
          │  STATUS ENGINE  │  ← ធ្វើមុនគេ
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │   TASK ENGINE   │
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │ EXECUTION STATE │
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │ COGNITIVE STATE │
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │  EVENT / TRACE  │
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │   VERIFICATION  │
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │ CONFIDENCE +    │
          │ PROVENANCE      │
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │  RELIABILITY    │
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │ METRICS / SLO   │
          └─────────────────┘

AUDIT
  ↓
REAL /api/status
  ↓
SYSTEM HEALTH
  ↓
TASK ENGINE
  ↓
EXECUTION
  ↓
COGNITIVE
  ↓
TRACE
  ↓
VERIFICATION
  ↓
CONFIDENCE
  ↓
PROVENANCE
  ↓
RELIABILITY
  ↓
METRICS
          
