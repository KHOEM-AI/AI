// src/ai/budget.mjs
// Resource Budget (spec Part 11): per-task limits on tool calls, retries,
// tokens, and cost. On exhaustion: STOP or REQUIRE_APPROVAL. Never infinite loop.

const DEFAULT_LIMITS = Object.freeze({
  maxToolCalls: 20,
  maxRetries: 3,
  maxTokens: 100000,
  maxCost: 1.0,
  timeMs: 120000,
});

const budgets = new Map(); // taskId -> { limits, usage, startedAt }
const MAX_BUDGETS = 500;

export function createBudget(taskId, limits = {}) {
  const budget = {
    taskId,
    limits: { ...DEFAULT_LIMITS, ...limits },
    usage: { toolCalls: 0, retries: 0, tokens: 0, cost: 0 },
    startedAt: Date.now(),
  };
  budgets.set(taskId, budget);
  const ids = [...budgets.keys()];
  if (ids.length > MAX_BUDGETS) budgets.delete(ids[0]);
  return budget;
}

export function getBudget(taskId) {
  return budgets.get(taskId) ?? null;
}

// Records usage and returns the check result immediately (evidence-based,
// never AI self-assessment — pure arithmetic against real counters).
export function recordUsage(taskId, delta = {}) {
  const b = budgets.get(taskId);
  if (!b) return { ok: false, reason: "NO_BUDGET", exceeded: [] };

  if (delta.toolCalls) b.usage.toolCalls += delta.toolCalls;
  if (delta.retries) b.usage.retries += delta.retries;
  if (delta.tokens) b.usage.tokens += delta.tokens;
  if (delta.cost) b.usage.cost += delta.cost;

  return checkBudget(taskId);
}

export function checkBudget(taskId) {
  const b = budgets.get(taskId);
  if (!b) return { ok: false, reason: "NO_BUDGET", exceeded: [] };

  const exceeded = [];
  if (b.usage.toolCalls >= b.limits.maxToolCalls) exceeded.push("maxToolCalls");
  if (b.usage.retries >= b.limits.maxRetries) exceeded.push("maxRetries");
  if (b.usage.tokens >= b.limits.maxTokens) exceeded.push("maxTokens");
  if (b.usage.cost >= b.limits.maxCost) exceeded.push("maxCost");
  if (Date.now() - b.startedAt >= b.limits.timeMs) exceeded.push("timeMs");

  return {
    ok: exceeded.length === 0,
    action: exceeded.length === 0 ? "CONTINUE" : "STOP",
    exceeded,
    usage: { ...b.usage },
    limits: { ...b.limits },
  };
}

export function listBudgets() {
  return [...budgets.values()];
}

export function clearBudget(taskId) {
  return budgets.delete(taskId);
}
