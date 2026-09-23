// src/ai/modelRouting.mjs
// Model Routing / Fallback (spec Part 10 §Model Routing): decides which
// provider to use based on registered availability. Never silently
// changes providers when policy prohibits it. Never fabricates a
// fallback provider that does not actually exist.

const PROVIDERS = new Map(); // name -> { name, available, isPrimary }

// Register the one real provider this system currently has (khoem-local),
// wired to core.mjs's actual constructor default — not invented.
PROVIDERS.set("khoem", { name: "khoem", available: true, isPrimary: true });

export function registerProvider(name, { available = true } = {}) {
  PROVIDERS.set(name, { name, available, isPrimary: false });
  return { ok: true };
}

export function setProviderAvailability(name, available) {
  const p = PROVIDERS.get(name);
  if (!p) return { ok: false, reason: "PROVIDER_NOT_REGISTERED" };
  p.available = available;
  return { ok: true };
}

export function listProviders() {
  return [...PROVIDERS.values()];
}

const routingHistory = [];
const MAX_HISTORY = 200;

// Decides which provider to use. If the preferred provider is unavailable
// and policy allows fallback, picks the next available registered
// provider. If no fallback is configured/available, returns NO_FALLBACK
// rather than inventing one — honest failure over fake success.
export function decideProvider(preferred = "khoem", { allowFallback = true } = {}) {
  const primary = PROVIDERS.get(preferred);
  const timestamp = new Date().toISOString();

  if (primary && primary.available) {
    const decision = { primaryModel: preferred, fallbackModel: null, usedProvider: preferred, reason: "primary available", timestamp };
    record(decision);
    return decision;
  }

  if (!allowFallback) {
    const decision = { primaryModel: preferred, fallbackModel: null, usedProvider: null, reason: "primary unavailable, fallback disabled by policy", timestamp, error: "NO_PROVIDER" };
    record(decision);
    return decision;
  }

  const fallback = [...PROVIDERS.values()].find((p) => p.name !== preferred && p.available);
  if (fallback) {
    const decision = { primaryModel: preferred, fallbackModel: fallback.name, usedProvider: fallback.name, reason: "primary unavailable, fell back", timestamp };
    record(decision);
    return decision;
  }

  const decision = { primaryModel: preferred, fallbackModel: null, usedProvider: null, reason: "no available provider — none fabricated", timestamp, error: "NO_FALLBACK" };
  record(decision);
  return decision;
}

function record(decision) {
  routingHistory.push(decision);
  if (routingHistory.length > MAX_HISTORY) routingHistory.shift();
}

export function getRoutingHistory(limit = 50) {
  return routingHistory.slice(-limit).reverse();
}
