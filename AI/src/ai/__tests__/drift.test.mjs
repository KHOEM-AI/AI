import { describe, it, expect } from "vitest";
import { sampleFromMetrics, detectDrift, getDriftReport, resetDrift } from "../drift.mjs";

const mk = (over = {}) => ({ denyRate: 0.1, taskFailRate: 0.1, openBreakerRatio: 0, ...over });
const many = (n, over) => Array.from({ length: n }, () => mk(over));

describe("drift.mjs", () => {
  it("sampleFromMetrics gives null rates when there are too few events", () => {
    const s = sampleFromMetrics({ policy: { deny: 1, totalDecisions: 2 }, tasks: { total: 0, byState: {} }, circuitBreakers: { open: 0, total: 0 } });
    expect(s.denyRate).toBe(null);
    expect(s.taskFailRate).toBe(null);
    expect(s.openBreakerRatio).toBe(null);
  });

  it("sampleFromMetrics computes real rates", () => {
    const s = sampleFromMetrics({
      policy: { deny: 2, totalDecisions: 10 },
      tasks: { total: 10, byState: { FAILED: 2, TIMEOUT: 1, COMPLETED: 7 } },
      circuitBreakers: { open: 1, total: 4 },
    });
    expect(s.denyRate).toBe(0.2);
    expect(s.taskFailRate).toBe(0.3);
    expect(s.openBreakerRatio).toBe(0.25);
  });

  it("fewer than 5 baseline samples is INSUFFICIENT_DATA", () => {
    expect(detectDrift(many(3), mk()).status).toBe("INSUFFICIENT_DATA");
  });

  it("same values as baseline is STABLE", () => {
    const r = detectDrift(many(6), mk());
    expect(r.status).toBe("STABLE");
    expect(r.findings).toEqual([]);
  });

  it("a large jump is DRIFTING and names the metric", () => {
    const r = detectDrift(many(6), mk({ denyRate: 0.6 }));
    expect(r.status).toBe("DRIFTING");
    expect(r.findings.map((f) => f.metric)).toEqual(["denyRate"]);
  });

  it("a small change under the minimum delta is not flagged", () => {
    expect(detectDrift(many(6), mk({ denyRate: 0.2 })).status).toBe("STABLE");
  });

  it("getDriftReport returns a valid status and starts from no history", () => {
    resetDrift();
    const r = getDriftReport();
    expect(r.status).toBe("INSUFFICIENT_DATA");
    expect(r.samples).toBe(0);
    expect(typeof r.checkedAt).toBe("string");
    resetDrift();
  });
});
