// src/ai/experiments.mjs — Experiment Engine (spec Part 8). Records experiments only;
// it never writes to production files.
import { randomUUID } from "node:crypto";

export const EXPERIMENT = Object.freeze({
  CREATED: "CREATED", RUNNING: "RUNNING", COMPLETED: "COMPLETED", FAILED: "FAILED", CANCELLED: "CANCELLED",
});
const ALLOWED = {
  CREATED: ["RUNNING", "CANCELLED"],
  RUNNING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: [], FAILED: [], CANCELLED: [],
};
const experiments = new Map();
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
  return { ok: true, experiment: exp };
}

export const getExperiment = (id) => experiments.get(id) ?? null;
export const listExperiments = () => [...experiments.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
