import { describe, it, expect } from "vitest";
import { createGoal, getGoal, listGoals, linkTaskToGoal, getGoalProgress, setGoalStatus, GOAL_STATUS } from "../goal.mjs";
import { createTask, transition, TASK } from "../tasks.mjs";

describe("goal.mjs", () => {
  it("creates and retrieves a goal", () => {
    const g = createGoal("Improve English Brain");
    expect(g.title).toBe("Improve English Brain");
    expect(g.status).toBe(GOAL_STATUS.ACTIVE);
    expect(getGoal(g.id).id).toBe(g.id);
  });

  it("rejects an empty title", () => {
    expect(() => createGoal("")).toThrow();
  });

  it("links a real task and returns TASK_NOT_FOUND for a fake one", () => {
    const g = createGoal("Ship budget module");
    const task = createTask({ label: "write budget.mjs" });
    const okLink = linkTaskToGoal(g.id, task.taskId);
    expect(okLink.ok).toBe(true);
    expect(okLink.goal.taskIds).toContain(task.taskId);

    const badLink = linkTaskToGoal(g.id, "does-not-exist");
    expect(badLink.ok).toBe(false);
    expect(badLink.reason).toBe("TASK_NOT_FOUND");
  });

  it("computes progress from real task state only", () => {
    const g = createGoal("Ship three modules");
    const t1 = createTask({});
    const t2 = createTask({});
    linkTaskToGoal(g.id, t1.taskId);
    linkTaskToGoal(g.id, t2.taskId);

    let progress = getGoalProgress(g.id);
    expect(progress.totalTasks).toBe(2);
    expect(progress.completedTasks).toBe(0);

    transition(t1.taskId, TASK.QUEUED);
    transition(t1.taskId, TASK.RUNNING);
    transition(t1.taskId, TASK.COMPLETED);
    progress = getGoalProgress(g.id);
    expect(progress.completedTasks).toBe(1);
    expect(progress.progressPct).toBe(50);
  });

  it("updates goal status and rejects invalid status", () => {
    const g = createGoal("Temp goal");
    const r = setGoalStatus(g.id, GOAL_STATUS.COMPLETED);
    expect(r.ok).toBe(true);
    expect(getGoal(g.id).status).toBe(GOAL_STATUS.COMPLETED);

    const bad = setGoalStatus(g.id, "BOGUS");
    expect(bad.ok).toBe(false);
  });

  it("lists goals newest first", () => {
    const before = listGoals().length;
    createGoal("A");
    createGoal("B");
    expect(listGoals().length).toBe(before + 2);
  });
});
