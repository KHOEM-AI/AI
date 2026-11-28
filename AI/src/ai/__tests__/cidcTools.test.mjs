import { describe, it, expect } from "vitest";
import { policyCheck, DECISION } from "../permission.mjs";
import { validatePolicyRegistry } from "../policyRegistry.mjs";
import { getTool } from "../toolRegistry.mjs";
import "../toolRegistry.bootstrap.mjs";
import { resolveOut, OUT_ROOT } from "../cidcTools.mjs";

describe("CIDC tools policy", () => {
  it("registry stays valid", () => {
    expect(validatePolicyRegistry().ok).toBe(true);
  });
  it("search and scaffold are auto-allowed, write needs approval", () => {
    expect(policyCheck("cidc.search").decision).toBe(DECISION.ALLOW);
    expect(policyCheck("cidc.scaffold").decision).toBe(DECISION.ALLOW);
    expect(policyCheck("cidc.write").decision).toBe(DECISION.REQUIRE_APPROVAL);
  });
  it("tools are registered", () => {
    for (const id of ["cidc-search", "cidc-scaffold", "cidc-write"]) expect(getTool(id)).not.toBeNull();
  });
  it("output path stays inside the generated folder", () => {
    expect(resolveOut("my-site").startsWith(OUT_ROOT)).toBe(true);
    for (const bad of ["../x", "a/b", "", "UPPER", "/etc"]) expect(() => resolveOut(bad)).toThrow();
  });
});
