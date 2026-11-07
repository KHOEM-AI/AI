# KHOEM-AI — Protected Core Files

## Purpose

This document records the files designated as protected core implementation.

Protection is enforced through `.github/CODEOWNERS` together with the
repository's GitHub branch/ruleset configuration.

A CODEOWNERS entry alone does not prevent direct pushes. The repository
must require code-owner review on the protected branch for the lock to
be enforced.

## Protected files

### AI Core / State

- `src/ai/memory.mjs`
- `src/ai/status.mjs`
- `src/ai/tasks.mjs`
- `src/ai/session.mjs`
- `src/ai/goal.mjs`

### Security / Authorization / Approval

- `src/ai/permission.mjs`
- `src/ai/approvals.mjs`
- `src/ai/audit.mjs`
- `src/ai/killswitch.mjs`
- `src/ai/verification.mjs`

### Code Change Safety

- `src/ai/rollback.mjs`
- `src/ai/sandbox.mjs`
- `src/ai/patch.mjs`

### Resource / Reliability Controls

- `src/ai/budget.mjs`
- `src/ai/circuitBreaker.mjs`
- `src/ai/retry.mjs`
- `src/ai/metrics.mjs`

### Model Layer

- `src/ai/model.mjs`
- `src/ai/modelRouting.mjs`

## Change policy

Protected files must not be changed casually or replaced based on
assumptions.

Any change should:

1. Identify the reason for the change.
2. Inspect the existing implementation before editing.
3. Preserve existing behavior unless a deliberate change is required.
4. Update or add tests when behavior changes.
5. Run the relevant test suite.
6. Run TypeScript/static checks when applicable.
7. Review the final diff before commit.
8. Require CODEOWNER review before merging to the protected branch.

## Important distinction

"Protected" does not mean "never change".

It means changes require deliberate review and verification.

Security, approval, audit, permission, rollback, sandbox, verification,
budget, circuit-breaker, retry, goal, and model-routing behavior must not
be removed or rewritten merely to make tests pass.

## Current baseline

The original protected set contained 19 files. `.github/CODEOWNERS` has since grown to 45 entries
(the 19 under "Protected files" plus the 26 under "Additional protected files").

The project test baseline at the time this lock list was created was:

- 77/77 tests passing
- Phase 24 Model Routing/Fallback implemented
- `main` synchronized with `origin/main`

These values are a historical baseline, not a permanent guarantee.
Future changes must re-run the test suite and review the resulting diff.

## Additional protected files

Added later in `.github/CODEOWNERS` (the enforced source). The same change policy applies.

### Core AI modules (previously unprotected)

- `src/ai/api.mjs`
- `src/ai/chinese.mjs`
- `src/ai/codeDataCenter.mjs`
- `src/ai/core.mjs`
- `src/ai/enginesSummary.mjs`
- `src/ai/english.mjs`
- `src/ai/experiments.mjs`
- `src/ai/find.mjs`
- `src/ai/ideas.mjs`
- `src/ai/khoem.mjs`
- `src/ai/knowledge.mjs`
- `src/ai/langCheckers.mjs`
- `src/ai/learn.mjs`
- `src/ai/planning.mjs`
- `src/ai/selfEval.mjs`
- `src/ai/tools.mjs`

### Safety and execution guards

- `src/ai/agentLoop.mjs`
- `src/ai/toolExecutor.mjs`
- `src/ai/toolRegistry.mjs`
- `src/ai/toolRegistry.bootstrap.mjs`
- `src/ai/inputGuard.mjs`
- `src/ai/inputRefs.mjs`
- `src/ai/goalVerifier.mjs`
- `src/ai/policyRegistry.mjs`
- `src/ai/persist.mjs`
- `src/ai/registerAll.mjs`

## Scope

This lock list intentionally does not protect:

- `docs/`
- temporary `*.bak` files
- temporary phase-application scripts

Those files remain outside this protected set until separately reviewed.
