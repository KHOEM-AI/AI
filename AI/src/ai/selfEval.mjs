// src/ai/selfEval.mjs — Self-Evaluation (spec Part 9/17). ADVISORY ONLY.
// Priority: TEST RESULT > SYSTEM RESULT > VERIFIED EVIDENCE > SELF-EVALUATION.
export const EVAL = Object.freeze({ SUCCESS: "SUCCESS", PARTIAL: "PARTIAL", FAILED: "FAILED", UNCERTAIN: "UNCERTAIN" });

const history = [];
const MAX_HISTORY = 200;

export function selfEvaluate({ goalAchieved, testsPassed, evidence = [], remaining = [] } = {}) {
  const out = (result, reason) => ({ result, reason, advisory: true, evaluatedAt: new Date().toISOString() });
  let evalResult;
  if (testsPassed === false) evalResult = out(EVAL.FAILED, "test result overrides self-claim");
  else if (testsPassed !== true) evalResult = out(EVAL.UNCERTAIN, "no test result available");
  else if (!evidence.length) evalResult = out(EVAL.UNCERTAIN, "no evidence supplied");
  else if (goalAchieved === true && remaining.length === 0) evalResult = out(EVAL.SUCCESS, "tests passed, evidence present, nothing remaining");
  else evalResult = out(EVAL.PARTIAL, "tests passed but goal not fully achieved or work remains");

  history.push(evalResult);
  if (history.length > MAX_HISTORY) history.shift();
  return evalResult;
}

export function getEvalHistory(limit = 50) {
  return history.slice(-limit).reverse();
}

export function getEvalStats() {
  const tally = {};
  for (const e of history) tally[e.result] = (tally[e.result] || 0) + 1;
  return { total: history.length, byResult: tally };
}
