import { describe, it, expect } from "vitest";
import { khmerReply } from "../khmer.mjs";

describe("khmer.mjs", () => {
  it("replies to Khmer hello with the provided honorific", () => {
    const result = khmerReply("សួស្តី", {}, "ប្អូន");

    expect(result).toContain("ជម្រាបសួរប្អូន");
    expect(result).toContain("KHOEM-AI");
  });

  it("replies to Khmer name questions", () => {
    const result = khmerReply("អ្នកឈ្មោះអ្វី?", {}, "បង");

    expect(result).toBe(
      "ខ្ញុំឈ្មោះ KHOEM-AI ជាជំនួយការឆ្លាតវៃផ្ទាល់ខ្លួនរបស់អ្នក។ 🙂",
    );
  });

  it("returns null for unrelated Khmer input", () => {
    expect(khmerReply("ខ្ញុំចង់សួរអំពីភ្ជុំបិណ្ឌ")).toBeNull();
  });

  it("returns null for slash commands", () => {
    expect(khmerReply("/learn សួស្តី = សួស្តីបង!")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(khmerReply("   ")).toBeNull();
  });
});
