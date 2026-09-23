// src/ai/verification.mjs
// Testing + Verification Pipeline (Phase 22, spec Part 4 star 6):
// Runs tsc/build/tests against the REAL repo and returns evidence-based
// status. Verification must come from actual command output, never from
// AI self-assessment. Read-only — never modifies files.

import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const ROOT = process.cwd();
const VERIFY_STATUS = Object.freeze({
  VERIFIED: "VERIFIED",
  UNVERIFIED: "UNVERIFIED",
  CONFLICTING: "CONFLICTING",
  UNKNOWN: "UNKNOWN",
});

const history = [];
const MAX_HISTORY = 100;

function runCheck(cmd, timeout) {
  try {
    const output = execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], timeout }).toString();
    return { ok: true, output: output.slice(-2000) };
  } catch (e) {
    return { ok: false, output: String(e.stdout || e.message || "").slice(-2000), error: String(e.stderr || "").slice(-2000) };
  }
}

export function getVerificationStatuses() {
  return VERIFY_STATUS;
}

// Runs the real pipeline (tsc -> build -> tests) against the actual repo.
// This is evidence, not opinion: the returned status is derived only from
// command exit codes, never from any AI judgement about the code.
export function runVerification(reason = "manual") {
  const tsc = runCheck("npx tsc --noEmit", 60000);
  const build = tsc.ok ? runCheck("npm run build", 90000) : { ok: false, output: "", error: "skipped — tsc failed" };
  const tests = build.ok ? runCheck("npx vitest run", 120000) : { ok: false, output: "", error: "skipped — build failed" };

  let status;
  if (tsc.ok && build.ok && tests.ok) status = VERIFY_STATUS.VERIFIED;
  else if (!tsc.ok || !build.ok) status = VERIFY_STATUS.UNVERIFIED;
  else status = VERIFY_STATUS.CONFLICTING; // build ok but tests failed — mixed evidence

  const report = {
    id: randomUUID(),
    reason,
    createdAt: new Date().toISOString(),
    status,
    checks: { tsc, build, tests },
  };
  history.push(report);
  if (history.length > MAX_HISTORY) history.shift();
  return report;
}

export function getLastVerification() {
  return history.length ? history[history.length - 1] : null;
}

export function listVerifications(limit = 20) {
  return history.slice(-limit).reverse();
}
