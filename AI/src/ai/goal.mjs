// src/ai/goal.mjs
import { randomUUID } from "node:crypto";
import { getTask } from "./tasks.mjs";

const goals = new Map();
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
    ideaIds: new Set(),
    planIds: new Set(),
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

export function linkTaskToGoal(goalId, taskId) {
  const goal = goals.get(goalId);
  if (!goal) return { ok: false, reason: "GOAL_NOT_FOUND" };
  const task = getTask(taskId);
  if (!task) return { ok: false, reason: "TASK_NOT_FOUND" };
  goal.taskIds.add(taskId);
  goal.updatedAt = new Date().toISOString();
  return { ok: true, goal: serialize(goal) };
}

export function getGoalProgress(goalId) {
  const goal = goals.get(goalId);
  if (!goal) return null;
  const tasks = [...goal.taskIds].map((id) => getTask(id)).filter(Boolean);
  const completed = tasks.filter((t) => t.state === "COMPLETED").length;
  return {
    goalId,
    totalTasks: tasks.length,
    completedTasks: completed,
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

// ===== NEW (additive only) =====

// Link an idea (from ideas.mjs) to a goal without validating idea existence
// here — ideas.mjs remains the source of truth; caller passes a real ideaId.
export function linkIdeaToGoal(goalId, ideaId) {
  const goal = goals.get(goalId);
  if (!goal) return { ok: false, reason: "GOAL_NOT_FOUND" };
  goal.ideaIds.add(ideaId);
  goal.updatedAt = new Date().toISOString();
  return { ok: true, goal: serialize(goal) };
}

// Link a plan (from planning.mjs) to a goal.
export function linkPlanToGoal(goalId, planId) {
  const goal = goals.get(goalId);
  if (!goal) return { ok: false, reason: "GOAL_NOT_FOUND" };
  goal.planIds.add(planId);
  goal.updatedAt = new Date().toISOString();
  return { ok: true, goal: serialize(goal) };
}

// Filter goals by status without touching listGoals()'s existing contract.
export function listGoalsByStatus(status) {
  return listGoals().filter((g) => g.status === status);
}

// Simple case-insensitive title search.
export function searchGoals(query) {
  const q = String(query || "").toLowerCase();
  if (!q) return [];
  return listGoals().filter((g) => g.title.toLowerCase().includes(q));
}

function serialize(goal) {
  return {
    id: goal.id,
    title: goal.title,
    metadata: goal.metadata,
    status: goal.status,
    taskIds: [...goal.taskIds],
    ideaIds: [...(goal.ideaIds || [])],
    planIds: [...(goal.planIds || [])],
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}
