// src/ai/permission.mjs — Permission + Policy Engine (standalone, additive)
import { randomUUID } from "node:crypto";

export const RISK = Object.freeze({ LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", CRITICAL: "CRITICAL" });
export const DECISION = Object.freeze({
  ALLOW: "ALLOW", DENY: "DENY", REQUIRE_APPROVAL: "REQUIRE_APPROVAL", SANDBOX_ONLY: "SANDBOX_ONLY",
});

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
};

const MAX_AUDIT = 500;
const auditLog = [];

function recordAudit(entry) {
  auditLog.push(entry);
  if (auditLog.length > MAX_AUDIT) auditLog.shift();
  return entry;
}

export function policyCheck(action, actor = "user") {
  const spec = REGISTRY[action];
  const timestamp = new Date().toISOString();
  if (!spec) {
    return recordAudit({
      id: randomUUID(), timestamp, actor, action, permission: null,
      risk: RISK.CRITICAL, approvalRequired: true, decision: DECISION.DENY,
      reason: "unregistered action — fail safe",
    });
  }
  // Policy: LOW/MEDIUM => ALLOW. HIGH/CRITICAL => REQUIRE_APPROVAL (none exist yet).
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
