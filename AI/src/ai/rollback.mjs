// src/ai/rollback.mjs
// Rollback strategy (Part 20: "Rollback strategy exists").
// Non-destructive: NEVER executes git reset/revert or restores task state
// automatically. Only records snapshots and computes the exact steps/commands
// a human operator must review and run (Part 5: AI must never self-escalate).

import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { getAllTasks } from "./tasks.mjs";

const ROOT = process.cwd();
const snapshots = new Map();
const MAX_SNAPSHOTS = 200;

function currentGit() {
  try {
    const commit = execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT }).toString().trim();
    const dirty = execSync("git status --porcelain", { cwd: ROOT }).toString().trim().length > 0;
    return { commit, branch, dirty };
  } catch {
    return { commit: null, branch: null, dirty: null };
  }
}

export function createSnapshot(reason = "manual") {
  const git = currentGit();
  const snapshot = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    reason,
    git,
    // Read-only copy of task state at snapshot time — not a live reference.
    tasks: getAllTasks().map((t) => ({ ...t })),
  };
  snapshots.set(snapshot.id, snapshot);
  const ids = [...snapshots.keys()];
  if (ids.length > MAX_SNAPSHOTS) snapshots.delete(ids[0]);
  return snapshot;
}

export function listSnapshots() {
  return [...snapshots.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSnapshot(id) {
  return snapshots.get(id) ?? null;
}

// Builds a rollback PLAN only — never executes anything.
export function buildRollbackPlan(id) {
  const snap = getSnapshot(id);
  if (!snap) return null;
  const nowGit = currentGit();
  const steps = [];

  if (snap.git.commit) {
    steps.push({
      step: "restore-code",
      description: `Return working tree to the commit at snapshot time (${snap.git.commit.slice(0, 8)} on ${snap.git.branch})`,
      reviewCommand: `git diff --stat ${snap.git.commit}..HEAD`,
      applyCommand: `git checkout ${snap.git.commit} -- .`,
      warning: "Review the diff first. This overwrites uncommitted changes in the working tree.",
    });
  } else {
    steps.push({
      step: "restore-code",
      description: "No git commit was recorded at snapshot time — cannot build a code rollback command.",
      applyCommand: null,
    });
  }

  steps.push({
    step: "restore-task-state",
    description: `Snapshot recorded ${snap.tasks.length} task(s). Task state is in-memory only and is not restored automatically.`,
    manualAction: "Re-create/replay affected tasks from the snapshot's `tasks` array if runtime state must match the snapshot.",
  });

  return {
    snapshotId: snap.id,
    snapshotCreatedAt: snap.createdAt,
    snapshotReason: snap.reason,
    currentGit: nowGit,
    steps,
    note: "No command in this plan is executed automatically. A human operator must review and run these manually.",
  };
}
