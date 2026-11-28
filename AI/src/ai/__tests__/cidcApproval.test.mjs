import { describe, it, expect } from "vitest";
import "../toolRegistry.bootstrap.mjs";
import { cidcWrite } from "../cidcTools.mjs";
import { approveRequest } from "../approvals.mjs";

describe("cidc.write approval", () => {
  it("cannot run before approval or be self-approved", async () => {
    const args = { templateId: "web-static", name: "approval-check" };
    const first = await cidcWrite(args);
    expect(first.status).toBe("REQUIRES_APPROVAL");
    await expect(cidcWrite({ ...args, approvalId: first.approvalId })).rejects.toThrow(/NOT_APPROVED/);
    expect(approveRequest(first.approvalId, "human:ai").error).toBe("SELF_APPROVAL_FORBIDDEN");
  });
});
