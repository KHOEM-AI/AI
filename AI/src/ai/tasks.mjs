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

// ================= EXECUTION + COGNITIVE STATE =================

export const EXECUTION = Object.freeze({
  IDLE: "IDLE", PROCESSING: "PROCESSING", TOOL_CALL: "TOOL_CALL",
  RETRIEVING: "RETRIEVING", LEARNING: "LEARNING", RESPONDING: "RESPONDING",
});
export const COGNITIVE = Object.freeze({
  IDLE: "IDLE", UNDERSTANDING: "UNDERSTANDING", RETRIEVING: "RETRIEVING",
  PLANNING: "PLANNING", REASONING: "REASONING", VERIFYING: "VERIFYING", ANSWERING: "ANSWERING",
});

const EXEC_ALLOWED = {
  IDLE: ["PROCESSING"],
  PROCESSING: ["TOOL_CALL", "RETRIEVING", "LEARNING", "RESPONDING"],
  TOOL_CALL: ["PROCESSING", "RETRIEVING", "RESPONDING"],
  RETRIEVING: ["PROCESSING", "TOOL_CALL", "RESPONDING"],
  LEARNING: ["PROCESSING", "RESPONDING"],
  RESPONDING: ["IDLE"],
};
const COG_ALLOWED = {
  IDLE: ["UNDERSTANDING"],
  UNDERSTANDING: ["RETRIEVING", "PLANNING", "REASONING", "ANSWERING"],
  RETRIEVING: ["PLANNING", "REASONING", "VERIFYING", "ANSWERING"],
  PLANNING: ["RETRIEVING", "REASONING"],
  REASONING: ["RETRIEVING", "VERIFYING", "ANSWERING"],
  VERIFYING: ["REASONING", "ANSWERING"],
  ANSWERING: ["IDLE"],
};

function stepState(taskId, field, table, enumObj, to, reason) {
  const t = tasks.get(taskId);
  if (!t) throw new Error("Unknown task");
  if (t.state !== "RUNNING" && t.state !== "WAITING")
    throw new Error(`Task must be RUNNING/WAITING to change ${field} (is ${t.state})`);
  if (!(to in enumObj)) throw new Error(`Invalid ${field} state: ${to}`);
  const from = t[field] ?? "IDLE";
  if (from !== to && !table[from].includes(to))
    throw new Error(`Illegal ${field} transition: ${from} -> ${to}`);
  t[field] = to;
  t.updatedAt = new Date().toISOString();
  emit(taskId, `${field.toUpperCase()}_${to}`, { from, reason });
  return { from, to, taskId, reason, timestamp: t.updatedAt };
}

export const setExecution = (id, to, reason = "") => stepState(id, "execution", EXEC_ALLOWED, EXECUTION, to, reason);
export const setCognitive = (id, to, reason = "") => stepState(id, "cognitive", COG_ALLOWED, COGNITIVE, to, reason);
