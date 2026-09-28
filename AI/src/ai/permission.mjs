// src/ai/permission.mjs — Permission + Policy Engine (standalone, additive)
import { randomUUID } from "node:crypto";
import { recordAuditEvent } from "./audit.mjs";

import { RISK, REGISTRY } from "./policyRegistry.mjs";
export { RISK };
export const DECISION = Object.freeze({
  ALLOW: "ALLOW", DENY: "DENY", REQUIRE_APPROVAL: "REQUIRE_APPROVAL", SANDBOX_ONLY: "SANDBOX_ONLY",
});

// Phase 14 (spec 4.9): used to detect that policy/permission has changed
// after an approval request is made. Bump manually if the REGISTRY in policyRegistry.mjs changes.
const POLICY_VERSION = 2;
const PERMISSION_VERSION = 2;
export const getPolicyVersion = () => POLICY_VERSION;
export const getPermissionVersion = () => PERMISSION_VERSION;

// registry: action -> { permission, risk }
// REGISTRY now lives in policyRegistry.mjs (policy as data, validated by validatePolicyRegistry).

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
