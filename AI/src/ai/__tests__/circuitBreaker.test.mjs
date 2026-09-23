import { describe, it, expect, beforeEach, vi } from "vitest";
import { beforeCall, recordSuccess, recordFailure, getBreakerState, resetBreaker, CB_STATE } from "../circuitBreaker.mjs";

describe("circuitBreaker.mjs", () => {
  beforeEach(() => resetBreaker("svc"));

  it("starts CLOSED and allows calls", () => {
    const r = beforeCall("svc");
    expect(r.allowed).toBe(true);
    expect(r.state).toBe(CB_STATE.CLOSED);
  });

  it("opens after failureThreshold consecutive failures", () => {
    beforeCall("svc", { failureThreshold: 3 });
    recordFailure("svc"); recordFailure("svc"); recordFailure("svc");
    expect(getBreakerState("svc").state).toBe(CB_STATE.OPEN);
    expect(beforeCall("svc").allowed).toBe(false);
  });

  it("moves to HALF_OPEN after openMs elapses, then CLOSED after enough successes", async () => {
    beforeCall("svc", { failureThreshold: 1, openMs: 10, halfOpenSuccessNeeded: 1 });
    recordFailure("svc");
    expect(getBreakerState("svc").state).toBe(CB_STATE.OPEN);
    await new Promise((r) => setTimeout(r, 20));
    const r = beforeCall("svc");
    expect(r.state).toBe(CB_STATE.HALF_OPEN);
    recordSuccess("svc");
    expect(getBreakerState("svc").state).toBe(CB_STATE.CLOSED);
  });

  it("re-opens immediately on failure during HALF_OPEN", async () => {
    beforeCall("svc", { failureThreshold: 1, openMs: 10 });
    recordFailure("svc");
    await new Promise((r) => setTimeout(r, 20));
    beforeCall("svc");
    recordFailure("svc");
    expect(getBreakerState("svc").state).toBe(CB_STATE.OPEN);
  });
});
