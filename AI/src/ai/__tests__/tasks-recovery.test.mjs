import { describe, it, expect } from "vitest";
import { createTask, transition, getTask, recoverInterruptedTasks } from "../tasks.mjs";

describe("tasks.mjs — recoverInterruptedTasks", () => {
  it("marks RUNNING and WAITING tasks FAILED, leaves others alone", () => {
    const run = createTask({ t: "run" });
    transition(run.taskId, "QUEUED"); transition(run.taskId, "RUNNING");
    const wait = createTask({ t: "wait" });
    transition(wait.taskId, "QUEUED"); transition(wait.taskId, "RUNNING"); transition(wait.taskId, "WAITING");
    const done = createTask({ t: "done" });
    transition(done.taskId, "QUEUED"); transition(done.taskId, "RUNNING"); transition(done.taskId, "COMPLETED");
    const fresh = createTask({ t: "fresh" });

    const n = recoverInterruptedTasks();
    expect(n).toBeGreaterThanOrEqual(2);
    expect(getTask(run.taskId).state).toBe("FAILED");
    expect(getTask(wait.taskId).state).toBe("FAILED");
    expect(getTask(run.taskId).transitions.at(-1).to).toBe("FAILED");
    expect(getTask(done.taskId).state).toBe("COMPLETED");
    expect(getTask(fresh.taskId).state).toBe("CREATED");
  });
  it("is idempotent (second call changes nothing)", () => {
    expect(recoverInterruptedTasks()).toBe(0);
  });
});
