import { describe, it, expect } from "vitest";
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
