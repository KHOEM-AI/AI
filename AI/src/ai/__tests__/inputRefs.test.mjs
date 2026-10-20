import { describe, it, expect } from "vitest";
import { parseRef, mapInput, validateRefs, resolveInput } from "../inputRefs.mjs";

const planned = [{ tools: ["tool-a"] }, { tools: ["tool-b"] }];
const results = [{ step: 1, toolId: "tool-a", status: "EXECUTED", result: { ok: true, n: 3, name: "x", deep: { v: 7 }, obj: {} } }];

describe("inputRefs", () => {
  it("parses a valid reference", () => {
    expect(parseRef({ $from: "step1.tool-a.deep.v" })).toMatchObject({ step: 1, toolId: "tool-a", path: ["deep", "v"] });
  });

  it("rejects malformed references and extra keys", () => {
    expect(() => parseRef({ $from: "nope" })).toThrow(/invalid/);
    expect(() => parseRef({ $from: 5 })).toThrow();
    expect(() => parseRef({ $from: "step1.tool-a.n", extra: 1 })).toThrow(/only key/);
    expect(() => parseRef({ $from: "step0.tool-a.n" })).toThrow(/invalid/);
  });

  it("blocks forbidden keys", () => {
    expect(() => parseRef({ $from: "step1.tool-a.__proto__" })).toThrow(/forbidden/);
    expect(() => parseRef({ $from: "step1.tool-a.constructor.name" })).toThrow(/forbidden/);
  });

  it("leaves inputs without $from unchanged", () => {
    const input = { q: "abc", list: [1, { a: 2 }], nested: { z: true } };
    expect(resolveInput(input, results)).toEqual(input);
  });

  it("replaces refs inside objects and arrays without mutating the original", () => {
    const input = { q: { $from: "step1.tool-a.name" }, list: [{ $from: "step1.tool-a.n" }], keep: "k" };
    const out = resolveInput(input, results);
    expect(out).toEqual({ q: "x", list: [3], keep: "k" });
    expect(input.q).toEqual({ $from: "step1.tool-a.name" });
  });

  it("fails on a missing step, missing field, object value or string result", () => {
    expect(() => resolveInput({ a: { $from: "step2.tool-a.n" } }, results)).toThrow(/no result/);
    expect(() => resolveInput({ a: { $from: "step1.tool-a.nope" } }, results)).toThrow(/not found/);
    expect(() => resolveInput({ a: { $from: "step1.tool-a.obj" } }, results)).toThrow(/string, number or boolean/);
    const str = [{ step: 1, toolId: "tool-a", status: "EXECUTED", result: "plain text" }];
    expect(() => resolveInput({ a: { $from: "step1.tool-a.length" } }, str)).toThrow(/not found/);
  });

  it("rejects results from a failed source tool", () => {
    const failed = [{
      step: 1,
      toolId: "tool-a",
      status: "FAILED",
      result: { n: 3 },
    }];
    expect(() =>
      resolveInput({ q: { $from: "step1.tool-a.n" } }, failed)
    ).toThrow(/source tool did not succeed/);
  });

  it("rejects a source result with ok:false", () => {
    const r = [{ step: 1, toolId: "tool-a", status: "EXECUTED", result: { ok: false, n: 3 } }];
    expect(() => resolveInput({ q: { $from: "step1.tool-a.n" } }, r)).toThrow(/ok:false/);
  });

  it("allows a source result that has no ok field", () => {
    const r = [{ step: 1, toolId: "tool-a", status: "EXECUTED", result: { n: 3 } }];
    expect(resolveInput({ q: { $from: "step1.tool-a.n" } }, r)).toEqual({ q: 3 });
  });

  it("validateRefs requires an earlier step that uses that tool", () => {
    expect(() => validateRefs({ a: { $from: "step1.tool-a.n" } }, 2, planned)).not.toThrow();
    expect(() => validateRefs({ a: { $from: "step2.tool-b.n" } }, 2, planned)).toThrow(/earlier step/);
    expect(() => validateRefs({ a: { $from: "step1.tool-b.n" } }, 2, planned)).toThrow(/does not use tool/);
    expect(() => validateRefs({ a: { $from: "step9.tool-a.n" } }, 10, planned)).toThrow(/does not use tool/);
  });

  it("limits nesting depth", () => {
    let deep = { $from: "step1.tool-a.n" };
    for (let i = 0; i < 8; i++) deep = { x: deep };
    expect(() => mapInput(deep, () => 1)).toThrow(/too deep/);
  });
});
