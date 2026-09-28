// src/ai/drift.mjs — Behavioral Drift Detection.
// Compares current rates (built only from real counters in metrics.mjs)
// against a rolling in-memory baseline. History resets on server restart.
// Too little data -> "INSUFFICIENT_DATA", never a guess.
import { getMetrics } from "./metrics.mjs";

export const DRIFT_DEFAULTS = Object.freeze({ minSamples: 5, sigma: 3, minAbsDelta: 0.15, minEvents: 5 });
const METRICS = ["denyRate", "taskFailRate", "openBreakerRatio"];
const MAX_SAMPLES = 100;
const samples = [];

const ratio = (num, den, minDen) => (den >= minDen ? num / den : null);

export function sampleFromMetrics(m, opts = {}) {
  const o = { ...DRIFT_DEFAULTS, ...opts };
  const failed = (m.tasks?.byState?.FAILED || 0) + (m.tasks?.byState?.TIMEOUT || 0);
  return {
    at: new Date().toISOString(),
    denyRate: ratio(m.policy?.deny || 0, m.policy?.totalDecisions || 0, o.minEvents),
    taskFailRate: ratio(failed, m.tasks?.total || 0, o.minEvents),
    openBreakerRatio: ratio(m.circuitBreakers?.open || 0, m.circuitBreakers?.total || 0, 1),
  };
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const stdev = (a, mu) => Math.sqrt(a.reduce((s, x) => s + (x - mu) ** 2, 0) / a.length);

export function detectDrift(history, current, opts = {}) {
  const o = { ...DRIFT_DEFAULTS, ...opts };
  const findings = [];
  let comparable = 0;
  for (const metric of METRICS) {
    const cur = current?.[metric];
    if (typeof cur !== "number") continue;
    const base = history.map((h) => h[metric]).filter((v) => typeof v === "number");
    if (base.length < o.minSamples) continue;
    comparable++;
    const mu = mean(base);
    const sd = stdev(base, mu);
    const delta = cur - mu;
    if (Math.abs(delta) > Math.max(o.sigma * sd, o.minAbsDelta)) {
      findings.push({ metric, current: cur, mean: mu, sd, delta });
    }
  }
  const status = comparable === 0 ? "INSUFFICIENT_DATA" : findings.length ? "DRIFTING" : "STABLE";
  return { status, samples: history.length, findings };
}

export function recordSample(sample) {
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) samples.shift();
  return sample;
}

// Compares first, then records, so the current sample is not part of its own baseline.
export function getDriftReport(opts = {}) {
  const current = sampleFromMetrics(getMetrics(), opts);
  const report = detectDrift(samples, current, opts);
  recordSample(current);
  return { ...report, current, checkedAt: new Date().toISOString() };
}

export function resetDrift() {
  samples.length = 0;
}
