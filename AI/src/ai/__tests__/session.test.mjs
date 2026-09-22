import { describe, it, expect } from "vitest";
import { checkSessionHealth, startSession, touchSession, getSessionState, endSession, activeSessionCount, SESSION_STATE } from "../session.mjs";

describe("session.mjs", () => {
  it("throws when memory interface missing", () => {
    expect(() => checkSessionHealth({})).toThrow();
  });
  it("passes when memory has add/get", () => {
    expect(checkSessionHealth({ memory: { add: () => {}, get: () => [] } }).status).toBe("READY");
  });
  it("lifecycle: start, touch, end", () => {
    startSession("s1");
    expect(activeSessionCount()).toBeGreaterThan(0);
    expect(touchSession("s1").state).toBe(SESSION_STATE.ACTIVE);
    expect(getSessionState("s1").state).toBe(SESSION_STATE.ACTIVE);
    endSession("s1");
    expect(getSessionState("s1")).toBeNull();
  });
});
