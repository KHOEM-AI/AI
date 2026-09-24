// src/ai/selfEval.mjs — Self-Evaluation (spec Part 9/17). ADVISORY ONLY.
// Priority: TEST RESULT > SYSTEM RESULT > VERIFIED EVIDENCE > SELF-EVALUATION.
export const EVAL = Object.freeze({ SUCCESS: "SUCCESS", PARTIAL: "PARTIAL", FAILED: "FAILED", UNCERTAIN: "UNCERTAIN" });

export function selfEvaluate({ goalAchieved, testsPassed, evidence = [], remaining = [] } = {}) {
  const out = (result, reason) => ({ result, reason, advisory: true, evaluatedAt: new Date().toISOString() });
  if (testsPassed === false) return out(EVAL.FAILED, "test result overrides self-claim");
  if (testsPassed !== true) return out(EVAL.UNCERTAIN, "no test result available");
  if (!evidence.length) return out(EVAL.UNCERTAIN, "no evidence supplied");
  if (goalAchieved === true && remaining.length === 0) return out(EVAL.SUCCESS, "tests passed, evidence present, nothing remaining");
  return out(EVAL.PARTIAL, "tests passed but goal not fully achieved or work remains");
}
