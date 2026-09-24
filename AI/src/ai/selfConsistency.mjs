const STATUS = Object.freeze({
  CONSISTENT: "CONSISTENT",
  INCONSISTENT: "INCONSISTENT",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
});

const CONFIDENCE = Object.freeze({
  HIGH: "HIGH",
  LOW: "LOW",
  UNCERTAIN: "UNCERTAIN",
});

function normalizeAnswer(answer) {
  return String(answer ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function analyzeConsistency(answers = []) {
  if (!Array.isArray(answers) || answers.length < 2) {
    return {
      status: STATUS.INSUFFICIENT_EVIDENCE,
      confidence: CONFIDENCE.UNCERTAIN,
      count: Array.isArray(answers) ? answers.length : 0,
      agreementRatio: 0,
    };
  }

  const normalized = answers
    .map(normalizeAnswer)
    .filter(Boolean);

  if (normalized.length < 2) {
    return {
      status: STATUS.INSUFFICIENT_EVIDENCE,
      confidence: CONFIDENCE.UNCERTAIN,
      count: normalized.length,
      agreementRatio: 0,
    };
  }

  const counts = new Map();

  for (const answer of normalized) {
    counts.set(answer, (counts.get(answer) || 0) + 1);
  }

  const maxAgreement = Math.max(...counts.values());
  const agreementRatio = maxAgreement / normalized.length;

  if (agreementRatio === 1) {
    return {
      status: STATUS.CONSISTENT,
      confidence: CONFIDENCE.HIGH,
      count: normalized.length,
      agreementRatio,
    };
  }

  return {
    status: STATUS.INCONSISTENT,
    confidence: CONFIDENCE.LOW,
    count: normalized.length,
    agreementRatio,
  };
}

export { STATUS as CONSISTENCY_STATUS };
