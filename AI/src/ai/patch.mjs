// src/ai/patch.mjs
// Safe Code Patch Proposal (Phase 21, spec Part 3 + Part 8):
// PROPOSE -> RISK CHECK -> APPROVAL -> APPLY, with sandbox verification
// and an automatic rollback snapshot before any production write.
//
// This is the ONLY module in the codebase allowed to write to files under
// src/. It never bypasses sandbox verification or approval re-check.

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { assertSafeRelPath, runSandboxTest } from "./sandbox.mjs";
import {
  createApprovalRequest,
  verifyBeforeExecution,
  markExecuted,
} from "./approvals.mjs";
import { createSnapshot } from "./rollback.mjs";

const ROOT = process.cwd();
const proposals = new Map();
const MAX_PROPOSALS = 200;

// Step 1: PROPOSE + RISK CHECK (sandbox). Never touches the real file.
// Returns a proposal id + sandbox result. If sandbox fails, no approval
// request is created — a failing patch cannot enter the approval queue.
export function proposePatch({ relPath, newContent, reason = "manual", actor = "user" }) {
  const safeRelPath = assertSafeRelPath(relPath);
  if (typeof newContent !== "string") {
    throw Object.assign(new Error("newContent must be a string"), { status: 400 });
  }

  const sandboxResult = runSandboxTest({ relPath: safeRelPath, newContent, reason });

  const proposal = {
    id: randomUUID(),
    relPath: safeRelPath,
    newContent,
    reason,
    actor,
    createdAt: new Date().toISOString(),
    sandboxOk: sandboxResult.ok,
    sandboxChecks: sandboxResult.checks,
    approvalId: null,
  };
  proposals.set(proposal.id, proposal);
  const ids = [...proposals.keys()];
  if (ids.length > MAX_PROPOSALS) proposals.delete(ids[0]);

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

  // Automatic rollback point before any production write (Phase 13 link).
  const snapshot = createSnapshot(`before applying patch ${proposalId} to ${proposal.relPath}`);

  const absPath = path.resolve(ROOT, proposal.relPath);
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
