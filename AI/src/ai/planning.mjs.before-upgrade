// src/ai/planning.mjs — Planning Engine (spec Part 8). Plans are validated, never executed here.
import { randomUUID } from "node:crypto";
import { RISK_RANK } from "./ideas.mjs";

const plans = new Map();
const MAX_PLANS = 200;

function bad(msg) {
  return Object.assign(new Error(msg), { status: 400 });
}

export function validatePlan(plan) {
  const problems = [];
  if (!plan.verificationCriteria.length) problems.push("MISSING_VERIFICATION_CRITERIA");
  if (RISK_RANK[plan.risk] >= RISK_RANK.MEDIUM && !String(plan.rollbackPlan).trim()) {
    problems.push("MISSING_ROLLBACK_PLAN");
  }
  return { ok: problems.length === 0, problems };
}

export function createPlan({ goal, steps, verificationCriteria = [], rollbackPlan = "", budget = null } = {}) {
  if (typeof goal !== "string" || !goal.trim()) throw bad("goal required");
  if (!Array.isArray(steps) || steps.length === 0) throw bad("steps must be a non-empty array");
  if (!Array.isArray(verificationCriteria)) throw bad("verificationCriteria must be an array");
  const clean = steps.map((s, n) => {
    if (!s || typeof s.description !== "string" || !s.description.trim()) throw bad(`step ${n + 1}: description required`);
    const risk = s.risk ?? "LOW";
    if (!RISK_RANK[risk]) throw bad(`step ${n + 1}: invalid risk`);
    return { order: n + 1, description: s.description.trim(), tools: s.tools ?? [], permissions: s.permissions ?? [], risk };
  });
  const risk = clean.reduce((m, s) => (RISK_RANK[s.risk] > RISK_RANK[m] ? s.risk : m), "LOW");
  const plan = {
    planId: randomUUID(), goal: goal.trim(), steps: clean, verificationCriteria, rollbackPlan, budget,
    risk, requiresApproval: RISK_RANK[risk] >= RISK_RANK.HIGH,
    executable: false, createdAt: new Date().toISOString(),
  };
  const v = validatePlan(plan);
  plan.validation = v;
  plan.status = v.ok ? "VALID" : "INVALID";
  plans.set(plan.planId, plan);
  if (plans.size > MAX_PLANS) plans.delete(plans.keys().next().value);
  return plan;
}

export const getPlan = (id) => plans.get(id) ?? null;
export const listPlans = () => [...plans.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
