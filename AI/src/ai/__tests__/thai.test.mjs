import { describe, it, expect } from "vitest";
import { thaiReply } from "../thai.mjs";

describe("thai.mjs", () => {
  it("replies to Thai hello", () => {
    const result = thaiReply("สวัสดี");
    expect(result).toContain("KHOEM-AI");
  });

  it("replies to Thai name questions", () => {
    const result = thaiReply("คุณชื่ออะไร");
    expect(result).toContain("KHOEM-AI");
  });

  it("returns null for unrelated Thai input", () => {
    expect(thaiReply("วันนี้อากาศเป็นอย่างไร")).toBeNull();
  });

  it("returns null for slash commands", () => {
    expect(thaiReply("/learn สวัสดี = หวัดดี")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(thaiReply("   ")).toBeNull();
  });
});
