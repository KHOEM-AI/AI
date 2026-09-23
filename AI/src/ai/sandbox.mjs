// src/ai/sandbox.mjs
// Sandbox (Phase 20, spec Part 7): AI-generated code changes are tested
// against a TEMPORARY COPY of the repo — never against production files.
// This module never writes to the real repository. Patch proposal (Phase 21)
// and the full test/verify pipeline (Phase 22) build on top of this.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const ROOT = process.cwd();
const EXCLUDE = new Set(["node_modules", ".git", "dist", "data", ".env", ".env.local"]);

// Test files that themselves call runSandboxTest(). If the whole repo is
// copied into a sandbox and its test suite is run there, these files would
// spawn another sandbox from inside the sandbox — unbounded recursion. They
// are excluded from the copy; their correctness is verified by running them
// directly against the real repo (outside any sandbox), not recursively.
const RECURSION_UNSAFE_TEST_FILES = [
  "src/ai/__tests__/sandbox.test.mjs",
  "src/ai/__tests__/patch.test.mjs",
];

// Defense in depth: if somehow invoked from inside an already-running
// sandbox (e.g. a future caller forgets to exclude a recursive test file),
// refuse immediately instead of recursing.
const NESTED = process.env.KHOEM_SANDBOX_NESTED === "1";

export function assertSafeRelPath(relPath) {
  if (typeof relPath !== "string" || !relPath.startsWith("src/")) {
    throw Object.assign(new Error("relPath must start with 'src/'"), { status: 400 });
  }
  const resolved = path.resolve(ROOT, relPath);
  if (!resolved.startsWith(path.resolve(ROOT, "src") + path.sep)) {
    throw Object.assign(new Error("path escapes src/ — rejected"), { status: 400 });
  }
  return relPath;
}

function createSandboxDir() {
  const dir = path.join(os.tmpdir(), "khoem-sandbox-" + randomUUID());
  fs.mkdirSync(dir, { recursive: true });
  for (const entry of fs.readdirSync(ROOT)) {
    if (EXCLUDE.has(entry)) continue;
    fs.cpSync(path.join(ROOT, entry), path.join(dir, entry), { recursive: true });
  }
  for (const rel of RECURSION_UNSAFE_TEST_FILES) {
    fs.rmSync(path.join(dir, rel), { force: true });
  }
  try {
    fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir");
  } catch (e) {
    // Fallback: no symlink support — checks below will fail with a clear reason instead of a crash.
  }
  return dir;
}

function cleanupSandbox(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup — do not throw from cleanup
  }
}

function runCheck(cmd, cwd, timeout) {
  try {
    const output = execSync(cmd, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      timeout,
      env: { ...process.env, KHOEM_SANDBOX_NESTED: "1" },
    }).toString();
    return { ok: true, output: output.slice(-2000) };
  } catch (e) {
    return {
      ok: false,
      output: String(e.stdout || e.message || "").slice(-2000),
      error: String(e.stderr || "").slice(-2000),
    };
  }
}

// Runs a proposed change against a temporary sandbox copy only.
// Never touches the real repository. Always cleans up the sandbox dir.
export function runSandboxTest({ relPath, newContent, reason = "manual" }) {
  if (NESTED) {
    throw Object.assign(new Error("nested sandbox run refused (recursion guard)"), { status: 409 });
  }
  const safeRelPath = assertSafeRelPath(relPath);
  if (typeof newContent !== "string") {
    throw Object.assign(new Error("newContent must be a string"), { status: 400 });
  }

  const dir = createSandboxDir();
  const id = path.basename(dir).replace("khoem-sandbox-", "");
  try {
    const targetPath = path.join(dir, safeRelPath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, newContent, "utf8");

    const tsc = runCheck("npx tsc --noEmit", dir, 60000);
    const build = tsc.ok ? runCheck("npm run build", dir, 90000) : { ok: false, output: "", error: "skipped — tsc failed" };
    const tests = build.ok ? runCheck("npx vitest run", dir, 120000) : { ok: false, output: "", error: "skipped — build failed" };

    const overallOk = tsc.ok && build.ok && tests.ok;
    return {
      id,
      relPath: safeRelPath,
      reason,
      createdAt: new Date().toISOString(),
      ok: overallOk,
      checks: { tsc, build, tests },
      note: "Sandbox only — the real repository was never modified. This result does not apply the change.",
    };
  } finally {
    cleanupSandbox(dir);
  }
}
