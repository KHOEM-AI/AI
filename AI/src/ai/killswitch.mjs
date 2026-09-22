// src/ai/killswitch.mjs
let killed = false;
let killedAt = null;
let killedReason = null;

export function isKilled() {
  return killed;
}

export function activateKillSwitch(reason = "manual") {
  killed = true;
  killedAt = new Date().toISOString();
  killedReason = reason;
  return { ok: true, killed, killedAt, killedReason };
}

export function deactivateKillSwitch() {
  killed = false;
  killedAt = null;
  killedReason = null;
  return { ok: true, killed };
}

export function getKillSwitchStatus() {
  return { killed, killedAt, killedReason };
}
