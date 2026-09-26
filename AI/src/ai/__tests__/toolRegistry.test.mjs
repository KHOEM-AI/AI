import { describe, it, expect, beforeEach } from "vitest";
import {
  registerTool,
  unregisterTool,
  listTools,
  getTool,
  findTools,
  describeToolRisk,
} from "../toolRegistry.mjs";

describe("toolRegistry.mjs", () => {
  beforeEach(() => {
    for (const t of listTools()) unregisterTool(t.id);
  });

  it("registers and lists tools", () => {
    registerTool({ id: "t1", action: "tool.scan", name: "Test Tool" });
    expect(listTools()).toHaveLength(1);
    expect(getTool("t1").name).toBe("Test Tool");
  });

  it("defaults name/description/capabilities when omitted", () => {
    registerTool({ id: "t1", action: "tool.scan" });
    const tool = getTool("t1");
    expect(tool.name).toBe("t1");
    expect(tool.description).toBe("");
    expect(tool.capabilities).toEqual([]);
  });

  it("throws on missing id", () => {
    expect(() => registerTool({ action: "tool.scan" })).toThrow();
  });

  it("throws on missing action", () => {
    expect(() => registerTool({ id: "t1" })).toThrow();
  });

  it("throws with 409 on duplicate id", () => {
    registerTool({ id: "t1", action: "tool.scan" });
    try {
      registerTool({ id: "t1", action: "tool.find" });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e.status).toBe(409);
      expect(e.message).toMatch(/already registered/);
    }
  });

  it("coerces non-array capabilities to an empty array", () => {
    registerTool({ id: "t1", action: "tool.scan", capabilities: "not-an-array" });
    expect(getTool("t1").capabilities).toEqual([]);
  });

  it("unregisters a tool", () => {
    registerTool({ id: "t1", action: "tool.scan" });
    expect(unregisterTool("t1")).toBe(true);
    expect(getTool("t1")).toBeNull();
  });

  it("finds tools by capability keyword", () => {
    registerTool({ id: "t1", action: "tool.scan", name: "Scan", capabilities: ["repo", "code"] });
    registerTool({ id: "t2", action: "tool.find", name: "Find", capabilities: ["search"] });
    expect(findTools("repo")).toHaveLength(1);
    expect(findTools("repo")[0].id).toBe("t1");
  });

  it("finds tools by description when name doesn't match", () => {
    registerTool({ id: "t1", action: "tool.scan", name: "Scan Repo", description: "walks the tree" });
    expect(findTools("walks")).toHaveLength(1);
    expect(findTools("walks")[0].id).toBe("t1");
  });

  it("does not crash on a capability entry that isn't a string", () => {
    registerTool({ id: "t1", action: "tool.scan", capabilities: [42, null, "search"] });
    expect(() => findTools("search")).not.toThrow();
    expect(findTools("search")).toHaveLength(1);
  });

  it("returns empty array for blank query", () => {
    registerTool({ id: "t1", action: "tool.scan" });
    expect(findTools("")).toEqual([]);
    expect(findTools("   ")).toEqual([]);
  });

  it("delegates risk to permission.mjs — HIGH risk actions require approval", () => {
    registerTool({ id: "apply", action: "code.applyPatch", name: "Apply" });
    const info = describeToolRisk("apply", "tester");
    expect(info.policy.decision).toBe("REQUIRE_APPROVAL");
    expect(info.policy.risk).toBe("HIGH");
  });

  it("delegates risk to permission.mjs — LOW risk actions auto-allow", () => {
    registerTool({ id: "scan", action: "tool.scan", name: "Scan" });
    const info = describeToolRisk("scan", "tester");
    expect(info.policy.decision).toBe("ALLOW");
    expect(info.policy.risk).toBe("LOW");
  });

  it("returns null for unknown tool id", () => {
    expect(describeToolRisk("nonexistent")).toBeNull();
  });

  it("fails safe: tool pointing at an unregistered action still DENY", () => {
    registerTool({ id: "ghost", action: "nonexistent.action", name: "Ghost" });
    const info = describeToolRisk("ghost");
    expect(info.policy.decision).toBe("DENY");
  });
});
