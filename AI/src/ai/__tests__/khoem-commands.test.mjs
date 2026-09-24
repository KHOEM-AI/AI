import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../learn.mjs", () => ({ handleLearn: vi.fn(() => null), load: vi.fn(() => []) }));
vi.mock("../patch.mjs", () => ({
  proposePatch: vi.fn(), getProposal: vi.fn(),
  applyPatch: vi.fn(), listProposals: vi.fn(),
}));
vi.mock("../approvals.mjs", () => ({ approveRequest: vi.fn(), rejectRequest: vi.fn() }));
vi.mock("../chinese.mjs", () => ({ chineseReply: vi.fn(() => "ZH-REPLY") }));
vi.mock("../english.mjs", async (orig) => ({ ...(await orig()), englishReply: vi.fn(() => "EN-REPLY") }));

import { khoemReply } from "../khoem.mjs";
import { getProposal, applyPatch, listProposals } from "../patch.mjs";
import { approveRequest, rejectRequest } from "../approvals.mjs";
import { chineseReply } from "../chinese.mjs";
import { englishReply } from "../english.mjs";

const say = (content) => [{ role: "user", content }];

beforeEach(() => {
  vi.resetAllMocks();
  getProposal.mockReturnValue(null);
  listProposals.mockReturnValue([]);
  chineseReply.mockReturnValue("ZH-REPLY");
  englishReply.mockReturnValue("EN-REPLY");
});

describe("khoemReply /approve", () => {
  it("reports when the proposal does not exist", async () => {
    const r = await khoemReply(say("/approve p1"));
    expect(r).toBe("រកមិនឃើញ proposal: p1");
    expect(applyPatch).not.toHaveBeenCalled();
  });

  it("reports a proposal that has no approval attached", async () => {
    getProposal.mockReturnValue({ id: "p1" });
    const r = await khoemReply(say("/approve p1"));
    expect(r).toContain("គ្មាន approval ភ្ជាប់");
    expect(approveRequest).not.toHaveBeenCalled();
    expect(applyPatch).not.toHaveBeenCalled();
  });

  it("does not apply when the approval is refused", async () => {
    getProposal.mockReturnValue({ id: "p1", approvalId: "a1" });
    approveRequest.mockReturnValue({ error: "NOT_PENDING" });
    const r = await khoemReply(say("/approve p1"));
    expect(r).toBe("❌ មិនអាចអនុម័តបាន: NOT_PENDING");
    expect(applyPatch).not.toHaveBeenCalled();
  });

  it("reports when apply fails after approval", async () => {
    getProposal.mockReturnValue({ id: "p1", approvalId: "a1" });
    approveRequest.mockReturnValue({});
    applyPatch.mockReturnValue({ ok: false, error: "WRITE_FAILED" });
    const r = await khoemReply(say("/approve p1"));
    expect(r).toBe("❌ Apply បរាជ័យ: WRITE_FAILED");
  });

  it("applies and reports the rollback snapshot on success", async () => {
    getProposal.mockReturnValue({ id: "p1", approvalId: "a1" });
    approveRequest.mockReturnValue({});
    applyPatch.mockReturnValue({ ok: true, relPath: "src/a.mjs", rollbackSnapshotId: "snap9", note: "NOTE-X" });
    const r = await khoemReply(say("/approve p1"));
    expect(r).toContain("src/a.mjs");
    expect(r).toContain("snap9");
    expect(r).toContain("NOTE-X");
    expect(applyPatch).toHaveBeenCalledTimes(1);
  });

  it("emits the TOOL_CALL stage", async () => {
    const stages = [];
    await khoemReply(say("/approve p1"), "បង", (s, d) => stages.push([s, d]));
    expect(stages[0]).toEqual(["TOOL_CALL", "patch approve"]);
  });
});

describe("khoemReply /reject", () => {
  it("reports when the proposal does not exist", async () => {
    const r = await khoemReply(say("/reject p1"));
    expect(r).toBe("រកមិនឃើញ proposal: p1");
  });

  it("reports a proposal that has no approval attached", async () => {
    getProposal.mockReturnValue({ id: "p1" });
    const r = await khoemReply(say("/reject p1"));
    expect(r).toContain("គ្មាន approval ភ្ជាប់");
    expect(rejectRequest).not.toHaveBeenCalled();
  });

  it("reports a refused rejection", async () => {
    getProposal.mockReturnValue({ id: "p1", approvalId: "a1" });
    rejectRequest.mockReturnValue({ error: "ALREADY_DECIDED" });
    const r = await khoemReply(say("/reject p1"));
    expect(r).toBe("❌ មិនអាចបដិសេធបាន: ALREADY_DECIDED");
  });

  it("confirms a successful rejection and never applies", async () => {
    getProposal.mockReturnValue({ id: "p1", approvalId: "a1" });
    rejectRequest.mockReturnValue({});
    const r = await khoemReply(say("/reject p1"));
    expect(r).toBe("✅ បានបដិសេធ proposal: p1");
    expect(applyPatch).not.toHaveBeenCalled();
  });

  it("emits the TOOL_CALL stage", async () => {
    const stages = [];
    await khoemReply(say("/reject p1"), "បង", (s, d) => stages.push([s, d]));
    expect(stages[0]).toEqual(["TOOL_CALL", "patch reject"]);
  });
});

describe("khoemReply /reject arguments", () => {
  it("splits the proposal id from the reason", async () => {
    getProposal.mockReturnValue({ id: "p1", approvalId: "a1" });
    rejectRequest.mockReturnValue({});
    await khoemReply(say("/reject p1 too risky now"));
    expect(getProposal).toHaveBeenCalledWith("p1");
    expect(rejectRequest).toHaveBeenCalledWith("a1", "user", "too risky now");
  });

  it("uses the default reason when none is given", async () => {
    getProposal.mockReturnValue({ id: "p1", approvalId: "a1" });
    rejectRequest.mockReturnValue({});
    await khoemReply(say("/reject p1"));
    expect(rejectRequest).toHaveBeenCalledWith("a1", "user", "rejected via chat");
  });
});

describe("khoemReply language routing", () => {
  it("sends Chinese input to chineseReply", async () => {
    const stages = [];
    const r = await khoemReply(say("你好吗"), "បង", (s, d) => stages.push([s, d]));
    expect(r).toBe("ZH-REPLY");
    expect(stages[0]).toEqual(["RETRIEVING", "chinese module"]);
  });

  it("sends English questions to englishReply", async () => {
    const r = await khoemReply(say("how does the weather work"));
    expect(r).toBe("EN-REPLY");
  });

  it("does not route slash commands to the language modules", async () => {
    await khoemReply(say("/proposals"));
    expect(chineseReply).not.toHaveBeenCalled();
    expect(englishReply).not.toHaveBeenCalled();
  });
});
