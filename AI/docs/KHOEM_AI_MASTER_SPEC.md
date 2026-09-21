icy
maxRetries
sandboxOnly
requiresApproval
inputSchema
outputSchema
auditFields

Tools must never bypass the Policy Engine.

========================================================
50. MASTER EXECUTION PIPELINE
========================================================

Goal
 -> Idea
 -> Plan
 -> Sandbox
 -> Experiment
 -> Evaluate
 -> Proposal
 -> Permission
 -> Policy
 -> Human Approval
 -> Execute
 -> Verify
 -> Version
 -> Rollback (if verification fails)
 -> Learn

Rules:
- No stage may be skipped.
- Execute is reachable only after Policy = ALLOW
  and (for HIGH/CRITICAL) Human Approval = APPROVE.
- Learn only stores verified results, with provenance.
- Every stage emits an event trace and audit record.

========================================================
51. IMPLEMENTATION ORDER (PHASES)
========================================================

Phase 1: Repository audit (no changes)
Phase 2: Status engine + /api/status (real status only)
Phase 3: Permission + Policy engine + risk levels
Phase 4: Task/Goal engine + state machines
Phase 5: Event trace + append-only audit log
Phase 6: Approval gate + Kill switch
Phase 7: Sandbox + Experiment engine
Phase 8: Ideation + Planning engines
Phase 9: Versioning + Rollback
Phase 10: Control Center UI (keep Black 3D design)

One phase per commit. Test before each commit.

========================================================
52. ACCEPTANCE CRITERIA
========================================================

- /api/chat, /learn, /learned, /forget, /scan, /read,
  /funcs, /check, /help still work
- Khmer and English still work
- /api/status shows real states, no fake READY
- Default autonomy is L3 or lower
- AI cannot raise its own autonomy
- STOP ALL pauses autonomy and preserves data
- No secrets in status, logs, UI, or errors
- Every claim of success is backed by a test result
