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

