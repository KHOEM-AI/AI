// src/ai/goal.mjs
// Goal Engine (spec Part 7): separates GOAL -> TASK -> ACTION.
// A goal can contain multiple tasks; a task belongs to at most one goal.
// This module only tracks the linkage — it does not create or run tasks
// itself (tasks.mjs remains the single source of truth for task state).

import { randomUUID } from "node:crypto";
import { getTask } from "./tasks.mjs";

const goals = new Map(); // goalId -> { id, title, createdAt, updatedAt, taskIds: Set, status }
const MAX_GOALS = 200;

export const GOAL_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  ABANDONED: "ABANDONED",
});

export function createGoal(title, metadata = {}) {
  if (!title || typeof title !== "string") {
    throw new Error("Goal title is required");
  }
  const now = new Date().toISOString();
  const goal = {
    id: randomUUID(),
    title,
    metadata,
    status: GOAL_STATUS.ACTIVE,
    taskIds: new Set(),
    createdAt: now,
    updatedAt: now,
  };
  goals.set(goal.id, goal);
  const ids = [...goals.keys()];
  if (ids.length > MAX_GOALS) goals.delete(ids[0]);
  return serialize(goal);
}

export function getGoal(id) {
  const g = goals.get(id);
  return g ? serialize(g) : null;
}

export function listGoals() {
  return [...goals.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(serialize);
}

// Links an existing task (from tasks.mjs) to a goal. Does not create the
// task — the task must already exist. Fails loudly rather than silently
// linking a non-existent task.
export function linkTaskToGoal(goalId, taskId) {
  const goal = goals.get(goalId);
  if (!goal) return { ok: false, reason: "GOAL_NOT_FOUND" };
  const task = getTask(taskId);
  if (!task) return { ok: false, reason: "TASK_NOT_FOUND" };
  goal.taskIds.add(taskId);
  goal.updatedAt = new Date().toISOString();
  return { ok: true, goal: serialize(goal) };
}

// Read-only progress view: counts real task states via tasks.mjs — never
// invents a completion percentage from anything but actual task state.
export function getGoalProgress(goalId) {
  const goal = goals.get(goalId);
  if (!goal) return null;
  const tasks = [...goal.taskIds].map((id) => getTask(id)).filter(Boolean);
  const completed = tasks.filter((t) => t.state === "COMPLETED").length;
  return {
    goalId,
    totalTasks: tasks.length,
    completedTasks: completed,
    // Only meaningful once at least one task is linked — avoid a
    // misleading 0% / divide-by-zero display.
    progressPct: tasks.length ? Math.round((completed / tasks.length) * 100) : null,
  };
}

export function setGoalStatus(goalId, status) {
  const goal = goals.get(goalId);
  if (!goal) return { ok: false, reason: "GOAL_NOT_FOUND" };
  if (!Object.values(GOAL_STATUS).includes(status)) {
    return { ok: false, reason: "INVALID_STATUS" };
  }
  goal.status = status;
  goal.updatedAt = new Date().toISOString();
  return { ok: true, goal: serialize(goal) };
}

function serialize(goal) {
  return {
    id: goal.id,
    title: goal.title,
    metadata: goal.metadata,
    status: goal.status,
    taskIds: [...goal.taskIds],
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}
