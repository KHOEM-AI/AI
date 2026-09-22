import { describe, it, expect } from "vitest";
import { aiStatus, TASK_STATE, SAFETY_STATE, CONFIDENCE_STATE } from "../status.mjs";

describe("status.mjs state machine", () => {
  it("rejects transitions out of a terminal task state", () => {
    aiStatus.reset();
    aiStatus.startTask("t1");
    aiStatus.setTaskState(TASK_STATE.QUEUED);
    aiStatus.setTaskState(TASK_STATE.RUNNING);
    aiStatus.setTaskState(TASK_STATE.COMPLETED);
    expect(() => aiStatus.setTaskState(TASK_STATE.RUNNING)).toThrow();
  });
  it("rejects invalid SAFETY_STATE", () => {
    aiStatus.reset();
    expect(() => aiStatus.setSafetyState("BOGUS")).toThrow();
    aiStatus.setSafetyState(SAFETY_STATE.REVIEW_REQUIRED);
    expect(aiStatus.getState().safety).toBe(SAFETY_STATE.REVIEW_REQUIRED);
  });
  it("rejects invalid CONFIDENCE_STATE", () => {
    aiStatus.reset();
    expect(() => aiStatus.setConfidenceState("BOGUS")).toThrow();
    aiStatus.setConfidenceState(CONFIDENCE_STATE.LOW);
    expect(aiStatus.getState().confidence).toBe(CONFIDENCE_STATE.LOW);
  });
});
