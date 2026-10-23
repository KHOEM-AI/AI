import { describe, it, expect } from "vitest";
import { parseConversations, withSeed, loadConversations } from "../conversations.mjs";

describe("conversations seed", () => {
  it("parses valid pairs, skips bad ones, first duplicate wins", () => {
    const m = parseConversations([
      { input: "សួស្តី?", response: "A" },
      { input: "សួស្តី", response: "B" },
      { input: "", response: "x" },
      { input: "ok", response: 5 },
      null,
    ]);
    expect(Object.values(m)).toEqual(["A"]);
  });
  it("learned answers win over seed", () => {
    const out = withSeed({ k: "learned" }, { k: "seed", s: "only-seed" });
    expect(out.k).toBe("learned");
    expect(out.s).toBe("only-seed");
  });
  it("the shipped file loads", () => {
    expect(Object.keys(loadConversations()).length).toBeGreaterThan(0);
  });
});
