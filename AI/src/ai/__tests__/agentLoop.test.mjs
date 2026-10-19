import { describe, it, expect, vi } from "vitest";
import { runAgent } from "../agentLoop.mjs";
import { getTask } from "../tasks.mjs";

const steps = [{ description: "check the thing", risk: "LOW" }];

describe("agentLoop", () => {
  it("succeeds when verify passes", async () => {
    const r = await runAgent({
      goal: "test goal ok",
      steps,
      verificationCriteria: ["thing is checked"],
      verify: async () => true,
    });
    expect(r.status).toBe("SUCCESS");
    expect(getTask(r.taskId).state).toBe("COMPLETED");
  });

  it("fails when verify fails (test result beats self-claim)", async () => {
    const r = await runAgent({
      goal: "test goal verify fails",
      steps,
      verificationCriteria: ["thing is checked"],
      verify: async () => false,
    });
    expect(r.status).toBe("FAILED");
    expect(getTask(r.taskId).state).toBe("FAILED");
  });

  it("is not SUCCESS without any verification", async () => {
    const r = await runAgent({
      goal: "test goal no verify",
      steps,
      verificationCriteria: ["thing is checked"],
    });
    expect(r.status).toBe("UNCERTAIN");
  });

  it("rejects an invalid plan (no verification criteria)", async () => {
    const r = await runAgent({ goal: "test goal invalid", steps });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/MISSING_VERIFICATION_CRITERIA/);
  });

  it("stops at approval for HIGH risk and never runs the tool", async () => {
    const runner = vi.fn();
    const r = await runAgent({
      goal: "test goal high risk",
      steps: [{ description: "dangerous", risk: "HIGH", tools: ["x"] }],
      verificationCriteria: ["checked"],
      rollbackPlan: "undo it",
      runners: { x: runner },
    });
    expect(r.status).toBe("NEEDS_APPROVAL");
    expect(runner).not.toHaveBeenCalled();
    expect(getTask(r.taskId).state).toBe("WAITING");
  });
});
