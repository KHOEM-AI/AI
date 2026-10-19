import { describe, it, expect, vi, afterEach } from "vitest";
import { runAgent } from "../agentLoop.mjs";
import { registerTool, unregisterTool } from "../toolRegistry.mjs";
import { getTask } from "../tasks.mjs";

const ID = "agentloop-test-tool";
afterEach(() => unregisterTool(ID));

describe("agentLoop real tool path", () => {
  it("fails and never runs the tool when policy denies the action", async () => {
    registerTool({ id: ID, action: "nonexistent.action.zzz" });
    const runner = vi.fn();
    const r = await runAgent({
      goal: "tool denied goal",
      steps: [{ description: "use denied tool", risk: "LOW", tools: [ID] }],
      verificationCriteria: ["checked"],
      runners: { [ID]: runner },
      verify: async () => true,
    });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/denied/i);
    expect(runner).not.toHaveBeenCalled();
    expect(getTask(r.taskId).state).toBe("FAILED");
  });

  it("fails when a step names a tool with no runner", async () => {
    registerTool({ id: ID, action: "nonexistent.action.zzz" });
    const r = await runAgent({
      goal: "no runner goal",
      steps: [{ description: "tool without runner", risk: "LOW", tools: [ID] }],
      verificationCriteria: ["checked"],
      runners: {},
      verify: async () => true,
    });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/no runner/);
  });
});
