// src/ai/sessionPruner.mjs — periodic cleanup of idle in-memory chat sessions.
// Age is measured from each session's last message timestamp (AIMemory.pruneOldSessions).
export function startSessionPruner(memory, {
  maxAgeHours = Number(process.env.KHOEM_SESSION_MAX_AGE_HOURS) || 24,
  intervalMs = 60 * 60 * 1000,
  log = console.log,
  logError = console.error,
} = {}) {
  const timer = setInterval(() => {
    try {
      const n = memory.pruneOldSessions(maxAgeHours * 3600 * 1000);
      if (n) log(`[memory] pruned ${n} idle session(s) older than ${maxAgeHours}h`);
    } catch (e) {
      logError("[memory] prune failed:", e && e.message);
    }
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  return { timer, maxAgeHours, stop: () => clearInterval(timer) };
}
