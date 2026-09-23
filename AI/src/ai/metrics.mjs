// src/ai/metrics.mjs
// Metrics / Observability (spec Part 11 + 4.16): aggregates REAL counters
// from existing modules only. Never fabricates a number — if a source
// module has no counter, that metric is reported as "NOT_IMPLEMENTED".

import { getAudit } from "./permission.mjs";
import { listApprovals } from "./approvals.mjs";
import { listBudgets } from "./budget.mjs";
import { listBreakers } from "./circuitBreaker.mjs";
import { getLastVerification, listVerifications } from "./verification.mjs";
import { getAllTasks } from "./tasks.mjs";

function count(arr, pred) {
  return arr.filter(pred).length;
}

export function getMetrics() {
  const policyDecisions = getAudit(500);
  const approvals = listApprovals();
  const budgets = listBudgets();
  const breakers = listBreakers();
  const verifications = listVerifications(100);
  const tasks = getAllTasks();

  return {
    generatedAt: new Date().toISOString(),

    policy: {
      totalDecisions: policyDecisions.length,
      allow: count(policyDecisions, (d) => d.decision === "ALLOW"),
      deny: count(policyDecisions, (d) => d.decision === "DENY"),
      requireApproval: count(policyDecisions, (d) => d.decision === "REQUIRE_APPROVAL"),
    },

    approvals: {
      total: approvals.length,
      pending: count(approvals, (a) => a.status === "PENDING_APPROVAL"),
      approved: count(approvals, (a) => a.status === "APPROVED"),
      rejected: count(approvals, (a) => a.status === "REJECTED"),
      expired: count(approvals, (a) => a.status === "EXPIRED"),
    },

    budgets: {
      active: budgets.length,
      exceeded: count(budgets, (b) =>
        b.usage.toolCalls >= b.limits.maxToolCalls ||
        b.usage.retries >= b.limits.maxRetries ||
        b.usage.tokens >= b.limits.maxTokens ||
        b.usage.cost >= b.limits.maxCost
      ),
    },

    circuitBreakers: {
      total: breakers.length,
      open: count(breakers, (b) => b.state === "OPEN"),
      halfOpen: count(breakers, (b) => b.state === "HALF_OPEN"),
      closed: count(breakers, (b) => b.state === "CLOSED"),
    },

    verification: {
      lastStatus: getLastVerification()?.status ?? "NOT_IMPLEMENTED",
      last100: {
        verified: count(verifications, (v) => v.status === "VERIFIED"),
        unverified: count(verifications, (v) => v.status === "UNVERIFIED"),
        conflicting: count(verifications, (v) => v.status === "CONFLICTING"),
      },
    },

    tasks: {
      total: tasks.length,
      // task states are whatever tasks.mjs currently reports — no invented buckets
      byState: tasks.reduce((acc, t) => {
        acc[t.state] = (acc[t.state] || 0) + 1;
        return acc;
      }, {}),
    },

    // Metrics required by spec but with no real source yet — reported
    // honestly rather than fabricated.
    notImplemented: ["approvalLatencyMs", "executionAuthorizationFailures"],
  };
}
