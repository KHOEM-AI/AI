import { describe, it, expect, vi, afterEach } from "vitest";
import { runAgent } from "../agentLoop.mjs";
import { registerTool, unregisterTool } from "../toolRegistry.mjs";

const A = "chain-a";
const B = "chain-b";
afterEach(() => { unregisterTool(A); unregisterTool(B); });

const setup = (resultA = { ok: true, name: "createGoal", n: 3, obj: {} }) => {
  registerTool({ id: A, action: "tool.scan" });
  registerTool({ id: B, action: "tool.scan" });
  const runA = vi.fn(async () => resultA);
  const runB = vi.fn(async (input) => ({ got: input }));
  return { runA, runB, runners: { [A]: runA, [B]: runB } };
};

const run = (runners, inputB) =>
  runAgent({
    goal: "chain goal",
    steps: [
      { description: "first", tools: [A] },
      { description: "second", tools: [B], input: inputB },
    ],
    verificationCriteria: ["checked"],
    runners,
    verify: async () => true,
  });

describe("agentLoop $from chaining", () => {
  it("passes an earlier result into a later step input", async () => {
    const { runB, runners } = setup();
    const r = await run(runners, { q: { $from: `step1.${A}.name` }, n: { $from: `step1.${A}.n` }, keep: "x" });
    expect(r.status).toBe("SUCCESS");
    expect(runB).toHaveBeenCalledWith({ q: "createGoal", n: 3, keep: "x" });
  });

  it("a forward reference is FAILED before any tool runs", async () => {
    const { runA, runB, runners } = setup();
    const r = await runAgent({
      goal: "forward goal",
      steps: [
        { description: "first", tools: [A], input: { q: { $from: `step2.${B}.x` } } },
        { description: "second", tools: [B] },
      ],
      verificationCriteria: ["checked"],
      runners,
      verify: async () => true,
    });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/earlier step/);
    expect(runA).not.toHaveBeenCalled();
    expect(runB).not.toHaveBeenCalled();
  });

  it("a reference to a tool the step does not use is FAILED before any tool runs", async () => {
    const { runA, runB, runners } = setup();
    const r = await run(runners, { q: { $from: `step1.${B}.x` } });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/does not use tool/);
    expect(runA).not.toHaveBeenCalled();
    expect(runB).not.toHaveBeenCalled();
  });

  it("a missing field is FAILED and the later tool never runs", async () => {
    const { runA, runB, runners } = setup();
    const r = await run(runners, { q: { $from: `step1.${A}.missing` } });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/unresolved input reference/);
    expect(runA).toHaveBeenCalledTimes(1);
    expect(runB).not.toHaveBeenCalled();
  });

  it("an object value is refused", async () => {
    const { runB, runners } = setup();
    const r = await run(runners, { q: { $from: `step1.${A}.obj` } });
    expect(r.status).toBe("FAILED");
    expect(runB).not.toHaveBeenCalled();
  });

  it("forbidden path keys are FAILED before any tool runs", async () => {
    const { runA, runners } = setup();
    const r = await run(runners, { q: { $from: `step1.${A}.__proto__` } });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/forbidden/);
    expect(runA).not.toHaveBeenCalled();
  });

  it("passes a scan-shaped fileCount as a number", async () => {
    const { runB, runners } = setup({ ok: true, fileCount: 42 });
    const r = await run(runners, { q: { $from: "step1." + A + ".fileCount" } });
    expect(r.status).toBe("SUCCESS");
    expect(runB).toHaveBeenCalledWith({ q: 42 });
  });

  it("a source tool that throws is FAILED and the later tool never runs", async () => {
    const { runB, runners } = setup();
    runners[A] = vi.fn(async () => { throw new Error("boom"); });
    const r = await run(runners, { q: { $from: "step1." + A + ".n" } });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/boom/);
    expect(runB).not.toHaveBeenCalled();
  });

  it("refuses a source result with ok:false and the later tool never runs", async () => {
    const { runB, runners } = setup({ ok: false, n: 3 });
    const r = await run(runners, { q: { $from: "step1." + A + ".n" } });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/ok:false/);
    expect(runB).not.toHaveBeenCalled();
  });

  it("stops at a step whose result is ok:false even when no later step uses $from", async () => {
    const { runB, runners } = setup({ ok: false, n: 3 });
    const r = await run(runners, { q: "plain" });
    expect(r.status).toBe("FAILED");
    expect(r.reason).toMatch(/ok:false/);
    expect(runB).not.toHaveBeenCalled();
  });

  it("keeps going when a result has no ok field", async () => {
    const { runB, runners } = setup({ n: 3 });
    const r = await run(runners, { q: "plain" });
    expect(r.status).toBe("SUCCESS");
    expect(runB).toHaveBeenCalledTimes(1);
  });

  it("inputs without $from reach the tool unchanged", async () => {
    const { runB, runners } = setup();
    const r = await run(runners, { q: "plain", n: 5 });
    expect(r.status).toBe("SUCCESS");
    expect(runB).toHaveBeenCalledWith({ q: "plain", n: 5 });
  });
});
