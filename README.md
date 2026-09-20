## 🌐 AI 

╔══════════════════════════════════════════════════════════════════════╗
║                         AI — AGI                                    ║
║              UNIVERSAL INTELLIGENT CONTROL PLATFORM                 ║
╚══════════════════════════════════════════════════════════════════════╝

PROGRAM / PAGE NAME
===================
AI

SYSTEM VISION
=============
AI → AGI

AI គឺជាប្រព័ន្ធ Intelligent Control Platform ដែលមានសមត្ថភាព
យល់ពីមនុស្ស → វិភាគ → សម្រេចចិត្ត → អនុវត្ត → ទទួលលទ្ធផល
→ ផ្ទៀងផ្ទាត់ → រៀនពី feedback ដែលបានគ្រប់គ្រង។

CORE FLOW
=========
Human
  ↓
AI Interface
  ↓
Understanding
  ↓
Context + Memory
  ↓
Reasoning
  ↓
Planning
  ↓
Authorization
  ↓
Safety Check
  ↓
Action Planner
  ↓
Command Engine
  ↓
Gateway / Protocol
  ↓
Device / Service
  ↓
Telemetry / Result
  ↓
Verification
  ↓
Audit
  ↓
Feedback
  ↓
Controlled Learning
  ↓
Improved Understanding


============================================================
1. AI INTERFACE
============================================================

AI គឺជាទំព័រ និងចំណុចប្រទាក់សំខាន់របស់ប្រព័ន្ធ។

សមត្ថភាព៖

- Text Input
- Voice Input
- Vision Input
- Camera
- File / Document Input
- Command Input
- Conversation
- Notifications
- System Status
- Device Status
- Time / Date
- Location Context
- Organization Context

AI Interface ត្រូវបែងចែកជា Module
មិនដាក់មុខងារទាំងអស់នៅក្នុងទំព័រតែមួយ។


============================================================
2. UNDERSTANDING ENGINE
============================================================

AI ត្រូវយល់ពី Input មុនពេលធ្វើសកម្មភាព។

Input Types:

TEXT
VOICE
IMAGE
VIDEO
DOCUMENT
SENSOR DATA
DEVICE TELEMETRY
SYSTEM EVENTS

AI ត្រូវបម្លែង Input ទៅជា Structured Intent។

ឧទាហរណ៍៖

User:
"បើកម៉ាស៊ីនត្រជាក់បន្ទប់ A"

AI:

intent:
    device_control

target:
    HVAC-A

action:
    TURN_ON

parameters:
    {}

priority:
    NORMAL


============================================================
3. CONTEXT ENGINE
============================================================

AI មិនគួរយល់តែប្រយោគបច្ចុប្បន្នទេ។

Context រួមមាន៖

- User
- Role
- Organization
- Device
- Device State
- Current Time
- Time Zone
- Location
- Previous Conversation
- Previous Commands
- Previous Results
- Current Alerts
- Safety State
- System State
- Network State

Context ត្រូវមាន Scope ច្បាស់លាស់៖

USER CONTEXT
ORGANIZATION CONTEXT
DEVICE CONTEXT
CONVERSATION CONTEXT
SYSTEM CONTEXT
TIME CONTEXT
SAFETY CONTEXT


============================================================
4. MEMORY
============================================================

AI Memory ត្រូវបែងចែកជា៖

A. SHORT-TERM MEMORY
- Current conversation
- Current task
- Current plan
- Current command

B. SESSION MEMORY
- Current login session
- Current workspace
- Recent actions

C. OPERATIONAL MEMORY
- Previous device commands
- Device results
- Alerts
- Incidents
- System events

D. LONG-TERM KNOWLEDGE
- Approved knowledge
- Organization rules
- Device documentation
- System documentation
- User-approved preferences

E. AUDIT MEMORY
- Who
- What
- When
- Where
- Why/context
- Result

IMPORTANT:

AI មិនត្រូវរៀនដោយស្វ័យប្រវត្តិពីរាល់ command
ដោយគ្មានការគ្រប់គ្រងទេ។

Learning ត្រូវមាន៖

OBSERVE
→ VALIDATE
→ APPROVE
→ STORE
→ REUSE


============================================================
5. REASONING ENGINE
============================================================

AI ត្រូវអាចវិភាគ៖

- Intent
- Context
- Constraints
- Dependencies
- Risks
- Permissions
- Safety Rules
- Device State
- Previous Results

Reasoning ត្រូវបង្កើតជា structured decision
មិនមែនធ្វើសកម្មភាពដោយគ្មាន validation ទេ។


============================================================
6. PLANNING ENGINE
============================================================

សម្រាប់ការងារសាមញ្ញ៖

Intent
→ Authorization
→ Safety
→ Command
→ Result


សម្រាប់ការងារច្រើនជំហាន៖

Goal
 ↓
Plan
 ↓
Step 1
 ↓
Verify
 ↓
Step 2
 ↓
Verify
 ↓
Step 3
 ↓
Verify
 ↓
Final Result


រាល់ Plan គួរមាន៖

planId
taskId
createdAt
createdBy
status
priority
steps
currentStep
retryPolicy
timeoutPolicy
failurePolicy
approvalRequired


Step គួរមាន៖

stepId
action
target
status
startedAt
completedAt
result
error
retryCount


============================================================
7. AUTHORIZATION
============================================================

AI មិនមានសិទ្ធិធ្វើអ្វីគ្រប់យ៉ាងដោយស្វ័យប្រវត្តិទេ។

ត្រូវពិនិត្យ៖

WHO
WHAT
WHICH RESOURCE
WHICH ACTION
WHICH ORGANIZATION
WHICH ROLE
WHICH PERMISSION

Flow:

User
 ↓
Authentication
 ↓
Identity
 ↓
Role
 ↓
Permission
 ↓
Authorization
 ↓
Safety


IMPORTANT SECURITY PRINCIPLE:

Discovery ≠ Authorization

ការមើលឃើញ Device
មិនមានន័យថា
អាចបញ្ជា Device នោះបានទេ។


============================================================
8. SAFETY ENGINE
============================================================

Safety ត្រូវនៅចន្លោះ៖

Authorization
        ↓
Safety
        ↓
Action

Default behavior:

UNKNOWN / ERROR
        ↓
BLOCK

Safety Rule Examples:

- Vehicle Geo-Fence
- Robot Human Zone
- Door Tamper
- Emergency Stop
- Cold Storage Safety
- Duress Code
- Ignition Lock
- HVAC Emergency
- Temperature Limit
- Pressure Limit
- Speed Limit
- Power Limit
- Human Presence
- Restricted Area
- Emergency State


Safety Principle:

FAIL SAFE

បើ Safety Engine មិនប្រាកដ
→ BLOCK ACTION


============================================================
9. ACTION PLANNER
============================================================

Action Planner បម្លែង Decision ទៅជា Action ដែលអាច execute បាន។

ឧទាហរណ៍៖

Intent:
TURN_ON_HVAC

Action:

{
    target: "HVAC-A",
    command: "TURN_ON",
    parameters: {},
    priority: "NORMAL"
}


Action មិនត្រូវបញ្ជូនទៅ Device ភ្លាមៗទេ។

ត្រូវឆ្លងកាត់៖

VALIDATE
→ AUTHORIZATION
→ SAFETY
→ COMMAND ENGINE


============================================================
10. COMMAND ENGINE
============================================================

Command Engine គ្រប់គ្រង៖

- Command Creation
- Validation
- Authorization
- Safety
- Queue
- Dispatch
- Retry
- Timeout
- Cancellation
- Result
- Audit

Command Status:

PENDING
AUTHORIZED
SAFETY_CHECK
BLOCKED
DISPATCHING
SENT
ACKNOWLEDGED
EXECUTING
SUCCESS
FAILED
TIMEOUT
CANCELLED


IMPORTANT:

SENT ≠ SUCCESS

ការបញ្ជូន command បាន
មិនមានន័យថា Device បានអនុវត្តជោគជ័យទេ។

ត្រូវមាន ACK / TELEMETRY / STATE VERIFICATION។


============================================================
11. GATEWAY / PROTOCOL ENGINE
============================================================

AI → Command Engine
→ Gateway
→ Protocol
→ Device

អាចគាំទ្រ៖

MQTT
HTTP / REST
WebSocket
TCP
UDP
Modbus
OPC-UA
CAN
BLE
Other Approved Protocols


Gateway Adapter Architecture:

Gateway
 ├── MQTT Adapter
 ├── HTTP Adapter
 ├── WebSocket Adapter
 ├── Modbus Adapter
 └── Future Adapters


រាល់ Adapter ត្រូវមាន Interface ស្តង់ដារ
ដើម្បីកុំឱ្យ AI Engine ចងភ្ជាប់ជាមួយ Protocol ផ្ទាល់។


============================================================
12. DEVICE ENGINE
============================================================

Device Model គួរមាន៖

deviceId
deviceType
name
organizationId
status
online
lastSeenAt
capabilities
gatewayId
protocol
metadata


Device State:

ONLINE
OFFLINE
DEGRADED
UNKNOWN
MAINTENANCE
EMERGENCY


Device Capability:

READ
WRITE
CONTROL
MONITOR
CONFIGURE
RESET
EMERGENCY_STOP


============================================================
13. TELEMETRY
============================================================

Device ត្រូវអាចផ្ញើ Result / Telemetry ត្រឡប់មកវិញ។

ឧទាហរណ៍៖

temperature
humidity
battery
speed
location
pressure
power
voltage
current
fuel
doorState
engineState
alarmState
networkState
healthState


Flow:

Device
 ↓
Gateway
 ↓
Telemetry
 ↓
Backend
 ↓
State Engine
 ↓
AI Context
 ↓
Verification


============================================================
14. RESULT VERIFICATION
============================================================

AI មិនគួរនិយាយថា:

"Command successful"

ដោយផ្អែកតែលើការបញ្ជូន command ទេ។

ត្រូវពិនិត្យ៖

Command Sent
     ↓
Gateway ACK
     ↓
Device ACK
     ↓
Telemetry
     ↓
Actual State
     ↓
Verification
     ↓
SUCCESS / FAILED / TIMEOUT


ឧទាហរណ៍៖

User:
"បើកម៉ាស៊ីនត្រជាក់"

AI:
Command sent.

Device:
ACK

Telemetry:
HVAC = ON

AI:
Verified: HVAC is ON.


============================================================
15. FAILURE & RECOVERY ENGINE
============================================================

ត្រូវគ្រប់គ្រង៖

- Device Offline
- Gateway Offline
- Network Failure
- Timeout
- Duplicate Command
- Invalid Command
- Safety Block
- Permission Denied
- Partial Execution
- Device Error
- Telemetry Missing
- ACK Missing

Recovery:

RETRY
WAIT
CANCEL
ROLLBACK
ESCALATE
SAFE MODE
HUMAN OVERRIDE


Retry ត្រូវមាន limit
ដើម្បីកុំឱ្យ AI បញ្ជាដដែលៗដោយគ្មានទីបញ្ចប់។


============================================================
16. HUMAN OVERRIDE
============================================================

មនុស្សត្រូវមានសិទ្ធិ override
ក្នុងស្ថានភាពដែលប្រព័ន្ធកំណត់ថាអាចអនុញ្ញាតបាន។

មាន៖

- Cancel
- Stop
- Emergency Stop
- Manual Control
- Take Over
- Safe Mode
- Disable Automation
- Require Approval


Human Override ត្រូវមាន Audit Log។


============================================================
17. AUDIT & PROVENANCE
============================================================

រាល់ Action សំខាន់ត្រូវអាច trace បាន៖

User
 ↓
Conversation
 ↓
Intent
 ↓
Context
 ↓
Plan
 ↓
Authorization
 ↓
Safety
 ↓
Command
 ↓
Gateway
 ↓
Device
 ↓
Telemetry
 ↓
Verification
 ↓
Result


Audit Data:

actor
userId
organizationId
action
resource
commandId
planId
deviceId
timestamp
result
reason
source
ip / session context
metadata


Secrets មិនត្រូវដាក់ក្នុង Audit Log។


============================================================
18. TIME ENGINE — ប្រព័ន្ធម៉ោង
============================================================

TIME គឺជាផ្នែក CORE របស់ AI → AGI
មិនមែនត្រឹមតែបង្ហាញម៉ោងលើ UI ទេ។

AI ត្រូវយល់៖

DATE
TIME
TIMEZONE
UTC
LOCAL TIME
DAY
WEEK
MONTH
YEAR
DURATION
DEADLINE
SCHEDULE
INTERVAL
TIMEOUT
EXPIRATION


============================================================
19. TIME STANDARD
============================================================

Internal system time:

UTC

ឧទាហរណ៍:

2026-08-05T00:00:00Z


UI អាចបង្ហាញជា Local Time។

ឧទាហរណ៍៖

Cambodia:
UTC+07:00


IMPORTANT:

Database / Audit / Event Timestamp
→ គួររក្សាទុកជា UTC

UI
→ Convert ទៅ Time Zone របស់ User


============================================================
20. TIMESTAMP TYPES
============================================================

createdAt
updatedAt
startedAt
completedAt
sentAt
receivedAt
acknowledgedAt
executedAt
verifiedAt
expiresAt
scheduledAt
lastSeenAt
lastTelemetryAt


រាល់ Timestamp ត្រូវមានន័យច្បាស់លាស់។


============================================================
21. TIME ZONE
============================================================

User Time Zone
Organization Time Zone
Device Time Zone
Server Time Zone

AI ត្រូវមិនសន្មត់ថា
Server Time = User Time។

ឧទាហរណ៍៖

Server:
UTC

User:
Asia/Phnom_Penh

Device:
Asia/Bangkok

AI ត្រូវបម្លែងពេលវេលាឱ្យត្រឹមត្រូវ
មុនពេលបង្ហាញ ឬកំណត់ Schedule។


============================================================
22. CLOCK / CURRENT TIME
============================================================

AI UI គួរមាន៖

CURRENT DATE
CURRENT TIME
TIMEZONE
UTC OFFSET

ឧទាហរណ៍៖

2026-08-05
07:18
Asia/Phnom_Penh
UTC+07:00


============================================================
23. SCHEDULER
============================================================

AI អាចរៀបចំការងារ៖

RUN NOW
RUN LATER
RUN AT
RUN EVERY
RUN DAILY
RUN WEEKLY
RUN MONTHLY
RUN ON CONDITION


ឧទាហរណ៍៖

"បើកម៉ាស៊ីនត្រជាក់នៅម៉ោង 18:00"

AI:

scheduleId
target
action
timezone
scheduledAt
status


============================================================
24. DEADLINE
============================================================

Task អាចមាន៖

deadline
timeout
expiration

ឧទាហរណ៍៖

Task:
Open Gate

Deadline:
18:30

Timeout:
30 seconds

Expiration:
18:35


============================================================
25. TIMEOUT
============================================================

រាល់ External Action
ត្រូវមាន Timeout។

ឧទាហរណ៍៖

Command sent
 ↓
Wait 10 seconds
 ↓
No ACK
 ↓
TIMEOUT
 ↓
Retry / Fail / Escalate


កុំឱ្យ AI រង់ចាំអស់កំណត់។


============================================================
26. SCHEDULE SAFETY
============================================================

Scheduled Action
ក៏ត្រូវឆ្លងកាត់៖

Authentication Context
↓
Authorization
↓
Safety
↓
Current Device State
↓
Command


មិនមែន Schedule ម្តង
ហើយអនុវត្តដោយមិនពិនិត្យ Safety ម្តងទៀតទេ។


============================================================
27. TIME-BASED SAFETY
============================================================

អាចកំណត់ Rule ដូចជា៖

Allowed Hours
Restricted Hours
Maintenance Window
Quiet Hours
Emergency Window
Business Hours


ឧទាហរណ៍៖

Device Control:
08:00–18:00

Outside window:
REQUIRE APPROVAL


============================================================
28. CLOCK SYNCHRONIZATION
============================================================

ប្រព័ន្ធដែលពឹងផ្អែកលើពេលវេលា
ត្រូវយកចិត្តទុកដាក់លើ៖

Server Clock
Database Clock
Gateway Clock
Device Clock
Client Clock


ប្រសិនបើ Clock ខុសគ្នាខ្លាំង
AI មិនគួរធ្វើសកម្មភាព Sensitive ដោយគ្មាន validation។


============================================================
29. TIME EVENTS
============================================================

AI អាចគ្រប់គ្រង Event:

TIME_STARTED
TIME_UPDATED
TIMEOUT
DEADLINE_REACHED
SCHEDULED
EXPIRED
RETRY_AFTER
MAINTENANCE_START
MAINTENANCE_END


============================================================
30. NOTIFICATION ENGINE
============================================================

AI អាចជូនដំណឹង៖

INFO
WARNING
SUCCESS
ERROR
SAFETY
SECURITY
EMERGENCY
SYSTEM


Notification ត្រូវមាន៖

notificationId
userId
type
title
message
createdAt
readAt
priority
source


============================================================
31. SECURITY
============================================================

Security Principles:

ZERO TRUST
LEAST PRIVILEGE
FAIL CLOSED
FAIL SAFE
DEFENSE IN DEPTH


ត្រូវមាន៖

Authentication
Authorization
RBAC
Session Security
Token Security
Rate Limiting
Input Validation
Audit Logging
Secret Management
Encryption
Secure Transport


============================================================
32. DATA SECURITY
============================================================

Sensitive Data:

Password
Token
API Key
Secret
Private Key
Credentials

មិនត្រូវ៖

- បង្ហាញក្នុង UI
- Log ជា Plain Text
- Audit ជា Plain Text
- Commit ទៅ Git
- បញ្ចូលក្នុង Source Code


Passwords:

passwordHash

មិនរក្សាទុក password plain text។


============================================================
33. AI SAFETY
============================================================

AI មិនត្រូវ៖

- Bypass authorization
- Bypass safety
- Guess missing permission
- Execute dangerous action without required approval
- Hide failures
- Claim success without verification
- Invent telemetry
- Invent device state


AI ត្រូវប្រាប់ភាពមិនប្រាកដច្បាស់លាស់។


============================================================
34. EXPLAINABILITY
============================================================

AI អាចពន្យល់ Action ជា Structured Reason:

Intent
Target
Permission
Safety Result
Action
Result
Verification


មិនចាំបាច់បង្ហាញ internal chain-of-thought
ទេ។

បង្ហាញតែ៖

"Action allowed because..."
"Action blocked because..."
"Verification failed because..."


============================================================
35. AI LEVELS
============================================================

LEVEL 1 — UNDERSTAND

Text
Voice
Vision
Documents
Sensors


LEVEL 2 — REASON

Context
Memory
Intent
Reasoning
Planning


LEVEL 3 — CONTROL

Authentication
Authorization
Safety
Command


LEVEL 4 — ACT

Gateway
Protocol
Device
Service


LEVEL 5 — LEARN

Observe
Verify
Feedback
Approved Memory
Improvement


Cross-Cutting:

SECURITY
SAFETY
AUDIT
TIME


============================================================
36. AI → AGI DEVELOPMENT PATH
============================================================

PHASE 1
AI INTERFACE

PHASE 2
UNDERSTANDING

PHASE 3
CONTEXT + MEMORY

PHASE 4
REASONING

PHASE 5
PLANNING

PHASE 6
AUTHORIZATION + SAFETY

PHASE 7
COMMAND ENGINE

PHASE 8
GATEWAY / PROTOCOL

PHASE 9
DEVICE CONTROL

PHASE 10
TELEMETRY

PHASE 11
VERIFICATION

PHASE 12
FAILURE / RECOVERY

PHASE 13
AUDIT / PROVENANCE

PHASE 14
CONTROLLED LEARNING

PHASE 15
MULTI-DOMAIN INTELLIGENCE


============================================================
37. MULTI-DOMAIN
============================================================

AI Platform អាចពង្រីកទៅ៖

FLEET
VEHICLE
ROBOT
HVAC
ENERGY
AGRICULTURE
MARINE
HEALTHCARE
EDUCATION
LOGISTICS
SECURITY
SMART BUILDING
INDUSTRIAL
FINANCE
MARKET
MEDIA
INFORMATION SYSTEMS


Domain មួយៗមាន៖

Domain Context
Domain Rules
Domain Devices
Domain Actions
Domain Safety
Domain Telemetry


============================================================
38. MODULAR ARCHITECTURE
============================================================

AI

├── UI
├── API
├── AUTH
├── AI ENGINE
├── INTENT
├── CONTEXT
├── MEMORY
├── REASONING
├── PLANNING
├── COMMAND
├── SAFETY
├── SECURITY
├── GATEWAY
├── PROTOCOLS
├── DEVICES
├── TELEMETRY
├── VERIFICATION
├── AUTOMATION
├── SCHEDULER
├── TIME
├── NOTIFICATION
├── AUDIT
├── DATABASE
├── CONFIG
└── TESTS


============================================================
39. DATABASE CORE
============================================================

Core Entities:

Users
Organizations
Roles
Permissions
Sessions
Devices
DeviceCapabilities
DeviceStates
Commands
CommandResults
Plans
PlanSteps
SafetyRules
SafetyLogs
Telemetry
Events
Schedules
Notifications
AuditLogs
AIConversations
AIContexts
AIMemory


Database Model
ត្រូវមាន Single Source of Truth
សម្រាប់ Field Names និង Relations។


============================================================
40. API ARCHITECTURE
============================================================

/api/auth
/api/users
/api/organizations
/api/devices
/api/devices/:id/commands
/api/commands
/api/plans
/api/safety
/api/telemetry
/api/events
/api/schedules
/api/time
/api/notifications
/api/audit
/api/ai
/api/ai/intent
/api/ai/plan
/api/ai/execute
/api/ai/status


============================================================
41. AI COMMAND API
============================================================

POST

/api/devices/:id/commands

Flow:

Request
 ↓
Authentication
 ↓
Permission
 ↓
Rate Limit
 ↓
Input Validation
 ↓
Organization Check
 ↓
Safety Evaluation
 ↓
Command Creation
 ↓
Gateway Dispatch
 ↓
Device ACK
 ↓
Telemetry
 ↓
Verification
 ↓
Audit
 ↓
Response


============================================================
42. AI RESPONSE MODEL
============================================================

AI Response គួរមាន Structured Result:

{
    requestId,
    intent,
    status,
    message,
    planId,
    commandId,
    deviceId,
    timestamp,
    result,
    verification,
    error
}


Status Examples:

UNDERSTOOD
PLANNED
AUTHORIZED
BLOCKED
DISPATCHED
EXECUTING
SUCCESS
FAILED
TIMEOUT
CANCELLED
UNKNOWN


============================================================
43. OBSERVABILITY
============================================================

ប្រព័ន្ធត្រូវអាចដឹង៖

Health
Latency
Errors
Command Count
Success Count
Failure Count
Timeout Count
Safety Blocks
Authentication Failures
Gateway Status
Device Online Count
Device Offline Count
Telemetry Freshness


Metrics ត្រូវមាន Timestamp។


============================================================
44. SYSTEM STATUS
============================================================

AI Dashboard អាចបង្ហាញ៖

AI ENGINE
ONLINE

DATABASE
CONNECTED

GATEWAY
ONLINE

DEVICE NETWORK
ONLINE / DEGRADED / OFFLINE

SAFETY ENGINE
ACTIVE

AUTH SERVICE
ACTIVE

TIME SERVICE
SYNCED

TELEMETRY
LIVE / STALE / OFFLINE


============================================================
45. DATA STATUS
============================================================

រាល់ Data Point គួរមាន៖

LIVE
STALE
OFFLINE
FALLBACK

Source Type:

AUTHORIZED_PRIMARY
SECONDARY_CACHE
CALCULATED_ENGINE


មិនត្រូវបង្ហាញ Data ចាស់
ជាទិន្នន័យ Live ដោយមិនបញ្ជាក់។


============================================================
46. GLOBAL TIME SERVICE
============================================================

Time Service គឺជា Core Service។

Responsibilities:

- UTC Clock
- User Time Zone
- Organization Time Zone
- Device Time Zone
- Timestamp
- Duration
- Deadline
- Timeout
- Schedule
- Expiration
- Clock Health
- Time Synchronization


============================================================
47. TIME API
============================================================

GET /api/time

Response concept:

{
    utc,
    localTime,
    timezone,
    offset,
    date,
    day,
    month,
    year,
    unixTimestamp
}


Optional:

GET /api/time/:timezone

ឧទាហរណ៍:

/api/time/Asia/Phnom_Penh


============================================================
48. TIME + AI
============================================================

AI Query:

"ម៉ោងនេះម៉ោងប៉ុន្មាន?"

AI:
Current local time.

AI Query:

"នៅ Tokyo ម៉ោងប៉ុន្មាន?"

AI:
Convert UTC → Asia/Tokyo.


AI Query:

"បើកឧបករណ៍នៅម៉ោង 20:00"

AI:

Understand timezone
→ create schedule
→ authorize
→ safety check at execution time
→ execute
→ verify


============================================================
49. TIME + MEMORY
============================================================

Memory Record:

memoryId
userId
content
createdAt
updatedAt
expiresAt
timezone
source
confidence
approvalStatus


Time-sensitive memory
ត្រូវមាន expiration
បើវាមិនគួររក្សាទុកអស់កាល។


============================================================
50. TIME + AUDIT
============================================================

Audit Example:

actor:
USER

action:
DEVICE_COMMAND

device:
DEV-XXXX

createdAt:
UTC

localTime:
Asia/Phnom_Penh

result:
SUCCESS

verifiedAt:
UTC


============================================================
51. AGI PRINCIPLE
============================================================

AGI នៅក្នុង Vision របស់កម្មវិធី AI
មិនមែនមានន័យថា
"AI ធ្វើអ្វីគ្រប់យ៉ាងដោយគ្មានការគ្រប់គ្រង" ទេ។

AGI Architecture:

UNDERSTAND
+
REASON
+
PLAN
+
AUTHORIZE
+
ACT
+
OBSERVE
+
VERIFY
+
LEARN


Learning ត្រូវមាន Control.


============================================================
52. CORE PRINCIPLES
============================================================

1. SECURITY FIRST
2. SAFETY FIRST
3. PRIVACY FIRST
4. HUMAN OVERSIGHT
5. LEAST PRIVILEGE
6. FAIL SAFE
7. FAIL CLOSED
8. VERIFY BEFORE CLAIMING SUCCESS
9. AUDIT EVERYTHING IMPORTANT
10. TIME-AWARE SYSTEM
11. MODULAR ARCHITECTURE
12. SINGLE SOURCE OF TRUTH
13. NO FAKE LIVE DATA
14. NO UNAUTHORIZED CONTROL
15. CONTROLLED LEARNING


============================================================
53. FINAL SYSTEM FLOW
============================================================

                    HUMAN
                      │
                      ▼
                 ┌─────────┐
                 │   AI    │
                 └────┬────┘
                      │
                      ▼
               UNDERSTANDING
                      │
                      ▼
              CONTEXT + MEMORY
                      │
                      ▼
                  REASONING
                      │
                      ▼
                  PLANNING
                      │
                      ▼
               AUTHORIZATION
                      │
                      ▼
                   SAFETY
                      │
                      ▼
               ACTION PLANNER
                      │
                      ▼
               COMMAND ENGINE
                      │
                      ▼
              GATEWAY / PROTOCOL
                      │
                      ▼
                  DEVICE
                      │
                      ▼
                 TELEMETRY
                      │
                      ▼
                VERIFICATION
                      │
                      ▼
                   RESULT
                      │
                      ▼
                    AUDIT
                      │
                      ▼
                 FEEDBACK
                      │
                      ▼
             CONTROLLED LEARNING
                      │
                      └──────────► AI


============================================================
54. PROGRAM NAME
============================================================

Official Application / Page Name:

AI

System Vision:

AI → AGI

Description:

UNIVERSAL INTELLIGENT CONTROL PLATFORM

Core Objective:

UNDERSTAND
DECIDE
ACT
VERIFY
LEARN


============================================================
55. FINAL IDENTITY
============================================================

APPLICATION:
AI

PLATFORM:
AI → AGI

TYPE:
Universal Intelligent Control Platform

CORE:
Understand → Reason → Plan → Control → Act → Verify → Learn

SECURITY:
Authentication + Authorization + Safety + Audit

TIME:
UTC + Timezone + Schedule + Timeout + Deadline + Verification

DEVICE:
Gateway + Protocol + Command + Telemetry

INTELLIGENCE:
Intent + Context + Memory + Reasoning + Planning

AGI DIRECTION:
Multi-domain + Multi-step + Feedback + Controlled Learning


============================================================
END
============================================================

AI
AI → AGI

UNDERSTAND
DECIDE
ACT
VERIFY
LEARN

SECURITY FIRST
SAFETY FIRST
PRIVACY FIRST
HUMAN OVERSIGHT

============================================================

💻 សរសេរ និងវិភាគកូដ — Python, TypeScript, JavaScript, SQL ជាដើម
📊 វិភាគទិន្នន័យ — CSV, Excel, JSON, database និង metrics
📄 អាន និងវិភាគឯកសារ — PDF, DOCX, reports, specifications
🧠 ចងចាំ Context និង Project Knowledge — ដើម្បីកុំឱ្យបងពន្យល់គម្រោងដដែលៗរាល់ពេល
🔍 Debug និង Audit Project — ពិនិត្យ structure, dependencies, errors, security និង consistency
⚙️ ធ្វើ Automation — រៀបចំការងារដែលធ្វើដដែលៗ
🕐 Time/Schedule — កាលវិភាគ, deadline, timeout និង timezone
🔐 Security + Permission + Safety — មិនឱ្យ AI ធ្វើសកម្មភាពដែលគ្មានសិទ្ធិ
📡 Device/Gateway Integration — នៅពេល architecture និង hardware gateway រួចរាល់
📈 Monitor និង Verify — មិនគ្រាន់តែប្រាប់ថា “success” ប៉ុណ្ណោះ តែពិនិត្យលទ្ធផលពិត
🤖 Multi-step tasks — បែងចែកការងារធំទៅជា Plan → Steps → Verify → Result

                 ┌─────────────────┐
                 │       AI        │
                 │   Assistant     │
                 └────────┬────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
      CODING            DATA            DOCUMENTS
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    MEMORY / CONTEXT
                          │
                    REASONING / PLAN
                          │
                 SECURITY / SAFETY
                          │
                    TOOLS / ACTION
                          │
                    VERIFY / AUDIT
                          │
                      RESULT

AI USER USAGE SYSTEM
====================

USER
 ↓
PLAN / TIER
 ↓
USAGE LIMIT
 ↓
USAGE MONITOR
 ↓
WARNING
 ↓
LIMIT REACHED
 ↓
TEMPORARY RESTRICTION
 ↓
RESET / UPGRADE / WAIT

MESSAGE LIMIT
FILE LIMIT
FILE SIZE LIMIT
CONTEXT LIMIT
AI TOKEN / COMPUTE LIMIT
VISION LIMIT
DATA ANALYSIS LIMIT
CODE ANALYSIS LIMIT
STORAGE LIMIT
AUTOMATION LIMIT
API LIMIT
DAILY LIMIT
MONTHLY LIMIT

FREE
- ការប្រើប្រាស់មានកំណត់
- File size មានកំណត់
- Daily usage មានកំណត់
- Storage មានកំណត់

STANDARD
- Usage ខ្ពស់ជាង FREE
- Files ច្រើនជាង
- Context ធំជាង
- Storage ច្រើនជាង

PRO
- Usage ខ្ពស់
- Large files
- Advanced analysis
- Automation ច្រើន
- Higher storage

ENTERPRISE
- Organization
- Admin controls
- Custom limits
- Audit
- Security policies
- Dedicated resources

LIMIT REACHED
      ↓
STOP NEW REQUESTS
      ↓
KEEP HISTORY
      ↓
SHOW USAGE
      ↓
SHOW RESET TIME
      ↓
USER CAN WAIT / UPGRADE

usageId
userId
organizationId
planId
resourceType
amountUsed
limit
remaining
periodStart
periodEnd
createdAt

AI USAGE
────────────────────

Today
████████░░  80%

Messages
120 / 150

Files
8 / 10

AI Analysis
34 / 50

Storage
2.4 GB / 5 GB

Reset
23h 14m

USER PAYMENT
      ↓
AI PLATFORM
      ↓
OPERATING COST
      ↓
INFRASTRUCTURE
      ↓
AI / MODEL COST
      ↓
STORAGE
      ↓
SECURITY
      ↓
DEVELOPMENT
      ↓
REINVESTMENT
      ↓
BETTER AI

📜 ចុចទីនេះដើម្បីមើល វិញ្ញាបនបត្រ Sololearn ទាំងអស់ (Sololearn Certificates)
Certificate #1 https://api2.sololearn.com/v2/certificates/CC-4WMNT8MZ/image/png?t=639211314186882960 Certificate #2 https://api2.sololearn.com/v2/certificates/CC-FQXPSLUW/image/png?t=639114126319491590 Certificate #3 https://api2.sololearn.com/v2/certificates/CC-T1WYSOHU/image/png?t=639218531599541850 Certificate #4 https://api2.sololearn.com/v2/certificates/CC-I6OFSBAU/image/png?t=639221583443257000 Certificate #5 https://api2.sololearn.com/v2/certificates/CC-IXX7OEVL/image/png?t=639129089670279240 Certificate #6 https://api2.sololearn.com/v2/certificates/CC-AYYCWFZD/image/png?t=639213017982820410 Certificate #7 https://api2.sololearn.com/v2/certificates/CC-3LIHOX01/image/png?t=639149755075790680 Certificate #8 https://api2.sololearn.com/v2/certificates/CC-HAW7ZIH5/image/png?t=639127071272290510 Certificate #9 https://api2.sololearn.com/v2/certificates/CC-U8DL49ZZ/image/png?t=639128642579113120 Certificate #10 https://api2.sololearn.com/v2/certificates/CC-SI2WZX43/image/png?t=639128879870325970 Certificate #11 https://api2.sololearn.com/v2/certificates/CC-SUOWGF8T/image/png?t=639129397891636970 Certificate #12 https://api2.sololearn.com/v2/certificates/CC-I4TIACOI/image/png?t=639129633525792890 Certificate #13 https://api2.sololearn.com/v2/certificates/CC-GT2PAJTL/image/png?t=639130145139061920 Certificate #14 https://api2.sololearn.com/v2/certificates/CC-CCYNOT2R/image/png?t=639130171535224370 Certificate #15 https://api2.sololearn.com/v2/certificates/CC-ZYSDAZM8/image/png?t=639130228680226390 Certificate #16 https://api2.sololearn.com/v2/certificates/CC-7ABADG4R/image/png?t=639130271146365570 Certificate #17 https://api2.sololearn.com/v2/certificates/CC-DBRL4YLD/image/png?t=639131460155620180 Certificate #18 https://api2.sololearn.com/v2/certificates/CC-033EXHKA/image/png?t=639132345227292480 Certificate #19 https://api2.sololearn.com/v2/certificates/CC-UYFGANZQ/image/png?t=639132373592160560 Certificate #20 https://api2.sololearn.com/v2/certificates/CC-2M47YBCR/image/png?t=639132404731128520 Certificate #21 https://api2.sololearn.com/v2/certificates/CC-WKCFVLYI/image/png?t=639132438814129950 Certificate #22 https://api2.sololearn.com/v2/certificates/CC-CRBRNFSO/image/png?t=639132486370977210 Certificate #23 https://api2.sololearn.com/v2/certificates/CC-SUEHSLUF/image/png?t=639132518202129160 Certificate #24 https://api2.sololearn.com/v2/certificates/CC-SI4N5SIB/image/png?t=639132552000527100 Certificate #25 https://api2.sololearn.com/v2/certificates/CC-ZTIH8SKI/image/png?t=639132624414342210 Certificate #26 https://api2.sololearn.com/v2/certificates/CC-OFASKCAF/image/png?t=639136631237077950 Certificate #27 https://api2.sololearn.com/v2/certificates/CC-SCJHQBG0/image/png?t=639133282834683540 Certificate #28 https://api2.sololearn.com/v2/certificates/CC-JAJVCQCJ/image/png?t=639133319713608600 Certificate #29 https://api2.sololearn.com/v2/certificates/CC-DJ9YJOG5/image/png?t=639133354278903030 Certificate #30 https://api2.sololearn.com/v2/certificates/CC-FYISPG0F/image/png?t=639139227658362860 Certificate #31 https://api2.sololearn.com/v2/certificates/CC-AXMQ8X3Q/image/png?t=639138317832565410 Certificate #32 https://api2.sololearn.com/v2/certificates/CC-OU33MLMF/image/png?t=639142032442792440 Certificate #33 https://api2.sololearn.com/v2/certificates/CC-K47BIVEI/image/png?t=639147137885562720 Certificate #34 https://api2.sololearn.com/v2/certificates/CC-AREK9EJE/image/png?t=639154446519468340 Certificate #35 https://api2.sololearn.com/v2/certificates/CC-6ZXHTBFA/image/png?t=639158173295795190 Certificate #36 https://api2.sololearn.com/v2/certificates/CC-ZDBUNAIR/image/png?t=639156230587386000 Certificate #37 https://api2.sololearn.com/v2/certificates/CC-2SCXNBZ6/image/png?t=639220875861304820 Certificate #38 https://api2.sololearn.com/v2/certificates/CC-CAZPORAO/image/png?t=639214762709896540 Certificate #39 https://api2.sololearn.com/v2/certificates/CC-S072WEWW/image/png?t=639220816092789140 Certificate #40 https://api2.sololearn.com/v2/certificates/CC-OP1HINXS/image/png?t=639222163892448310 Certificate #41 https://api2.sololearn.com/v2/certificates/CC-GPX6LLCC/image/png?t=639222232281084110 Certificate #42 https://api2.sololearn.com/v2/certificates/CC-8VRSVYY8/image/png?t=639223768700061080 Certificate #43 https://api2.sololearn.com/v2/certificates/CC-IGJZ5ICG/image/png?t=639224674159806284 Certificate #44 https://api2.sololearn.com/v2/certificates/CC-NIHNI6RW/image/png?t=639224739175951367 Certificate #45 https://api2.sololearn.com/v2/certificates/CC-PKZFLGAF/image/png?t=639224766824092049 Certificate #46 https://api2.sololearn.com/v2/certificates/CC-BXKK8SSV/image/png?t=639225729535120880 Certificate​ #47 https://api2.sololearn.com/v2/certificates/CC-L8HOE7QV/image/png?t=639227517866924285
