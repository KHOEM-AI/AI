import { describe, it, expect } from "vitest";
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
