// src/ai/permission.mjs — Permission + Policy Engine (standalone, additive)
import { randomUUID } from "node:crypto";
import { recordAuditEvent } from "./audit.mjs";

export const RISK = Object.freeze({ LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", CRITICAL: "CRITICAL" });
export const DECISION = Object.freeze({
  ALLOW: "ALLOW", DENY: "DENY", REQUIRE_APPROVAL: "REQUIRE_APPROVAL", SANDBOX_ONLY: "SANDBOX_ONLY",
});

// Phase 14 (spec 4.9): used to detect that policy/permission has changed
// after an approval request is made. Bump manually if the REGISTRY below changes.
const POLICY_VERSION = 1;
const PERMISSION_VERSION = 1;
export const getPolicyVersion = () => POLICY_VERSION;
export const getPermissionVersion = () => PERMISSION_VERSION;

// registry: action -> { permission, risk }
const REGISTRY = {
  "tool.scan": { permission: "tool.execute", risk: RISK.LOW },
  "tool.check": { permission: "tool.execute", risk: RISK.LOW },
  "tool.find": { permission: "file.read", risk: RISK.LOW },
  "tool.funcs": { permission: "file.read", risk: RISK.LOW },
  "tool.read": { permission: "file.read", risk: RISK.LOW },
  "knowledge.readLearned": { permission: "knowledge.read", risk: RISK.LOW },
  "learning.write": { permission: "knowledge.write", risk: RISK.MEDIUM },
  "learning.delete": { permission: "knowledge.write", risk: RISK.MEDIUM },
  // Phase 14 (spec 4.13): mock only to test the pipeline — no real effect
  "approval.test.high-risk": { permission: "system.modify", risk: RISK.HIGH },
  // Phase 12: emergency stop / resume. MEDIUM = auto-ALLOW so kill is instant.
  // TODO: raise "system.resume" to RISK.HIGH once execute-after-approval
  // pipeline exists for real (non-mock) actions.
  "system.kill": { permission: "system.modify", risk: RISK.MEDIUM },
  "system.resume": { permission: "system.modify", risk: RISK.MEDIUM },
  // Phase 13: rollback snapshots/plans are read-only — no destructive
  // execution happens through the API, so LOW risk / auto-ALLOW is safe.
  "rollback.snapshot": { permission: "system.read", risk: RISK.LOW },
  "rollback.plan": { permission: "system.read", risk: RISK.LOW },
  // Phase 20: sandbox tests run against a temp copy only — production
  // is never touched, so MEDIUM/auto-ALLOW is appropriate. Applying a
  // verified sandbox result to production (Phase 21) will be HIGH risk.
  "code.sandboxTest": { permission: "tool.execute", risk: RISK.MEDIUM },
  // Phase 21: proposing a patch only runs it in sandbox (no production
  // write) so MEDIUM/auto-ALLOW is safe. Applying it is a real write to
  // src/ and always requires human approval regardless of sandbox result.
  "code.proposePatch": { permission: "tool.execute", risk: RISK.MEDIUM },
  "code.applyPatch": { permission: "code.write", risk: RISK.HIGH },
  // Phase 22 verification (tsc/build/tests):
  // - cannot modify source files
  // - may generate temporary/runtime test artifacts (e.g. audit-log.test.jsonl)
  // - cannot perform production actions
  // - cannot bypass permission/policy checks
  "code.verify": { permission: "tool.execute", risk: RISK.LOW },
};

const MAX_AUDIT = 500;
const auditLog = [];

function recordAudit(entry) {
  auditLog.push(entry);
  if (auditLog.length > MAX_AUDIT) auditLog.shift();
  recordAuditEvent("POLICY_" + entry.decision, entry);
  return entry;
}

export function policyCheck(action, actor = "user") {
  const spec = REGISTRY[action];
  const timestamp = new Date().toISOString();
  if (!spec) {
    return recordAudit({
      id: randomUUID(), timestamp, actor, action, permission: null,
      risk: RISK.CRITICAL, approvalRequired: false, decision: DECISION.DENY,
      reason: "unregistered action — fail safe",
    });
  }
  const decision = (spec.risk === RISK.HIGH || spec.risk === RISK.CRITICAL)
    ? DECISION.REQUIRE_APPROVAL
    : DECISION.ALLOW;
  return recordAudit({
    id: randomUUID(), timestamp, actor, action, permission: spec.permission,
    risk: spec.risk, approvalRequired: decision === DECISION.REQUIRE_APPROVAL,
    decision,
  });
}

export const getAudit = (limit = 50) => auditLog.slice(-limit);
