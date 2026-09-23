# KHOEM AI — MASTER ARCHITECTURE + CONTROLLED AUTONOMY
## CONSOLIDATED IMPLEMENTATION SPECIFICATION
*(Merged from 4 source documents — duplicates removed, gaps filled, phase numbering unified)*

---

# PART 0 — PROJECT

- **PROJECT:** KHOEM AI
- **REPOSITORY:** `~/ai-project/AI`
- **REMOTE:** `https://github.com/KHOEM-AI/AI.git`
- **BRANCH:** `main`

## MISSION
Build KHOEM AI as a modular, observable, reliable, creative,
autonomous-capable AI system while keeping human authority over
privileged actions.

**IMPORTANT:** This project is an **AGI-oriented architecture**. It must
NOT claim the system IS AGI merely because it contains memory, planning,
reasoning, tools, autonomy, or cognitive-state representations.

The objective is:

```
CREATIVE AUTONOMY + HUMAN CONTROL + VERIFIABILITY
+ SAFETY + RELIABILITY + OBSERVABILITY
```

## MOST IMPORTANT RULE

**CAPABILITY ≠ AUTHORITY.**

The AI may become better at thinking, reasoning, creating, planning,
learning, simulating, proposing, verifying — without automatically
gaining permission to execute privileged actions. Human authority
remains the final control boundary.

---

# PART 1 — NON-DESTRUCTIVE DEVELOPMENT CONTRACT

**ABSOLUTE RULE:** Inspect first → Modify second → Test third → Commit last.

Before modifying anything, inspect:
repository · Git status · existing architecture · README · current APIs
· current AI modules · frontend · tests · configuration

Never assume something is missing. **If functionality already exists,
EXTEND it. Do NOT rewrite it unnecessarily.**

### Never:
- delete working files
- replace files blindly
- remove existing routes / tools
- remove `/learn`, `/learned`, `/forget`, `/scan`, `/read`, `/funcs`, `/check`, `/help`
- break `/api/chat`
- remove Khmer or English support
- remove Black 3D UI
- expose secrets
- fabricate status
- claim unverified success
- weaken existing Permission/Policy checks
- bypass audit logging
- modify AIStatus unless explicitly required and verified
- use `nano` (use `cat`, Python, shell, safe automated editing instead)

### Git Safety
Before changes: `git status --short` · `git branch --show-current` · `git log --oneline -8`
After changes: `git diff --stat` · `git diff -- <files>` · `git status --short`
Before commit: build → typecheck → runtime tests → security checks. Only then commit.
Never use `git reset --hard`, `git clean -fd`, mass deletion, or blind file replacement
unless explicitly authorized.

---

# PART 2 — TARGET ARCHITECTURE (FULL)

```
KHOEM AI
├── SYSTEM HEALTH               ├── PERMISSION ENGINE
├── AI CORE                     ├── POLICY ENGINE
├── TASK ENGINE                 ├── HUMAN APPROVAL GATE
├── GOAL ENGINE                 ├── SANDBOX
├── EXECUTION ENGINE            ├── EXPERIMENT ENGINE
├── COGNITIVE STATE             ├── VERSION / ROLLBACK
├── MEMORY                      ├── RESOURCE BUDGET
├── KNOWLEDGE                   ├── RELIABILITY
├── LEARNING                    ├── SECURITY
├── IDEATION                    ├── AUDIT / TRACE
├── PLANNING                    ├── OBSERVABILITY
├── REASONING                   └── CONTROL CENTER
├── VERIFICATION
├── SELF-EVALUATION
├── CONFIDENCE
└── PROVENANCE
```

## Core Design Principle
The system must distinguish: **THINK → PLAN → PROPOSE → SIMULATE → EXECUTE**.
These are NOT the same permission. AI may THINK / PLAN / GENERATE IDEAS
without being allowed to EXECUTE.

## Root Authority
```
ROOT AUTHORITY → POLICY → PERMISSION → AI ACTION → EXECUTION
```
The AI must not silently elevate its own permissions. No self-escalation.
No automatic privilege escalation. No bypass of approval gates.

## Autonomy Levels
| Level | Name | Capability |
|---|---|---|
| L0 | OBSERVE | inspect permitted information |
| L1 | THINK | analyze |
| L2 | IDEATE | generate ideas |
| L3 | PLAN | create plans |
| L4 | SIMULATE | test plans in sandbox |
| L5 | PROPOSE | create proposals for human review |
| L6 | EXECUTE | execute explicitly allowed actions |
| L7 | PRIVILEGED | human approval required |

**Default: L3 or lower.** The AI must never self-escalate from L0–L5 to L6/L7.
Permission elevation requires human-controlled policy.

---

# PART 3 — PERMISSION & POLICY ENGINE

## Permission Model
Do not use `canDoEverything = true`. Use explicit permissions, e.g.:
`memory.read/write`, `knowledge.read/write`, `tool.execute`, `file.read/write`,
`code.generate/test`, `network.read`, `external.action`, `system.modify`,
`production.deploy`.

Every action must record: `action, actor, permission, scope, risk, approvalRequired, timestamp`.

## Policy Engine
```
ACTION → POLICY CHECK → PERMISSION CHECK → RISK CHECK → APPROVAL CHECK → EXECUTE
```
Decisions: `ALLOW | DENY | REQUIRE_APPROVAL | SANDBOX_ONLY`.
Never let individual tools invent their own security rules.

## Risk Classification
| Risk | Examples |
|---|---|
| LOW | read-only inspection, safe analysis, sandbox experiment |
| MEDIUM | controlled file changes, non-critical configuration |
| HIGH | production changes, large data modifications, external side effects |
| CRITICAL | privileged system actions, secret/security changes, irreversible operations |

**HIGH and CRITICAL require human approval — no exceptions.**

---

# PART 4 — HUMAN APPROVAL GATE (PHASE 14 — FULL SPEC)

*This section replaces and expands the short "Human Approval Gate" summary
from the original spec §9 with the complete Phase-14 work order.*

## 4.0 Objective
Continue development from the verified current state. Do **not** jump
directly to Idea Engine, Planning Engine, Sandbox, Experiment Engine, or
autonomous HIGH/CRITICAL execution before this gate exists.

**Core principle:**
```
THINK → PLAN → PROPOSE → SIMULATE → REQUEST APPROVAL → EXECUTE
```

## 4.1 Required States
`PENDING_APPROVAL | APPROVED | REJECTED | EXPIRED`

## 4.2 Execution Rule
- LOW → existing normal policy flow
- MEDIUM → existing normal policy flow
- **HIGH → MUST require human approval**
- **CRITICAL → MUST require human approval**

HIGH/CRITICAL actions MUST NEVER execute directly. No hidden bypass.

## 4.3 Approval Request Data Model
```
ApprovalRequest {
  id
  taskId
  action
  actor
  permission
  risk
  reason
  createdAt
  expiresAt
  status
  requestedBy
  decidedBy
  decidedAt
  decisionReason

  // optional but recommended
  metadata
  resource
  target
  policyVersion
  permissionVersion
  requestVersion
}
```
**Never store:** API keys, passwords, tokens, private credentials, raw
authorization headers.

## 4.4 Approval State Machine
```
PENDING_APPROVAL ── APPROVED
                 ├── REJECTED
                 └── EXPIRED
```
No other transitions. `APPROVED→REJECTED`, `APPROVED→EXPIRED`,
`REJECTED→APPROVED`, `EXPIRED→APPROVED` must all be **rejected**.

An approval is one-time and bound to its specific `taskId + action +
target/resource + permission + risk + request id`. An approval for one
action must NOT authorize another action.

## 4.5 Expiration
Every request has `expiresAt`. On reaching it: `PENDING_APPROVAL → EXPIRED`.
Expired approvals MUST NOT execute. Never silently renew — a new request
must be created if the action is still needed.

## 4.6 Human Authority
Human authority is ROOT authority. The AI must NOT be able to:
approve itself · reject its own approval · increase its own permission ·
change its own risk classification · change policy to bypass approval ·
disable the approval gate / audit log / kill switch · modify protected
security configuration.

**The identity that requests an approval must not automatically become
the identity that approves it.**

## 4.7 Full Pipeline Order
```
REQUEST
 → AUTHENTICATION / ACTOR IDENTIFICATION
 → PERMISSION CHECK
 → POLICY CHECK
 → RISK CLASSIFICATION
 → LOW/MEDIUM  → normal execution path
 → HIGH/CRITICAL → PENDING_APPROVAL → HUMAN DECISION
      ├── APPROVE → final execution authorization → EXECUTE
      ├── REJECT  → BLOCKED/REJECTED
      └── EXPIRE  → EXPIRED
```
Never execute before approval.

## 4.8 Race Condition Protection
Approval must be atomic. Prevent: double approval · approve-after-expiry ·
execute-after-rejection · execute-after-expiry · concurrent execution from
duplicate approval requests.

Verify immediately before execution:
```
PENDING_APPROVAL → APPROVED
 → verify request still valid
 → verify permission still valid
 → verify policy still valid
 → verify target/action still matches
 → execute
```
If any verification fails: **DO NOT EXECUTE.**

## 4.9 Policy/Permission Version Staleness
An approval becomes invalid if authorization context changes
(`permissionVersion`, `policyVersion`, `action`, `target`, `risk`, `task`).
If policy/permission changes after approval → mark request **stale** and
require a new approval. Never reuse an approval under a different policy.

## 4.10 Audit Requirements
Every approval lifecycle event must be audited:
```
APPROVAL_REQUESTED · APPROVAL_VIEWED · APPROVAL_APPROVED · APPROVAL_REJECTED
APPROVAL_EXPIRED · APPROVAL_INVALIDATED · EXECUTION_AUTHORIZED
EXECUTION_STARTED · EXECUTION_COMPLETED · EXECUTION_FAILED · EXECUTION_BLOCKED
```
Records must include: `timestamp, taskId, approvalId, actor, action, risk,
permission, decision, reason, result`. Never log secrets.

## 4.11 Event Trace (connects Approval Gate ↔ Task Engine)

**Approved path:**
```
TASK_CREATED → INPUT_RECEIVED → TASK_QUEUED → TASK_STARTED
→ EXECUTION_PROCESSING → COGNITIVE_UNDERSTANDING → PLANNING
→ POLICY_CHECK → PERMISSION_CHECK → APPROVAL_REQUESTED
→ WAITING_FOR_APPROVAL → APPROVAL_APPROVED → EXECUTION_AUTHORIZED
→ EXECUTION_STARTED → EXECUTION_COMPLETED → TASK_COMPLETED
```
**Rejected path:**
```
APPROVAL_REQUESTED → WAITING_FOR_APPROVAL → APPROVAL_REJECTED → TASK_BLOCKED
```
**Expired path:**
```
APPROVAL_REQUESTED → WAITING_FOR_APPROVAL → APPROVAL_EXPIRED → TASK_TIMEOUT/TASK_BLOCKED
```
**Do not invent events that are not actually implemented.**

## 4.12 Task Engine Integration
If `tasks.mjs` already has `CREATED, QUEUED, RUNNING, WAITING, BLOCKED,
COMPLETED, FAILED, CANCELLED, TIMEOUT` — **reuse those states**. Do not
create a duplicate Task Engine. `WAITING` may represent "waiting for
approval" if compatible with the existing architecture. If a dedicated
state is truly required, document why before implementing it.

## 4.13 Safe Mock Action
Do **NOT** introduce a real dangerous HIGH/CRITICAL tool. Create only a
safe test/mock action, e.g. `approval.test.high-risk`, that performs no
destructive operation. It exists only to exercise: permission, policy,
risk, approval, audit, task state, execution authorization, rejection,
expiration, race protection.

## 4.14 API Design
First inspect existing API conventions (`guard`, `wrap` pattern). If
compatible, add:
```
GET  /api/approvals
GET  /api/approvals/:id
POST /api/approvals/:id/approve
POST /api/approvals/:id/reject
```
All mutations must: validate request ID · validate current state ·
validate actor · validate authorization · write audit event · prevent
duplicate decisions. Never expose secrets.

## 4.15 Control Center Integration
Control Center is currently **read-only** — preserve the existing UI.
Add a **Pending Approvals** section only after the backend approval flow
is correctly implemented, showing: Approval ID, Task ID, Action, Risk,
Permission, Reason, Created time, Expiration time, Current status, and
APPROVE/REJECT buttons.

**The button must call the real backend** and the backend must perform
the actual authorization decision — never a button that merely changes
UI state.

## 4.16 AI Autonomy Boundary
AI can freely: L0 OBSERVE · L1 THINK · L2 IDEATE · L3 PLAN · L4 SIMULATE ·
L5 PROPOSE. Privileged execution (L6 EXECUTE, L7 PRIVILEGED) remains
controlled. The AI must never self-escalate from L0-L5 to L6/L7.

## 4.17 Kill Switch Preparation (not full implementation yet)
Do NOT implement the full Kill Switch in this phase unless the existing
architecture already provides it — but ensure the Approval Gate does not
prevent future Kill Switch behavior. Future requirements: stop new
autonomous execution · cancel cancellable tasks · block new privileged
actions · preserve audit records · never delete evidence. Do not create a
fake kill switch.

## 4.18 Security Boundaries
Protected and must remain protected: Permission Engine · Policy Engine ·
Approval Gate · Audit Log · Kill Switch · Security Configuration · Secret
Handling · Root Authority. AI-generated code must never silently modify
these without explicit human approval.

## 4.19 Error Handling (fail closed for privileged actions)
Define truthful errors for: approval not found · already
approved/rejected/expired · invalid transition · unauthorized approver ·
permission/policy/target/action changed · duplicate approval · execution
authorization failed · approval storage failure. **Never silently treat
errors as approval.**

## 4.20 Failure Safety
If approval storage fails → HIGH/CRITICAL action MUST NOT execute.
If audit logging fails for a privileged decision → fail-closed unless an
existing verified architecture explicitly defines otherwise.
If policy/permission cannot be verified → MUST NOT execute.
If approval state cannot be verified immediately before execution →
**DO NOT EXECUTE.**

## 4.21 Observability
Expose where possible: approval request count · pending/approved/
rejected/expired counts · approval latency · execution authorization
failures · approval-related errors. **Do not fabricate metrics** — report
`NOT IMPLEMENTED` if a metric does not exist.

## 4.22 Test Plan (minimum, before claiming VERIFIED)
| # | Test | Expected |
|---|---|---|
| A | LOW action | executes normally |
| B | MEDIUM action | existing behavior preserved |
| C | HIGH action | PENDING_APPROVAL, does not execute |
| D | CRITICAL action | PENDING_APPROVAL, does not execute |
| E | APPROVE | action executes exactly once |
| F | REJECT | action does not execute |
| G | EXPIRE | action does not execute |
| H | DOUBLE APPROVE | second approval rejected |
| I | APPROVE AFTER EXPIRY | rejected |
| J | EXECUTE AFTER REJECTION | blocked |
| K | ACTION CHANGED AFTER APPROVAL | blocked |
| L | TARGET CHANGED AFTER APPROVAL | blocked |
| M | POLICY VERSION CHANGED | stale approval rejected |
| N | PERMISSION VERSION CHANGED | stale approval rejected |
| O | DUPLICATE EXECUTION REQUEST | no unintended duplicate execution |
| P | AUDIT | all lifecycle events recorded |
| Q | SECRETS | no keys/tokens/passwords in response or audit payload |
| R | Existing AIStatus | unchanged, still working |
| S | Existing `/api/status` | unchanged, still working |
| T | Control Center | existing Events/Audit still work; Pending Approvals works only when backed by real API |

## 4.23 Regression Tests (re-run every phase)
`/api/health · /api/status · /api/control · /api/audit · /api/chat ·
/scan · /read · /funcs · /check · /help · /learn · /learned · /forget`
Plus: `npm run build` · `npx tsc --noEmit` · `node --check` on modified files.

## 4.24 Audit-First Behavior (STOP BEFORE CODING)
Before writing any Phase-14 code, inspect and report on:
`src/ai/permission.mjs · src/ai/tasks.mjs · src/ai/api.mjs ·
src/ai/status.mjs · server.mjs · src/components/ControlCenter.tsx ·
src/App.tsx · existing audit/event modules · package.json`

Report: current permission flow · current policy flow · current risk
classification · current task state machine · current event system ·
current audit system · current Control Center API/UI · exact execution
insertion point · approval data model proposal · API proposal · UI
proposal · security risks · race-condition risks · failure-mode handling
· test plan · exact files to modify/create · files remaining untouched ·
any architectural conflict discovered.

**DO NOT MODIFY FILES DURING THIS AUDIT. STOP AND WAIT FOR HUMAN APPROVAL.**

Only after human approves the audit: implement the approved scope, run
all checks above, show `git diff --stat` / `git diff` / `git status
--short`, report using the truthful labels (Part 12), and **do not commit
until the human reviews the result.**

---

# PART 5 — CONTROL CENTER

Show: System Health · Autonomy Level · Current Task · Current Execution ·
Current Cognitive State · **Pending Approvals** · Active Tasks · Resource
Usage · Recent Events · Recent Errors · Permissions · Policy State.

Controls: Pause Autonomy · Resume Autonomy · Stop Task · Stop All ·
Revoke Permission · Reject Proposal · Approve Proposal · Rollback.

## Status Card (per module)
module name · status · reason · last checked · response time · version ·
error if present. Current modules: AI Core, Memory, Learning, Knowledge,
English Brain, Khmer Brain, Tools, API, Model, Session.

## Autonomy UI
Shows current L0–L7 level. Default conservative. Human can reduce
autonomy; **AI must not increase its own autonomy.**

## Approval UI
```
PROPOSAL #001
Goal: ...
Plan: ...
Files: ...
Risk: ...
Expected result: ...
Tests: ...
Rollback: ...
[ APPROVE ]  [ REJECT ]
```
Never execute before approval.

## Pause / Stop / Revoke
Pause blocks new autonomous execution. Stop cancels cancellable tasks.
Revoke removes a selected permission. **All auditable.**

---

# PART 6 — KILL SWITCH

Protected emergency stop. `STOP ALL` must: stop new autonomous execution
· cancel cancellable tasks · prevent new privileged actions · preserve
audit records. Must NOT destroy memory or data. After stop:
`AUTONOMY = PAUSED`, manual recovery required.

---

# PART 7 — TASK / GOAL / EXECUTION / COGNITIVE ENGINES

## Task Engine
States: `CREATED, QUEUED, RUNNING, WAITING, BLOCKED, COMPLETED, FAILED,
CANCELLED, TIMEOUT`. Every task: `taskId, goalId, createdAt, updatedAt,
state, priority, risk, budget, permissions, owner, metadata`. Prevent
invalid state transitions. Every transition: `{from, to, timestamp,
reason, taskId}`.

## Goal Engine
Separate **GOAL → TASK → ACTION**. Example: Goal "Improve English Brain" →
Task "Analyze current English learning system" → Action "Read learning
module". A goal can contain multiple tasks; a task can contain multiple
actions. Do not mix these concepts.

## Execution State
`IDLE, PROCESSING, RETRIEVING, TOOL_CALL, LEARNING, WAITING, RESPONDING`

## Cognitive State
`IDLE, UNDERSTANDING, RETRIEVING, PLANNING, REASONING, VERIFYING, ANSWERING`
These represent software processing stages — **do not claim human
consciousness.**

---

# PART 8 — IDEATION / PLANNING / SANDBOX / EXPERIMENT

## Ideation Engine
```
GOAL → OBSERVE → IDENTIFY GAP → GENERATE IDEAS → COMBINE IDEAS
→ COMPARE → SIMULATE → PROPOSE
```
Each idea: `ideaId, title, description, reason, expectedBenefit,
dependencies, risk, complexity, estimatedCost, testPlan, rollbackPlan`.
AI may create ideas automatically. **Ideas are NOT automatically executed.**

## Creative Diversity
For non-critical creative tasks generate alternatives (Idea A/B/C),
compared on benefit, cost, risk, complexity, compatibility. Do not
always choose the first generated idea.

## Planning Engine
GOAL → PLAN containing: steps, dependencies, required tools, permissions,
risk, budget, verification criteria, rollback plan. Validate plan before
execution.

## Sandbox
AI may generate code, modify temporary files, run tests/simulations,
compare results — **inside sandbox only**. Must not directly modify
production architecture from an experiment.
```
IDEA → SANDBOX → TEST → RESULT → PROPOSAL → HUMAN APPROVAL → PRODUCTION
```

## Experiment Engine
`experimentId, goal, hypothesis, inputs, changes, results, metrics,
status, createdAt, completedAt`. States: `CREATED, RUNNING, COMPLETED,
FAILED, CANCELLED`. Never overwrite production blindly.

---

# PART 9 — SELF-EVALUATION / VERIFICATION / CONFIDENCE / PROVENANCE

## Self-Evaluation
After executing a task, evaluate: did it achieve the goal? what changed?
what failed? what evidence exists? what remains? Output: `SUCCESS,
PARTIAL, FAILED, UNCERTAIN`. **Advisory only — does not override actual
test results.**

## Verification
Knowledge states: `UNKNOWN, KNOWN, RETRIEVED, VERIFYING, VERIFIED,
CONFLICTING`. Must use explicit evidence. Generated text alone ≠ VERIFIED.
`RETRIEVED ≠ VERIFIED`.

## Confidence
`HIGH, MEDIUM, LOW, UNCERTAIN` — evidence-based. Signals: source
availability, verification result, knowledge match, conflict detection,
retrieval quality, model certainty if available. Insufficient evidence →
`UNCERTAIN`. Never fabricate confidence.

## Provenance
Track: `source, origin, createdAt, updatedAt, version, verified,
confidence`. Origin: `user, system, imported, generated, tool,
external_source`. Never misrepresent generated information as external.

## Knowledge Conflict Resolution
If sources disagree → state `CONFLICTING`. Do not silently choose one.
Record `sourceA, sourceB, conflict, resolutionStatus`
(`UNRESOLVED, RESOLVED, HUMAN_REVIEW`).

---

# PART 10 — MEMORY / LEARNING / MODEL ROUTING

## Memory Lifecycle
Separate: `SHORT_TERM_MEMORY, SESSION_MEMORY, LONG_TERM_MEMORY,
LEARNED_MEMORY`. Define creation, retrieval, update, expiration,
deletion, verification. Do not automatically save every conversation
forever. Keep MEMORY separate from KNOWLEDGE — memory is conversation/
session/recent context; knowledge is facts/documents/structured/verified
information. Do not auto-convert every message into permanent knowledge.

## Learning Engine
Preserve `/learn, /learned, /forget`. Learning must have `source,
timestamp, confidence, version`. Should not silently overwrite
higher-confidence knowledge.

## Model Routing / Fallback
Support `LOCAL, EXTERNAL, FALLBACK` providers, considering availability,
latency, cost, capability, policy, privacy. Never expose API keys. On
preferred-model failure: check policy → fallback if configured → record
`primaryModel, fallbackModel, reason, timestamp`. Never silently change
providers when policy prohibits it.

---

# PART 11 — RESOURCE BUDGET / RELIABILITY / CIRCUIT BREAKER

## Resource Budget
Per task: `timeMs, maxToolCalls, maxRetries, maxMemoryItems, maxTokens,
maxCost`. On exhaustion: `STOP` or `REQUIRE_APPROVAL`. Never infinite loop.

## Reliability
Implement: `TIMEOUT, RETRY, CIRCUIT_BREAKER, DEPENDENCY_HEALTH,
DEGRADED_MODE`.

### Timeout Constants (canonical — reuse existing, do not duplicate)
```
API_HEALTH_TIMEOUT_MS     = 3000
API_DEFAULT_TIMEOUT_MS    = 10000
CHAT_TIMEOUT_MS           = 30000
TOOL_TIMEOUT_MS           = 15000
LEARN_TIMEOUT_MS          = 5000
KNOWLEDGE_TIMEOUT_MS      = 5000
STATUS_POLL_INTERVAL_MS   = 10000
```

### Timeout ≠ Error ≠ Offline
- **TIMEOUT** — no response within allowed time
- **ERROR** — request responded but operation failed
- **OFFLINE** — repeated health checks failed (recommended: failure count ≥ 3)
- **UNKNOWN** — insufficient information
A single timeout must NOT automatically become OFFLINE. A successful
health check resets the failure count.

### Retry Policy
Health checks: max 2 retries. Safe read-only tools: max 1 retry. Chat:
do NOT auto-retry (duplicate side effects possible). Learning: never
duplicate writes. Knowledge lookup: safe retry only if read-only. All
retries must be observable in trace/event data.

## Circuit Breaker
`CLOSED → OPEN` (repeated failure) → `HALF_OPEN` (recovery test) →
`CLOSED` (successful recovery). Do not apply to every local module
unnecessarily — only where cascading failure risk exists.

---

# PART 12 — STATUS ENGINE  *(✅ already implemented — see Appendix B)*

*The three "Status Engine" work orders among the source documents were
~90% duplicates of each other. Consolidated below; current build already
satisfies this section — see Appendix B for verification evidence.*

## `/api/status` Contract
Must report real status for: `system, api, aiCore, memory, learning,
knowledge, englishBrain, khmerBrain, tools, model, session`.

### Per-service schema
```json
{
  "status": "READY",
  "reason": "...",
  "lastChecked": "2026-09-22T...",
  "lastSuccessfulCheck": "2026-09-22T...",
  "responseTime": 4,
  "error": null,
  "version": "1.0.0",
  "available": true,
  "stale": false
}
```
Use `null` where unavailable. **Never fabricate values.**

### Valid Service States
`ONLINE, OFFLINE, ERROR, TIMEOUT, UNKNOWN, LOADING, UPDATING, ACTIVE,
READY, DEVELOPING, DEGRADED`

### Status Priority (for aggregation)
```
ERROR > OFFLINE > TIMEOUT > LOADING > UPDATING > ACTIVE > READY > DEVELOPING
```
Do not hide individual module status behind the aggregate.

### System Health
`HEALTHY, DEGRADED, ERROR, OFFLINE` — deterministic aggregation; document
which services are critical; one non-critical module failure must not
crash the whole endpoint.

### Frontend Polling
Poll `/api/status` every `STATUS_POLL_INTERVAL_MS` (10s), each request
timing out at `API_HEALTH_TIMEOUT_MS` (3s). On poll failure, don't
instantly mark everything OFFLINE — show last known state with
`stale: true`. `UNKNOWN` is a valid, honest state — never silently
upgraded to `READY`.

---

# PART 13 — SECURITY / DATA SAFETY / PRIVACY / CONFIGURATION

## Configuration Safety
Protect environment variables, API keys, tokens, credentials, private
configuration. Never expose via `/api/status`, logs, UI, trace, or error
messages.

## Data Safety
Backup/version before destructive changes. Avoid irreversible operations.
Require approval for destructive operations.

## Privacy
Do not store unnecessary personal information. Do not place sensitive
user data into generic traces. Minimize logged content — prefer IDs and
metadata over raw private content.

## Security Testing Checklist
No API keys in responses · no secrets in logs · no secret exposure in
status · no permission escalation · no approval bypass · no audit
deletion through normal AI tools · no autonomous modification of
protected components.

---

# PART 14 — FRONTEND

Keep the existing Black 3D design. **Do not rewrite the whole UI.**
Add a Control Center (Part 5) alongside the existing status dashboard.
Maintain Khmer + English text throughout. Use details panels/modals for
deeper information rather than overloading the main screen.

---

# PART 15 — TOOL CONTRACT / CHAT PIPELINE

## Tool Contract
Every tool should define: `name, description, permissions, riskLevel,
timeout, retryPolicy, inputSchema, outputSchema, sideEffects`. Tool
execution must pass policy checks.

## Chat Pipeline
```
INPUT → TASK CREATED → UNDERSTANDING → MEMORY → KNOWLEDGE → PLANNING
→ REASONING → VERIFICATION → RESPONSE → MEMORY UPDATE → TASK COMPLETED
```
Not every simple request needs every expensive stage — use lightweight
paths where appropriate (e.g. "សួស្តី" may go straight
`INPUT → UNDERSTANDING → RESPONSE`).

---

# PART 16 — AUTONOMOUS IMPROVEMENT LOOP / SELF-MODIFICATION BOUNDARY

## Autonomous Improvement Loop
```
OBSERVE → IDENTIFY PROBLEM → GENERATE IDEAS → RANK CANDIDATES
→ CREATE EXPERIMENT → SANDBOX → TEST → EVALUATE → PROPOSAL
→ HUMAN APPROVAL → IMPLEMENT → VERIFY → VERSION → LEARN
```
AI does NOT directly rewrite protected core systems.

## Self-Modification Boundary
AI **may**: analyze its architecture, suggest improvements, generate
patches, test patches in sandbox, create proposals.
AI **may NOT**: silently modify protected core, remove approval
mechanisms, disable security, increase its own permissions, disable
audit logging, remove kill switch, hide actions from the operator.

## Protected Components
Permission Engine · Policy Engine · Approval Gate · Audit Log ·
Kill Switch · Security Configuration · Secret Handling · Root Authority.
Cannot be modified by autonomous execution without explicit human approval.

---

# PART 17 — FAILURE MODES

`NORMAL, DEGRADED, PAUSED, BLOCKED, ERROR, OFFLINE, EMERGENCY_STOP`.
**When uncertain: FAIL SAFE.**

## Self-Evaluation Rule
AI self-evaluation is **not authoritative**. Priority order:
```
TEST RESULT > SYSTEM RESULT > VERIFIED EVIDENCE > SELF-EVALUATION
```
Never allow the AI to mark its own failure as success without evidence.

---

# PART 18 — TESTING (merged from all source documents)

## Functional Tests
`/api/health` returns 200 · `/api/status` returns 200 with all required
services · no service status is silently fabricated · API is ONLINE when
health succeeds · timeout distinct from OFFLINE · repeated health
failures → OFFLINE · successful health check resets failure count · one
module failure doesn't crash `/api/status` · task/execution/cognitive
state transitions work and invalid ones are rejected · unknown knowledge
stays UNKNOWN · knowledge becomes VERIFIED only after real verification ·
confidence is not fabricated · provenance preserved · trace events
generated · resource limits prevent infinite execution · malformed
status response doesn't crash frontend.

## Engine Tests (as engines are built)
status engine · task engine · goal engine · permission engine · policy
engine · approval engine · idea engine · planning engine · sandbox ·
experiment engine · verification · confidence · provenance · rollback ·
audit · kill switch · resource budget · circuit breaker.

## Negative Tests
invalid permissions · invalid state transitions · missing status ·
timeout · offline · dependency failure · malformed input · tool failure ·
approval rejection · approval requirement · rollback · pause · stop.

## Regression Tests (every phase, no exceptions)
`/scan · /read · /funcs · /check · /help · /learn · /learned · /forget ·
POST /api/chat` — existing Khmer/English behavior unchanged.

## Static Checks
```
node --check <modified .mjs files>
npx tsc --noEmit
npm run build          (or vite build)
```
Do not invent package scripts.

## Runtime Checks
```
curl -s http://localhost:8787/api/health
curl -s http://localhost:8787/api/status
```
Then test chat and existing commands. Start frontend, verify status
cards / control center / approval flow / pause / stop / task state /
error handling. **Do not claim runtime success without actually testing it.**

---

# PART 19 — IMPLEMENTATION ORDER (UNIFIED PHASE LIST)

*Three source documents proposed slightly different phase numberings for
the same work. This is the single canonical order — the current
implementation state (Appendix B) shows we are past Phase 13.*

```
PHASE 0  — Repository audit                              ✅ DONE
PHASE 1  — Real /api/status, Status Engine, service checks ✅ VERIFIED
PHASE 2  — System health aggregation                       ✅ VERIFIED
PHASE 3  — Task Engine                                     ✅ VERIFIED
PHASE 4  — Execution State                                 ✅ VERIFIED
PHASE 5  — Cognitive State                                 ✅ VERIFIED
PHASE 6  — Goal Engine                                     ❌ NOT IMPLEMENTED
PHASE 7  — Event / Trace                                   ✅ VERIFIED
PHASE 8  — Knowledge State                                 ⚠️ PARTIAL (knowledge.mjs = static keyword DB only, no state machine)
PHASE 9  — Verification                                    ✅ VERIFIED (verification.mjs, real tsc→build→vitest)
PHASE 10 — Confidence                                       ✅ VERIFIED (status.mjs CONFIDENCE_STATE, tested)
PHASE 11 — Provenance                                        ⚠️ PARTIAL (codeDataCenter.mjs findings have "evidence" field only)
PHASE 12 — Permission Engine                                ✅ VERIFIED
PHASE 13 — Policy Engine                                    ✅ VERIFIED
PHASE 14 — Human Approval Gate                               ✅ VERIFIED (approvals.mjs, commit e7cf938)
PHASE 15 — Idea Engine                                       ❌ NOT IMPLEMENTED
PHASE 16 — Planning Engine                                   ❌ NOT IMPLEMENTED
PHASE 17 — Sandbox                                            ✅ VERIFIED (sandbox.mjs)
PHASE 18 — Experiment Engine                                  ❌ NOT IMPLEMENTED
PHASE 19 — Self-Evaluation                                    ❌ NOT IMPLEMENTED
PHASE 20 — Versioning + Rollback                              ✅ VERIFIED (rollback.mjs — plan-only, never auto-executes by design)
PHASE 21 — Resource Budget                                    ❌ NOT IMPLEMENTED (patch.mjs is a different feature, mislabeled Phase 21 in its commit)
PHASE 22 — Timeout + Retry                                    ⚠️ PARTIAL (timeout via status.mjs withTimeout(); no retry logic found)
PHASE 23 — Circuit Breaker                                    ❌ NOT IMPLEMENTED
PHASE 24 — Model Routing / Fallback                           ✅ VERIFIED (modelRouting.mjs — decideProvider() honest NO_FALLBACK, no fabricated providers, 6 tests)
PHASE 25 — Control Center                                     ✅ VERIFIED (~30-language i18n, Pending Approvals UI)
PHASE 26 — Audit + Security hardening                         ✅ VERIFIED (secret-scrubbing, stale-approval detection)
PHASE 27 — Metrics / Observability                            ❌ NOT IMPLEMENTED
PHASE 28 — Documentation                                      ⚠️ PARTIAL (corrected 2026-09-23)
PHASE 29 — Automated Test Suite                               ✅ VERIFIED (13 files / 50 tests; api.mjs, codeDataCenter.mjs, core.mjs, english.mjs, knowledge.mjs, learn.mjs, tools.mjs untested)
PHASE 30 — Full regression / acceptance                       ❌ NOT IMPLEMENTED

NOTE (audit 2026-09-23): commit-message phase numbers do not match this table
(e.g. Sandbox commit says "Phase 20" but is Phase 17 here). This table is the
source of truth going forward, not commit messages.

## Phase Gate
Do NOT start the next phase until the previous phase compiles, passes
tests, passes runtime checks, and does not break existing functionality.
If a phase fails: **STOP. Fix it first.**

---

# PART 20 — 10-STAR ENGINEERING STANDARD

| ★ | Criterion | Meaning |
|---|---|---|
| 1 | Correctness | Real behavior, not fake state |
| 2 | Reliability | Safe failure, timeout, retry |
| 3 | Observability | System can explain its state |
| 4 | State Consistency | States cannot contradict each other |
| 5 | Traceability | Actions can be reconstructed |
| 6 | Verification | Evidence distinguishable from generation |
| 7 | Provenance | Origins are known |
| 8 | Security | Privileges and secrets protected |
| 9 | Human Control | AI cannot bypass root authority |
| 10 | Maintainability | Modular, tested, documented, extensible |

## Final Architecture
```
                    HUMAN
                      │
                ROOT AUTHORITY
                      │
                POLICY ENGINE
                      │
             PERMISSION ENGINE
                      │
              APPROVAL GATE
                      │
                 KHOEM AI
        ┌─────────────┼─────────────┐
      MEMORY      KNOWLEDGE      TOOLS
        └─────────────┼─────────────┘
                   TASK → GOAL → PLANNING → REASONING
                      → VERIFICATION → SELF-EVAL → PROPOSAL
                      → SANDBOX → EXPERIMENT → APPROVAL
                      → EXECUTE → VERIFY → VERSION → ROLLBACK
                      → LEARN → OBSERVE

CONTROL LAYER: HEALTH · TIMEOUT · RETRY · BUDGET · AUDIT · TRACE
               · SECURITY · KILL SWITCH
```

## Final Acceptance Criteria
See checklist form in Appendix B — this list is tracked with live status,
not left as blank checkboxes, so it stays truthful over time.

---

# PART 21 — TRUTHFUL REPORTING RULES

Use only these labels — nothing else:

| Label | Meaning |
|---|---|
| `VERIFIED` | Actually tested, with evidence |
| `NOT VERIFIED` | Inspected/built but not tested |
| `EXISTING — PRESERVED` | Was already there, untouched |
| `CREATED` | New file/module |
| `MODIFIED` | Existing file extended |
| `NOT IMPLEMENTED` | Does not exist yet |
| `PARTIAL` | Some but not all of the requirement is done |
| `BLOCKED` | Cannot proceed until something else is resolved |

**Never use:** "100% complete", "fully secure", "AGI achieved",
"production safe" — unless objectively demonstrated and supported by tests.

## Final Report Format (produce this after every phase)
```
REPOSITORY AUDIT / FILES INSPECTED / FILES CHANGED / FILES CREATED /
FILES PRESERVED / ARCHITECTURE CHANGES / API CHANGES / STATUS ENGINE /
TASK ENGINE / GOAL ENGINE / COGNITIVE ENGINE / MEMORY / KNOWLEDGE /
VERIFICATION / CONFIDENCE / PROVENANCE / PERMISSION / POLICY / APPROVAL /
IDEATION / PLANNING / SANDBOX / EXPERIMENTS / SELF-EVALUATION / ROLLBACK /
RELIABILITY / SECURITY / AUDIT / CONTROL CENTER / TEST RESULTS /
BUILD RESULT / RUNTIME RESULT / GIT STATUS / COMMIT HASH / PUSH RESULT /
REMAINING WORK / UNVERIFIED ITEMS
```

---

# APPENDIX A — CANONICAL EVENT TYPE LIST

*(Merged from all sources into one non-duplicated list — implement only
what is actually wired up; do not emit events for stages that don't exist yet)*

```
INPUT_RECEIVED             TASK_CREATED            TASK_STARTED
TASK_QUEUED                TASK_COMPLETED          TASK_FAILED
TASK_TIMEOUT               TASK_BLOCKED
UNDERSTANDING_STARTED      MEMORY_RETRIEVED        MEMORY_UPDATED
KNOWLEDGE_RETRIEVED        PLAN_CREATED            IDEA_CREATED
REASONING_STARTED
POLICY_CHECK               PERMISSION_CHECK
APPROVAL_REQUESTED         APPROVAL_VIEWED         APPROVAL_APPROVED
APPROVAL_REJECTED          APPROVAL_EXPIRED        APPROVAL_INVALIDATED
WAITING_FOR_APPROVAL
EXECUTION_AUTHORIZED       EXECUTION_STARTED       EXECUTION_COMPLETED
EXECUTION_FAILED           EXECUTION_BLOCKED
TOOL_CALL_STARTED          TOOL_CALL_COMPLETED
VERIFICATION_STARTED       VERIFICATION_COMPLETED
EXPERIMENT_STARTED         EXPERIMENT_COMPLETED
RESPONSE_STARTED           RESPONSE_COMPLETED
ROLLBACK_STARTED           ROLLBACK_COMPLETED
AUTONOMY_PAUSED            AUTONOMY_RESUMED
```
Every event: `{id, taskId, timestamp, type, actor, duration, metadata}`.

---

# APPENDIX B — CURRENT IMPLEMENTATION STATUS
*(As verified live in this project's development session — not aspirational)*

## EXISTING — PRESERVED (unchanged throughout all work)
- `/api/chat`, `/api/health`, `/api/models` — unchanged
- `/scan`, `/read`, `/funcs`, `/check`, `/help`, `/learn`, `/learned`, `/forget` — unchanged, regression-tested repeatedly
- Khmer brain (`khoem.mjs`) and English brain (`english.mjs`) — unchanged
- Black 3D UI — unchanged, only additive elements
- `src/ai/tasks.mjs` (Task/Execution/Cognitive state machine) — already existed before this work began

## VERIFIED (tested live with curl / build / on-device screenshots)
- **Status Engine (Phase 1–2):** `src/ai/status.mjs` extended with
  `available`, `lastSuccessfulCheck`, `stale`, `version` per card.
  Confirmed via `curl /api/status` → system `HEALTHY`, all 9 modules
  reporting real state.
- **Task/Execution/Cognitive Engine (Phase 3–5, 7):** confirmed via live
  `/api/chat` call + `/api/tasks` trace: `TASK_CREATED → INPUT_RECEIVED →
  TASK_QUEUED → TASK_STARTED → EXECUTION_PROCESSING →
  COGNITIVE_UNDERSTANDING → ... → TASK_COMPLETED`.
- **Permission + Policy Engine (Phase 12–13):** `src/ai/permission.mjs`
  created. 8 tool actions registered with explicit permission + risk
  (LOW/MEDIUM only — no HIGH/CRITICAL action exists yet). Unregistered
  actions fail safe to DENY. Wired into `src/ai/api.mjs` via `policy()`
  middleware. Confirmed via curl: audit entries show
  `actor, action, permission, risk, decision, timestamp`.
- **Control Center (Phase 25, read-only):** `src/components/
  ControlCenter.tsx` created, polls unauthenticated `GET /api/control`
  (added to `server.mjs`) every 5s, shows Recent Task Events + Permission
  Audit. Confirmed rendering correctly on-device; does not interfere
  with existing `AIStatus.tsx` overlay.
- Build: `npm run build` and `npx tsc --noEmit` pass after every change.
  `node --check` passes on every modified `.mjs` file.

## NOT VERIFIED
- Behavior when a probed module fails to load (timeout/error paths exist
  in `status.mjs` `probe()` but have not been exercised live)
- Long-term memory/task growth under sustained load

## NOT IMPLEMENTED
- Goal Engine (Phase 6) — Task/Action exist, Goal layer does not
- Knowledge State / Verification / Confidence / Provenance (Phase 8–11)
- **Human Approval Gate (Phase 14)** — see Part 4 of this document for
  the full approved design; not yet coded. Current `policy()` middleware
  returns a stub `202 PENDING_APPROVAL` with no real `ApprovalRequest`,
  no persistence, no `/api/approvals` — this must be replaced, not extended.
- Ideation, Planning, Sandbox, Experiment Engines (Phase 15–18)
- Self-Evaluation, Versioning, Rollback (Phase 19–20)
- Resource Budget enforcement, Circuit Breaker (Phase 21, 23)
- Kill Switch (Part 6 of this document)
- Automated test suite (Phase 29) — all testing so far is manual curl-based

## KNOWN ARCHITECTURAL GAP (must be resolved before Phase 14 code is written)
Tool routes (`/api/scan`, `/api/learn`, etc.) do **not** create a Task —
only `/api/chat` calls `createTask()`. A HIGH/CRITICAL mock action for
approval-gate testing will need its own lightweight task creation to
produce the full event trace shown in Part 4.11. See Part 4.24 for the
required audit-first process before coding this.

## Git History (this session)
```
f1a93a1  ai: extend english brain
37038d5  permission: add Permission+Policy Engine, wire into tool routes, add /api/audit
2ac7305  control-center: add read-only Control Center UI showing task events and permission audit
```
All pushed to `origin/main`.
