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

describe("approvals.mjs - self-approval with human: prefix (regression)", () => {
  const mk = (actor) => createApprovalRequest({ action: "x", actor, permission: "p", risk: "HIGH" });
  it("forbids human:<same actor>", () => {
    expect(approveRequest(mk("alice").id, "human:alice", "ok").error).toBe("SELF_APPROVAL_FORBIDDEN");
  });
  it("forbids the same actor with different case or spaces", () => {
    expect(approveRequest(mk("alice").id, "human: Alice ", "ok").error).toBe("SELF_APPROVAL_FORBIDDEN");
  });
  it("forbids self-rejection the same way", () => {
    expect(rejectRequest(mk("alice").id, "human:alice", "no").error).toBe("SELF_APPROVAL_FORBIDDEN");
  });
  it("still allows a different human", () => {
    expect(approveRequest(mk("alice").id, "human:bob", "ok").ok).toBe(true);
  });
});

describe("approvals.mjs - self-approval identity bypass attempts (regression)", () => {
  const mk = (actor) => createApprovalRequest({ action: "x", actor, permission: "p", risk: "HIGH" });
  it("forbids a repeated human: prefix", () => {
    expect(approveRequest(mk("alice").id, "human:human:alice", "ok").error).toBe("SELF_APPROVAL_FORBIDDEN");
    expect(approveRequest(mk("alice").id, "human:HUMAN: alice", "ok").error).toBe("SELF_APPROVAL_FORBIDDEN");
  });
  it("forbids full-width letters and zero-width characters", () => {
    expect(approveRequest(mk("alice").id, "ａｌｉｃｅ", "ok").error).toBe("SELF_APPROVAL_FORBIDDEN");
    expect(approveRequest(mk("alice").id, "al\u200Bice", "ok").error).toBe("SELF_APPROVAL_FORBIDDEN");
  });
  it("still allows a different human after the prefix fix", () => {
    expect(approveRequest(mk("alice").id, "human:human:bob", "ok").ok).toBe(true);
  });
});
