// src/ai/experiments.mjs — Experiment Engine (spec Part 8). Records experiments only;
// it never writes to production files.
import { randomUUID } from "node:crypto";
import { loadItems, saveItems } from "./persist.mjs";

export const EXPERIMENT = Object.freeze({
  CREATED: "CREATED", RUNNING: "RUNNING", COMPLETED: "COMPLETED", FAILED: "FAILED", CANCELLED: "CANCELLED",
});
const ALLOWED = {
  CREATED: ["RUNNING", "CANCELLED"],
  RUNNING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: [], FAILED: [], CANCELLED: [],
};
const experiments = new Map(loadItems("experiments").map((e) => [e.experimentId, e]));
const save = () => saveItems("experiments", [...experiments.values()]);
const MAX_EXPERIMENTS = 200;

export function createExperiment({ goal, hypothesis, inputs = {}, changes = [] } = {}) {
  if (typeof goal !== "string" || !goal.trim()) throw Object.assign(new Error("goal required"), { status: 400 });
  if (typeof hypothesis !== "string" || !hypothesis.trim()) throw Object.assign(new Error("hypothesis required"), { status: 400 });
  const exp = {
    experimentId: randomUUID(), goal, hypothesis, inputs, changes,
    results: null, metrics: null, status: EXPERIMENT.CREATED, sandboxOnly: true,
    createdAt: new Date().toISOString(), completedAt: null,
  };
  experiments.set(exp.experimentId, exp);
  if (experiments.size > MAX_EXPERIMENTS) experiments.delete(experiments.keys().next().value);
  save();
  return exp;
}

export function transitionExperiment(id, to, { results, metrics } = {}) {
  const exp = experiments.get(id);
  if (!exp) return { ok: false, error: "NOT_FOUND" };
  if (!ALLOWED[exp.status]?.includes(to)) return { ok: false, error: `INVALID_TRANSITION (${exp.status} -> ${to})` };
  exp.status = to;
  if (results !== undefined) exp.results = results;
  if (metrics !== undefined) exp.metrics = metrics;
  if (ALLOWED[to].length === 0) exp.completedAt = new Date().toISOString();
  save();
  return { ok: true, experiment: exp };
}

export const getExperiment = (id) => experiments.get(id) ?? null;
export const listExperiments = () => [...experiments.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function listExperimentsByStatus(status) {
  return listExperiments().filter((e) => e.status === status);
}

export function experimentStats() {
  const all = listExperiments();
  const finished = all.filter((e) => e.status === "COMPLETED" || e.status === "FAILED");
  const completed = finished.filter((e) => e.status === "COMPLETED").length;
  return {
    total: all.length,
    finished: finished.length,
    completed,
    failed: finished.length - completed,
    successRatePct: finished.length ? Math.round((completed / finished.length) * 100) : null,
  };
}

export function searchExperiments(query) {
  const q = String(query || "").toLowerCase();
  if (!q) return [];
  return listExperiments().filter(
    (e) => e.goal.toLowerCase().includes(q) || e.hypothesis.toLowerCase().includes(q)
  );
}
