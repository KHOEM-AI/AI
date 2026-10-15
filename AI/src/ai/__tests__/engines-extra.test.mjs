import { describe, it, expect } from "vitest";
import {
  createIdea, transitionIdea, listIdeasByStatus, searchIdeas, IDEA_STATUS,
} from "../ideas.mjs";
import { createPlan, searchPlans, listPlansByRisk, listPlansByStatus } from "../planning.mjs";

describe("ideas.mjs — transitionIdea", () => {
  it("PROPOSED -> ACCEPTED -> IMPLEMENTED is allowed and sets updatedAt", () => {
    const i = createIdea({ title: "tr-happy-zq" });
    const a = transitionIdea(i.ideaId, "ACCEPTED");
    expect(a.ok).toBe(true);
    expect(a.idea.status).toBe("ACCEPTED");
    expect(a.idea.updatedAt).toBeTruthy();
    const b = transitionIdea(i.ideaId, "IMPLEMENTED");
    expect(b.ok).toBe(true);
    expect(b.idea.status).toBe("IMPLEMENTED");
  });
  it("rejects skipping a step (PROPOSED -> IMPLEMENTED)", () => {
    const i = createIdea({ title: "tr-skip-zq" });
    const r = transitionIdea(i.ideaId, "IMPLEMENTED");
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("ILLEGAL_TRANSITION");
    expect(i.status).toBe("PROPOSED");
  });
  it("terminal states cannot move (REJECTED, IMPLEMENTED)", () => {
    const r1 = createIdea({ title: "tr-rej-zq" });
    expect(transitionIdea(r1.ideaId, "REJECTED").ok).toBe(true);
    expect(transitionIdea(r1.ideaId, "ACCEPTED").ok).toBe(false);
    const r2 = createIdea({ title: "tr-impl-zq" });
    transitionIdea(r2.ideaId, "ACCEPTED");
    transitionIdea(r2.ideaId, "IMPLEMENTED");
    expect(transitionIdea(r2.ideaId, "REJECTED").ok).toBe(false);
  });
  it("unknown id -> IDEA_NOT_FOUND, bad status -> INVALID_STATUS", () => {
    expect(transitionIdea("nope", "ACCEPTED").reason).toBe("IDEA_NOT_FOUND");
    const i = createIdea({ title: "tr-bad-zq" });
    expect(transitionIdea(i.ideaId, "WHATEVER").reason).toBe("INVALID_STATUS");
  });
});

describe("ideas.mjs — listIdeasByStatus / searchIdeas", () => {
  it("listIdeasByStatus filters by status", () => {
    const i = createIdea({ title: "ls-acc-zq" });
    transitionIdea(i.ideaId, "ACCEPTED");
    const acc = listIdeasByStatus(IDEA_STATUS.ACCEPTED);
    expect(acc.some((x) => x.ideaId === i.ideaId)).toBe(true);
    expect(acc.every((x) => x.status === "ACCEPTED")).toBe(true);
  });
  it("searchIdeas matches title and description, case-insensitive", () => {
    const a = createIdea({ title: "SearchTitleZQ" });
    const b = createIdea({ title: "other-zq", description: "has NeedleDescZQ inside" });
    expect(searchIdeas("searchtitlezq").map((x) => x.ideaId)).toContain(a.ideaId);
    expect(searchIdeas("needledesczq").map((x) => x.ideaId)).toContain(b.ideaId);
  });
  it("searchIdeas: empty/no match returns []", () => {
    expect(searchIdeas("")).toEqual([]);
    expect(searchIdeas(undefined)).toEqual([]);
    expect(searchIdeas("no-such-idea-xyz-123")).toEqual([]);
  });
});

describe("planning.mjs — searchPlans / listPlansByRisk / listPlansByStatus", () => {
  it("searchPlans matches goal substring, case-insensitive", () => {
    const p = createPlan({ goal: "Deploy PlanSearchZQ", steps: [{ description: "x" }], verificationCriteria: ["ok"] });
    expect(searchPlans("plansearchzq").map((x) => x.planId)).toContain(p.planId);
  });
  it("searchPlans: empty/no match returns []", () => {
    expect(searchPlans("")).toEqual([]);
    expect(searchPlans(null)).toEqual([]);
    expect(searchPlans("no-such-plan-xyz-123")).toEqual([]);
  });
  it("listPlansByRisk separates LOW and HIGH plans", () => {
    const low = createPlan({ goal: "risk-low-zq", steps: [{ description: "read" }], verificationCriteria: ["ok"] });
    const high = createPlan({
      goal: "risk-high-zq", steps: [{ description: "deploy", risk: "HIGH" }],
      verificationCriteria: ["ok"], rollbackPlan: "revert",
    });
    const highIds = listPlansByRisk("HIGH").map((x) => x.planId);
    const lowIds = listPlansByRisk("LOW").map((x) => x.planId);
    expect(highIds).toContain(high.planId);
    expect(highIds).not.toContain(low.planId);
    expect(lowIds).toContain(low.planId);
    expect(lowIds).not.toContain(high.planId);
  });
  it("listPlansByStatus separates VALID and INVALID", () => {
    const bad = createPlan({ goal: "inv-zq", steps: [{ description: "x" }] }); // no verification criteria
    const good = createPlan({ goal: "val-zq", steps: [{ description: "x" }], verificationCriteria: ["ok"] });
    expect(listPlansByStatus("INVALID").map((x) => x.planId)).toContain(bad.planId);
    expect(listPlansByStatus("VALID").map((x) => x.planId)).toContain(good.planId);
    expect(listPlansByStatus("VALID").map((x) => x.planId)).not.toContain(bad.planId);
  });
});
