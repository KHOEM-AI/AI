import { describe, it, expect, beforeEach } from "vitest";
import { createBudget, recordUsage, checkBudget, getBudget, clearBudget } from "../budget.mjs";

describe("budget.mjs", () => {
  beforeEach(() => clearBudget("t1"));

  it("starts under budget", () => {
    createBudget("t1");
    expect(checkBudget("t1").ok).toBe(true);
  });

  it("stops when maxToolCalls exceeded", () => {
    createBudget("t1", { maxToolCalls: 2 });
    recordUsage("t1", { toolCalls: 1 });
    const r = recordUsage("t1", { toolCalls: 1 });
    expect(r.ok).toBe(false);
    expect(r.exceeded).toContain("maxToolCalls");
    expect(r.action).toBe("STOP");
  });

  it("returns NO_BUDGET for unknown task", () => {
    expect(checkBudget("does-not-exist").reason).toBe("NO_BUDGET");
  });

  it("tracks multiple usage dimensions independently", () => {
    createBudget("t1", { maxCost: 5 });
    recordUsage("t1", { toolCalls: 1, tokens: 500 });
    const r = checkBudget("t1");
    expect(r.usage.toolCalls).toBe(1);
    expect(r.usage.tokens).toBe(500);
    expect(r.ok).toBe(true);
  });
});
