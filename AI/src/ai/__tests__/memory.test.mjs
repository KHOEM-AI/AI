import { describe, it, expect } from "vitest";
import { AIMemory } from "../memory.mjs";

describe("memory.mjs", () => {
  it("caps messages per session", () => {
    const mem = new AIMemory({ maxMessages: 3 });
    for (let i = 0; i < 5; i++) mem.add("s1", { role: "user", content: String(i) });
    expect(mem.get("s1").length).toBe(3);
    expect(mem.get("s1")[0].content).toBe("2");
  });
  it("evicts oldest session when session cap exceeded", () => {
    const mem = new AIMemory({ maxSessions: 2 });
    mem.add("a", { role: "user", content: "x" });
    mem.add("b", { role: "user", content: "x" });
    mem.add("c", { role: "user", content: "x" });
    expect(mem.sessions.has("a")).toBe(false);
    expect(mem.sessions.has("b")).toBe(true);
    expect(mem.sessions.has("c")).toBe(true);
  });
  it("rejects missing sessionId or malformed message", () => {
    const mem = new AIMemory();
    expect(() => mem.add(null, { role: "user", content: "x" })).toThrow();
    expect(() => mem.add("s", { role: "user" })).toThrow();
  });
});
