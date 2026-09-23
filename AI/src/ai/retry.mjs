// src/ai/retry.mjs
// Retry Policy (spec Part 11 §Retry Policy): retries only where cascading
// failure risk does NOT exist. Read-only/idempotent operations only —
// duplicate side effects (writes) must never be auto-retried.

const DEFAULTS = Object.freeze({
  maxRetries: 3,
  baseDelayMs: 200,
  maxDelayMs: 5000,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt, opts) {
  const raw = opts.baseDelayMs * Math.pow(2, attempt);
  return Math.min(raw, opts.maxDelayMs);
}

// Retries `fn` (must be idempotent/read-only) with exponential backoff.
// Returns { ok, result, attempts, error } — never throws; caller decides
// what to do with a final failure (e.g. STOP or REQUIRE_APPROVAL).
export async function retryIdempotent(fn, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  let lastError = null;

  for (let attempt = 0; attempt <= o.maxRetries; attempt++) {
    try {
      const result = await fn(attempt);
      return { ok: true, result, attempts: attempt + 1, error: null };
    } catch (e) {
      lastError = e && e.message ? e.message : String(e);
      if (attempt < o.maxRetries) {
        await sleep(backoffDelay(attempt, o));
      }
    }
  }
  return { ok: false, result: null, attempts: o.maxRetries + 1, error: lastError };
}

// Explicit guard: call this before wrapping any action in retryIdempotent.
// Write/mutating actions must never be retried automatically (spec: "never
// duplicate writes" / "no automatic retry (duplicate side effects possible)").
const NON_RETRYABLE_PREFIXES = ["code.applyPatch", "learning.write", "learning.delete", "system.kill", "system.resume"];

export function isRetryable(action) {
  return !NON_RETRYABLE_PREFIXES.includes(action);
}
