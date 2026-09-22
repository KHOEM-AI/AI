import { describe, it, expect } from "vitest";
import {
  createSnapshot,
  listSnapshots,
  getSnapshot,
  buildRollbackPlan,
} from "../rollback.mjs";

describe("rollback.mjs", () => {
  it("createSnapshot returns a snapshot with id, createdAt, git, tasks", () => {
    const snap = createSnapshot("unit test");
    expect(snap.id).toBeTruthy();
    expect(snap.createdAt).toBeTruthy();
    expect(snap.reason).toBe("unit test");
    expect(snap.git).toHaveProperty("commit");
    expect(Array.isArray(snap.tasks)).toBe(true);
  });

  it("defaults reason to 'manual' when not provided", () => {
    const snap = createSnapshot();
    expect(snap.reason).toBe("manual");
  });

  it("listSnapshots returns newest first and includes created snapshot", () => {
    const snap = createSnapshot("list test");
    const all = listSnapshots();
    expect(all.some((s) => s.id === snap.id)).toBe(true);
    expect(all[0].createdAt >= all[all.length - 1].createdAt).toBe(true);
  });

  it("getSnapshot returns null for unknown id", () => {
    expect(getSnapshot("does-not-exist")).toBe(null);
  });

  it("buildRollbackPlan returns null for unknown snapshot", () => {
    expect(buildRollbackPlan("does-not-exist")).toBe(null);
  });

  it("buildRollbackPlan never includes an auto-execute flag and includes manual review commands", () => {
    const snap = createSnapshot("plan test");
    const plan = buildRollbackPlan(snap.id);
    expect(plan.snapshotId).toBe(snap.id);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.note).toMatch(/human operator/i);
    // Every step must be inspectable, never auto-applied by this module.
    for (const step of plan.steps) {
      expect(step).not.toHaveProperty("autoExecute");
    }
  });
});
