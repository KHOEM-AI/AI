import { describe, it, expect } from "vitest";
import { REGISTRY, RISK, validatePolicyRegistry } from "../policyRegistry.mjs";
import { RISK as RISK_FROM_PERMISSION, policyCheck, DECISION, getPolicyVersion } from "../permission.mjs";

describe("policyRegistry.mjs (policy as data)", () => {
  it("passes its own structural validation", () => {
    const r = validatePolicyRegistry();
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("validator catches a bad action name, missing permission and invalid risk", () => {
    const r = validatePolicyRegistry({
      "ok.action": { permission: "x", risk: "LOW" },
      "bad name": { permission: "x", risk: "LOW" },
      "no.perm": { permission: "", risk: "LOW" },
      "bad.risk": { permission: "x", risk: "NOPE" },
    });
    expect(r.ok).toBe(false);
    expect(r.problems.length).toBe(3);
  });

  it("permission.mjs re-exports the very same RISK object", () => {
    expect(RISK_FROM_PERMISSION).toBe(RISK);
  });

  it("key safety entries are unchanged after the move", () => {
    expect(REGISTRY["code.applyPatch"].risk).toBe("HIGH");
    expect(REGISTRY["approval.test.high-risk"].risk).toBe("HIGH");
    expect(REGISTRY["system.kill"].risk).toBe("MEDIUM");
  });

  it("policyCheck still decides using the moved registry", () => {
    expect(policyCheck("code.applyPatch", "tester").decision).toBe(DECISION.REQUIRE_APPROVAL);
    expect(policyCheck("tool.scan", "tester").decision).toBe(DECISION.ALLOW);
    expect(policyCheck("not.registered.anything", "tester").decision).toBe(DECISION.DENY);
    expect(getPolicyVersion()).toBe(2);
  });
});
