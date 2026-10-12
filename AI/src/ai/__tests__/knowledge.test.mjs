import { describe, it, expect } from "vitest";
import { searchAllKnowledge, knowledgeStats } from "../knowledge.mjs";

describe("knowledge.mjs", () => {
  it("routes AI questions to the AI entry", () => {
    for (const q of ["Explain AI", "What is AI", "Tell me about artificial intelligence", "ពន្យល់អំពី AI"]) {
      expect(searchAllKnowledge(q)).toContain("Artificial intelligence");
    }
  });

  it("finds programming topics", () => {
    for (const q of ["Python programming", "What is Python?", "JavaScript", "សរសេរកម្មវិធី"]) {
      expect(searchAllKnowledge(q)).toContain("Programming");
    }
  });

  it("keeps existing Khmer topics working", () => {
    expect(searchAllKnowledge("Tell me about Angkor Wat")).toContain("សូរ្យវរ្ម័ន");
    expect(searchAllKnowledge("ទូរស័ព្ទ")).toContain("ទូរស័ព្ទ");
    expect(searchAllKnowledge("ពិធីបុណ្យអុំទូក")).toContain("អុំទូក");
  });

  it("skips current healthcare questions and unknown topics", () => {
    expect(searchAllKnowledge("What hospital services are available today?")).toBeNull();
    expect(searchAllKnowledge("")).toBeNull();
  });

  it("reports stats", () => {
    expect(knowledgeStats().databases).toBe(7);
  });
});
