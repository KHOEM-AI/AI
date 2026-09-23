// src/ai/patch.mjs
// Safe Code Patch Proposal (Phase 21, spec Part 3 + Part 8):
// PROPOSE -> RISK CHECK -> APPROVAL -> APPLY, with sandbox verification
// and an automatic rollback snapshot before any production write.
//
// This is the ONLY module in the codebase allowed to write to files under
// src/. It never bypasses sandbox verification or approval re-check.

import fs from "node:fs";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { assertSafeRelPath, runSandboxTest } from "./sandbox.mjs";
import {
  createApprovalRequest,
  verifyBeforeExecution,
  markExecuted,
  getApproval,
} from "./approvals.mjs";
import { createSnapshot } from "./rollback.mjs";

const ROOT = process.cwd();
const proposals = new Map();
const MAX_PROPOSALS = 200;

// Evict proposals that can no longer be applied (no approval, REJECTED,
// EXPIRED, or already executed). Live approvals are never evicted.
export function pruneProposals(map, keepId, max = MAX_PROPOSALS) {
  let removed = 0;
  for (const [pid, p] of map) {
    if (map.size <= max) break;
    if (pid === keepId) continue;
    const a = p.approvalId ? getApproval(p.approvalId) : null;
    const dead = !a || a.status === "REJECTED" || a.status === "EXPIRED" || Boolean(a.executedAt);
    if (dead) { map.delete(pid); removed++; }
  }
  return removed;
}

// Step 1: PROPOSE + RISK CHECK (sandbox). Never touches the real file.
// Returns a proposal id + sandbox result. If sandbox fails, no approval
// request is created — a failing patch cannot enter the approval queue.
export function proposePatch({ relPath, newContent, reason = "manual", actor = "user" }) {
  const safeRelPath = assertSafeRelPath(relPath);
  if (typeof newContent !== "string") {
    throw Object.assign(new Error("newContent must be a string"), { status: 400 });
  }

  const sandboxResult = runSandboxTest({ relPath: safeRelPath, newContent, reason });

  // Hash the target file as it stood at propose time. The sandbox result
  // only proves newContent is safe against THIS repo state — if the file
  // (or anything it depends on) changes before apply, that proof is stale.
  const absPathAtPropose = path.resolve(ROOT, safeRelPath);
  const baseContent = fs.existsSync(absPathAtPropose) ? fs.readFileSync(absPathAtPropose, "utf8") : "";
  const baseHash = createHash("sha256").update(baseContent).digest("hex");

  const proposal = {
    id: randomUUID(),
    relPath: safeRelPath,
    newContent,
    reason,
    actor,
    createdAt: new Date().toISOString(),
    sandboxOk: sandboxResult.ok,
    sandboxChecks: sandboxResult.checks,
    baseHash,
    approvalId: null,
  };
  proposals.set(proposal.id, proposal);
  pruneProposals(proposals, proposal.id);

  if (!sandboxResult.ok) {
    return { ...proposal, status: "REJECTED_BY_SANDBOX" };
  }

  // Step 2: request human APPROVAL. code.applyPatch is registered HIGH risk
  // in permission.mjs, so this always creates a PENDING approval — never
  // auto-allowed, regardless of sandbox success.
  const approval = createApprovalRequest({
    action: "code.applyPatch",
    actor,
    permission: "code.write",
    risk: "HIGH",
    reason: `sandbox-verified patch to ${safeRelPath}: ${reason}`,
    target: proposal.id,
    resource: safeRelPath,
  });
  proposal.approvalId = approval.id;

  return { ...proposal, status: "PENDING_APPROVAL", approval };
}

export function getProposal(id) {
  return proposals.get(id) ?? null;
}

export function listProposals() {
  return [...proposals.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Step 3: APPLY — only reachable after human approval. Re-verifies the
// approval (spec 4.8), takes an automatic rollback snapshot first, then
// writes the real file. Any failure before the write leaves production
// untouched.
export function applyPatch(proposalId, approvalId, actor = "user") {
  const proposal = getProposal(proposalId);
  if (!proposal) {
    return { ok: false, error: "PROPOSAL_NOT_FOUND" };
  }
  if (proposal.approvalId !== approvalId) {
    return { ok: false, error: "APPROVAL_MISMATCH" };
  }

  const verify = verifyBeforeExecution(approvalId, {
    action: "code.applyPatch",
    target: proposalId,
  });
  if (!verify.ok) {
    return { ok: false, error: verify.error };
  }

  // Staleness guard: the sandbox result only proves newContent is safe
  // against the repo state at propose time. If the target file changed
  // since then (another patch, a manual edit), that proof no longer
  // holds — refuse rather than silently overwrite an unverified state.
  const absPath = path.resolve(ROOT, proposal.relPath);
  const currentContent = fs.existsSync(absPath) ? fs.readFileSync(absPath, "utf8") : "";
  const currentHash = createHash("sha256").update(currentContent).digest("hex");
  if (currentHash !== proposal.baseHash) {
    return { ok: false, error: "STALE_PROPOSAL: target file changed since sandbox verification — re-propose the patch" };
  }

  // Automatic rollback point before any production write (Phase 13 link).
  const snapshot = createSnapshot(`before applying patch ${proposalId} to ${proposal.relPath}`);

  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, proposal.newContent, "utf8");

  markExecuted(approvalId);

  return {
    ok: true,
    relPath: proposal.relPath,
    appliedAt: new Date().toISOString(),
    rollbackSnapshotId: snapshot.id,
    note: `File written. To undo: GET /api/rollback/plan/${snapshot.id}`,
  };
}
