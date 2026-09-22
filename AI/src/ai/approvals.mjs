// src/ai/approvals.mjs — Human Approval Gate (Phase 14, spec Part 4)
import { randomUUID } from "node:crypto";
import { getPolicyVersion, getPermissionVersion } from "./permission.mjs";
import { emit } from "./tasks.mjs";

export const APPROVAL = Object.freeze({
  PENDING: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
});

const ALLOWED = {
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "EXPIRED"],
  APPROVED: [],
  REJECTED: [],
  EXPIRED: [],
};

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 200;
const requests = new Map();

function auditApproval(type, req, extra = {}) {
  emit(req.taskId || req.id, type, {
    approvalId: req.id, actor: req.actor, action: req.action,
    risk: req.risk, permission: req.permission,
    decision: extra.decision, reason: extra.reason,
  });
}

export function createApprovalRequest({
  taskId, action, actor, permission, risk, reason,
  target, resource, metadata, ttlMs = DEFAULT_TTL_MS,
}) {
  const now = new Date().toISOString();
  const req = {
    id: randomUUID(),
    taskId: taskId || null,
    action, actor, permission, risk,
    reason: reason || "policy requires human approval",
    createdAt: now,
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    status: APPROVAL.PENDING,
    requestedBy: actor,
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    executedAt: null,
    metadata: metadata || {},
    resource: resource || null,
    target: target || null,
    policyVersion: getPolicyVersion(),
    permissionVersion: getPermissionVersion(),
    requestVersion: 1,
  };
  requests.set(req.id, req);
  if (requests.size > MAX_REQUESTS) requests.delete(requests.keys().next().value);
  auditApproval("APPROVAL_REQUESTED", req);
  return req;
}

function expireIfNeeded(req) {
  if (req.status === APPROVAL.PENDING && Date.now() > Date.parse(req.expiresAt)) {
    req.status = APPROVAL.EXPIRED;
    req.decidedAt = new Date().toISOString();
    req.decisionReason = "expired";
    auditApproval("APPROVAL_EXPIRED", req);
  }
  return req;
}

export function getApproval(id) {
  const req = requests.get(id);
  return req ? expireIfNeeded(req) : null;
}

export function listApprovals({ status } = {}) {
  const all = [...requests.values()].map(expireIfNeeded);
  return status ? all.filter((r) => r.status === status) : all;
}

function transitionApproval(id, to, { decidedBy, decisionReason }) {
  const req = requests.get(id);
  if (!req) return { error: "NOT_FOUND" };
  expireIfNeeded(req);
  if (!ALLOWED[req.status]?.includes(to)) {
    return { error: `INVALID_TRANSITION (${req.status} -> ${to})` };
  }
  // spec 4.6: a decision must be attributable to someone, and the requester
  // cannot also be the approver of their own request
  if (!decidedBy) {
    return { error: "DECIDER_REQUIRED" };
  }
  if (decidedBy === req.requestedBy) {
    return { error: "SELF_APPROVAL_FORBIDDEN" };
  }
  // spec 4.9: policy/permission must match what it was at request time — otherwise it is stale
  if (req.policyVersion !== getPolicyVersion() || req.permissionVersion !== getPermissionVersion()) {
    req.status = APPROVAL.EXPIRED;
    req.decidedAt = new Date().toISOString();
    req.decisionReason = "stale: policy/permission changed since request";
    auditApproval("APPROVAL_INVALIDATED", req, { reason: req.decisionReason });
    return { error: "STALE_APPROVAL" };
  }
  req.status = to;
  req.decidedBy = decidedBy;
  req.decidedAt = new Date().toISOString();
  req.decisionReason = decisionReason || null;
  auditApproval(
    to === APPROVAL.APPROVED ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
    req, { decision: to, reason: decisionReason }
  );
  return { ok: true, request: req };
}

export const approveRequest = (id, decidedBy, decisionReason) =>
  transitionApproval(id, APPROVAL.APPROVED, { decidedBy, decisionReason });

export const rejectRequest = (id, decidedBy, decisionReason) =>
  transitionApproval(id, APPROVAL.REJECTED, { decidedBy, decisionReason });

// spec 4.8: verify everything again, immediately before execution — never
// trust a decision made even a moment earlier without re-checking.
export function verifyBeforeExecution(id, { action, target } = {}) {
  const req = getApproval(id);
  if (!req) return { ok: false, error: "NOT_FOUND" };
  if (req.status !== APPROVAL.APPROVED) return { ok: false, error: `NOT_APPROVED (${req.status})` };
  if (req.executedAt) return { ok: false, error: "ALREADY_EXECUTED" };
  if (action !== undefined && req.action !== action) return { ok: false, error: "ACTION_MISMATCH" };
  if (target !== undefined && req.target !== target) return { ok: false, error: "TARGET_MISMATCH" };
  if (req.policyVersion !== getPolicyVersion() || req.permissionVersion !== getPermissionVersion()) {
    return { ok: false, error: "STALE_APPROVAL" };
  }
  return { ok: true, request: req };
}

export function markExecuted(id) {
  const req = requests.get(id);
  if (req) req.executedAt = new Date().toISOString();
}
