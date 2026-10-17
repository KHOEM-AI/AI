import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { startSessionPruner } from "../sessionPruner.mjs";
import { AIMemory } from "../memory.mjs";

const H = 3600 * 1000;
let pruner;
let savedEnv;

beforeEach(() => {
  savedEnv = process.env.KHOEM_SESSION_MAX_AGE_HOURS;
  delete process.env.KHOEM_SESSION_MAX_AGE_HOURS;
  vi.useFakeTimers();
});
afterEach(() => {
  if (pruner) pruner.stop();
  pruner = undefined;
  vi.useRealTimers();
  if (savedEnv === undefined) delete process.env.KHOEM_SESSION_MAX_AGE_HOURS;
  else process.env.KHOEM_SESSION_MAX_AGE_HOURS = savedEnv;
});

function memWith(sessions) {
  const m = new AIMemory();
  for (const [id, ageMs] of Object.entries(sessions)) {
    m.add(id, { role: "user", content: "hi" });
    m.sessions.get(id)[0].timestamp = new Date(Date.now() - ageMs).toISOString();
  }
  return m;
}

describe("sessionPruner — real AIMemory", () => {
  it("does nothing before the first interval", () => {
    const m = memWith({ old: 48 * H });
    pruner = startSessionPruner(m, { log: () => {} });
    vi.advanceTimersByTime(59 * 60 * 1000);
    expect(m.listSessionIds()).toEqual(["old"]);
  });
  it("after one interval removes idle sessions and keeps active ones", () => {
    const m = memWith({ old: 48 * H, fresh: 0 });
    pruner = startSessionPruner(m, { log: () => {} });
    vi.advanceTimersByTime(H);
    expect(m.listSessionIds()).toEqual(["fresh"]);
  });
  it("respects a custom maxAgeHours", () => {
    const m = memWith({ twoH: 2 * H, halfH: 30 * 60 * 1000 });
    pruner = startSessionPruner(m, { maxAgeHours: 1, intervalMs: 1000, log: () => {} });
    vi.advanceTimersByTime(1000);
    expect(m.listSessionIds()).toEqual(["halfH"]);
  });
  it("keeps running on every interval", () => {
    const m = memWith({ fresh: 0 });
    pruner = startSessionPruner(m, { maxAgeHours: 1, intervalMs: H, log: () => {} });
    vi.advanceTimersByTime(30 * 60 * 1000);
    expect(m.listSessionIds()).toEqual(["fresh"]);
    vi.advanceTimersByTime(2 * H); // fresh is now > 1h old and gets pruned on a later tick
    expect(m.listSessionIds()).toEqual([]);
  });
});

describe("sessionPruner — logging and failures", () => {
  it("logs only when something was removed", () => {
    const log = vi.fn();
    const m = { pruneOldSessions: vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(2) };
    pruner = startSessionPruner(m, { intervalMs: 1000, maxAgeHours: 24, log });
    vi.advanceTimersByTime(1000);
    expect(log).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toContain("pruned 2");
    expect(log.mock.calls[0][0]).toContain("24h");
  });
  it("a throwing prune is logged, not thrown, and the timer keeps going", () => {
    const logError = vi.fn();
    const m = { pruneOldSessions: vi.fn(() => { throw new Error("boom"); }) };
    pruner = startSessionPruner(m, { intervalMs: 1000, logError });
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
    expect(m.pruneOldSessions).toHaveBeenCalledTimes(2);
    expect(logError).toHaveBeenCalledTimes(2);
    expect(logError.mock.calls[0][1]).toBe("boom");
  });
  it("stop() prevents further runs", () => {
    const m = { pruneOldSessions: vi.fn(() => 0) };
    pruner = startSessionPruner(m, { intervalMs: 1000 });
    vi.advanceTimersByTime(1000);
    pruner.stop();
    vi.advanceTimersByTime(5000);
    expect(m.pruneOldSessions).toHaveBeenCalledTimes(1);
  });
});

describe("sessionPruner — KHOEM_SESSION_MAX_AGE_HOURS", () => {
  const argFor = (env) => {
    if (env === undefined) delete process.env.KHOEM_SESSION_MAX_AGE_HOURS;
    else process.env.KHOEM_SESSION_MAX_AGE_HOURS = env;
    const m = { pruneOldSessions: vi.fn(() => 0) };
    const p = startSessionPruner(m, { intervalMs: 1000 });
    vi.advanceTimersByTime(1000);
    p.stop();
    return m.pruneOldSessions.mock.calls[0][0];
  };
  it("defaults to 24h", () => expect(argFor(undefined)).toBe(24 * H));
  it("uses the env value", () => expect(argFor("2")).toBe(2 * H));
  it("invalid or zero falls back to 24h", () => {
    expect(argFor("abc")).toBe(24 * H);
    expect(argFor("0")).toBe(24 * H);
  });
});
