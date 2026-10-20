import { describe, it, expect } from "vitest";
import { verifyGoalCriteria } from "../goalVerifier.mjs";

const results = [
  {
    toolId: "scan-repo-data",
    status: "EXECUTED",
    result: { ok: true, fileCount: 8 },
  },
];

describe("goalVerifier", () => {
  it("verifies successful scan", () => {
    expect(verifyGoalCriteria({
      criteria: ["scan.ok=true", "scan.fileCount>0"],
      results,
    }).passed).toBe(true);
  });

  it("supports file count thresholds", () => {
    expect(verifyGoalCriteria({
      criteria: ["scan.fileCount>=5"],
      results,
    }).passed).toBe(true);

    expect(verifyGoalCriteria({
      criteria: ["scan.fileCount>=9"],
      results,
    }).passed).toBe(false);
  });

  it("fails when scan evidence is absent", () => {
    expect(verifyGoalCriteria({
      criteria: ["scan.ok=true"],
      results: [],
    }).passed).toBe(false);
  });

  it("fails closed for unknown criteria", () => {
    expect(verifyGoalCriteria({
      criteria: ["deploy to production"],
      results,
    }).passed).toBe(false);
  });

  it("requires every criterion to pass", () => {
    expect(verifyGoalCriteria({
      criteria: ["scan.fileCount>0", "deploy to production"],
      results,
    }).passed).toBe(false);
  });

  it("checks whether an allowlisted tool executed", () => {
    expect(verifyGoalCriteria({
      criteria: ["tool.find-symbol.executed"],
      results: [{
        toolId: "find-symbol",
        status: "EXECUTED",
        result: "No symbol found",
      }],
    }).passed).toBe(true);
  });

  it("rejects unknown tool identifiers", () => {
    expect(verifyGoalCriteria({
      criteria: ["tool.unknown-tool.executed"],
      results,
    }).passed).toBe(false);
  });

  it("does not pass empty criteria", () => {
    expect(verifyGoalCriteria({
      criteria: [],
      results,
    }).passed).toBe(false);
  });
});
