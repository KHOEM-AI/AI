// src/ai/policyRegistry.mjs — Policy as data.
// The action -> { permission, risk } table lives here, separate from the
// decision logic in permission.mjs. If an entry changes, bump
// POLICY_VERSION / PERMISSION_VERSION in permission.mjs.

export const RISK = Object.freeze({ LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", CRITICAL: "CRITICAL" });

// registry: action -> { permission, risk }
export const REGISTRY = {
  "tool.scan": { permission: "tool.execute", risk: RISK.LOW },
  "tool.check": { permission: "tool.execute", risk: RISK.LOW },
  "tool.find": { permission: "file.read", risk: RISK.LOW },
  "tool.funcs": { permission: "file.read", risk: RISK.LOW },
  "tool.read": { permission: "file.read", risk: RISK.LOW },
  "knowledge.readLearned": { permission: "knowledge.read", risk: RISK.LOW },
  "learning.write": { permission: "knowledge.write", risk: RISK.MEDIUM },
  "learning.delete": { permission: "knowledge.write", risk: RISK.MEDIUM },
  // Phase 14 (spec 4.13): mock only to test the pipeline — no real effect
  "approval.test.high-risk": { permission: "system.modify", risk: RISK.HIGH },
  // Phase 12: emergency stop / resume. MEDIUM = auto-ALLOW so kill is instant.
  // TODO: raise "system.resume" to RISK.HIGH once execute-after-approval
  // pipeline exists for real (non-mock) actions.
  "system.kill": { permission: "system.modify", risk: RISK.MEDIUM },
  "system.resume": { permission: "system.modify", risk: RISK.MEDIUM },
  // Phase 13: rollback snapshots/plans are read-only — no destructive
  // execution happens through the API, so LOW risk / auto-ALLOW is safe.
  "rollback.snapshot": { permission: "system.read", risk: RISK.LOW },
  "rollback.plan": { permission: "system.read", risk: RISK.LOW },
  // Phase 20: sandbox tests run against a temp copy only — production
  // is never touched, so MEDIUM/auto-ALLOW is appropriate. Applying a
  // verified sandbox result to production (Phase 21) will be HIGH risk.
  "code.sandboxTest": { permission: "tool.execute", risk: RISK.MEDIUM },
  // Phase 21: proposing a patch only runs it in sandbox (no production
  // write) so MEDIUM/auto-ALLOW is safe. Applying it is a real write to
  // src/ and always requires human approval regardless of sandbox result.
  "code.proposePatch": { permission: "tool.execute", risk: RISK.MEDIUM },
  "code.applyPatch": { permission: "code.write", risk: RISK.HIGH },
  // Phase 22 verification (tsc/build/tests):
  // - cannot modify source files
  // - may generate temporary/runtime test artifacts (e.g. audit-log.test.jsonl)
  // - cannot perform production actions
  // - cannot bypass permission/policy checks
  "code.verify": { permission: "tool.execute", risk: RISK.LOW },
  // Phase 21: budget check is read-only (no execution), safe to auto-ALLOW.
  "budget.check": { permission: "system.read", risk: RISK.LOW },
  // Phase 23: circuit breaker status is read-only.
  "circuit.check": { permission: "system.read", risk: RISK.LOW },
  // Phase 27: metrics are read-only aggregates of existing counters.
  "metrics.read": { permission: "system.read", risk: RISK.LOW },
  // Phase 6: goals are user-facing organizational objects, not privileged actions.
  "goal.create": { permission: "system.write", risk: RISK.LOW },
  "goal.read": { permission: "system.read", risk: RISK.LOW },
  "goal.link": { permission: "system.write", risk: RISK.LOW },
  "goal.setStatus": { permission: "system.write", risk: RISK.LOW },
  // Phase 24: routing decision is read-only, never changes provider without policy check inside decideProvider().
  "model.route": { permission: "system.read", risk: RISK.LOW },
  // Phases 15/16/18/19: engines only record proposals/plans/experiments.
  // Nothing here executes or applies anything, so LOW is appropriate.
  "ideas.read": { permission: "system.read", risk: RISK.LOW },
  "ideas.create": { permission: "system.write", risk: RISK.LOW },
  "plan.read": { permission: "system.read", risk: RISK.LOW },
  "plan.create": { permission: "system.write", risk: RISK.LOW },
  "experiment.read": { permission: "system.read", risk: RISK.LOW },
  "experiment.create": { permission: "system.write", risk: RISK.LOW },
  "experiment.transition": { permission: "system.write", risk: RISK.LOW },
  "selfeval.run": { permission: "system.read", risk: RISK.LOW },
  "code.read": { permission: "file.read", risk: RISK.LOW },
  "code.scan": { permission: "tool.execute", risk: RISK.LOW },
  "task.read": { permission: "system.read", risk: RISK.LOW },
  "system.statusRead": { permission: "system.read", risk: RISK.LOW },
  "patch.read": { permission: "system.read", risk: RISK.LOW },
  "verify.read": { permission: "system.read", risk: RISK.LOW },
  "audit.read": { permission: "system.read", risk: RISK.LOW },
  "approval.read": { permission: "system.read", risk: RISK.LOW },
  "approval.decide": { permission: "system.modify", risk: RISK.MEDIUM },
  "approval.execute": { permission: "system.modify", risk: RISK.LOW },
};

// Structural check for the registry. Returns { ok, problems } and never throws.
export function validatePolicyRegistry(reg = REGISTRY) {
  const problems = [];
  const risks = Object.values(RISK);
  for (const [action, spec] of Object.entries(reg)) {
    if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(action)) problems.push('bad action name: ' + action);
    if (!spec || typeof spec.permission !== 'string' || !spec.permission.trim()) problems.push('missing permission: ' + action);
    if (!spec || !risks.includes(spec.risk)) problems.push('invalid risk: ' + action);
  }
  return { ok: problems.length === 0, problems };
}
