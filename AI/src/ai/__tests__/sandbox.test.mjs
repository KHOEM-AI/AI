import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { runSandboxTest } from "../sandbox.mjs";

describe("sandbox.mjs", () => {
  it("rejects relPath outside src/", () => {
    expect(() =>
      runSandboxTest({ relPath: "../../etc/passwd", newContent: "x" })
    ).toThrow();
  });

  it("rejects relPath not starting with src/", () => {
    expect(() =>
      runSandboxTest({ relPath: "package.json", newContent: "{}" })
    ).toThrow();
  });

  it("rejects non-string newContent", () => {
    expect(() =>
      runSandboxTest({ relPath: "src/ai/killswitch.mjs", newContent: 123 })
    ).toThrow();
  });

  it("never modifies the real repository file", () => {
    const realPath = "src/ai/killswitch.mjs";
    const before = fs.readFileSync(realPath, "utf8");
    try {
      runSandboxTest({
        relPath: realPath,
        newContent: "// SANDBOX TEST — this must never land in the real file\n",
        reason: "regression test",
      });
    } catch {
      // sandbox may fail its own checks — that's fine, we only care the real file is untouched
    }
    const after = fs.readFileSync(realPath, "utf8");
    expect(after).toBe(before);
  });
});
