// src/ai/session.mjs
// SESSION layer (Part 1 #10): session lifecycle, state, timeout, conversation state.
// checkSessionHealth is the single source of truth used by status.mjs.

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const sessions = new Map();

export const SESSION_STATE = Object.freeze({
  ACTIVE: "ACTIVE",
  IDLE: "IDLE",
  EXPIRED: "EXPIRED",
});

export function checkSessionHealth(aiCore) {
  const mem = aiCore && aiCore.memory;
  if (!mem || typeof mem.add !== "function" || typeof mem.get !== "function") {
    throw new Error("session memory interface missing");
  }
  return {
    status: "READY",
    reasonKm: "Session memory មាន add/get និងអាចប្រើបាន",
    reasonEn: "Session memory exposes add/get and is usable",
    module: "memory.mjs",
  };
}

export function startSession(sessionId) {
  const now = Date.now();
  const s = { createdAt: now, lastActiveAt: now, state: SESSION_STATE.ACTIVE };
  sessions.set(sessionId, s);
  return s;
}

export function touchSession(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  s.lastActiveAt = Date.now();
  s.state = SESSION_STATE.ACTIVE;
  return s;
}

export function getSessionState(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  const idleMs = Date.now() - s.lastActiveAt;
  if (idleMs > SESSION_TIMEOUT_MS) s.state = SESSION_STATE.EXPIRED;
  else if (idleMs > SESSION_TIMEOUT_MS / 2) s.state = SESSION_STATE.IDLE;
  return { ...s, idleMs };
}

export function endSession(sessionId) {
  return sessions.delete(sessionId);
}

export function activeSessionCount() {
  let n = 0;
  for (const s of sessions.values()) {
    if (s.state !== SESSION_STATE.EXPIRED) n++;
  }
  return n;
}
