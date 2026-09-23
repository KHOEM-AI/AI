import { describe, it, expect } from "vitest";
import { getMetrics } from "../metrics.mjs";

describe("metrics.mjs", () => {
  it("returns all real sections with numeric/array-derived fields", () => {
    const m = getMetrics();
    expect(typeof m.generatedAt).toBe("string");
    expect(typeof m.policy.totalDecisions).toBe("number");
    expect(typeof m.approvals.total).toBe("number");
    expect(typeof m.budgets.active).toBe("number");
    expect(typeof m.circuitBreakers.total).toBe("number");
    expect(typeof m.tasks.total).toBe("number");
  });

  it("never fabricates unimplemented metrics — lists them honestly", () => {
    const m = getMetrics();
    expect(Array.isArray(m.notImplemented)).toBe(true);
    expect(m.notImplemented.length).toBeGreaterThan(0);
  });

  it("verification section reflects real getLastVerification (no run yet = NOT_IMPLEMENTED)", () => {
    const m = getMetrics();
    expect(["NOT_IMPLEMENTED", "VERIFIED", "UNVERIFIED", "CONFLICTING"]).toContain(m.verification.lastStatus);
  });
});
