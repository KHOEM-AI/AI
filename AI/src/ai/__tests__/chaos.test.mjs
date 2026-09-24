import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { beforeCall, recordSuccess, recordFailure, getBreakerState, resetBreaker } from "../circuitBreaker.mjs";

// Chaos tests: inject faults into a fake dependency and check the breaker's guarantees.
// Test-only. No production code is touched and no real time is waited (fake timers).

const NAMES = ["chaos-a", "chaos-b"];

function makeDep(mode) {
  const dep = { calls: 0, mode };
  dep.fn = async () => {
    dep.calls++;
    if (dep.mode === "down") throw new Error("INJECTED_ERROR");
    if (dep.mode === "mixed") throw new Error(dep.calls % 2 ? "INJECTED_TIMEOUT" : "INJECTED_ERROR");
    return "ok";
  };
  return dep;
}

async function guarded(name, fn) {
  const gate = beforeCall(name);
  if (!gate.allowed) return { blocked: true, ...gate };
  try {
    const value = await fn();
    recordSuccess(name);
    return { ok: true, value };
  } catch (e) {
    recordFailure(name);
    return { ok: false, error: e.message };
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  NAMES.forEach(resetBreaker);
});

afterEach(() => {
  vi.useRealTimers();
  NAMES.forEach(resetBreaker);
});

async function openBreaker(name, dep) {
  dep.mode = "down";
  for (let i = 0; i < 5; i++) await guarded(name, dep.fn);
}

describe("chaos: circuit breaker under injected faults", () => {
  it("total outage (errors + timeouts): dependency is hit only 5 times out of 1000 calls", async () => {
    const dep = makeDep("mixed");
    let blocked = 0;
    for (let i = 0; i < 1000; i++) {
      const r = await guarded("chaos-a", dep.fn);
      if (r.blocked) blocked++;
    }
    expect(dep.calls).toBe(5);
    expect(blocked).toBe(995);
    expect(getBreakerState("chaos-a").state).toBe("OPEN");
  });

  it("a success in between resets the failure count (4 fail, 1 ok, 4 fail stays CLOSED)", async () => {
    const dep = makeDep("down");
    for (let i = 0; i < 4; i++) await guarded("chaos-a", dep.fn);
    dep.mode = "up";
    await guarded("chaos-a", dep.fn);
    dep.mode = "down";
    for (let i = 0; i < 4; i++) await guarded("chaos-a", dep.fn);
    const s = getBreakerState("chaos-a");
    expect(s.state).toBe("CLOSED");
    expect(s.consecutiveFailures).toBe(4);
  });

  it("recovers: stays blocked until 30s, then HALF_OPEN, then 2 successes close it", async () => {
    const dep = makeDep("down");
    await openBreaker("chaos-a", dep);
    dep.mode = "up";

    vi.advanceTimersByTime(29999);
    const early = await guarded("chaos-a", dep.fn);
    expect(early.blocked).toBe(true);
    expect(early.retryAfterMs).toBe(1);

    vi.advanceTimersByTime(1);
    expect((await guarded("chaos-a", dep.fn)).ok).toBe(true);
    expect(getBreakerState("chaos-a").state).toBe("HALF_OPEN");
    expect((await guarded("chaos-a", dep.fn)).ok).toBe(true);
    expect(getBreakerState("chaos-a").state).toBe("CLOSED");
  });

  it("a failed probe in HALF_OPEN re-opens immediately for a full new 30s", async () => {
    const dep = makeDep("down");
    await openBreaker("chaos-a", dep);
    vi.advanceTimersByTime(30000);

    const probe = await guarded("chaos-a", dep.fn);
    expect(probe.ok).toBe(false);
    expect(dep.calls).toBe(6);

    const next = await guarded("chaos-a", dep.fn);
    expect(next.blocked).toBe(true);
    expect(next.retryAfterMs).toBe(30000);
    expect(dep.calls).toBe(6);
  });

  it("isolation: one dependency being down does not block another", async () => {
    const bad = makeDep("down");
    const good = makeDep("up");
    await openBreaker("chaos-a", bad);
    const r = await guarded("chaos-b", good.fn);
    expect(r.ok).toBe(true);
    expect(getBreakerState("chaos-a").state).toBe("OPEN");
    expect(getBreakerState("chaos-b").state).toBe("CLOSED");
  });
});
