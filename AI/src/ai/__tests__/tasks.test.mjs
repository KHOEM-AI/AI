import { describe, it, expect } from "vitest";
import { createTask, transition, setExecution, setCognitive, getEvents, TASK, EXECUTION, COGNITIVE } from "../tasks.mjs";

describe("tasks.mjs", () => {
  it("rejects illegal task transitions", () => {
    const t = createTask({ label: "test" });
    transition(t.taskId, TASK.QUEUED);
    transition(t.taskId, TASK.RUNNING);
    transition(t.taskId, TASK.COMPLETED);
    expect(() => transition(t.taskId, TASK.RUNNING)).toThrow();
  });
  it("requires RUNNING/WAITING before changing execution/cognitive state", () => {
    const t = createTask({});
    expect(() => setExecution(t.taskId, EXECUTION.PROCESSING)).toThrow();
    transition(t.taskId, TASK.QUEUED);
    transition(t.taskId, TASK.RUNNING);
    expect(() => setExecution(t.taskId, EXECUTION.PROCESSING)).not.toThrow();
    expect(() => setCognitive(t.taskId, COGNITIVE.UNDERSTANDING)).not.toThrow();
  });
  it("records events for a task", () => {
    const t = createTask({});
    transition(t.taskId, TASK.QUEUED);
    expect(getEvents(t.taskId).length).toBeGreaterThan(0);
  });
});
