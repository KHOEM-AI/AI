import { describe, it, expect } from "vitest";
import { summarizeEngines } from "../enginesSummary.mjs";
import { createIdea } from "../ideas.mjs";
import { createPlan } from "../planning.mjs";
import { createExperiment } from "../experiments.mjs";

describe("enginesSummary.mjs", () => {
  it("has the expected shape", () => {
    const s = summarizeEngines();
    expect(typeof s.ideas.total).toBe("number");
    expect(typeof s.plans.needingApproval).toBe("number");
    expect(typeof s.experiments.byStatus).toBe("object");
  });

  it("counts grow, and no user-entered text is exposed", () => {
    const before = summarizeEngines();
    createIdea({ title: "SECRET-TITLE-XYZ", risk: "HIGH" });
    createPlan({ goal: "SECRET-GOAL-XYZ", steps: [{ description: "SECRET-STEP-XYZ", risk: "HIGH" }] });
    createExperiment({ goal: "SECRET-EXP-XYZ", hypothesis: "SECRET-HYP-XYZ" });
    const after = summarizeEngines();
    expect(after.ideas.total).toBe(before.ideas.total + 1);
    expect(after.plans.needingApproval).toBe(before.plans.needingApproval + 1);
    expect(after.experiments.total).toBe(before.experiments.total + 1);
    expect(JSON.stringify(after)).not.toContain("SECRET");
  });
});
