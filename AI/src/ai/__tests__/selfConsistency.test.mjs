import { describe, it, expect } from "vitest";
import {
  analyzeConsistency,
  CONSISTENCY_STATUS,
} from "../selfConsistency.mjs";

describe("selfConsistency.mjs", () => {
  it("returns CONSISTENT for identical answers", () => {
    const result = analyzeConsistency([
      "The capital is Phnom Penh.",
      "The capital is Phnom Penh.",
      "The capital is Phnom Penh.",
    ]);

    expect(result.status).toBe(CONSISTENCY_STATUS.CONSISTENT);
    expect(result.confidence).toBe("HIGH");
    expect(result.count).toBe(3);
    expect(result.agreementRatio).toBe(1);
  });

  it("normalizes whitespace and case", () => {
    const result = analyzeConsistency([
      "  Phnom Penh  ",
      "phnom   penh",
      "PHNOM PENH",
    ]);

    expect(result.status).toBe(CONSISTENCY_STATUS.CONSISTENT);
    expect(result.agreementRatio).toBe(1);
  });

  it("returns INCONSISTENT for divergent answers", () => {
    const result = analyzeConsistency([
      "Phnom Penh",
      "Bangkok",
      "Phnom Penh",
    ]);

    expect(result.status).toBe(CONSISTENCY_STATUS.INCONSISTENT);
    expect(result.confidence).toBe("LOW");
    expect(result.count).toBe(3);
    expect(result.agreementRatio).toBeCloseTo(2 / 3);
  });

  it("returns INSUFFICIENT_EVIDENCE with fewer than two answers", () => {
    const result = analyzeConsistency(["Phnom Penh"]);

    expect(result.status).toBe(CONSISTENCY_STATUS.INSUFFICIENT_EVIDENCE);
    expect(result.confidence).toBe("UNCERTAIN");
  });

  it("returns INSUFFICIENT_EVIDENCE for empty answers", () => {
    const result = analyzeConsistency([]);

    expect(result.status).toBe(CONSISTENCY_STATUS.INSUFFICIENT_EVIDENCE);
    expect(result.confidence).toBe("UNCERTAIN");
    expect(result.count).toBe(0);
  });

  it("does not call inconsistency hallucination", () => {
    const result = analyzeConsistency([
      "Answer A",
      "Answer B",
    ]);

    expect(result.status).toBe(CONSISTENCY_STATUS.INCONSISTENT);
    expect(result).not.toHaveProperty("hallucination");
  });
});
