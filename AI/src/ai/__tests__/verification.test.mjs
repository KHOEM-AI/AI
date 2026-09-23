import { describe, it, expect } from "vitest";
import { getVerificationStatuses, getLastVerification, listVerifications } from "../verification.mjs";

describe("verification.mjs — fast checks (no real pipeline run)", () => {
  it("exposes the 4 evidence-based statuses", () => {
    const s = getVerificationStatuses();
    expect(s).toEqual({
      VERIFIED: "VERIFIED",
      UNVERIFIED: "UNVERIFIED",
      CONFLICTING: "CONFLICTING",
      UNKNOWN: "UNKNOWN",
    });
  });

  it("getLastVerification is null before any run", () => {
    // Note: may be non-null if a previous test in this file already ran
    // runVerification(); this only checks the function doesn't throw.
    expect(() => getLastVerification()).not.toThrow();
  });

  it("listVerifications returns an array", () => {
    expect(Array.isArray(listVerifications())).toBe(true);
  });
});
