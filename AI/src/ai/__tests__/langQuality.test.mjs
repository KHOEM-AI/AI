import { describe, it, expect } from "vitest";
import { englishReply } from "../english.mjs";
import { chineseReply } from "../chinese.mjs";

describe("english whole-word matching", () => {
  it("does not treat hi/hey inside other words as greetings", () => {
    expect(englishReply("this is hard")).toBeNull();
    expect(englishReply("they said no")).toBeNull();
  });
  it("still answers real greetings", () => {
    expect(englishReply("hi")).toMatch(/Hello/);
    expect(englishReply("hey, how are you")).not.toBeNull();
  });
});

describe("chinese matching", () => {
  it("does not answer 我不知道 with the 不 rule", () => {
    expect(chineseReply("我不知道怎么办")).toBeNull();
  });
  it("still matches real phrases", () => {
    expect(chineseReply("你好")).toMatch(/你好/);
    expect(chineseReply("谢谢你")).toBe("不客气！");
  });
});
