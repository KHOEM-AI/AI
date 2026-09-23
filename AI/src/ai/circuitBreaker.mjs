// src/ai/circuitBreaker.mjs
// Circuit Breaker (spec Part 11): stops calling a failing dependency
// repeatedly. States: CLOSED (normal) -> OPEN (blocked) -> HALF_OPEN (probe).

export const CB_STATE = Object.freeze({
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN",
});

const breakers = new Map(); // name -> breaker state

const DEFAULTS = Object.freeze({
  failureThreshold: 5,     // consecutive failures before opening
  openMs: 30000,           // how long to stay OPEN before trying HALF_OPEN
  halfOpenSuccessNeeded: 2, // successes in HALF_OPEN before closing
});

function getOrCreate(name, opts = {}) {
  if (!breakers.has(name)) {
    breakers.set(name, {
      name,
      state: CB_STATE.CLOSED,
      consecutiveFailures: 0,
      halfOpenSuccesses: 0,
      openedAt: null,
      limits: { ...DEFAULTS, ...opts },
    });
  }
  return breakers.get(name);
}

// Call before attempting the dependency. Returns whether the call is allowed.
export function beforeCall(name, opts = {}) {
  const b = getOrCreate(name, opts);

  if (b.state === CB_STATE.OPEN) {
    const elapsed = Date.now() - b.openedAt;
    if (elapsed >= b.limits.openMs) {
      b.state = CB_STATE.HALF_OPEN;
      b.halfOpenSuccesses = 0;
      return { allowed: true, state: b.state };
    }
    return { allowed: false, state: b.state, retryAfterMs: b.limits.openMs - elapsed };
  }
  return { allowed: true, state: b.state };
}

export function recordSuccess(name) {
  const b = getOrCreate(name);
  if (b.state === CB_STATE.HALF_OPEN) {
    b.halfOpenSuccesses++;
    if (b.halfOpenSuccesses >= b.limits.halfOpenSuccessNeeded) {
      b.state = CB_STATE.CLOSED;
      b.consecutiveFailures = 0;
    }
  } else {
    b.consecutiveFailures = 0;
  }
  return { state: b.state };
}

export function recordFailure(name) {
  const b = getOrCreate(name);
  if (b.state === CB_STATE.HALF_OPEN) {
    // Any failure during probe re-opens immediately.
    b.state = CB_STATE.OPEN;
    b.openedAt = Date.now();
    b.consecutiveFailures = b.limits.failureThreshold;
    return { state: b.state };
  }
  b.consecutiveFailures++;
  if (b.consecutiveFailures >= b.limits.failureThreshold) {
    b.state = CB_STATE.OPEN;
    b.openedAt = Date.now();
  }
  return { state: b.state };
}

export function getBreakerState(name) {
  const b = breakers.get(name);
  if (!b) return null;
  return { name: b.name, state: b.state, consecutiveFailures: b.consecutiveFailures };
}

export function listBreakers() {
  return [...breakers.values()].map((b) => ({
    name: b.name, state: b.state, consecutiveFailures: b.consecutiveFailures,
  }));
}

// Test/ops helper — never called from production request paths.
export function resetBreaker(name) {
  return breakers.delete(name);
}
