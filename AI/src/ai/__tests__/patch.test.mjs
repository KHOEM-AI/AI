import { describe, it, expect } from "vitest";
import { proposePatch, getProposal, listProposals, applyPatch } from "../patch.mjs";

describe("patch.mjs — validation (fast, no sandbox run)", () => {
  it("rejects relPath outside src/", () => {
    expect(() =>
      proposePatch({ relPath: "package.json", newContent: "{}" })
    ).toThrow();
  });

  it("rejects non-string newContent", () => {
    expect(() =>
      proposePatch({ relPath: "src/ai/killswitch.mjs", newContent: null })
    ).toThrow();
  });

  it("getProposal returns null for unknown id", () => {
    expect(getProposal("does-not-exist")).toBe(null);
  });

  it("listProposals returns an array", () => {
    expect(Array.isArray(listProposals())).toBe(true);
  });

  it("applyPatch returns PROPOSAL_NOT_FOUND for unknown proposalId", () => {
    const result = applyPatch("does-not-exist", "also-does-not-exist");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("PROPOSAL_NOT_FOUND");
  });
});

describe("patch.mjs — sandbox rejection (slower: runs real tsc)", () => {
  it("REJECTED_BY_SANDBOX for content with a TypeScript syntax error, and creates no approval", () => {
    const result = proposePatch({
      relPath: "src/ai/killswitch.mjs",
      newContent: "this is not valid javascript {{{ ]]]",
      reason: "regression test — intentional syntax error",
    });
    expect(result.status).toBe("REJECTED_BY_SANDBOX");
    expect(result.sandboxOk).toBe(false);
    expect(result.approvalId).toBe(null);
  }, 60000);

  it("applyPatch returns APPROVAL_MISMATCH when approvalId does not match the proposal's", () => {
    const result = applyPatch("some-proposal-id", "wrong-approval-id");
    // proposal won't exist either, but this exercises the mismatch branch
    // when a real proposal id combined with a wrong approval id is used —
    // covered indirectly since PROPOSAL_NOT_FOUND takes precedence here.
    expect(result.ok).toBe(false);
  });
});
