# AI Project - 35 Module Unified Architecture

## 1. Purpose

The AI project contains 35 active src/ai/*.mjs modules. These modules must remain separate according to their responsibilities while working together as one coherent AI system.

The goal is NOT: 35 files -> 1 file

The goal is: 35 specialized modules -> clear responsibilities -> clear interfaces -> correct imports/connections -> unified orchestration -> one working AI system

## 2. Running API

The backend API is part of the project and currently runs through:

- Root: ~/ai-project/AI
- Backend: server.mjs
- Port: 8787
- Start command: npm run server

Architecture work must preserve the existing API contract unless an explicit change is required and verified. Do not unnecessarily stop, rewrite, or replace the running API.

## 3. Principles

DO:
- Scan before editing
- Read existing code before edit
- Reuse existing modules
- Connect existing modules before creating new ones
- Preserve each module's responsibility
- Preserve API compatibility
- Test all significant changes
- Verify imports and dependency flow
- Verify Git status and diff before commit
- Commit only relevant files
- Push after successful verification

DO NOT:
- Merge the 35 files into one file
- Create duplicate files
- Create a new Language Center before reviewing the old architecture
- Rewrite protected core just to make tests pass
- Change API behavior unnecessarily
- Delete backup files without reference/history verification
- Push without checking git diff
- Assume a module is unused without checking references

## 4. Target Architecture

server.mjs -> API Layer -> khoem.mjs (Master/Router/Orchestrator) -> Language Center -> Language Registry -> Specific Language Module -> Knowledge/Retrieval/Interpretation -> Policy/Permission -> Approval when required -> Execution/Response -> Audit -> Final Response

Conversation Flow:
User Input -> Master/Router/Orchestrator -> Language Center -> Language Registry -> Specific Language Module -> Knowledge/Retrieval/Interpretation -> Response -> Audit -> Final Response

Action/Execution Flow:
User Input -> Master/Router/Orchestrator -> Language Center -> Language Registry -> Specific Language Module -> Knowledge/Retrieval/Interpretation -> Policy/Permission -> Approval when required -> Execution -> Audit -> Response -> Final Response

Important: Conversation requests do not automatically require execution. Execution is only reached when the request represents an action that passes the existing policy, permission, approval, and security architecture.

## 5. The 35 Modules Must Run as One System

Modules do not share the same responsibility. Separation must be preserved.

A. Master / Orchestration: khoem.mjs, core.mjs -- Master AI flow, routing, coordination, orchestration, connection between subsystems. khoem.mjs must not become a giant language-content file.

B. API: api.mjs -- API integration, request/response handling, connecting the API layer to the AI architecture. The existing API contract must be preserved.

C. Human Language: Currently english.mjs, chinese.mjs, plus existing Khmer behavior. Future language modules should connect through: Language Center -> Language Registry -> Specific Language Module. Language routing should not be entirely hard-coded inside khoem.mjs if a registry architecture can handle it.

## 6. UI i18n vs. AI Language Architecture

These must remain distinct.

src/i18n/ -> UI Translation (sidebar, buttons, menus, interface text)

src/ai/ -> AI Conversational Language Architecture (user language detection, conversation, interpretation, response generation, language routing, language-specific knowledge)

UI i18n dictionaries must not be used as a substitute for AI conversational language modules.

## 7. Code / Programming Language Architecture

Programming languages (JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, Dart, ...) are separate from human conversational languages.

Detection and analysis must reuse existing infrastructure: langCheckers.mjs, codeDataCenter.mjs, find.mjs, tools.mjs. Do not create duplicate checkers without need.

## 8. Knowledge Architecture

Knowledge must stay separate from executable language modules: Language Module -> Interpretation -> Knowledge/Retrieval -> Response. Knowledge should not be duplicated into each language module unnecessarily.

## 9. Security / Policy / Audit

Existing security architecture must be preserved. Protected Core modules must not be rewritten to accommodate new architecture without genuine need.

Input -> Language/Interpretation -> Policy -> Permission -> Approval if required -> Execution/Response -> Audit

Language routing must not bypass the security architecture.

## 10. Protected Core

The official Protected Core contains 19 files: memory.mjs, status.mjs, tasks.mjs, session.mjs, goal.mjs, permission.mjs, approvals.mjs, audit.mjs, killswitch.mjs, verification.mjs, rollback.mjs, sandbox.mjs, patch.mjs, budget.mjs, circuitBreaker.mjs, retry.mjs, metrics.mjs, model.mjs, modelRouting.mjs.

Protected means: "do not change behavior without genuine need and verification." Protected does not mean these modules cannot connect to other modules.

## 11. CODEOWNERS

All 35 direct src/ai/*.mjs modules are protected via CODEOWNERS. This protection must be preserved.

Protected by CODEOWNERS is not the same as Disconnected modules. Protection is for change control. Architecture is for connection and operation. Both must coexist.

## 12. Required Workflow

SCAN -> UNDERSTAND -> VERIFY -> PLAN -> CHANGE ONLY REQUIRED AREA -> TEST -> VERIFY FILE LOCATION -> VERIFY API -> GIT STATUS -> GIT DIFF -> COMMIT -> PUSH

Do not skip verification steps without reason.

## 13. Language Architecture Implementation Rule

Before creating a new Language Center or Language Registry, review: khoem.mjs, english.mjs, chinese.mjs, langCheckers.mjs, codeDataCenter.mjs, knowledge.mjs, core.mjs, api.mjs, src/language.ts, and their imports/references/tests.

Then decide: reuse, refactor, connect, extract, or create a new module -- in that order of preference. Creating a new file is the last option, not the first.

## 14. API Safety Rule

Since the backend API is running (server.mjs, port 8787), architecture changes must not break the API contract. After any integration, verify: server starts, API responds, existing tests pass, language routing works, existing functionality remains intact.

## 15. Final Architecture Goal

The goal is not 35 files -> 1 file. The goal is: 35 specialized modules -> clear responsibilities -> clear interfaces -> correct dependency graph -> unified orchestration -> one coherent AI system.

This allows the AI project to grow from Khmer, English, and Chinese to a larger language architecture, without breaking the API or creating duplicate architecture.

## 16. Documentation Rule

Every architecture change must keep documentation in sync with code. At minimum, review: README, Master Specification, API Documentation, Phase Reports, Architecture Documentation, CODEOWNERS/Protected Core documentation, Tests.

Documentation <-> Architecture <-> Implementation <-> Tests

Documentation must not describe one thing while the code does another.

## 17. Final Principle

Keep files separate, but make the system work together. Do not tear down what is working to build something new if existing pieces can be connected or reused instead. The running API is a critical part of the system and must be protected during architecture evolution. Every change requires verification before moving to the next step.
