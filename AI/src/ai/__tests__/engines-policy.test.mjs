import { describe, it, expect } from "vitest";
import { policyCheck, DECISION, getPolicyVersion } from "../permission.mjs";

const ACTIONS = [
  "ideas.read", "ideas.create", "plan.read", "plan.create",
  "experiment.read", "experiment.create", "experiment.transition", "selfeval.run",
];

describe("engine actions in the permission registry", () => {
  for (const a of ACTIONS) {
    it(`${a} is registered LOW and allowed`, () => {
      const rec = policyCheck(a, "tester");
      expect(rec.decision).toBe(DECISION.ALLOW);
      expect(rec.risk).toBe("LOW");
    });
  }
  it("unregistered actions still fail safe to DENY", () => {
    expect(policyCheck("ideas.deleteEverything", "tester").decision).toBe(DECISION.DENY);
  });
  it("policy version was bumped", () => {
    expect(getPolicyVersion()).toBeGreaterThanOrEqual(2);
  });
});
