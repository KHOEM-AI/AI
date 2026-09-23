import { describe, it, expect } from "vitest";
import { createIdea, rankIdeas, getIdea } from "../ideas.mjs";
import { createPlan } from "../planning.mjs";
import { createExperiment, transitionExperiment } from "../experiments.mjs";
import { selfEvaluate } from "../selfEval.mjs";

describe("ideas.mjs", () => {
  it("creates a non-executable PROPOSED idea", () => {
    const i = createIdea({ title: "A" });
    expect(i.status).toBe("PROPOSED");
    expect(i.executable).toBe(false);
    expect(getIdea(i.ideaId)).toBeTruthy();
  });
  it("rejects missing title and invalid risk", () => {
    expect(() => createIdea({})).toThrow();
    expect(() => createIdea({ title: "x", risk: "NOPE" })).toThrow();
  });
  it("ranks higher benefit / lower risk first", () => {
    const a = createIdea({ title: "safe", benefitScore: 8, risk: "LOW" });
    const b = createIdea({ title: "risky", benefitScore: 8, risk: "HIGH" });
    const r = rankIdeas([a, b]);
    expect(r[0].ideaId).toBe(a.ideaId);
  });
});

describe("planning.mjs", () => {
  it("valid LOW plan with verification criteria", () => {
    const p = createPlan({ goal: "g", steps: [{ description: "read" }], verificationCriteria: ["tests pass"] });
    expect(p.status).toBe("VALID");
    expect(p.requiresApproval).toBe(false);
    expect(p.executable).toBe(false);
  });
  it("HIGH step requires approval and rollback plan", () => {
    const p = createPlan({ goal: "g", steps: [{ description: "deploy", risk: "HIGH" }], verificationCriteria: ["ok"] });
    expect(p.requiresApproval).toBe(true);
    expect(p.status).toBe("INVALID");
    expect(p.validation.problems).toContain("MISSING_ROLLBACK_PLAN");
  });
  it("rejects empty steps", () => {
    expect(() => createPlan({ goal: "g", steps: [] })).toThrow();
  });
});

describe("experiments.mjs", () => {
  it("follows CREATED -> RUNNING -> COMPLETED", () => {
    const e = createExperiment({ goal: "g", hypothesis: "h" });
    expect(e.sandboxOnly).toBe(true);
    expect(transitionExperiment(e.experimentId, "RUNNING").ok).toBe(true);
    const done = transitionExperiment(e.experimentId, "COMPLETED", { results: "ok" });
    expect(done.ok).toBe(true);
    expect(done.experiment.completedAt).toBeTruthy();
  });
  it("rejects invalid transitions", () => {
    const e = createExperiment({ goal: "g", hypothesis: "h" });
    expect(transitionExperiment(e.experimentId, "COMPLETED").ok).toBe(false);
    transitionExperiment(e.experimentId, "CANCELLED");
    expect(transitionExperiment(e.experimentId, "RUNNING").ok).toBe(false);
  });
  it("unknown id -> NOT_FOUND", () => {
    expect(transitionExperiment("nope", "RUNNING").error).toBe("NOT_FOUND");
  });
});

describe("selfEval.mjs", () => {
  it("failed tests override a success claim", () => {
    expect(selfEvaluate({ goalAchieved: true, testsPassed: false, evidence: ["x"] }).result).toBe("FAILED");
  });
  it("no test result -> UNCERTAIN", () => {
    expect(selfEvaluate({ goalAchieved: true }).result).toBe("UNCERTAIN");
  });
  it("tests + evidence + nothing remaining -> SUCCESS", () => {
    expect(selfEvaluate({ goalAchieved: true, testsPassed: true, evidence: ["log"] }).result).toBe("SUCCESS");
  });
  it("work remaining -> PARTIAL, and always advisory", () => {
    const r = selfEvaluate({ goalAchieved: true, testsPassed: true, evidence: ["log"], remaining: ["docs"] });
    expect(r.result).toBe("PARTIAL");
    expect(r.advisory).toBe(true);
  });
});
