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

  it("finds Cambodian geography topics", () => {
    expect(searchAllKnowledge("ទន្លេមេគង្គ")).toContain("មេគង្គ");
    expect(searchAllKnowledge("Tonle Sap")).toContain("ទន្លេសាប");
    expect(searchAllKnowledge("ភ្នំអូរ៉ាល់")).toContain("ភ្នំ");
    expect(searchAllKnowledge("ភូមិសាស្ត្រកម្ពុជា")).toContain("ភូមិសាស្ត្រកម្ពុជា");
  });

  it("reports stats", () => {
    expect(knowledgeStats().databases).toBe(8);
  });
});

describe("knowledge.mjs regressions", () => {
  it("answers Phnom Penh with the city entry, not Sihanouk or the beer", () => {
    expect(searchAllKnowledge("ភ្នំពេញ")).toContain("ចតុមុខ");
    expect(searchAllKnowledge("Phnom Penh")).toContain("ចតុមុខ");
  });

  it("matches bare 'programming'", () => {
    expect(searchAllKnowledge("programming")).toContain("Programming");
  });
});
