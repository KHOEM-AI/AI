// src/ai/ideas.mjs — Idea Engine (spec Part 8). Ideas are proposals only: never executed.
import { randomUUID } from "node:crypto";

export const RISK_RANK = Object.freeze({ LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 });
const COMPLEXITY_RANK = Object.freeze({ LOW: 1, MEDIUM: 2, HIGH: 3 });
const MAX_IDEAS = 200;
const ideas = new Map();

function bad(msg) {
  return Object.assign(new Error(msg), { status: 400 });
}

export function createIdea({
  title, description = "", reason = "", expectedBenefit = "", benefitScore = 0,
  dependencies = [], risk = "LOW", complexity = "LOW", estimatedCost = 0,
  testPlan = "", rollbackPlan = "", origin = "generated",
} = {}) {
  if (typeof title !== "string" || !title.trim()) throw bad("title required");
  if (!RISK_RANK[risk]) throw bad("invalid risk");
  if (!COMPLEXITY_RANK[complexity]) throw bad("invalid complexity");
  if (!Array.isArray(dependencies)) throw bad("dependencies must be an array");
  if (typeof estimatedCost !== "number" || estimatedCost < 0) throw bad("invalid estimatedCost");
  if (typeof benefitScore !== "number" || benefitScore < 0 || benefitScore > 10) throw bad("benefitScore must be 0-10");
  const idea = {
    ideaId: randomUUID(), title: title.trim(), description, reason, expectedBenefit, benefitScore,
    dependencies, risk, complexity, estimatedCost, testPlan, rollbackPlan, origin,
    status: "PROPOSED", executable: false, createdAt: new Date().toISOString(),
  };
  ideas.set(idea.ideaId, idea);
  if (ideas.size > MAX_IDEAS) ideas.delete(ideas.keys().next().value);
  return idea;
}

export const getIdea = (id) => ideas.get(id) ?? null;
export const listIdeas = () => [...ideas.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function scoreIdea(i) {
  return i.benefitScore - RISK_RANK[i.risk] - COMPLEXITY_RANK[i.complexity];
}

export function rankIdeas(list = listIdeas()) {
  return list
    .map((i) => ({ ideaId: i.ideaId, title: i.title, score: scoreIdea(i), risk: i.risk, complexity: i.complexity }))
    .sort((a, b) => b.score - a.score);
}

// ===== NEW (additive only) =====

export const IDEA_STATUS = Object.freeze({
  PROPOSED: "PROPOSED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  IMPLEMENTED: "IMPLEMENTED",
});

const ALLOWED_TRANSITIONS = {
  PROPOSED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["IMPLEMENTED", "REJECTED"],
  REJECTED: [],
  IMPLEMENTED: [],
};

// Advisory status transition — does not execute anything, just records intent.
export function transitionIdea(ideaId, toStatus) {
  const idea = ideas.get(ideaId);
  if (!idea) return { ok: false, reason: "IDEA_NOT_FOUND" };
  if (!Object.values(IDEA_STATUS).includes(toStatus)) {
    return { ok: false, reason: "INVALID_STATUS" };
  }
  const allowed = ALLOWED_TRANSITIONS[idea.status] || [];
  if (!allowed.includes(toStatus)) {
    return { ok: false, reason: `ILLEGAL_TRANSITION (${idea.status} -> ${toStatus})` };
  }
  idea.status = toStatus;
  idea.updatedAt = new Date().toISOString();
  return { ok: true, idea };
}

export function listIdeasByStatus(status) {
  return listIdeas().filter((i) => i.status === status);
}

export function searchIdeas(query) {
  const q = String(query || "").toLowerCase();
  if (!q) return [];
  return listIdeas().filter(
    (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
  );
}
