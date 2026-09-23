import fs from "node:fs";
console.log("=== PHASE 3: persist audit, fix approvalRequired bug, require decider, align WAITING, tests ===");

function backup(f) { fs.writeFileSync(f + ".bak-phase3", fs.readFileSync(f, "utf8"), "utf8"); }
function patch(file, edits) {
  let src = fs.readFileSync(file, "utf8");
  backup(file);
  let changed = false;
  for (const [label, from, to] of edits) {
    if (!src.includes(from)) { console.log(`⚠️  [${file}] anchor not found: ${label} — check manually`); continue; }
    src = src.replace(from, to);
    changed = true;
    console.log(`✅ [${file}] ${label}`);
  }
  if (changed) fs.writeFileSync(file, src, "utf8");
  return changed;
}

// ---- tasks.mjs: persist every emit() into the durable audit log (covers tasks AND approvals, since approvals.mjs routes through emit()) ----
patch("src/ai/tasks.mjs", [
  ["import recordAuditEvent",
   `import { randomUUID } from "node:crypto";`,
   `import { randomUUID } from "node:crypto";\nimport { recordAuditEvent } from "./audit.mjs";`],
  ["persist emit() to durable log",
   `export function emit(taskId, type, metadata = {}, duration = null) {
  const ev = { id: randomUUID(), taskId, type, timestamp: new Date().toISOString(), duration, metadata };
  events.push(ev);
  if (events.length > MAX_EVENTS) events.shift();
  return ev;
}`,
   `export function emit(taskId, type, metadata = {}, duration = null) {
  const ev = { id: randomUUID(), taskId, type, timestamp: new Date().toISOString(), duration, metadata };
  events.push(ev);
  if (events.length > MAX_EVENTS) events.shift();
  recordAuditEvent(type, { taskId, duration, ...metadata });
  return ev;
}`],
]);

// ---- permission.mjs: persist policy decisions; fix approvalRequired bug on DENY ----
patch("src/ai/permission.mjs", [
  ["import recordAuditEvent",
   `import { randomUUID } from "node:crypto";`,
   `import { randomUUID } from "node:crypto";\nimport { recordAuditEvent } from "./audit.mjs";`],
  ["persist recordAudit() to durable log",
   `function recordAudit(entry) {
  auditLog.push(entry);
  if (auditLog.length > MAX_AUDIT) auditLog.shift();
  return entry;
}`,
   `function recordAudit(entry) {
  auditLog.push(entry);
  if (auditLog.length > MAX_AUDIT) auditLog.shift();
  recordAuditEvent("POLICY_" + entry.decision, entry);
  return entry;
}`],
  ["fix: DENY should not also mark approvalRequired true",
   `risk: RISK.CRITICAL, approvalRequired: true, decision: DECISION.DENY,`,
   `risk: RISK.CRITICAL, approvalRequired: false, decision: DECISION.DENY,`],
]);

// ---- approvals.mjs: require an explicit decider (close the self-approval loophole) ----
patch("src/ai/approvals.mjs", [
  ["require decidedBy before checking self-approval",
   `  // spec 4.6: the requester cannot also be the approver of their own request
  if (decidedBy && decidedBy === req.requestedBy) {
    return { error: "SELF_APPROVAL_FORBIDDEN" };
  }`,
   `  // spec 4.6: a decision must be attributable to someone, and the requester
  // cannot also be the approver of their own request
  if (!decidedBy) {
    return { error: "DECIDER_REQUIRED" };
  }
  if (decidedBy === req.requestedBy) {
    return { error: "SELF_APPROVAL_FORBIDDEN" };
  }`],
]);

// ---- status.mjs: align WAITING transitions with tasks.mjs (WAITING -> FAILED is valid) ----
patch("src/ai/status.mjs", [
  ["align WAITING -> FAILED with tasks.mjs",
   `  WAITING: ['RUNNING', 'TIMEOUT', 'CANCELLED'],`,
   `  WAITING: ['RUNNING', 'TIMEOUT', 'CANCELLED', 'FAILED'],`],
]);

// ---- tests ----
const TEST_DIR = "src/ai/__tests__";
function writeTest(file, content) {
  if (fs.existsSync(file)) { console.log("⚠️ ", file, "exists — skipped"); return; }
  fs.writeFileSync(file, content, "utf8");
  console.log("✅ created", file);
}

writeTest(TEST_DIR + "/permission.test.mjs", `import { describe, it, expect } from "vitest";
import { policyCheck, getAudit, RISK, DECISION } from "../permission.mjs";

describe("permission.mjs", () => {
  it("denies unregistered actions and does not require approval", () => {
    const r = policyCheck("bogus.action", "tester");
    expect(r.decision).toBe(DECISION.DENY);
    expect(r.approvalRequired).toBe(false);
  });
  it("allows LOW risk actions", () => {
    const r = policyCheck("tool.scan", "tester");
    expect(r.decision).toBe(DECISION.ALLOW);
    expect(r.risk).toBe(RISK.LOW);
  });
  it("requires approval for HIGH risk actions", () => {
    const r = policyCheck("approval.test.high-risk", "tester");
    expect(r.decision).toBe(DECISION.REQUIRE_APPROVAL);
    expect(r.approvalRequired).toBe(true);
  });
  it("records audit entries", () => {
    policyCheck("tool.scan", "tester");
    expect(getAudit(5).length).toBeGreaterThan(0);
  });
});
`);

writeTest(TEST_DIR + "/approvals.test.mjs", `import { describe, it, expect } from "vitest";
import { createApprovalRequest, approveRequest, rejectRequest, verifyBeforeExecution, markExecuted } from "../approvals.mjs";

describe("approvals.mjs", () => {
  it("requires a decider", () => {
    const req = createApprovalRequest({ action: "x", actor: "alice", permission: "p", risk: "HIGH" });
    const res = approveRequest(req.id, undefined, "ok");
    expect(res.error).toBe("DECIDER_REQUIRED");
  });
  it("rejects self-approval", () => {
    const req = createApprovalRequest({ action: "x", actor: "alice", permission: "p", risk: "HIGH" });
    const res = approveRequest(req.id, "alice", "ok");
    expect(res.error).toBe("SELF_APPROVAL_FORBIDDEN");
  });
  it("approves then blocks double execution", () => {
    const req = createApprovalRequest({ action: "x", actor: "alice", permission: "p", risk: "HIGH", target: "t1" });
    const res = approveRequest(req.id, "bob", "looks fine");
    expect(res.ok).toBe(true);
    const check1 = verifyBeforeExecution(req.id, { action: "x", target: "t1" });
    expect(check1.ok).toBe(true);
    markExecuted(req.id);
    const check2 = verifyBeforeExecution(req.id);
    expect(check2.error).toBe("ALREADY_EXECUTED");
  });
  it("rejects invalid transitions from a terminal state", () => {
    const req = createApprovalRequest({ action: "x", actor: "alice", permission: "p", risk: "HIGH" });
    rejectRequest(req.id, "bob", "no");
    const res = approveRequest(req.id, "bob", "changed my mind");
    expect(res.error).toMatch(/INVALID_TRANSITION/);
  });
});
`);

writeTest(TEST_DIR + "/tasks.test.mjs", `import { describe, it, expect } from "vitest";
import { createTask, transition, setExecution, setCognitive, getEvents, TASK, EXECUTION, COGNITIVE } from "../tasks.mjs";

describe("tasks.mjs", () => {
  it("rejects illegal task transitions", () => {
    const t = createTask({ label: "test" });
    transition(t.taskId, TASK.QUEUED);
    transition(t.taskId, TASK.RUNNING);
    transition(t.taskId, TASK.COMPLETED);
    expect(() => transition(t.taskId, TASK.RUNNING)).toThrow();
  });
  it("requires RUNNING/WAITING before changing execution/cognitive state", () => {
    const t = createTask({});
    expect(() => setExecution(t.taskId, EXECUTION.PROCESSING)).toThrow();
    transition(t.taskId, TASK.QUEUED);
    transition(t.taskId, TASK.RUNNING);
    expect(() => setExecution(t.taskId, EXECUTION.PROCESSING)).not.toThrow();
    expect(() => setCognitive(t.taskId, COGNITIVE.UNDERSTANDING)).not.toThrow();
  });
  it("records events for a task", () => {
    const t = createTask({});
    transition(t.taskId, TASK.QUEUED);
    expect(getEvents(t.taskId).length).toBeGreaterThan(0);
  });
});
`);

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
