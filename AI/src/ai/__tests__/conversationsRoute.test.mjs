import { describe, it, expect } from "vitest";
import { routeLanguage } from "../languageCenter.mjs";
import { loadConversations } from "../conversations.mjs";

describe("conversation seed is the last resort", () => {
  it("answers a seed-only Khmer question", async () => {
    const seed = loadConversations();
    const k = Object.keys(seed).find((x) => x.includes("ស៊ីដ"));
    expect(k).toBeTruthy();
    expect(await routeLanguage(k)).toBe(seed[k]);
  });
  it("does not override an existing khmer.mjs answer", async () => {
    const r = await routeLanguage("សួស្តី");
    expect(r).not.toBeNull();
    expect(Object.values(loadConversations())).not.toContain(r);
  });
});
