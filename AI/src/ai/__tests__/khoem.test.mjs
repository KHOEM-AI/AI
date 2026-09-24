import { describe, it, expect, vi } from "vitest";

vi.mock("../learn.mjs", () => ({ handleLearn: vi.fn(() => null), load: vi.fn(() => []) }));
vi.mock("../patch.mjs", () => ({
  proposePatch: vi.fn(), getProposal: vi.fn(() => null),
  applyPatch: vi.fn(), listProposals: vi.fn(() => []),
}));
vi.mock("../approvals.mjs", () => ({ approveRequest: vi.fn(), rejectRequest: vi.fn() }));

import { khoemReply } from "../khoem.mjs";

const say = (content) => [{ role: "user", content }];

describe("khoem.mjs khoemReply", () => {
  it("returns a non-empty string for /help", async () => {
    const r = await khoemReply(say("/help"));
    expect(typeof r).toBe("string");
    expect(r.length).toBeGreaterThan(0);
  });

  it("handles an empty conversation without throwing", async () => {
    await expect(khoemReply([])).resolves.toBeDefined();
  });

  it("/read refuses paths outside src/", async () => {
    const stages = [];
    const r = await khoemReply(say("/read ../../etc/passwd"), "បង", (s, d) => stages.push([s, d]));
    expect(r).toContain("src/");
    expect(stages[0][0]).toBe("TOOL_CALL");
  });

  it("/proposals says there are none when the list is empty", async () => {
    const r = await khoemReply(say("/proposals"));
    expect(r).toBe("គ្មាន proposal ណាមួយទេ");
  });

  it("/proposals lists entries when they exist", async () => {
    const { listProposals } = await import("../patch.mjs");
    listProposals.mockReturnValueOnce([{ id: "p1", relPath: "src/a.mjs", status: "pending" }]);
    const r = await khoemReply(say("/proposals"));
    expect(r).toBe("- p1 | src/a.mjs | pending");
  });
});
