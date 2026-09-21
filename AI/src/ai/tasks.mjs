// src/ai/tasks.mjs — Task engine + trace events (standalone, additive)
import { randomUUID } from "node:crypto";

export const TASK = Object.freeze({
  CREATED: "CREATED", QUEUED: "QUEUED", RUNNING: "RUNNING", WAITING: "WAITING",
  COMPLETED: "COMPLETED", FAILED: "FAILED", CANCELLED: "CANCELLED", TIMEOUT: "TIMEOUT",
});

const ALLOWED = {
  CREATED: ["QUEUED", "CANCELLED"],
  QUEUED: ["RUNNING", "CANCELLED", "TIMEOUT"],
  RUNNING: ["WAITING", "COMPLETED", "FAILED", "TIMEOUT", "CANCELLED"],
  WAITING: ["RUNNING", "TIMEOUT", "CANCELLED", "FAILED"],
  COMPLETED: [], FAILED: [], CANCELLED: [], TIMEOUT: [],
};

const MAX_TASKS = 200;
const MAX_EVENTS = 500;
const tasks = new Map();
const events = [];

export function emit(taskId, type, metadata = {}, duration = null) {
  const ev = { id: randomUUID(), taskId, type, timestamp: new Date().toISOString(), duration, metadata };
  events.push(ev);
  if (events.length > MAX_EVENTS) events.shift();
  return ev;
}

export function createTask(metadata = {}) {
  const now = new Date().toISOString();
  const task = { taskId: randomUUID(), createdAt: now, updatedAt: now, state: TASK.CREATED, reason: "created", metadata, transitions: [] };
  tasks.set(task.taskId, task);
  if (tasks.size > MAX_TASKS) tasks.delete(tasks.keys().next().value);
  emit(task.taskId, "TASK_CREATED");
  return task;
}

export function transition(taskId, to, reason = "") {
  const t = tasks.get(taskId);
  if (!t) throw new Error("Unknown task");
  if (!(to in TASK)) throw new Error(`Invalid task state: ${to}`);
  if (!ALLOWED[t.state].includes(to)) throw new Error(`Illegal task transition: ${t.state} -> ${to}`);
  const tr = { from: t.state, to, timestamp: new Date().toISOString(), reason, taskId };
  t.transitions.push(tr);
  t.state = to; t.reason = reason; t.updatedAt = tr.timestamp;
  emit(taskId, to === "RUNNING" ? "TASK_STARTED" : `TASK_${to}`, { reason });
  return tr;
}

export const getTask = (id) => tasks.get(id) ?? null;
export const getEvents = (taskId) => (taskId ? events.filter((e) => e.taskId === taskId) : [...events]);
